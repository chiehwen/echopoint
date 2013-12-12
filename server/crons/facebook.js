/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Cron = require('cron').CronJob,
		Model = Model || Object,
		Harvester = {facebook: require('../harvesters/facebook')};


var FacebookCron = function() {

	// private functions
	var jobs = {
		metrics: function(methods) {
			Model.User.find(function(err, users) {
				if (err || !users)
					return Log.error(err ? err : 'No users returned', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})

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
							var harvest = new Harvester.facebook
							
							harvest.getMetrics({
								methods: methods,
								user: user._id,
								analytics_id: business.Analytics.id,
								index: index,
								network_id: f.account.id,
								auth_token: f.account.oauthAccessToken
							}, function(err) {
								console.log('Facebook callbacks complete [' + methods.toString() + ']');
							})
						}
					}) // End of business forEach
				}) // End of users forEach
			}) // End of Model users array
		},

		engagers: function(methods) {
			methods = methods || ['engagers'];
			var harvest = new Harvester.facebook
							
			harvest.appData(methods,
				function(err) {
				console.log('Facebook callbacks complete [' + methods.toString() + ']');
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

module.exports = FacebookCron;