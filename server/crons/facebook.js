/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Cron = require('cron').CronJob,
		Model = Model || Object,
		Harvester = {twitter: require('../harvesters/facebook')};


var FacebookCron = (function() {

	// Private attribute that holds the single instance
	var facebook;

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Model.User.find(function(err, users) {
					if (err || !users)
						return Log.error(err ? err : 'No users returned', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
console.log(methods);
					users.forEach(function(user) {
						user.Business.forEach(function(business, index) {

						var f = business.Social.facebook;
						if (
								f.auth.oauthAccessToken
								&& f.auth.expires
								&& f.auth.created
								&& f.account.id
								&& f.account.oauthAccessToken
								&& ((f.auth.created + f.auth.expires) * 1000 > Date.now())
							) {

								Harvester.facebook.getMetrics({
									methods: methods,
									user: user._id,
									analytics_id: business.Analytics.id,
									index: index,
									network_id: f.account.id,
									auth_token: f.account.oauthAccessToken
								}, function(err) {
									console.log('Facebook callbacks complete');
								})
							}
						}) // End of business forEach
					}) // End of users forEach
				}) // End of Model users array
			},

			connections: function(methods) {
				Harvester.facebook.processConnectionUsers({
					methods: methods, //['populateById', 'populateByScreenName', 'detect_duplicates'],
					user: user._id,
					analytics_id: business.Analytics.id,
					index: index,
					network_id: t.id,
					auth_token: t.auth.oauthAccessToken,
					token_secret: t.auth.oauthAccessTokenSecret
				}, function(err) {
					console.log('Facebook callbacks complete');
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
			if(!facebook)
				facebook = constructor();
			return facebook;
		}
	}
})();

module.exports = FacebookCron;