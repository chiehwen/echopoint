var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Requester = require('requester'),
		cheerio = require('cheerio'),
		winston = require('winston');

var YelpHarvester = (function() {

	/*winston.add(winston.transports.File, 
		{ filename: 'googlePage.log' 
			, json: true
		})
	.remove(winston.transports.Console);*/

	var Analytics,
			requester = new Requester({
				debug: 1,
				//proxies: [{ip: '184.82.95.37', port: 80}]
			}),
			yelp,
			response,
			data,
			update = false,
			reviews_update = false,
			rating_update = false,
			url = false,
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
			yelp.business(data.network_id, function(err, response) {
				if(err || response.error)
					return console.log(err, response.meta); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

				var cached = Analytics.yelp.business.data,
						timestamp = Helper.timestamp(),
						localUpdate = false;

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

					url = response.url;

					Model.User.findById(data.user, function(err, user) {
						user.Business[data.index].Social.yelp.business = Analytics.yelp.business.data;
						user.save(function(err) {console.log(err)});
					});
				}

				if(response.review_count != Analytics.yelp.tracking.reviews.total) {
					update = localUpdate = true;
					reviews_update = true;
					Analytics.yelp.tracking.reviews.history.push({
						timestamp: timestamp,
						total: response.review_count
					})
					Analytics.yelp.tracking.reviews.total = response.review_count;
					Analytics.yelp.tracking.reviews.timestamp = timestamp;
				}

				if(response.rating != Analytics.yelp.tracking.rating.score) {
					update = localUpdate = true;
					rating_update = true;
					Analytics.yelp.tracking.rating.history.push({
						timestamp: timestamp,
						score: parseFloat(response.rating)
					})
					Analytics.yelp.tracking.rating.score = parseFloat(response.rating);
					Analytics.yelp.tracking.rating.timestamp = timestamp;
				}	

				if(localUpdate)
					console.log('saved updated Yelp business and review/rating data from API...');

				next(itr, cb);
			})
		},

		reviews: function(itr, cb) {
			//if(!reviews_update && !rating_update)
			//	return next(itr, cb);

			requester.get((url || Analytics.yelp.business.data.url) + '?sort_by=date_desc', function(body) {
				if (this.statusCode != 200)
					return next(itr, cb, body);
				//console.log(body);
				//console.log(this);

				$ = cheerio.load(body);

				$('#reviews-other ul li.review').each(function(key, value) {
					console.log($(value).find('.review_comment').text());
				})

				next(itr, cb);
			})
		},

		test: function(itr, cb) {
			//if(!reviews_update && !rating_update)
			//	return next(itr, cb);

			requester.get('http://maps.google.com/maps/place?cid=10281119596374313554', function(body) {
				if (this.statusCode != 200)
					return next(itr, cb, body);
				console.log(body);
				console.log(this);
winston.info(body);
				//$ = cheerio.load(body);

				//$('#reviews-other ul li.review').each(function(key, value) {
				//	console.log($(value).find('.review_comment').text());
				//})

				next(itr, cb);
			})
		}

	} // End Harvest


	return {
		getData: function(params, callback) {
			yelp = Auth.load('yelp'),
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

module.exports = YelpHarvester;