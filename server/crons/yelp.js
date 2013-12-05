/*
 * Cron-based Analytics Processing
 *
 * Rate limit: 10,000/day | 416.66/min | 6.944/min [no user specific calls. all application based]
 * http://www.yelp.com/developers/getting_started
 *
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {yelp: require('../harvesters/yelp')};

var YelpCron = (function() {

	// Private attribute that holds the single instance
	var yelp;

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $and: [{'Social.yelp.id': {$exists: true}}, {$or : [{'Social.yelp.update.timestamp': {$exists: false}}, {'Social.yelp.update.timestamp': {$lt : Helper.timestamp() /*- 86400 /* 86400 seconds = 24 hours */}} ]} ]} }}, function(err, match) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!match || !match.Business || !match.Business.length)
						return

					Helper.getBusinessIndex(match._id, match.Business[0]._id, function(err, user, index) {
						if (err) { // a failure here is really bad because the attempt time isn't updated so this User/Business will be called repeatedly
							Log.error('index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							Alert.file('Business index lookup failure', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), timestamp: Helper.timestamp()})
							Alert.broadcast('Business index lookup failure', {file: __filename, line: Helper.stack()[0].getLineNumber()})
							return
						}
			
						// mark the lookup time so this isn't called again for 24 hours
						user.Business[index].Social.yelp.update.timestamp = Helper.timestamp();
						user.save(function(err) {
							if(err)
								Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						})

						var y = user.Business[index].Social.yelp;
						if (y.id) {
							Harvester.yelp.getMetrics(user, {
								methods: methods,
								index: index,
								network_id: y.id
							}, function(err, update) {
								/*user.save(function(err) {
									if(err)
										return Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
									console.log('Yelp callbacks complete')
								})*/

								console.log('Yelp callback complete')
								user.save(function(err, save) {
									if(err && err.name !== 'VersionError')
										return Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

									// if we have a versioning overwrite error than load up the analytics document again
									if(err && err.name === 'VersionError')
										Model.User.findById(user._id, function(err, saveUser) {
											if(err)
												return Log.error('Error querying User table', {error: err, user_id: user._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

											saveUser.Business[index].Social.yelp = user.Business[index].Social.yelp;
											saveUser.markModified('.Business['+index+'].Social.yelp')

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
			if(!yelp)
				yelp = constructor();
			return yelp;
		}
	}
})();

module.exports = YelpCron;