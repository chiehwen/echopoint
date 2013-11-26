/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {twitter: require('../harvesters/twitter')};

var TwitterCron = (function() {

	// Private attribute that holds the single instance
	var twitter;

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Model.User.find(function(err, users) {
					if (err || !users)
						return Log.error(err ? err : 'No users returned', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					users.forEach(function(user) {
						user.Business.forEach(function(business, index) {

						var t = business.Social.twitter;
						if (
								t.auth.oauthAccessToken
								&& t.auth.oauthAccessTokenSecret
								&& t.id
							) {

								Harvester.twitter.getMetrics({
									methods: methods, //['credentials', 'timeline', 'mentions', 'retweets', 'dm', 'favorited'],
									user: user._id,
									analytics_id: business.Analytics.id,
									index: index,
									network_id: t.id,
									auth_token: t.auth.oauthAccessToken,
									token_secret: t.auth.oauthAccessTokenSecret
								}, function(err) {
									console.log('Twitter callbacks complete')
								})
							} 
						}) // End of business forEach
					}) // End of users forEach
				}) // End of Model users array
			},

			connections: function(methods) {
				Harvester.twitter.processConnectionUsers({
					methods: methods, //['populateById', 'populateByScreenName', 'detect_duplicates'],
					user: user._id,
					analytics_id: business.Analytics.id,
					index: index,
					network_id: t.id,
					auth_token: t.auth.oauthAccessToken,
					token_secret: t.auth.oauthAccessTokenSecret
				}, function(err) {
					console.log('Twitter callbacks complete')
				})
			}
		}
		// public members
		return {
			getJob: function(type) {
				return jobs[type](arguments[1])
			}
		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!twitter)
				twitter = constructor();
			return twitter;
		}
	}
})();

module.exports = TwitterCron;