var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		winston = require('winston');

var FoursquareHarvester = (function() {

	winston.add(winston.transports.File, 
		{ filename: 'foursquareUpdates.log' 
			, json: true
		})
	.remove(winston.transports.Console);

	var Analytics,
			foursquare,
			response,
			data,
			update = false,
			next = function(i, cb) {
				var i = i+1;
				if(data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {
		test: function() {

			multi =		'/venues/' + f.venue.id +
								',/venues/' + f.venue.id + '/stats',
								//',/venues/' + f.venue.id + '/likes' +
								//',/venues/' + f.venue.id + '/tips?limit=25' +
								//',/venues/' + f.venue.id + '/photos?group=venue&limit=20',
			params = {
				v: foursquare.client.verified,
				requests: multi
			},
			venue = null,
			stats = null;

			foursquare.post('multi', params, function(err, response) {
				if(err || response.meta.code != 200) 
					console.log(response.meta.code);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

					// TODO: build into a for loop
					if(response.response.responses[0].response.venue) { // really foursquare? you couldn't add a few more 'reponses' in there?
						venue = response.response.responses[0].response.venue;
						stats = response.response.responses[1].response.stats

					} else {
						venue = response.response.responses[1].response.venue;
						stats = response.response.responses[0].response.stats;
					}

				if(venue && stats) {

					if(previousVenueUpdateData != JSON.stringify(venue))
						winston.info(venue);

					if(previousStatsUpdateData != JSON.stringify(stats))
						winston.warn(stats);

					previousVenueUpdateData = JSON.stringify(venue);
					previousStatsUpdateData = JSON.stringify(stats);
				}
			})
		},

		// new tweets 
		venue: function(itr, cb) {

			foursquare.get('venues/' + data.network_id, {v: foursquare.client.verified}, function(err, response) {
				if(err || response.meta.code != 200)
					console.log(err, response.meta); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

return;		
				if(!response.length)
					return next(itr, cb);

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
					//response[i].retweets = {history:[{timestamp:timestamp,total:parseInt(response[i].retweet_count, 10)}],total:parseInt(response[i].retweet_count, 10), timestamp: timestamp};
					//response[i].favorited_count = {};
					response[i].timestamp = Helper.timestamp();
					Analytics.twitter.timeline.tweets.push(response[i]);
				}

				Analytics.twitter.timeline.since_id = response[0].id_str;
				Analytics.twitter.timeline.timestamp = Helper.timestamp();

				console.log('saved twitter user timeline...');

				next(itr, cb);
			})
		},

		stats: function() {

		},

		here_now: function(itr, cb) {

		},

	} // End Harvest

	var previousVenueUpdateData,
			previousStatsUpdateData;

	return {
		getData: function(params, callback) {
			foursquare = Auth.load('foursquare').setAccessToken(params.auth_token),
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

module.exports = FoursquareHarvester;