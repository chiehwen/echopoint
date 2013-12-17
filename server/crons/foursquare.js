/*
 * Cron-based Analytics Processing
 *
 * Rate limit: 5000/hr userless requests to venues/* endpoint | 500/hr userless to all other top level endpoints
 * Rate limts: 500/hr per user auth requests for all endpoints | rate limit is meaused by top level endpoint not actual API calls (see link for all details) 
 * https://developer.foursquare.com/overview/ratelimits
 *
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Cron = require('cron').CronJob,
		Model = Model || Object,
		Harvester = {foursquare: require('../harvesters/foursquare')};


var FoursquareCron = function() {

	// private functions
	var jobs = {
		metrics: function(methods) {
			Model.User.find(function(err, users) {
				if (err || !users)
					return Log.error(err ? err : 'No users returned', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				users.forEach(function(user) {
					user.Business.forEach(function(business, index) {

						var f = business.Social.foursquare;
						if (f.auth.oauthAccessToken && f.venue.id) {
							var harvest = new Harvester.foursquare;

							harvest.getMetrics({
								methods: methods, 
								user: user._id,
								analytics_id: business.Analytics.id,
								index: index,
								network_id: f.id,
								network_id: f.venue.id,
								auth_token: f.auth.oauthAccessToken
							}, function(err) {
								console.log('Foursquare callbacks complete [' + methods.toString() + ']')
							})
						} 
					}) // End of business forEach
				}) // End of users forEach
			}) // End of Model users array
		},

		tips: function(methods) {
			Model.Analytics.findOne({'foursquare.business.id': {$exists: true}, 'foursquare.tracking.tips.update': true}, function(err, business) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
//console.log(business);
				if(!business)
					return

				methods = methods || ['tips'];
				var harvest = new Harvester.foursquare;

				harvest.appData({
					methods: methods,
					business: business
				}, function(err) {
					console.log('Foursquare tips callback complete [' + methods.toString() + ']');							
					business.save(function(err, save) {
						if(err && err.name !== 'VersionError')
							return Log.error('Error saving Foursquare analytics to database', {error: err, analytics_id: business._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

						// if we have a versioning overwrite error than load up the analytics document again
						if(err && err.name === 'VersionError')
							Model.Analytics.findById(business._id, function(err, analytics) {
								if(err)
									return Log.error('Error querying Analytic table', {error: err, analytics_id: business._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

								analytics.foursquare = business.foursquare;
								analytics.markModified('foursquare')

								analytics.save(function(err, save) {
									if(err)
										return Log.error('Error saving Foursquare analytics to database', {error: err, analytics_id: business._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

								})
							})
					})
				})
			})
		},

		engagers: function(methods) {
			methods = methods || ['engagers'];
			var harvest = new Harvester.foursquare;

			harvest.appData({
				methods: methods
			}, function(err) {
				console.log('Foursquare callbacks complete [' + methods.toString() + ']')
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

module.exports = FoursquareCron;