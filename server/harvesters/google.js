var request = require('request'),
		Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Requester = require('requester'),
		cheerio = require('cheerio'),
		winston = require('winston');

var googlePageData = require('./tmpPageData/googlePage'); // TEMP

var GoogleHarvester = (function() {

	/*winston.add(winston.transports.File, 
		{ filename: 'googlePage.log' 
			, json: true
		})
	.remove(winston.transports.Console);*/

	var Analytics,
			requester = new Requester({
				debug: 1,
				//proxies: [{ip: '107.17.100.254', port: 8080}]
			}),
			google,
			//response,
			data,
			update = false,
			//url = false,
			//getReviews = false,
			next = function(i, cb, err) {
				var i = i+1
				if(err) console.log(err)
				if(data.methods[i])
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

					//url = place.url;

					Model.User.findById(data.user, function(err, user) {
						user.Business[data.index].Social.google.business.data = Analytics.google.business.data;
						user.save(function(err) {console.log(err)});
					});
				}

				if(parseFloat(place.rating) != Analytics.google.tracking.rating.score) {
					update = localUpdate = true;
					Analytics.google.tracking.rating.history.push({
						timestamp: timestamp,
						score: parseFloat(place.rating)
					})
					Analytics.google.tracking.rating.score = parseFloat(place.rating);
					Analytics.google.tracking.rating.timestamp = timestamp;
				}	

				if(localUpdate)
					console.log('saved updated Google business and rating data from API.');

				next(itr, cb);
			})
		},

		scrape: function(itr, cb) {
			/// only scrape if something has changed from the API data
			//if(!update)
			//	return next(itr, cb);

			requester.get((url || Analytics.google.business.data.url), function(body) {
				if (this.statusCode != 200)
					return next(itr, cb, body);
				//console.log(body);
				//console.log(this);

				//var reviewsArray = [];

				var $ = cheerio.load(body),
						timestamp = Helper.timestamp(),
						localUpdate = false;

				var reviews_star_breakdown = {},
						topics_list = [];

				$('.tLP8Cb > div > div').each(function(key, value) {
					var star = '';
					switch(key) {
						case 0:
							star = 'five_star';
							break;
						case 1:
							star = 'four_star';
							break;
						case 2:
							star = 'three_star';
							break;
						case 3:
							star = 'two_star';
							break;
						case 4:
							star = 'one_star';
							break;
					}

					reviews_star_breakdown[star] = $(value).find('.g-wc').text().trim();
				})

				$('.tgAekb > span').each(function(key, value) {
					topics_list.push($(value).text().trim());
				})


				var pageObject = {
					rating: {
//						$('body div div/ div:nth-child(3) div:nth-child(2) div:nth-child(4) div div div div:nth-child(2) div div div div:nth-child(3) div div div div div:nth-child(2) div:nth-child(3)')
						score: parseFloat($('.SNJ03').text().trim()),
						//stars: 
					},
					reviews: {
						count: $('.ix.ZzSoq.IY5lWc .TezzSb.qja').text(),
						star_breakdown: reviews_star_breakdown
					},
					summary: $('.Jya').text().trim(),
					topics: topics_list,
					zagat_featured: $('.r6Rtbe.bh0S9e.sLv3ye.ZXKyud.tob').attr('role') ? true : false
				}

				if(
					pageObject.summary != Analytics.google.business.page.local.data.summary
					|| pageObject.topics.length !== Analytics.google.business.page.local.data.length
					|| pageObject.zagat_featured != Analytics.google.business.page.local.data.zagat_featured
				) {
					update = localUpdate = true;
					Analytics.google.business.page.local.data = {
						summary: pageObject.summary,
						topics: pageObject.topics,
						zagat_featured: pageObject.zagat_featured
					}
				}

				if(pageObject.reviews.count != Analytics.google.tracking.reviews.total) {
					update = localUpdate = true;

					if(pageObject.reviews.count > Analytics.google.tracking.reviews.total)
						getReviews = {
							count: pageObject.reviews.count - Analytics.google.tracking.reviews.total,
							pagination: Analytics.google.tracking.reviews.total,
							total: pageObject.reviews.count
						}
					else 
						getReviews = {
							count: pageObject.reviews.count,
							pagination: 0,
							removed: true
						}

					Analytics.google.tracking.reviews.history.push({
						total: pageObject.reviews.count,
						star_breakdown: pageObject.reviews.star_breakdown,
						timestamp: timestamp
					})
					Analytics.google.tracking.reviews.total = pageObject.reviews.count;
					Analytics.google.tracking.reviews.timestamp = timestamp;
				}

				if(pageObject.rating.score != Analytics.google.tracking.rating.score) {
					update = localUpdate = true;
					Analytics.google.tracking.rating.history.push({
						score: pageObject.rating.score,
						timestamp: timestamp
					});
					Analytics.google.tracking.rating.score = pageObject.rating.score;
					Analytics.google.tracking.rating.timestamp = timestamp;
				}

				if(!Analytics.google.business.page.local.id) {
					update = localUpdate = true;
					Analytics.google.business.page.local.id = $('div[data-placeid]').attr('data-placeid');
					getReviews = {
						count: pageObject.reviews.count,
						pagination: 0
					}
				}

console.log(pageObject);				

				next(itr, cb);
			})
		},

		reviews: function(itr, cb, pagination) {

// Need to have id from page scrape
// and total new reviews to look up with pagination

			// only call review POST if something has changed from the API data
			if(!Analytics.google.business.data.url)
				return next(itr, cb);

			if(!Analytics.google.business.page.local.id) {
				requester.get(Analytics.google.business.data.url, function(body) {
					if (this.statusCode != 200)
						return next(itr, cb, body);

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

				request.post('https://plus.google.com/_/pages/local/loadreviews', 
					{ form: {
						"f.req": '["' + Analytics.google.business.page.local.id + '",null,[null,null,[[28,' + pagination + ',' + count + ',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
						at: 'AObGSAiOtoNHKnLAO-PWRdWXOASNwMAl4g:1379699578795'
					}}, 
					function(err, res) {
						if(err)
							return console.log('error!: ', err);

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

		cheer: function(itr, cb) {
			$ = cheerio.load(googlePageData.html);

			var reviews_star_breakdown = {},
					topics_list = [];

			$('.tLP8Cb > div > div').each(function(key, value) {
				var star = '';
				switch(key) {
					case 0:
						star = 'five_star';
						break;
					case 1:
						star = 'four_star';
						break;
					case 2:
						star = 'three_star';
						break;
					case 3:
						star = 'two_star';
						break;
					case 4:
						star = 'one_star';
						break;
				}

				reviews_star_breakdown[star] = $(value).find('.g-wc').text().trim();
			})

			$('.tgAekb > span').each(function(key, value) {
				topics_list.push($(value).text().trim());
			})


			var pageObject = {
					rating: {
						score: parseFloat($('.SNJ03').text().trim()),
						//stars: 
					},
					reviews: {
						count: $('.ix.ZzSoq.IY5lWc .TezzSb.qja').text(),
						star_breakdown: reviews_star_breakdown
					},
					summary: $('.Jya').text().trim(),
					topics: topics_list,
					zagat_featured: $('.r6Rtbe.bh0S9e.sLv3ye.ZXKyud.tob').attr('role') ? true : false
				}
//console.log(pageObject);


console.log('id: ', $('div[data-placeid]').attr('data-placeid')) //.attr('data-placeid'));

/*
request.post('https://plus.google.com/_/pages/local/loadreviews', 
	{ form: {
		"f.req": '["17751536374062546769",null,[null,null,[[28,10,10,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
		at: 'AObGSAiOtoNHKnLAO-PWRdWXOASNwMAl4g:1379699578795'
	}}, 
	function(err, res) {
		if(err)
			return console.log('error!: ', err);
//var parsedReviewData = eval(res.body.toString().replace(")]}'", "").trim());
		//strTest = { data: eval(strTest) };
		//console.log(strTest[0]);

		var parsedReviewData = eval(res.body.toString().replace(")]}'", "").trim())
				reviews = parsedReviewData[0][1][11][0],
				reviewObjects = [];

		for(var i=0, l=reviews.length; i<l;i++) {
			reviewObjects.push({
				user: {
					name: reviews[i][0][0][1],
					page: reviews[i][0][0][3][0] || reviews[i][0][0][0],
					photo: reviews[i][0][1]
				},
				review: {
					complete: reviews[i][3],
					summary: reviews[i][4]
				},
				lang_code: reviews[i][30],
				relative_time:reviews[i][5],
				reference: reviews[i][33],
				timestamp: Helper.timestamp()
			});
		}

console.log(reviewObjects);

	} 
)*/

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

/*
			$('#reviews-other ul li.review').each(function(key, value) {

				var date = $(value).find('.media-block .media-story .review-meta > meta').attr('content'),
						elite = $(value).find('.media-block .media-avatar .user-passport .user-stats li.is-elite'),
						reviewAttributes = {
							useful: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.useful a span.count').text(),
							funny: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.funny a span.count').text(),
							cool: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.cool a span.count').text()
						};


				var reviewObject = {
					id: $(value).attr('id'),
					date: {
						standard: date,
						timestamp: new Date(date).getTime()
					},
					user: {
						name: $(value).find('.media-block .media-avatar .user-passport .user-name a').text().trim(),
						id: $(value).find('.media-block .media-avatar .user-passport .user-name a').attr('href').toString().trim().replace('http://www.yelp.com/user_details?userid=', ''),
						location: $(value).find('.media-block .media-avatar p.reviewer_info').text().trim(),
						photo: $(value).find('.media-block .media-avatar .user-passport .photo-box a img').attr('src').trim(),
						link: $(value).find('.media-block .media-avatar .user-passport .user-name a').attr('href').trim(),
						friend_count: $(value).find('.media-block .media-avatar .user-passport .user-stats .friend-count > span').text().trim(),
						review_count: $(value).find('.media-block .media-avatar .user-passport .user-stats .review-count > span').text().trim(),
						is_elite: (elite && elite != '') ? true : false
					},
					rating: {
						score: parseFloat($(value).find('.media-block .media-story .review-meta .rating meta').attr('content')),
					},
					review: {
						text: $(value).find('.media-block .media-story .review_comment').text().trim(),
						useful_count: reviewAttributes.useful != '' ? parseInt(reviewAttributes.useful, 10) : 0,
						funny_count: reviewAttributes.funny != '' ? parseInt(reviewAttributes.funny, 10) : 0,
						cool_count: reviewAttributes.cool != '' ? parseInt(reviewAttributes.cool, 10) : 0
					},
					links: {
						owner_comment: $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').attr('href').trim(),
						to_review: 'http://www.yelp.com/' + $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.i-orange-link-common-wrap').attr('href').trim()
					} 
				} 

console.log(reviewObject);
			}) */
		},

		test: function(itr, cb) {
			klout = Auth.load('klout');

			klout.get('identity.json/twitter', {screenName: 'SteveMartinToGo', key: klout.client.key}, function(err, res) {
				console.log(res);
			})
			//if(!reviews_update && !rating_update)
			//	return next(itr, cb);

			/*requester.get('http://maps.google.com/maps/place?cid=10281119596374313554', function(body) {
				if (this.statusCode != 200)
					return next(itr, cb, body);
				console.log(body);
				console.log(this);
winston.info(body);

				next(itr, cb);
			})*/
		}

	} // End Harvest


	return {
		getData: function(params, callback) {
			google = Auth.load('google'),
			data = params,
			update = false;

			Model.Analytics.findOne({id: data.analytics_id}, function(err, analytics) {
				Analytics = analytics;

				Harvest[data.methods[0]](0, function() {
					if(update)
						Analytics.save(function(err,r){
							// TODO: handle err 
							//console.log('saved all twitter analytic data from multiple methods');
							callback(null);
						})
					else
						callback(null);//callback({err: 'error occured'});
				});
			})
		}
	}

})();

module.exports = GoogleHarvester;