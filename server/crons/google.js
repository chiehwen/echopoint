/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Alert = require('../logger').getInstance().getLogger('alert'),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {google: require('../harvesters/google')};

var GoogleCron = function() {

	// private functions
	var jobs = {
		activity: function(methods) { // CHANGE THE FALSE BACK TO TRUE
			Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and: [{'Social.google.plus.id': {$exists: false}}, {$or : [{'Social.google.update.plus.timestamp': {$exists: false}}, {'Social.google.update.plus.timestamp': {$lt: Helper.timestamp() - 86400 /* 86400 seconds = 24 hours */}}]} ] }}}, {lean: true}, function(err, match) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!match || !match.Business || !match.Business.length)
					return

				Helper.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
					if (err) { // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
						Log.error('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						Alert.file('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Business index lookup failure', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						return
					}

// I don't think this is needed now that we are using auth credentials, we can call every 15 min or so
					// update and save api call attempt timestamp
//						user.Business[index].Social.google.plus.update.timestamp = Helper.timestamp();
					user.save(function(err) {
						if(err)
							Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					})

					var g = user.Business[index].Social.google;					
					if (/*g.plus.id && */g.auth.oauthAccessToken && g.auth.oauthRefreshToken) {
						var harvest = new Harvester.google;

						harvest.getMetrics(user, {
							methods: methods,
							index: index,
//								network_id: g.plus.id
							accessToken: g.auth.oauthAccessToken,
							refreshToken: g.auth.oauthRefreshToken
						}, function(err, update) {
							/*user.save(function(err) {
								if(err)
									return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
								console.log('Google callback complete')
							})*/

							console.log('Google activity callback complete [' + methods.toString() + ']')
return							
							user.save(function(err, save) {
								if(err && err.name !== 'VersionError')
									return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

								// if we have a versioning overwrite error than load up the analytics document again
								if(err && err.name === 'VersionError')
									Model.User.findById(user._id, function(err, saveUser) {
										if(err)
											return Log.error('Error querying User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

										saveUser.Business[index].Social.google = user.Business[index].Social.google;
										saveUser.markModified('.Business['+index+'].Social.google')

										saveUser.save(function(err, save) {
											if(err)
												return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

										})
									})
							})
						})
					}
				})
			})
		},

		business: function(methods) {
			Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and: [{'Social.google.places.id': {$exists: true}}, {'Social.google.places.data.reference': {$exists: true}}, {$or : [{'Social.google.update.places.timestamp': {$exists: false}}, {'Social.google.places.update.timestamp': {$lt: Helper.timestamp() - 86400 /* 86400 seconds = 24 hours */}}]} ] }}}, {lean: true}, function(err, match) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!match || !match.Business || !match.Business.length)
					return

				Helper.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
					if (err) { // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
						Log.error('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						Alert.file('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Business index lookup failure', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						return
					}

					// update and save api call attempt timestamp
					user.Business[index].Social.google.places.update.timestamp = Helper.timestamp();
					user.save(function(err) {
						if(err)
							Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					})

					var g = user.Business[index].Social.google.places;
					if (g.id && g.data.reference) {
						var harvest = new Harvester.google

						harvest.getMetrics(user, {
							methods: methods,
							index: index,
							network_id: g.id,
							network_ref: g.data.reference
						}, function(err, update) {
							/*user.save(function(err) {
								if(err)
									return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
								console.log('Google callback complete')
							})*/

							console.log('Google business callback complete [' + methods.toString() + ']')
							user.save(function(err, save) {
								if(err && err.name !== 'VersionError')
									return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

								// if we have a versioning overwrite error than load up the analytics document again
								if(err && err.name === 'VersionError')
									Model.User.findById(user._id, function(err, saveUser) {
										if(err)
											return Log.error('Error querying User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

										saveUser.Business[index].Social.google = user.Business[index].Social.google;
										saveUser.markModified('.Business['+index+'].Social.google')

										saveUser.save(function(err, save) {
											if(err)
												return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

										})
									})
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
					return

				Helper.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
					if (err) { // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
						Log.error('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						Alert.file('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
						Alert.broadcast('Business index lookup failure', {file: __filename, line: Helper.stack()[0].getLineNumber()})
						return
					}

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

						if(!analytics.google.places.id || !analytics.google.palces.data || !analytics.google.places.data.url) 
							return jobs.reviews(methods)

						var harvest = new Harvester.google

						harvest.getMetrics(user, {
							methods: methods,
							index: index
						}, function(err, update) {
							/*user.save(function(err) {
								if(err)
									return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
								console.log('Google reviews callback complete')
							})*/
							
							console.log('Google reviews callback complete [' + methods.toString() + ']')
							user.save(function(err, save) {
								if(err && err.name !== 'VersionError')
									return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

								// if we have a versioning overwrite error than load up the analytics document again
								if(err && err.name === 'VersionError')
									Model.User.findById(user._id, function(err, saveUser) {
										if(err)
											return Log.error('Error querying User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

										saveUser.Business[index].Social.google = user.Business[index].Social.google;
										saveUser.markModified('.Business['+index+'].Social.google')

										saveUser.save(function(err, save) {
											if(err)
												return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

										})
									})
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
}

module.exports = GoogleCron;