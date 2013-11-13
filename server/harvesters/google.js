var request = require('request'),
		Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Requester = require('requester'),
		cheerio = require('cheerio');

//var googlePageData = require('./tmpPageData/googlePage'); // TEMP

var GoogleHarvester = (function() {

	var User,
			Analytics,
			requester = new Requester({
				debug: 1,
				//proxies: [{ip: '107.17.100.254', port: 8080}]
			}),
			google,
			data,
			update = false,
			next = function(i, cb, stop) {
				var i = i+1
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null)
			};

	var Harvest = {

		business: function(itr, cb) {
			google.get('https://maps.googleapis.com/maps/api/place/details/json', {key: google.client.key, reference: data.network_ref, sensor: false, review_summary: true}, function(err, response) {
				if(err || response.error)
					return console.log('error', err, response)

				var place = response.result,
						cached = Analytics.google.business.data,
						timestamp = Helper.timestamp(),
						ratingChange = false,
						localUpdate = false;
console.log(place);
				if(
					!cached
					|| place.id != cached.id
					|| place.name != cached.name
					|| place.reference != cached.reference
					|| place.formatted_address != cached.formatted_address 
					|| place.formatted_phone_number != cached.formatted_phone_number 
					|| place.international_phone_number != cached.international_phone_number 
					|| place.url != cached.url 
					|| place.website != cached.website 
					|| place.types.length != cached.types.length
				) {
					update = localUpdate = true;
					Analytics.google.business = {
						timestamp: timestamp,
						data: place
					}

					//Model.User.findById(data.user, function(err, user) {
						User.Business.Social.google.business.data = Analytics.google.business.data;
						//user.save(function(err) {console.log(err)});
					//});
				}

				if(parseFloat(place.rating) != Analytics.google.tracking.rating.score) {
					update = localUpdate = true;
					ratingChange = Analytics.google.tracking.rating.timestamp;
					Analytics.google.tracking.rating.history.push({
						timestamp: timestamp,
						score: parseFloat(place.rating)
					})
					Analytics.google.tracking.rating.score = parseFloat(place.rating);
					Analytics.google.tracking.rating.timestamp = timestamp;

					//User[0].Business[0].Social.google.reviews.override = ratingChange = true;
				}	

				if(localUpdate)
					console.log('saved updated Google business and rating data from API.');

				if(Business.Social.google.reviews.timestamp === 0 || (ratingChange && Business.Social.google.reviews.timestamp < ratingChange))
					next(itr, cb)
				else
					next(itr, cb, true)
			})
		},

		// call every 5 minutes
		reviews: function(itr, cb, pagination) {

			// if we dont have the business page id then scrape the webpage for the data
			if(!Analytics.google.business.page.local.id) {
				// if we don't have the url to scrape
				// for the business page id then exit
				if(!Analytics.google.business.data.url) {
					if(User.Business[0])
						User.Business[0].Social.google.reviews.timestamp = timestamp;
					else
						User.Business.Social.google.reviews.timestamp = timestamp;
					return next(itr, cb);
				}

				requester.get(Analytics.google.business.data.url, function(body) {
					if (this.statusCode != 200)
						return next(itr, cb);

					var $ = cheerio.load(body);
					update = true;

					Analytics.google.business.page.local.id = $('div[data-placeid]').attr('data-placeid');
					return Harvest.reviews(itr, cb)
				})
			} else {
				var count = 1000, //Math.max((count || getReviews.count), 100),
						pagination = pagination || 0,
						timestamp = Helper.timestamp(),
						localUpdate = false;

				//User[0].Business[0].Social.google.reviews.scraped = true;
				//User[0].Business[0].Social.google.reviews.override = false;
				//User[0].Business[0].Social.google.reviews.timestamp = timestamp;

				if(User.Business[0])
					User.Business[0].Social.google.reviews.timestamp = timestamp;
				else
					User.Business.Social.google.reviews.timestamp = timestamp;

				request.post('https://plus.google.com/_/pages/local/loadreviews', 
					{ form: {
						"f.req": '["' + Analytics.google.business.page.local.id + '",null,[null,null,[[28,' + pagination + ',' + count + ',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
						at: 'AObGSAiOtoNHKnLAO-PWRdWXOASNwMAl4g:1379699578795'
					}}, 
					function(err, res) {
						if(err)
							return console.log('error!: ', err);

						if(!res.body || res.body == '')
							return console.log('error!: ', err);

						// make sure the proper JSON set was returned for eval() parsing
						if(res.body.toString().indexOf(")]}'") !== -1)
							console.log('error!: ', err);

						var parsedReviewData = eval(res.body.toString().replace(")]}'", "").trim())
								reviews = parsedReviewData[0][1][11][0],
								reviewObject = {},
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
									id: reviews[i][0][3] /// use this for klout
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
console.log(overview);
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

						if (reviews.length >= count)
							Harvest.reviews(itr, cb, (count+pagination))
						else 
							next(itr, cb);

	//console.log(reviewObject);

					}
				)

			} // end Google page id else
		},




// USER OBJECT: [0][1][11][0][0][0]
// user plus page: 
// 			[0][1][11][0][0][0][0][0]
//			OR
//			[0][1][11][0][0][0][0][3][0] (more concise)
// user name: [0][1][11][0][0][0][0][1]
// user photo: [0][1][11][0][0][0][1]

// REVIEW Object:
// user review: [0][1][11][0][0][3] // this can be undefined if the review is short enough for summary
// user review summary: [0][1][11][0][0][4]
// relative time: [0][1][11][0][0][5]
// language code: [0][1][11][0][0][30]
// google reference code: [0][1][11][0][0][33]

// TODO: look into correct "inappropriate flag":
// url between:  [0][1][11][0][0][7], [0][1][11][0][0][13]


	} // End Harvest


	return {
		getMetrics: function(user, params, callback) {
			if(!user)
				return Log.error('No user provided', {error: err, meta: params, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})

			User = user[0] || user,
			Business = User.Business[0] || User.Business,
			google = Auth.load('google'),
			data = params,
			update = false;

			Model.Analytics.findById(Business.Analytics.id, function(err, analytics) {
				Analytics = analytics;

				Harvest[data.methods[0]](0, function() {
					if(update)
						Analytics.save(function(err,r){
							if(err)
								return Log.error('Error saving to Analytics table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
							callback(null, update);
						})
					else
						callback(null, update);
				});
			})
		}
	}

})();

module.exports = GoogleHarvester;