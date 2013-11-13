/*
 * Cron-based Analytics Processing
 */
var Auth = require('./auth').getInstance(),
		Log = require('./logger').getInstance().getLogger(),
		Error = require('./error').getInstance(),
		Helper = require('./helpers'),
		Cron = require('cron').CronJob,
		Model = Model || Object,
		Harvester = {twitter: require('./harvesters/twitter')};


var MetricCronJobs = (function() {

	// Private attribute that holds the single instance
	var metricCronInstance;

	function constructor() {

		// private variables
		var next = function(i, cb, stop) {
				var i = i+1;
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			}

		// private functions
		var jobs = {
			metrics: function(methods, platform) {
				Model.User.find(function(err, users) {
					if (err || !users)
						return Log.error(err ? err : 'No users returned', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})

					users.forEach(function(user) {
						user.Business.forEach(function(business, index) {

						var network = business.Social[platform];
						if (
								(platform === 'twitter' && network.auth.oauthAccessToken && network.auth.oauthAccessTokenSecret && network.id)
								|| (platform === 'twitter' && network.auth.oauthAccessToken && network.auth.oauthAccessTokenSecret && network.id)
								|| (platform === 'foursquare' && network.auth.oauthAccessToken && network.venue.id)
							) {

								Harvester.twitter.getData({
									methods: methods, //['credentials', 'timeline', 'mentions', 'retweets', 'dm', 'favorited'],
									user: user._id,
									analytics_id: business.Analytics.id,
									index: index,
									network_id: t.id,
									auth_token: t.auth.oauthAccessToken,
									token_secret: t.auth.oauthAccessTokenSecret
								}, function(err) {
									console.log(platform + ' callbacks complete');							
									//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
								});
		
							} else {
								console.log('no credentials or credentials problem');
							} // End of twitter credentials if statement

						}); // End of business forEach
					}); // End of users forEach
				}); // End of Model users array
			},
			connections: function(methods) {

			}
		}
		// public members
		return {
			getJob: function(type) {
				return jobs[type](arguments[1], arguments[2], arguments[3], arguments[4]);
			}
		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!metricCronInstance)
				metricCronInstance = constructor();
			return metricCronInstance;
		}
	}
})();

module.exports = MetricCronJobs;