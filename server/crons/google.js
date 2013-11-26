/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {google: require('../harvesters/google')};

var GoogleCron = (function() {

	// Private attribute that holds the single instance
	var google,
			options = [
				//{Business: {$elemMatch: {'Social.google.reviews.scraped': false}}},
				//{Business: {$elemMatch: {'Social.google.reviews.override': true}}},
				// this first query option is for timestamp = 0 which means it hasn't beed scraped yet and has priority
				{Business: {$elemMatch: {'Social.google.reviews.timestamp': 0}}},

				// if no business needs the initial scrape then we check for 24 hours passed since last reviews lookup
				{Business: {$elemMatch: {'Social.google.reviews.timestamp': { $lt : Helper.timestamp() - 86400 /* 86400 seconds = 1 day  */}}}}
			];

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: {'Social.google.business.timestamp': { $lt : Helper.timestamp() - 86400 /* 86400 seconds = 1 day  */}}}}, function(err, user) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!user[0] || !user[0].Business || !user[0].Business.length)
						return

					var g = user[0].Business[0].Social.google.business;
					if (g.id && g.data.reference) {
						Harvester.google.getMetrics(user, {
							methods: methods,
							network_id: g.id,
							network_ref: g.data.reference
						}, function(err, update) {
							//if(update)
								user.save(function(err) {
									if(err)
										return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
									console.log('Google callback complete')
								})
						})
					}
				})
			},
			reviews: function(methods, itr) {

				if(!options[itr])
					return 

				// TODO: possibly skip user table for this call and just use analytics table directly
				Model.User.findOne({Business: {$exists: true}}, options[itr], function(err, user) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!user[0] || !user[0].Business || !user[0].Business.length)
						jobs.metrics(methods, itr++)

					Harvester.google.getMetrics(user, {
						methods: methods
					}, function(err, update) {
						if(update)
							user.save(function(err) {
								if(err)
									return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
								console.log('Google reviews callback complete')
							})
					})
				})
			}
		}

		// public members
		return {
			getJob: function(type) {
				return jobs[type](arguments[1], 0)
			}
		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!google)
				google = constructor();
			return google;
		}
	}
})();

module.exports = GoogleCron;