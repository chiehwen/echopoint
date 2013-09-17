var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var FoursquareHarvester = (function() {

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

		// new tweets 
		venue: function(itr, cb) {

			twitter.get('/statuses/user_timeline.json', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 100, contributor_details: true, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
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

		here_now: function(itr, cb) {

		},

		businesses_list: function(itr, cb) {

		},

	} // End Harvest

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