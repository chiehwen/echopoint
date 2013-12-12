/*
 * Cron-based Analytics Processing
 *
 * https://dev.twitter.com/docs/rate-limiting/1.1
 *
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object,
		Harvester = {twitter: require('../harvesters/twitter')};

var TwitterCron = function() {

	// private functions
	var jobs = {
		metrics: function(methods) {
			Model.User.find(function(err, users) {
				if (err || !users)
					return Log.error(err ? err : 'No users returned', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				users.forEach(function(user) {
					user.Business.forEach(function(business, index) {

					var t = business.Social.twitter;
					if (
							t.auth.oauthAccessToken
							&& t.auth.oauthAccessTokenSecret
							&& t.id
						) {
							var harvest = new Harvester.twitter;

							harvest.getMetrics({
								methods: methods,
								user: user._id,
								analytics_id: business.Analytics.id,
								index: index,
								network_id: t.id,
								auth_token: t.auth.oauthAccessToken,
								token_secret: t.auth.oauthAccessTokenSecret
							}, function(err) {
								console.log('Twitter callbacks complete [' + methods.toString() + ']')
							})
						} 
					}) // End of business forEach
				}) // End of users forEach
			}) // End of Model users array
		},

		engagers: function(methods) {
			var harvest = new Harvester.twitter;
			
			harvest.engagers(methods, function(err) {
				console.log('Twitter callbacks complete [' + methods.toString() + ']')
			})
		}
	}
	// public members
	return {
		getJob: function(type) {
			return jobs[type](arguments[1])
		}
	} // end return object
}

module.exports = TwitterCron;