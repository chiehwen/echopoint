var fs = require('fs'),
		request = require('request'),
		Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Alert = require('../logger').getInstance().getLogger('alert'),
		ScrapingLog = require('../logger').getInstance().getLogger('scraping'),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Requester = require('requester'),
		cheerio = require('cheerio'),
		googleTimestampHash = require('./config/google').getInstance();

//var googlePageData = require('./tmpPageData/googlePage'); // TEMP

var GoogleHarvester = (function() {

	var User,
			Analytics,
			index = 0,
			//requester = new Requester({
				//debug: 1,
				//proxies: [{ip: '107.17.100.254', port: 8080}]
			//}),
			//google,
			data,
			update = false,
			//url = false,
			next = function(i, cb, stop) {
				var i = i+1
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null)
			};

	var Harvest = {

		// call every 5 minutes (using time tracking to call only one business every 5 minutes)
		business: function(itr, cb) {	
console.log('at the google business update method');
	
			var google = Auth.load('google')

			google.get('https://maps.googleapis.com/maps/api/place/details/json', {key: google.client.key, reference: data.network_ref, sensor: false, review_summary: true}, function(err, response) {
				if(err || response.error)
					return console.log('error', err, response)

				var place = response.result,
						cached = Analytics.google.places.data,
						timestamp = Helper.timestamp(),
						changeTimestamp = 0,
						localUpdate = false;

				if(
					!cached
					|| place.id != cached.id
					|| place.name != cached.name
					//|| place.reference != cached.reference // reference token is always changing
					|| place.formatted_address != cached.formatted_address 
					|| place.formatted_phone_number != cached.formatted_phone_number 
					|| place.international_phone_number != cached.international_phone_number 
					|| place.url != cached.url 
					|| place.website != cached.website 
					|| place.types.length != cached.types.length
				) {
					update = localUpdate = true;
					place.reviews = [];
					Analytics.google.places = {
						id: Analytics.google.places.id,
						timestamp: timestamp,
						data: place
					}

					User.Business[index].Social.google.places.data = Analytics.google.places.data;
				}

				if(place.reviews.length) {
					reviewSamplesLoop:
					for(var x=0,l=place.reviews.length;x<l;x++) {
						for(var y=0,len=Analytics.google.reviews.api_samples.length;y<len;y++) 
							if(place.reviews[x].author_url == Analytics.google.reviews.api_samples[y].author_url)
								continue reviewSamplesLoop;

						update = localUpdate = true;
						changeTimestamp = Analytics.google.tracking.reviews.api_timestamp;
						Analytics.google.tracking.reviews.api_timestamp = timestamp;
						Analytics.google.reviews.api_samples = place.reviews;
						break;
					}
				}	

				if(parseFloat(place.rating) != Analytics.google.tracking.rating.api_score) {
					update = localUpdate = true;
					changeTimestamp = Analytics.google.tracking.rating.api_timestamp;
					// this is now handled in the page harvesting
					/*Analytics.google.tracking.rating.history.push({
						timestamp: timestamp,
						score: parseFloat(place.rating)
					})*/

					Analytics.google.tracking.rating.api_timestamp = timestamp;
					Analytics.google.tracking.rating.api_score = parseFloat(place.rating);
				}	

				if(localUpdate)
					console.log('saving updated Google business and rating data from API.');

				if(!Business.Social.google.reviews.timestamp || (changeTimestamp && Business.Social.google.reviews.timestamp < changeTimestamp))
					next(itr, cb)
				else
					next(itr, cb, true)
			})
		},

		// called only if a change has occured from above
		reviews: function(itr, cb, pagination) {
console.log('at the google reviews method');

			// mark the attempt time 
			var timestamp = Helper.timestamp();
			User.Business[index].Social.google.reviews.timestamp = timestamp;

			// if we dont have the business page id then scrape the webpage for the data
			if(!Analytics.google.places.id) {
				// if we don't have the url to scrape
				// for the business page id then exit
				if(!Analytics.google.places.data.url)
					return next(itr, cb);

				request.get(Analytics.google.places.data.url,
					{ 
						headers: {
							'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
							'accept-language' : 'en-US,en;q=0.8',
							'accept' : '*/*',
							//'accept-encoding': 'gzip,deflate,sdch',
							'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
						}
					}, function(err, res) {
					if (err || !res || res.statusCode !== 200 || !res.body || res.body == '') {
						ScrapingLog.error('Google reviews return did not contain )]}\' at begining', {error: err, response: res || err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						//Error.handler('google', res.statusCode, null, body, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb);
					}

					var $ = cheerio.load(res.body);
					update = true;

					if(!$('div[data-placeid]').length || !$('div[data-placeid]').attr('data-placeid')) {
						Alert.file('necessary Google html page element not found! No $("div[data-placeid]")', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('necessary Google html page element not found', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('necessary Google html page element not found! No $("div[data-placeid]")', {file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					Analytics.google.places.id = $('div[data-placeid]').attr('data-placeid').toString().trim();
					return Harvest.reviews(itr, cb)
				})
			} else {
				var count = 500, //Math.max((count || getReviews.count), 100),
						pagination = pagination || 0,
						timestamp = Helper.timestamp(),
						localUpdate = false;

				request.post('https://plus.google.com/_/pages/local/loadreviews', 
					{
						headers: {
							'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
							'accept-language' : 'en-US,en;q=0.8',
							'accept' : '*/*',
							//'accept-encoding': 'gzip,deflate,sdch',
							'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
						},
						form: {
							"f.req": '["' + Analytics.google.places.id + '",null,[null,null,[[28,' + pagination + ',' + count + ',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
							at: googleTimestampHash.getTimestampHash() || Helper.googleTimestampHash
//						at: 'AObGSAiOtoNHKnLAO-PWRdWXOASNwMAl4g:1379699578795'
						}
					}, 
					function(err, res) {
						if(err || !res || res.statusCode !== 200 || !res.body || res.body == '') {
							ScrapingLog.error('Google reviews return did not contain )]}\' at begining', {error: err, response: res || err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							//Error.handler('google', err || 'No html response body returned!', err, res, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						// make sure the proper JSON set was returned for eval() parsing
						if(res.body.toString().trim().indexOf(")]}'") === -1) {
							//Error.handler('google', "Google reviews return did not contain )]}' at begining", null, res.body.toString(), {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							Alert.file("Google reviews return did not contain )]}' at begining", {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
							Alert.broadcast("Google reviews did not contain )]}", {file: __filename, line: Helper.stack()[0].getLineNumber()})
							ScrapingLog.error('Google reviews return did not contain )]}\' at begining', {response: res.body.toString(), file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							return next(itr, cb)
						}

						// TODO: This is a security risk, make sure returned data does not contain any malicous scripting before calling eval()
						var parsedReviewData = eval(res.body.toString().replace(")]}'", "").trim());

						if(!parsedReviewData[0] || !parsedReviewData[0][1] || !parsedReviewData[0][1][11] || !parsedReviewData[0][1][11][0]){
							Alert.file('Google reviews array undefined in response JSON! should be at [0][1][11][0]', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
							Alert.broadcast('Google reviews array undefined in response JSON', {file: __filename, line: Helper.stack()[0].getLineNumber()})
							ScrapingLog.error('Google reviews array undefined in response JSON! should be at [0][1][11][0]', {response: parsedReviewData, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							return next(itr, cb)
						}

						var reviews = parsedReviewData[0][1][11][0];

						// this does not stop the loading of reviews, it is currently just an alert system
						Harvest.responseIntegrityCheck(reviews[0], function(err) {

						})

						var reviewObject = {},
								reviewObjects = [],
								initialAnalyticReviewsLength = Analytics.google.reviews.active.length,
								removalIndexes = [],
								overview = {
									count: reviews.length,
									scores_sum: 0,
									score: 0,
									star_breakdown: {
										one: 0,
										two: 0,
										three: 0,
										four: 0,
										five: 0
									}
								};

						reviewsLoop:
						for(var i=0, l=overview.count; i<l;i++) {
			
							reviewObject = {
								id: reviews[i][10], // I'm guessing this is review id
								user: {
									name: reviews[i][0][0][1],
									page: reviews[i][0][0][3] ? reviews[i][0][0][3][0] || reviews[i][0][0][0] : reviews[i][0][0][0],
									photo: reviews[i][0][1],
									id: reviews[i][0][3] /// Google+ id, use this for Klout
								},
								review: {
									complete: reviews[i][3],
									summary: reviews[i][4],
									rating: reviews[i][1]
								},
								lang_code: reviews[i][30],
								relative_time:reviews[i][5],
								reference: reviews[i][33],
								timestamp: timestamp
							}

							overview.scores_sum += reviewObject.review.rating || 0;
							switch(reviewObject.review.rating) {
								case 5000:
									overview.star_breakdown.five += 1;
									break;
								case 4000:
									overview.star_breakdown.four += 1;
									break;
								case 3000:
									overview.star_breakdown.three += 1;
									break;
								case 2000:
									overview.star_breakdown.two += 1;
									break;
								case 1000:
									overview.star_breakdown.one += 1;
									break;
							}

							reviewObjects.push(reviewObject);

							for(var y=0,len=initialAnalyticReviewsLength; y<len; y++) {
								if(reviewObject.id == Analytics.google.reviews.active[y].id)
									continue reviewsLoop;
							}

							update = localUpdate = true;
							Analytics.google.reviews.active.push(reviewObject); 
						}

						if(overview.count != Analytics.google.tracking.reviews.total) {
							update = localUpdate = true;

							Analytics.google.tracking.reviews.history.push({
								total: overview.count,
								star_breakdown: overview.star_breakdown,
								timestamp: timestamp
							})
							Analytics.google.tracking.reviews.total = overview.count;
							Analytics.google.tracking.reviews.timestamp = timestamp;
						}

						// calculate complete score 
						overview.score = parseFloat((overview.scores_sum / (overview.count * 1000)).toFixed(2));

						if(overview.score != Analytics.google.tracking.rating.score) {
							update = localUpdate = true;

							Analytics.google.tracking.rating.history.push({
								score: overview.score,
								timestamp: timestamp
							});
							Analytics.google.tracking.rating.score = overview.score;
							Analytics.google.tracking.rating.timestamp = timestamp;
						}

						// check for removed reviews
						removalLoop:
						for(var x=0,l=initialAnalyticReviewsLength; x<l;x++) {

							for(var y=0,len=reviewObjects.length; y<len;y++)
								if(Analytics.google.reviews.active[x].id == reviewObjects[y].id)
									// already in db
									continue removalLoop;

							// if here then we have a removed review
							update = localUpdate = true;

							removalIndexes.unshift(x);
							Analytics.google.reviews.active[x].removalTimestamp = timestamp;
							Analytics.markModified('google.reviews.active');

							Analytics.google.reviews.retracted.push(Analytics.google.reviews.active[x]);
						}

						// remove retracted reviews from active array
						for(var i=0,l=removalIndexes.length; i<l;i++)
							Analytics.google.reviews.active.splice(removalIndexes[i], 1)

						if(localUpdate)
							console.log('saving new/updated Google reviews from Harvester');

						if (reviews.length >= count)
							Harvest.reviews(itr, cb, (count+pagination))
						else 
							next(itr, cb);
					}
				)
			} // end Google page id else
		},


		// quickly save a scraped page for debugging
		savePage: function(itr, cb) {
			request.post('https://plus.google.com/_/pages/local/loadreviews', 
				{ 
					headers: {
						'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
						'accept-language' : 'en-US,en;q=0.8',
						'accept' : '*/*',
						//'accept-encoding': 'gzip,deflate,sdch',
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
					},
					form: {
						"f.req": '["15451866226298415817",null,[null,null,[[28,0,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
						at: googleTimestampHash.getTimestampHash() || Helper.googleTimestampHash
					}
				}, 
				function(err, res) {
					if(err || !res || !res.body || res.body == '' || res.body.toString() == '') {
						ScrapingLog.error(err || 'No html response body returned!', {file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					fs.writeFileSync('server/harvesters/output/google.' + Helper.timestamp() + '.json', res.body.toString())	
			})
		},

		// every 5 minutes with proxies, every 4 hours without
		pageChangesAlert: function() {
			// 15451866226298415817 is speaks social google plus id
			request.post('https://plus.google.com/_/pages/local/loadreviews', 
				{
					headers: {
						'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
  					'accept-language' : 'en-US,en;q=0.8',
  					'accept' : '*/*',
						//'accept-encoding': 'gzip,deflate,sdch',
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
					},
					form: {
						"f.req": '["15451866226298415817",null,[null,null,[[28,0,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
						at: googleTimestampHash.getTimestampHash() || Helper.googleTimestampHash
//					at: 'AObGSAiOtoNHKnLAO-PWRdWXOASNwMAl4g:1379699578795'
					}
				}, 
				function(err, res) {
					if(err || !res || res.statusCode !== 200 || !res.body || res.body == '' || res.body.toString() == '') {
						ScrapingLog.error(err || 'No html response body returned!', {file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						Alert.file(err || 'No html response body returned!', {response: err || res, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast(err || 'No html response body returned!', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						return next(itr, cb)
					}

					// make sure the proper JSON set was returned for eval() parsing
					if(res.body.toString().trim().indexOf(")]}'") === -1) {
						Alert.file('Google reviews return did not contain )]}\' at begining', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google reviews return did not contain )]}\' at begining', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google reviews return did not contain )]}\' at begining', {response: res.body.toString(), file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// TODO: This is a security risk, make sure returned data does not contain any malicous scripting before calling eval()
					var parsedReviewData = eval(res.body.toString().replace(")]}'", "").trim());

					if(!parsedReviewData[0] || !parsedReviewData[0][1] || !parsedReviewData[0][1][11] || !parsedReviewData[0][1][11][0]){
						Alert.file('Google reviews array undefined in response JSON! should be at [0][1][11][0]', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google reviews array undefined in response JSON', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google reviews array undefined in response JSON! should be at [0][1][11][0]', {response: parsedReviewData, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					var reviews = parsedReviewData[0][1][11][0];

					// check that we have reviews in array (this is hardcoded so it certainly always should unless the page is removed)
					if(!reviews.length) {
						Alert.file('Google returned reviews length is 0', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google returned reviews length is 0', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google returned reviews length is 0', {response: parsedReviewData, review: reviews, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}
		
					// check for review id
					if(!reviews[0][10]) {
						Alert.file('Google review ID undefined at needed array location! should be located at [i][10] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google review ID undefined', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google review ID undefined at needed array location! should be located at [i][10] inside reviews array', {review: reviews[0], review_id: reviews[0][10], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// check for reviewers id
					if(!reviews[0][0][3]) {
						Alert.file('Google reviewer Google+ ID is undefined at needed array location! should be located at [i][0][3] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google reviewer Google+ ID is undefined', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google reviewer Google+ ID is undefined at needed array location! should be located at [i][0][3] inside reviews array', {review: reviews[0], reviewer_id: reviews[0][0][3], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// check for reviewers data
					if(!reviews[0][0][0] || !reviews[0][0][0].length) {
						Alert.file('Google reviewer meta data array missing! should be located at [i][0][0] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google reviewer meta data array missing', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google reviewer meta data array missing! should be located at [i][0][0] inside reviews array', {review: reviews[0], reviewer_meta: reviews[0][0][0], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// check for reviewers name
					if(!reviews[0][0][0][1]) {
						Alert.file('Google reviewers name is undefined at needed array location! should be located at [i][10] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google reviewers name is undefined', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google reviewers name is undefined at needed array location! should be located at [i][10] inside reviews array', {review: reviews[0], reviewers_name: reviews[0][0][0][1], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// check for actual review data
					if(!reviews[0][1] || !reviews[0][4]) {
						Alert.file('Google review data is missing at needed array location! should be located at reviews[i][3] for review and reviews[0][1] for rating inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google review data is missing', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google review data is missing at needed array location! should be located at reviews[i][3] for review and reviews[0][1] for rating inside reviews array', {review: reviews[0], review_text: reviews[0][3], review_rating: reviews[0][1],file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// check for review reference code
					if(!reviews[0][33] || reviews[0][33] == '') {
						Alert.file('Google review reference data is missing at needed array location! should be located at reviews[i][33] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google review reference data is missing', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google review reference data is missing at needed array location! should be located at reviews[i][33] inside reviews array', {review: reviews[0], reference_data: reviews[0][33],file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					// check for relative time
					if(!reviews[0][5]) {
						Alert.file('Google review relative time data is missing at needed array location! should be located at reviews[i][5] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Google review relative time data is missing!', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Google review relative time data is missing at needed array location! should be located at reviews[i][5] inside reviews array', {review: reviews[0], relative_time_data: reviews[0][5], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb)
					}

					next(itr, cb)
			})
		},


		responseIntegrityCheck: function(review, callback) {
			if(!review)
				return callback(null)

			// check that we have reviews in array (this is hardcoded so it certainly always should unless the page is removed)
			/*if(!reviews.length) {
				Alert.file('Google returned reviews length is 0', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google returned reviews length is 0', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google returned reviews length is 0', {response: parsedReviewData, review: reviews, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}*/

			// check for review id
			if(!review[10]) {
				Alert.file('Google review ID undefined at needed array location! should be located at [i][10] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google review ID undefined', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google review ID undefined at needed array location! should be located at [i][10] inside reviews array', {review: review, review_id: review[10], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			// check for reviewers id
			if(!review[0][3]) {
				Alert.file('Google reviewer Google+ ID is undefined at needed array location! should be located at [i][0][3] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google reviewer Google+ ID is undefined', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google reviewer Google+ ID is undefined at needed array location! should be located at [i][0][3] inside reviews array', {review: review, reviewer_id: review[0][3], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			// check for reviewers data
			if(!review[0][0] || !review[0][0].length) {
				Alert.file('Google reviewer meta data array missing! should be located at [i][0][0] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google reviewer meta data array missing', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google reviewer meta data array missing! should be located at [i][0][0] inside reviews array', {review: review, reviewer_meta: review[0][0], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			// check for reviewers name
			if(!review[0][0][1]) {
				Alert.file('Google reviewers name is undefined at needed array location! should be located at [i][10] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google reviewers name is undefined', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google reviewers name is undefined at needed array location! should be located at [i][10] inside reviews array', {review: review, reviewers_name: review[0][0][1], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			// check for actual review data
			if(!review[1] || !review[4]) {
				Alert.file('Google review data is missing at needed array location! should be located at reviews[i][3] for review and reviews[0][1] for rating inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google review data is missing', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google review data is missing at needed array location! should be located at reviews[i][3] for review and reviews[0][1] for rating inside reviews array', {review: review, review_text: review[3], review_rating: review[1],file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			// check for review reference code
			if(!review[33] || review[33] == '') {
				Alert.file('Google review reference data is missing at needed array location! should be located at reviews[i][33] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google review reference data is missing', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google review reference data is missing at needed array location! should be located at reviews[i][33] inside reviews array', {review: review, reference_data: review[33],file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			// check for relative time
			if(!review[5]) {
				Alert.file('Google review relative time data is missing at needed array location! should be located at reviews[i][5] inside reviews array', {file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
				Alert.broadcast('Google review relative time data is missing!', {file: __filename, line: Helper.stack()[0].getLineNumber()})
				ScrapingLog.error('Google review relative time data is missing at needed array location! should be located at reviews[i][5] inside reviews array', {review: review, relative_time_data: review[5], file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				return callback(true)
			}

			callback(null)
		},

				// called only if a change has occured from above
		activity: function(itr, cb, pagination) {
console.log('at the google plus activity method');

			// mark the attempt time 
			var timestamp = Helper.timestamp();
			User.Business[index].Social.google.activity.timestamp = timestamp;

			if(!Analytics.google.plus.id)
					return next(itr, cb);

			var google = Auth.load('google_discovery');
		
			google
				.discover('plus', 'v1')
				.execute(function(err, client) {
					client
					//.plus.people.search({ query: 'Speak Social' })
					//.plus.people.get({ userId: 'me' })
					//.plus.people.get({ userId: '100941364374251988809' }) // andy
					.plus.activities.list({ userId: '100941364374251988809', collection: 'public' })
					.withApiKey(google.apiKey)
					.execute(function(err, data) {
						if(err || !data) {
							Error.handler('google', 'Failure on google plus execute after oauth process', err, data, {user_id: User._id, business_id: user.Business[index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})

						}

					})
				})
		}


// USER OBJECT: [0][1][11][0][0][0]
// user plus page: 
// 			[0][1][11][0][0][0][0][0]
//			OR
//			[0][1][11][0][0][0][0][3][0] (more concise)
// user name: [0][1][11][0][0][0][0][1]
// user photo: [0][1][11][0][0][0][1]

// REVIEW Object:
// user review: [0][1][11][0][0][3] // this can be undefined if the review is short enough for summary only
// user review summary: [0][1][11][0][0][4]
// relative time: [0][1][11][0][0][5]
// language code: [0][1][11][0][0][30]
// google reference code: [0][1][11][0][0][33]

// TODO: look into correct "inappropriate flag":
// url between:  [0][1][11][0][0][7], [0][1][11][0][0][13]


	} // End Harvest


	return {
		getMetrics: function(user, params, callback) {
			if(!user || !params || typeof params.index === 'undefined') // index may be zero so check typeof
				return Log.error('No user or index provided', {error: err, meta: params, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

			User = user,
			index = params.index,
			Business = User.Business[index],
			//google = Auth.load('google'),
			data = params,
			update = false;

			Model.Analytics.findById(Business.Analytics.id, function(err, analytics) {
				Analytics = analytics;
				analytics = null;

				Harvest[data.methods[0]](0, function() {
					if(update)
						Analytics.save(function(err, save) {
							if(err && err.name !== 'VersionError')
								return Log.error('Error saving Google analytics to database', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

							// if we have a versioning overwrite error than load up the analytics document again
							if(err && err.name === 'VersionError')
								Model.Analytics.findById(Business.Analytics.id, function(err, analytics) {
									if(err)
										return Log.error('Error querying Analytic table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

									analytics.google = Analytics.google;
									analytics.markModified('google')

									analytics.save(function(err, save) {
										if(err)
											return Log.error('Error saving Google analytics to database', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
										callback(null);
									})
								})

							callback(null);
						})
					else
						callback(null, update);
				});
			})
		},
		directToMethod: function(methods, callback) {
			//yelp = Auth.load('yelp'),
			//data = params,
			update = false;

			Harvest[methods[0]](0, function() {
				callback(null, update);
			});
		}
	}

})();

module.exports = GoogleHarvester;