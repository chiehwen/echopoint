/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Cron = require('cron').CronJob,
		Model = Model || Object,
		Harvester = {foursquare: require('../harvesters/foursquare')};


var FoursquareCron = (function() {

	// Private attribute that holds the single instance
	var foursquare;

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

							var f = business.Social.foursquare;
							if (
									f.auth.oauthAccessToken
									&& f.venue.id
								) {

									Harvester.foursquare.getMetrics({
										methods: methods, //['credentials', 'timeline', 'mentions', 'retweets', 'dm', 'favorited'],
										user: user._id,
										analytics_id: business.Analytics.id,
										index: index,
										network_id: t.id,
										network_id: f.venue.id,
										auth_token: f.auth.oauthAccessToken
									}, function(err) {
										console.log('Foursquare callbacks complete')
									})
							} 
						}) // End of business forEach
					}) // End of users forEach
				}) // End of Model users array
			},

			tips: function(methods) {
				Model.Analytics.findOne({'foursquare.business.id': {$exists: true}, 'foursquare.tracking.tips.update': true}, function(err, business) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})

					if(!business)
						return

					Harvester.foursquare.appData({
						methods: methods || ['tips'],
						business: business
					}, function(err) {
						console.log('Foursquare tips callback complete');							
						business.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Analytics table', {error: err, analytics_id: business._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						})
					})
				})
			},

			connections: function(methods) {
				Harvester.foursquare.appData({
					methods: methods || ['user']
				}, function(err) {
					console.log('Foursquare callbacks complete')
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
			if(!foursquare)
				foursquare = constructor();
			return foursquare;
		}
	}
})();

module.exports = FoursquareCron;