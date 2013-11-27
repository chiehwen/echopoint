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

				// FALSE we should call this the moment a user selects a business
				{Business: {$elemMatch: {'Social.google.reviews.timestamp': 0}}},

				// if no business needs the initial scrape then we check for 24 hours passed since last reviews lookup
				{Business: {$elemMatch: {'Social.google.reviews.timestamp': { $lt : Helper.timestamp() - 86400 /* 86400 seconds = 1 day  */}}}}
			];

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and: [{'Social.google.business.id': {$exists: true}}, {'Social.google.business.data.reference': {$exists: true}}, {$or : [{'Social.google.update.timestamp': {$exists: false}}, {'Social.google.update.timestamp': {$lt: Helper.timestamp() /*- 86400 /* 86400 seconds = 24 hours */}}]} ] }}}, {lean: true}, function(err, match) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!match || !match.Business || !match.Business.length)
						return

					Helper.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
						if (err) // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
							return Log.error('index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

						// update and save api call attempt timestamp
						user.Business[index].Social.google.update.timestamp = Helper.timestamp();
						user.save(function(err) {
							if(err)
								Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						})

						var g = user.Business[index].Social.google.business;
						if (g.id && g.data.reference) {
							Harvester.google.getMetrics(user, {
								methods: methods,
								index: index,
								network_id: g.id,
								network_ref: g.data.reference
							}, function(err, update) {
								user.save(function(err) {
									if(err)
										return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
									console.log('Google callback complete')
								})
							})
						}
					})
				})
			},

			// call every 48 hours if business method hasn't triggered a reviews update. 
			reviews: function(methods) {
				// TODO: possibly skip user table for this call and just use analytics table directly
				Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $or : [{'Social.google.reviews.timestamp': {$exists: false}}, {'Social.google.reviews.timestamp': {$lt: Helper.timestamp() - 172800 /* 172800 seconds = 48 hours */}}]} }}, {lean: true}, function(err, match) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!match || !match.Business || !match.Business.length )
						return // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly

					Helper.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
						if (err) // a failure here is also really bad because the attempt time isn't updated so this User/Business will be called repeatedly
							return Log.error('index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

						// update and save api call attempt timestamp
						user.Business[index].Social.google.reviews.timestamp = Helper.timestamp();
						user.save(function(err) {
							if(err)
								Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						})

						// if this user is missing a connecting Analytics model then log error and call function again for next user
						if(!user.Business[index].Analytics || !user.Business[index].Analytics.id) {
							Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							return jobs.reviews(methods)
						}

						Model.Analytics.findById(user.Business[index].Analytics.id, {lean: true},function(err, analytics) {
							if(err || !analytics) {
								Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
								return jobs.reviews(methods)
							}

							if(!analytics.google.business.page.local.id || !analytics.google.business.data || !analytics.google.business.data.url) 
								return jobs.reviews(methods)

							Harvester.google.getMetrics(user, {
								methods: methods || ['reviews'],
								index: index
							}, function(err, update) {
								user.save(function(err) {
									if(err)
										return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
									console.log('Google reviews callback complete')
								})
							})
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