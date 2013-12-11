/*
 * Yelp Harvester
 *
 * Rate limit: 10,000/day | 416.66/min | 6.944/min [no user specific calls, only application based]
 * http://www.yelp.com/developers/getting_started
 *
 */

var fs = require('fs'),
		zlib = require('zlib'),
		request = require('request'),
		Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Alert = require('../logger').getInstance().getLogger('alert'),
		ScrapingLog = require('../logger').getInstance().getLogger('scraping'),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Requester = require('requester'),
		cheerio = require('cheerio');

var yelpPageData = require('./tmpPageData/yelpPage'); // TEMP

var YelpHarvester = function() {

	var User,
			Analytics,
			index = 0,
			//requester = new Requester({
				//debug: 1,
				//proxies: [{ip: '107.17.100.254', port: 8080}]
			//}),
			yelp,
			response,
			data,
			update = false,
			retries = Helper.retryErrorCodes,
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
console.log('at yelp business info update method...');
			request.get({
					url: yelp.base + 'business/' + data.network_id,
					oauth: yelp.client,
					json: true
				},
				function(err, response) {

				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && (response.statusCode === 503 || response.statusCode === 504 || retries.indexOf(err.code) > -1)) {
					if(retry && retry > 2) {
						Error.handler('yelp', 'Yelp business method failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.business(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || (response && response.statusCode !== 200)) {	
					Error.handler('yelp', err || response.statusCode, err, response, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb)
				}

				var response = response.body,
						cached = Analytics.yelp.business.data,
						timestamp = Helper.timestamp(),
						reviewsUpdated = false,
						localUpdate = false;

				if(
					!cached
					|| response.id != cached.id
					|| response.name != cached.name
					|| response.is_claimed != cached.is_claimed
					|| response.is_closed != cached.is_closed 
					|| response.image_url != cached.image_url 
					|| response.url != cached.url 
					|| response.phone != cached.phone 
					//|| response.snippet_text != cached.snippet 
					//|| (cached.categories && response.categories.length != cached.categories.length)
					|| !response.location.address.equals(cached.location.address)
					|| !response.location.display_address.equals(cached.location.display_address)
					|| !response.location.neighborhoods.equals(cached.location.neighborhoods)
					|| response.location.city != cached.location.city 
					|| response.location.state_code != cached.location.state_code 
					|| response.location.postal_code != cached.location.postal_code
				) {
					update = localUpdate = true;
					response.reviews = [];
					Analytics.yelp.business = {
						timestamp: timestamp,
						data: response
					}
console.log('here1');
					User.Business[index].Social.yelp.business = Analytics.yelp.business.data;
				}

				if(response.review_count != Analytics.yelp.tracking.reviews.total) {
					update = localUpdate = reviewsUpdated = true;
					Analytics.yelp.tracking.reviews.history.push({
						timestamp: timestamp,
						total: response.review_count
					})
					Analytics.yelp.tracking.reviews.total = response.review_count;
					Analytics.yelp.tracking.reviews.timestamp = timestamp;
				}

				if(parseFloat(response.rating) != Analytics.yelp.tracking.rating.score) {
					update = localUpdate = reviewsUpdated = true;
					Analytics.yelp.tracking.rating.history.push({
						timestamp: timestamp,
						score: parseFloat(response.rating)
					})
					Analytics.yelp.tracking.rating.score = parseFloat(response.rating);
					Analytics.yelp.tracking.rating.timestamp = timestamp;
				}	

				if(localUpdate)
					console.log('saving updated Yelp business and review/rating data from API...');

				//next(itr, cb, reviewsUpdated ? false : true);
				next(itr, cb)
			})
		},

		// called only if a change has occured from above
		reviews: function(itr, cb, pagination) {
console.log('at yelp reviews harvesting method...');		
			// mark the attempt time 
			var timestamp = Helper.timestamp();
			User.Business[index].Social.yelp.update.timestamp = timestamp;

			// only scrape if something has changed from the API data
			// although this could give untrue data (such as if someone posts a review and another user deletes a review within the same 24 hour period)
			// the likelyhood is low. when we get more money we can connect proxies and run this every 24 hours for all businesses
			if(!Analytics.yelp.business.data.url)
				return next(itr, cb);

/// use this to set specific pages for testing TMP
//var url = 'http://www.yelp.com/biz/speak-social-austin';//'http://www.yelp.com/biz/midas-auto-service-experts-austin-6'; //Analytics.yelp.business.data.url;
			
			var cached = Analytics.yelp.business.data,
					pagination = (pagination || 0),
					timestamp = Helper.timestamp(),
					localUpdate = false;

			request.get(Analytics.yelp.business.data.url + '?sort_by=date_desc' + (pagination ? '&start=' + (pagination * Analytics.yelp.harvest.pagination.multiplier) : ''), 
				{ 
					headers: {
						'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
						'accept-language' : 'en-US,en;q=0.8',
						'accept' : '*/*',
						//'accept-encoding': 'gzip,deflate,sdch',
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
					}
				}, function(err, res) {
				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && (response.statusCode === 503 || response.statusCode === 504 || retries.indexOf(err.code) > -1)) {
					if(retry && retry > 2) {
						Error.handler('yelp', 'Yelp reviews method failed to connect in 3 attempts!', err, res, {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.reviews(itr, cb, pagination, retry ? ++retry : 1)
				}

				// error handling
				if (err || !res || res.statusCode !== 200 || !res.body || res.body == '') {
					Error.handler('yelp', err || res.statusCode, err, res, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				var $ = cheerio.load(res.body),
						reviewsCount = $('#reviews-other .reviews-header').length ? parseInt($('#reviews-other .reviews-header').text().trim(), 10) : 0, // TODO: add || #rpp-count
						filteredReviewsCount = $('.filtered-reviews #filtered-reviews-link').length ? parseInt($('.filtered-reviews #filtered-reviews-link').text().trim(), 10) : $('.not-recommended a').length ? parseInt($('.not-recommended a').text().trim(), 10) : $('#paginationControls #filtered-reviews-link').length ? parseInt($('#paginationControls #filtered-reviews-link').text().trim(), 10) : false,
						reviewObject = {},
						complete = false;

if(filteredReviewsCount === false) {
	Harvest.savePage(null, null, res.body)
	Log.warn('could find filteredReviewsCount on Yelp page. Check newest saveFile() output')
}

				// if NaN then set to 0
				reviewsCount = (!reviewsCount || Number.isNaN(reviewsCount)) ? 0 : reviewsCount;
				filteredReviewsCount = (filteredReviewsCount === false || Number.isNaN(filteredReviewsCount)) ? false : filteredReviewsCount;

				if(!Analytics.yelp.business.id && $('#edit_cat_link').length && $('#edit_cat_link').attr('href')) {
					update = localUpdate = true;
					Analytics.yelp.business.id = $('#edit_cat_link').attr('href').trim().replace('/biz_attribute?biz_id=', '')
				}

				if(filteredReviewsCount !== false && Analytics.yelp.reviews.filtered.count !== filteredReviewsCount) {
					update = localUpdate = true;
					Analytics.yelp.reviews.filtered.count = filteredReviewsCount;
				}

				reviewsLoop:
				for(var i=0, l=$('#reviews-other ul li.review').length; i<l;i++) {
					var value = $('#reviews-other ul li.review')[i];

					// verify that we have a review ID in the scraped HTML!
					if(!$(value).attr('id') || $(value).attr('id') === '') {
						console.log('ERROR ALERT OMG');
						ScrapingLog.error('Missing Yelp review ID!', {review: $(value).html().toString(), iteration: i, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb);
						break;
					}

					// exit once we reach an already stored review id
					for(var x=0, len=Analytics.yelp.reviews.active.length; x<len;x++)
						if(Analytics.yelp.reviews.active[x].id == $(value).attr('id')) {
							complete = true;					
							break reviewsLoop;
						}

					// these should stop review processing and send an alert!
					if(
							!$(value).find('.media-block .media-story .review-meta > meta').length // date
							|| !$(value).find('.media-block .media-avatar .user-passport .user-name a').length // name, user_id, and url
							|| !$(value).find('.media-block .media-avatar .user-passport .user-name a').attr('href') // user id and url attribute
							|| !$(value).find('.media-block .media-avatar .user-passport .photo-box a img').length // user photo
							|| !$(value).find('.media-block .media-avatar .user-passport .photo-box a img').attr('src') // user photo attribute
							|| !$(value).find('.media-block .media-story .review-meta .rating meta').length // rating
							|| !$(value).find('.media-block .media-story .review-meta .rating meta').attr('content') // rating attribute
							|| !$(value).find('.media-block .media-story .review_comment').length // review text
					) {
						Alert.file('Missing one or more critical Yelp review DOM elements!', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Missing one or more critical Yelp review DOM elements!', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						ScrapingLog.error('Missing one or more critical Yelp review DOM elements!', {review: $(value).html().toString(), iteration: i, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						return next(itr, cb);
					}

					// these send an error to logs but shouldn't stop review processing
					if(
							!$(value).find('.media-block .media-avatar p.reviewer_info').length // location
							|| !$(value).find('.media-block .media-avatar .user-passport .user-stats .friend-count > span').length // friend count
							|| !$(value).find('.media-block .media-avatar .user-passport .user-stats .review-count > span').length // review count
							//|| !$(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').length // owner comment url
							//|| !$(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').attr('href') // owner comment url attribute
					) {
						console.log('not as error alerting ');
						Error.handler('yelp', 'Missing a non-critical review DOM element!', null, null, {iteration: i, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'warn'})
						ScrapingLog.error('Missing one or more non-critical Yelp review DOM element!', {review: $(value).html().toString(), iteration: i, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					}

					update = localUpdate = true;

					var date = $(value).find('.media-block .media-story .review-meta > meta').attr('content'),
							elite = $(value).find('.media-block .media-avatar .user-passport .user-stats li.is-elite').length ? $(value).find('.media-block .media-avatar .user-passport .user-stats li.is-elite') : false,
							reviewAttributes = {
								useful: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.useful a span.count').length ? $(value).find('.media-block .media-story .extra-actions .rateReview ul li.useful a span.count').text() : '',
								funny: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.funny a span.count').length ? $(value).find('.media-block .media-story .extra-actions .rateReview ul li.funny a span.count').text() : '',
								cool: $(value).find('.media-block .media-story .extra-actions .rateReview ul li.cool a span.count').length ? $(value).find('.media-block .media-story .extra-actions .rateReview ul li.cool a span.count').text() : ''
							},
							listArray = [],
							imageArray = [];

					if($(value).find('.userLists a').length)
						$(value).find('.userLists a').each(function(list_key, list) {
							if($(list).length)
								listArray.push({
									url: $(list).attr('href') ? $(list).attr('href') : '',
									title: $(list).text().trim(),
									summary: $(list).attr('title') ? $(list).attr('title') : ''
								})
						})

					if($(value).find('.review-photos ul.photo-list li').length)
						$(value).find('.review-photos ul.photo-list li').each(function(image_key, image) {
							imageArray.push({
								url: $(image).find('a').length && $(image).find('a').attr('href') ? $(image).find('a').attr('href') : '',
								image: $(image).find('img').length && $(image).find('img').attr('src') ? $(image).find('img').attr('src') : '',
								caption: $(image).find('p').length ? $(image).find('p').text().trim() : ''
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
							friend_count: $(value).find('.media-block .media-avatar .user-passport .user-stats .friend-count > span').length ? parseInt($(value).find('.media-block .media-avatar .user-passport .user-stats .friend-count > span').text().trim(), 10) : 0,
							review_count: $(value).find('.media-block .media-avatar .user-passport .user-stats .review-count > span').length ? parseInt($(value).find('.media-block .media-avatar .user-passport .user-stats .review-count > span').text().trim(), 10) : 0,
							is_elite: (elite && elite != '') ? true : false
						},
						rating: {
							score: $(value).find('.media-block .media-story .review-meta .rating meta').length && $(value).find('.media-block .media-story .review-meta .rating meta').attr('content') ? parseFloat($(value).find('.media-block .media-story .review-meta .rating meta').attr('content')) : 0,
						},
						review: {
							text: $(value).find('.media-block .media-story .review_comment').length ? $(value).find('.media-block .media-story .review_comment').text().trim() : '',
							useful_count: reviewAttributes.useful !== '' && !Number.isNaN(reviewAttributes.useful) ? parseInt(reviewAttributes.useful, 10) : 0,
							funny_count: reviewAttributes.funny !== '' && !Number.isNaN(reviewAttributes.funny) ? parseInt(reviewAttributes.funny, 10) : 0,
							cool_count: reviewAttributes.cool !== '' && !Number.isNaN(reviewAttributes.cool) ? parseInt(reviewAttributes.cool, 10) : 0
						},
						links: {
							owner_comment: $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').length && $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').attr('href') ? $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.add-owner-comment').attr('href') : '',
							to_review: 'http://www.yelp.com/' + $(value).find('.media-block .media-story .extra-actions .externalReviewActions li a.i-orange-link-common-wrap').attr('href').trim()
						},
						lists: listArray,
						images: {
							url: $(value).find('.review-photos .more-review-photos a').length && $(value).find('.review-photos .more-review-photos a').attr('href') ? $(value).find('.review-photos .more-review-photos a').attr('href') : undefined,
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

				if(localUpdate) {
					console.log('saving updated Yelp active reviews...')
					Analytics.markModified('yelp.reviews.active')
				}

				Analytics.yelp.harvest.timestamp = timestamp
				next(itr, cb)
				
			})
		},

		reviewStructureCheck: function(id, review) {
			var $ = cheerio.load(review);

			// these should stop review processing and send an alert!
			if(
					!id || id === ''
					|| !$('.media-block').find('.media-story .review-meta > meta').length // date
					|| !$('.media-block').find('.media-avatar .user-passport .user-name a').length // name, user_id, and url
					|| !$('.media-block').find('.media-avatar .user-passport .user-name a').attr('href') // user id and url attribute
					|| !$('.media-block').find('.media-avatar .user-passport .photo-box a img').length // user photo
					|| !$('.media-block').find('.media-avatar .user-passport .photo-box a img').attr('src') // user photo attribute
					|| !$('.media-block').find('.media-story .review-meta .rating meta').length // rating
					|| !$('.media-block').find('.media-story .review-meta .rating meta').attr('content') // rating attribute
					|| !$('.media-block').find('.media-story .review_comment').length // review text
			) {
				callback('a necessary HTML DOM element is missing!')
			}

			// these send an error to logs but shouldn't stop review processing
			if(
					!$('.media-block').find('.media-story .extra-actions .rateReview ul li.useful a span.count').length // useful
					|| !$('.media-block').find('.media-story .extra-actions .rateReview ul li.funny a span.count').length // funny
					|| !$('.media-block').find('.media-story .extra-actions .rateReview ul li.cool a span.count').length // cool
					|| !$('.media-block').find('.media-avatar p.reviewer_info').length // location
					|| !$('.review-photos').find('.more-review-photos a').length // images url
					|| !$('.review-photos').find('.more-review-photos a').attr('href') // images url attribute
					|| !$('.media-block').find('.media-avatar .user-passport .user-stats .friend-count > span').length // friend count
					|| !$('.media-block').find('.media-avatar .user-passport .user-stats .review-count > span').length // review count
					|| !$('.media-block').find('.media-story .extra-actions .externalReviewActions li a.add-owner-comment').length // owner comment url
					|| !$('.media-block').find('.media-story .extra-actions .externalReviewActions li a.add-owner-comment').attr('href') // owner comment url attribute
			) {
				Error.handler('yelp', 'Missing a non-critical review DOM element!', null, null, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
				ScrapingLog.error('Missing a non-critical review DOM element!', {review: $('.media-block').html().toString(), file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				callback(null)
			}
		},

		// quickly save a scraped page for debugging
		savePage: function(itr, cb, html) {
			if(!html)
				requester.get('http://www.yelp.com/biz/midas-green-tech-austin?sort_by=date_desc', function(body) {
					fs.writeFileSync('server/harvesters/output/yelp.' + Helper.timestamp() + '.html', body)
				})
			else
				fs.writeFileSync('server/harvesters/output/yelp.' + Helper.timestamp() + '.html', html)
		},

		// every 5 minutes with proxies, every 4 hours without
		pageChangesAlert: function() {
			request.get('http://www.yelp.com/biz/speak-social-austin?sort_by=date_desc',
				{
					headers: {
						'accept-charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
  					'accept-language' : 'en-US,en;q=0.8',
  					'accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						//'accept-encoding': 'gzip,deflate,sdch',
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36'
					}
				}, function(err, res) {
					if (err || !res || res.statusCode !== 200 || !res.body || res.body == '')
						return Error.handler('yelp', err || res.statusCode, err, res, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})

				var $ = cheerio.load(res.body),
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
						Alert.file('change in the Yelp html elements structure!', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('change in the Yelp html elements structure!', {file: __filename, line: Helper.stack()[0].getLineNumber()})
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
			if(!user || !params || typeof params.index === 'undefined') // index may be zero so check typeof
				return Log.error('No user or params provided', {meta: params, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

			User = user,
			index = params.index,
			yelp = Auth.load('yelp'),
			data = params,
			update = false;

			Model.Analytics.findById(User.Business[index].Analytics.id, function(err, analytics) {
				Analytics = analytics;
				analytics = null;

				Harvest[data.methods[0]](0, function() {
					if(update)
						Analytics.save(function(err, save) {
							if(err && err.name !== 'VersionError')
								return Log.error('Error saving Yelp analytics to database', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

							// if we have a versioning overwrite error than load up the analytics document again
							if(err && err.name === 'VersionError')
								Model.Analytics.findById(User.Business[index].Analytics.id, function(err, analytics) {
									if(err)
										return Log.error('Error querying Analytic table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

									analytics.yelp = Analytics.yelp;
									analytics.markModified('yelp')

									analytics.save(function(err, save) {
										if(err)
											return Log.error('Error saving Yelp analytics to database', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
										callback();
									})
								})

							callback();
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

};

module.exports = YelpHarvester;