/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Alert = require('../logger').getInstance().getLogger('alert'),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object,
		Harvester = {google: require('../harvesters/google')};

var GoogleCron = function() {

	// private functions
	var jobs = {
		plus: function(methods) { // CHANGE THE FALSE BACK TO TRUE
			Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and: [{'Social.google.plus.id': {$exists: true}}, {$or : [{'Social.google.update.plus.timestamp': {$exists: false}}, {'Social.google.update.plus.timestamp': {$lt: Utils.timestamp() - 86400 /* 86400 seconds = 24 hours */}}]} ] }}}, {lean: true}, function(err, match) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!match || !match.Business || !match.Business.length)
					return

				Utils.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
					if (err) { // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
						Log.error('Business index lookup failure', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						Alert.file('Business index lookup failure', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), timestamp: Utils.timestamp()})
						Alert.broadcast('Business index lookup failure', {file: __filename, line: Utils.stack()[0].getLineNumber()})
						return
					}

// I don't think this is needed now that we are using auth credentials, we can call every 15 min or so for each user
					// update and save api call attempt timestamp
//						user.Business[index].Social.google.plus.update.timestamp = Utils.timestamp();
					user.save(function(err) {
						if(err)
							Log.error('Error saving to Users table', {error: err, user_id: user._id.toString(), business_id: user.Business[0]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					})

					var g = user.Business[index].Social.google;

					if (g.plus.id && g.auth.oauthAccessToken && g.auth.oauthRefreshToken) {
						var harvest = new Harvester.google;

						harvest.getMetrics(user, {
							methods: methods,
							user_id: user._id,
							business_id: user.Business[index]._id,
							analytics_id: user.Business[index].Analytics.id,
							index: index,
							network_id: g.plus.id,
							accessToken: g.auth.oauthAccessToken,
							refreshToken: g.auth.oauthRefreshToken
						}, function(err, update) {
							console.log('Google activity callback complete [' + methods.toString() + ']')

							user.save(function(err, save) {
								if(err && err.name !== 'VersionError')
									return Log.error('Error saving to User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

								// if we have a versioning overwrite error than load up the analytics document again
								if(err && err.name === 'VersionError')
									Model.User.findById(user._id, function(err, saveUser) {
										if(err)
											return Log.error('Error querying User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

										saveUser.Business[index].Social.google = user.Business[index].Social.google;
										saveUser.markModified('.Business['+index+'].Social.google')

										saveUser.save(function(err, save) {
											if(err)
												return Log.error('Error saving to User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

										})
									})
							})
						})
					}
				})
			})
		},

		places: function(methods) {
			Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and: [{'Social.google.places.id': {$exists: true}}, {'Social.google.places.reference': {$exists: true}}, {$or : [{'Social.google.update.places.timestamp': {$exists: false}}, {'Social.google.places.update.timestamp': {$lt: Utils.timestamp() - 86400 /* 86400 seconds = 24 hours */}}]} ] }}}, {lean: true}, function(err, match) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!match || !match.Business || !match.Business.length)
					return

				Utils.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
					if (err) { // a failure here is bad because the attempt time isn't updated so this User/Business will be called repeatedly
						Log.error('Business index lookup failure', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						Alert.file('Business index lookup failure', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), timestamp: Utils.timestamp()})
						Alert.broadcast('Business index lookup failure', {file: __filename, line: Utils.stack()[0].getLineNumber()})
						return
					}

					// update and save api call attempt timestamp
					user.Business[index].Social.google.places.update.timestamp = Utils.timestamp();
					user.save(function(err) {
						if(err)
							Log.error('Error saving to Users table', {error: err, user_id: user._id.toString(), business_id: user.Business[0]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					})

					var g = user.Business[index].Social.google.places;
					if (g.id && g.reference) {
						var harvest = new Harvester.google

						harvest.getMetrics(user, {
							methods: methods,
							user_id: user._id,
							business_id: user.Business[index]._id,
							analytics_id: user.Business[index].Analytics.id,
							index: index,
							network_id: g.id,
							network_ref: g.reference
						}, function(err, update) {
							/*user.save(function(err) {
								if(err)
									return Log.error('Error saving to Users table', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								console.log('Google callback complete')
							})*/

							console.log('Google business callback complete [' + methods.toString() + ']')
							user.save(function(err, save) {
								if(err && err.name !== 'VersionError')
									return Log.error('Error saving to User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

								// if we have a versioning overwrite error than load up the analytics document again
								if(err && err.name === 'VersionError')
									Model.User.findById(user._id, function(err, saveUser) {
										if(err)
											return Log.error('Error querying User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

										saveUser.Business[index].Social.google = user.Business[index].Social.google;
										saveUser.markModified('.Business['+index+'].Social.google')

										saveUser.save(function(err, save) {
											if(err)
												return Log.error('Error saving to User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

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
			// TODO: possibly skip User collection for this call and just use Analytics collection directly
			// we use the $and statement here because we only want this called if the initial call has been made before, this will get called automatically by the places inital setup and cron if timestamp is undefined
			Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and : [{'Social.google.reviews.timestamp': {$exists: true}}, {'Social.google.reviews.timestamp': {$gt: 0}}, {'Social.google.reviews.timestamp': {$lt: Utils.timestamp() - 172800 /* 172800 seconds = 48 hours */}}]} }}, {lean: true}, function(err, match) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!match || !match.Business || !match.Business.length )
					return

				Utils.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
					if (err) { // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
						Log.error('Business index lookup failure', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						Alert.file('Business index lookup failure', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), timestamp: Utils.timestamp()})
						Alert.broadcast('Business index lookup failure', {file: __filename, line: Utils.stack()[0].getLineNumber()})
						return
					}

					// update and save api call attempt timestamp
					user.Business[index].Social.google.reviews.timestamp = Utils.timestamp();
					user.save(function(err) {
						if(err)
							Log.error('Error saving to Users table', {error: err, user_id: user._id.toString(), business_id: user.Business[0]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					})

					// if this user is missing a connecting Analytics model then log error and call function again for next user
					if(!user.Business[index].Analytics || !user.Business[index].Analytics.id) {
						Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						return jobs.reviews(methods)
					}

					Model.Analytics.findById(user.Business[index].Analytics.id, {lean: true},function(err, analytics) {
						if(err || !analytics) {
							Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							return jobs.reviews(methods)
						}

						if(!analytics.google.places.id || !analytics.google.places.data || !analytics.google.places.data.url) 
							return jobs.reviews(methods)

						var harvest = new Harvester.google

						harvest.getMetrics(user, {
							methods: methods,
							user_id: user._id,
							business_id: user.Business[index]._id,
							analytics_id: user.Business[index].Analytics.id,
							index: index
						}, function(err, update) {
							
							console.log('Google reviews callback complete [' + methods.toString() + ']')
							user.save(function(err, save) {
								if(err && err.name !== 'VersionError')
									return Log.error('Error saving to User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

								// if we have a versioning overwrite error than load up the User collection again
								if(err && err.name === 'VersionError')
									Model.User.findById(user._id, function(err, saveUser) {
										if(err)
											return Log.error('Error querying User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

										saveUser.Business[index].Social.google = user.Business[index].Social.google;
										saveUser.markModified('.Business['+index+'].Social.google')

										saveUser.save(function(err, save) {
											if(err)
												return Log.error('Error saving to User table', {error: err, user_id: user._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

										})
									})
							})
						})
					})
				})
			})
		},

		engagers: function(methods) {
			methods = methods || ['engagers'];
			var harvest = new Harvester.google
							
			harvest.directToMethods(methods,
				function(err) {
				console.log('Google callbacks complete [' + methods.toString() + ']');
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

module.exports = GoogleCron;