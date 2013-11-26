var fs = require('fs'),
		zlib = require('zlib'),
		request = require('request'),
		Auth = require('../auth').getInstance(),
		Logger = require('../logger').getInstance(),
		Log = Logger.getLogger(),
		ScrapingLog = Logger.getLogger('scraping'),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Requester = require('requester'),
		cheerio = require('cheerio');

var yelpPageData = require('./tmpPageData/yelpPage'); // TEMP

var YelpHarvester = (function() {

	var User,
			Analytics,
			requester = new Requester({
				debug: 1,
				//proxies: [{ip: '107.17.100.254', port: 8080}]
			}),
			yelp,
			response,
			data,
			update = false,
			url = false,
			next = function(i, cb, stop) {
				var i = i+1
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null)
			};

	var Harvest = {

		business: function(itr, cb) {
			yelp.business(data.network_id, function(err, response) {
				if(err || (response && response.error)) {
					Error.handler('yelp', err || response.error, err, response, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb)
				}

				var cached = Analytics.yelp.business.data,
						timestamp = Helper.timestamp(),
						localUpdate = false;

				///Model.User.findById(data.user, function(err, user) {
					User.Business[0].Social.yelp.update.timestamp = timestamp;
					//data.user.save(function(err) {
						//if(err)
						//	return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					//})
				//})

				if(
					response.id != cached.id
					|| response.name != cached.name
					|| response.is_claimed != cached.is_claimed
					|| response.is_closed != cached.is_closed 
					|| response.image_url != cached.image_url 
					|| response.url != cached.url 
					|| response.phone != cached.phone 
					|| response.snippet_text != cached.snippet 
					|| reponse.categories.length != cached.categories.length
					|| response.location.address != cached.location.address 
					|| response.location.city != cached.location.city 
					|| response.location.state_code != cached.location.state 
					|| response.location.postal_code != cached.location.postal
				) {
					update = localUpdate = true;
					Analytics.yelp.business = {
						timestamp: timestamp,
						data: response
					}

					//Model.User.findById(data.user, function(err, user) {
						User.Business[0].Social.yelp.business = Analytics.yelp.business.data;
						//data.user.save(function(err) {
							//if(err)
							//	return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						//})
					//})
				}

				if(response.review_count != Analytics.yelp.tracking.reviews.total) {
					update = localUpdate = true;
					url = response.url || cached.url;
					Analytics.yelp.tracking.reviews.history.push({
						timestamp: timestamp,
						total: response.review_count
					})
					Analytics.yelp.tracking.reviews.total = response.review_count;
					Analytics.yelp.tracking.reviews.timestamp = timestamp;
				}

				if(parseFloat(response.rating) != Analytics.yelp.tracking.rating.score) {
					update = localUpdate = true;
					Analytics.yelp.tracking.rating.history.push({
						timestamp: timestamp,
						score: parseFloat(response.rating)
					})
					Analytics.yelp.tracking.rating.score = parseFloat(response.rating);
					Analytics.yelp.tracking.rating.timestamp = timestamp;
				}	

				if(localUpdate)
					console.log('saved updated Yelp business and review/rating data from API...');

				next(itr, cb, url ? false : true);
			})
		},

		reviews: function(itr, cb, pagination) {

			// mark the attempt time 
			var timestamp = Helper.timestamp();
			User.Business[0].Social.yelp.update.timestamp = timestamp;

			// only scrape if something has changed from the API data
			// although this could give untrue data (such as if someone posts a review and another user deletes a review within the same 24 hour period)
			// the likelyhood is low. when we get more money we can connect proxies and run this every 24 hours for all businesses
			if(!url)
				return next(itr, cb);

			//if(!Analytics.yelp.business.data.url)
				//return next(itr, cb);

//var url = 'http://www.yelp.com/biz/speak-social-austin';//'http://www.yelp.com/biz/midas-auto-service-experts-austin-6'; //Analytics.yelp.business.data.url;
			
			var cached = Analytics.yelp.business.data,
					pagination = (pagination || 0),
					timestamp = Helper.timestamp(),
					localUpdate = false;

			requester.get(url + '?sort_by=date_desc' + (pagination ? '&start=' + (pagination * Analytics.yelp.harvest.pagination.multiplier) : ''), function(body) {
				if (this.statusCode !== 200) {
					Error.handler('yelp', this.statusCode, null, body, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				//fs.writeFile('server/harvesters/output/yelp-' + timestamp + '.html', body, function(err) {
					//console.log('totes here? ',err);
					
					//return
				//})

console.log(this.statusCode);

//console.log('body by yelp: ', body);
				var $ = cheerio.load(body),
						reviewsCount = parseInt($('#reviews-other .reviews-header').text().trim(), 10), // TODO: add || #rpp-count
						filteredReviewsCount = parseInt($('.filtered-reviews #filtered-reviews-link').text().trim() || $('#paginationControls #filtered-reviews-link').text().trim(), 10),
						reviewObject = {},
						complete = false;

				reviewsCount = (!reviewsCount || Number.isNaN(reviewsCount)) ? 0 : reviewsCount;
				filteredReviewsCount = (!filteredReviewsCount || Number.isNaN(filteredReviewsCount)) ? 0 : filteredReviewsCount;


				if(!Analytics.yelp.business.id && $('#edit_cat_link').attr('href')) {
					update = localUpdate = true;
					Analytics.yelp.business.id = $('#edit_cat_link').attr('href').trim().replace('/biz_attribute?biz_id=', '')
				}

				if(Analytics.yelp.reviews.filtered.count != filteredReviewsCount) {
					update = localUpdate = true;
					Analytics.yelp.reviews.filtered.count = filteredReviewsCount;
				}

				reviewsLoop:
				for(var i=0, l=$('#reviews-other ul li.review').length; i<l;i++) {
					var value = $('#reviews-other ul li.review')[i];

					for(var x=0, len=Analytics.yelp.reviews.active.length; x<len;x++)
						if(Analytics.yelp.reviews.active[x].id == $(value).attr('id')) {
							complete = true;
							break reviewsLoop;
						}

					update = localUpdate = true;

					var date = $(value).find('.media-block .media-story .review-meta > meta').attr('content'),
							elite = $(value).find('.media-block .media-avatar .user-passport .user-stats li.is-elite'),
							reviewAttributes = {
								useful: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.useful a span.count').text(),
								funny: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.funny a span.count').text(),
								cool: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.cool a span.count').text()
							},
							listArray = [],
							imageArray = [];

					$(value).find('.userLists a').each(function(list_key, list) {
						listArray.push({
							url: $(list).attr('href'),
							title: $(list).text().trim(),
							summary: $(list).attr('title')
						})
					})

					$(value).find('.review-photos ul.photo-list li').each(function(image_key, image) {
						imageArray.push({
							url: $(image).find('a').attr('href'),
							image: $(image).find('img').attr('src'),
							caption: $(image).find('p').text().trim()
						})
					})
					
					reviewObject = {
						id: $(value).attr('id'),
						date: {
							standard: date,
							timestamp: new Date(date).getTime()
						},
						user: {
							name: $(value).find('.media-block .media-avatar .user-passport .user-name a').text().trim(),
							id: $(value).find('.media-block .media-avatar .user-passport .user-name a').attr('href') ? $(value).find('.media-block .media-avatar .user-passport .user-name a').attr('href').toString().trim().replace('http://www.yelp.com/user_details?userid=', '') : '',
							location: $(value).find('.media-block .media-avatar p.reviewer_info').text().trim(),
							photo: $(value).find('.media-block .media-avatar .user-passport .photo-box a img').attr('src').trim(),
							link: $(value).find('.media-block .media-avatar .user-passport .user-name a').attr('href').trim(),
							friend_count: parseInt($(value).find('.media-block .media-avatar .user-passport .user-stats .friend-count > span').text().trim(), 10),
							review_count: parseInt($(value).find('.media-block .media-avatar .user-passport .user-stats .review-count > span').text().trim(), 10),
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
							owner_comment: $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').attr('href'),
							to_review: 'http://www.yelp.com/' + $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.i-orange-link-common-wrap').attr('href').trim()
						},
						lists: listArray,
						images: {
							url: $(value).find('.review-photos .more-review-photos a').attr('href'),
							list: imageArray
						}
					}

					// if this is the initial load then .push() in order, else .splice() to the front in order
					if(!Analytics.yelp.harvest.timestamp || !Analytics.yelp.reviews.active || !Analytics.yelp.reviews.active.length)
						Analytics.yelp.reviews.active.push(reviewObject)
					else
						Analytics.yelp.reviews.active.splice(i, 0, reviewObject)

				}

				if(!complete && ((pagination*Analytics.yelp.harvest.pagination.multiplier)+Analytics.yelp.harvest.pagination.multiplier) < reviewsCount )
					return Harvest.reviews(itr, cb, pagination+1)

				Analytics.yelp.harvest.timestamp = timestamp
				next(itr, cb)
			})
		},

		savePage: function(itr, cb) {
			requester.get('http://www.yelp.com/biz/midas-green-tech-austin?sort_by=date_desc', function(body) {
				fs.writeFileSync('server/harvesters/output/yelp.' + Helper.timestamp() + '.html', body)
			})
		},

		// every 5 minutes with proxies, every 4 hours without
		pageChangesAlert: function() {
			requester.get('http://www.yelp.com/biz/speak-social-austin?sort_by=date_desc',
				{
					headers: {
						'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
  					'accept-language' : 'en-US,en;q=0.8',
  					'accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						//'accept-encoding': 'gzip,deflate,sdch',
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
					},
					//dataType: 'RAW',
					processResponse: function (stream) {
						if(this.headers['content-encoding'] == 'gzip' ) {
	            var raw = fs.createReadStream('yelpy.html');
							return raw.pipe(zlib.createGunzip()).pipe(this);
						} else {
							return stream
						}
        	}
				}, function(body) {
				if (this.statusCode !== 200)
					return Error.handler('yelp', this.statusCode, null, body, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})

				// failed attempt at compression request
				// TODO need to fix to use gzip
				//var stream;
//this.body = [];
//this.headers = [];
//console.log(this.headers);
//return				
				/*var raw = fs.createReadStream('yelpy.html');
				if(this.headers['content-encoding'] == 'gzip' ) {
					console.log('zomg')
				 raw.pipe(zlib.createGunzip()).pipe(this);
				} else { 
					console.log('here');
					stream = this;
				}*/
				/*zlib.unzip(JSON.stringify(this.headers)+body, function(err, res) {
					console.log(err, res);
				})*/

				var $ = cheerio.load(body),
						reviewsCount = $('#reviews-other .reviews-header').length,
						filteredReviewsCount = $('.filtered-reviews #filtered-reviews-link').length || $('#paginationControls #filtered-reviews-link').length,
						yelpBusinessId = $('#edit_cat_link').length,
						reviews = $('#reviews-other ul li.review').length;

				if(!reviewsCount || !filteredReviewsCount || !yelpBusinessId || !reviews) {
					// ALERT! change in the html elements structure!
					ScrapingLog.error('necessary Yelp html page element not found!', {reviewsCount: reviewsCount, filteredReviewsCount: filteredReviewsCount, yelpBusinessId: yelpBusinessId, reviews: reviews, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!reviews)
						return;
				}

				// go through reviews and detect missing elements
				var review = $('#reviews-other ul li.review')[0],
						elementsArray = [
							$(review).attr('id'), // 0 - review_id
							$(review).find('.media-block .media-avatar .user-passport .user-name a').length, // 1 - user name and id
							$(review).find('.media-block .media-avatar p.reviewer_info').length,
							$(review).find('.media-block .media-avatar .user-passport .photo-box a img').length,
							$(review).find('.media-block .media-avatar .user-passport .user-name a').length,
							$(review).find('.media-block .media-avatar .user-passport .user-stats .friend-count > span').length,
							$(review).find('.media-block .media-avatar .user-passport .user-stats .review-count > span').length,
							$(review).find('.media-block .media-story .review-meta .rating meta').length,
							$(review).find('.media-block .media-story .review_comment').length,
							$(review).find('.media-block .media-story .review-meta > meta').length,
							//$(review).find('.media-block .media-avatar .user-passport .user-stats li.is-elite').length,
							$(review).find('.media-block .media-story .extra-actions .rateReview ul li.useful a span.count').length,
							$(review).find('.media-block .media-story .extra-actions .rateReview ul li.funny a span.count').length,
							$(review).find('.media-block .media-story .extra-actions .rateReview ul li.cool a span.count').length,
							$(review).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').length,
							$(review).find('.media-block .media-story .extra-actions .externalReviewActions li a.i-orange-link-common-wrap').length,
							//$(review).find('.review-photos .more-review-photos a').length
						]

				for(var i=0, l=elementsArray.length; i<l;i++) {
					if(!elementsArray[i])
						// ALERT! change in the html elements structure!
						ScrapingLog.error('necessary Yelp html page element not found!', {elementsArray: elementsArray, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				}
			})
		},


		cheer: function(itr, cb, pagination) {

			var $ = cheerio.load(yelpPageData.html),
					reviewsCount = parseInt($('#reviews-other .reviews-header').text().trim(), 10) || parseInt($('#review-count-search h2#total_reviews').text().trim(), 10),
					filteredReviewsCount = parseInt($('#paginationControls #filtered-reviews-link').text().trim(), 10),
					reviewObject = {},
					cached = Analytics.yelp.business.data,
					pagination = (pagination || 0),
					timestamp = Helper.timestamp(),
					localUpdate = false;

			if(!Analytics.yelp.business.id) {
				update = localUpdate = true;
				Analytics.yelp.business.id = $('#edit_cat_link').attr('href').trim().replace('/biz_attribute?biz_id=', '')
			}

			if(Analytics.yelp.reviews.filtered.count != filteredReviewsCount) {
				update = localUpdate = true;
				Analytics.yelp.reviews.filtered.count = filteredReviewsCount;
			}

			//$('#reviews-other ul li.review').each(function(key, value) {
			for(var i=0, l=$('#reviews-other ul li.review').length; i<l;i++) {
				var value = $('#reviews-other ul li.review')[i];

				for(var x=0, len=Analytics.yelp.reviews.active.length; x<len;x++)
					if(Analytics.yelp.reviews.active[x].id == $(value).attr('id'))
						break;

				update = localUpdate = true;

				var date = $(value).find('.media-block .media-story .review-meta > meta').attr('content'),
						elite = $(value).find('.media-block .media-avatar .user-passport .user-stats li.is-elite'),
						reviewAttributes = {
							useful: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.useful a span.count').text(),
							funny: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.funny a span.count').text(),
							cool: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.cool a span.count').text()
						};
				
				reviewObject = {
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
					},
					images: {

					},
					lists: []
				}

				// if this is the initial load then .push() in order, else .splice() to the front in order
				if(!Analytics.yelp.harvest.timestamp || !Analytics.yelp.reviews.active || !Analytics.yelp.reviews.active.length)
					Analytics.yelp.reviews.active.push(reviewObject)
				else
					Analytics.yelp.reviews.active.splice(i, 0, reviewObject)

			}

			if(((pagination*Analytics.yelp.harvest.pagination.multiplier)+Analytics.yelp.harvest.pagination.multiplier) < reviewsCount )
				return Harvest.reviews(itr, cb, pagination+1)

			Analytics.yelp.harvest.timestamp = timestamp
			next(itr, cb)

			/*if(newReviews) {
				update = localUpdate = true;
				Analytics.yelp.reviews.active.sort(Helper.sortBy())
			}*/

//console.log($('#reviews-other ul li.review'));
/*var test = $('#reviews-other ul li.review');

console.log(test);
for(var i=0, l=test.length; i<l;i++) {
	var value = test[i];
	console.log($(value).attr('id'));
}*/
	
		},

		test: function(itr, cb) {
			//if(!reviews_update && !rating_update)
			//	return next(itr, cb);

			requester.get('http://maps.google.com/maps/place?cid=10281119596374313554', function(body) {
				if (this.statusCode != 200)
					return next(itr, cb, body);
				console.log(body);
				console.log(this);
//winston.info(body);
				//$ = cheerio.load(body);

				//$('#reviews-other ul li.review').each(function(key, value) {
				//	console.log($(value).find('.review_comment').text());
				//})

				next(itr, cb);
			})
		}

	} // End Harvest


	return {
		getMetrics: function(user, params, callback) {
			if(!user)
				return Log.error('No user provided', {error: err, meta: params, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

			User = user,
			yelp = Auth.load('yelp'),
			data = params,
			update = false;

			Model.Analytics.findById(User.Business[0].Analytics.id, function(err, analytics) {
				Analytics = analytics;

				Harvest[data.methods[0]](0, function() {
					if(update)
						Analytics.save(function(err,r){
							if(err)
								return Log.error('Error saving to Analytics table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							callback(null, update);
						})
					else
						callback(null, update);
				});
			})
		},
		directToMethod: function(params, callback) {
			//yelp = Auth.load('yelp'),
			data = params,
			update = false;

			Harvest[data.methods[0]](0, function() {
				callback(null, update);
			});
		}
	}

})();

module.exports = YelpHarvester;