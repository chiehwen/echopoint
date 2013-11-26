/*
 * Cron-based Analytics Processing
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
				Model.User.findOne({Business: {$exists: true}}, {Business: {$elemMatch: { $or: [{'Social.yelp.update.timestamp': {$exists: false}}, {'Social.yelp.update.timestamp': {$lt : Helper.timestamp() - 86400 /* 86400 seconds = 1 day  */}}]}   }}, function(err, user) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

					if(!user || !user.Business || !user.Business.length)
						return

					var y = user.Business[0].Social.yelp;					
					if (y.id) {
						Harvester.yelp.getMetrics(user, {
							methods: methods,
							network_id: y.id
						}, function(err, update) {
							//if(update)
								user.save(function(err) {
									if(err)
										return Log.error('Error saving to Users table', {error: err, user_id: user._id, business_id: user.Business[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
									console.log('Yelp callbacks complete')
								})
						})
					} // End of Yelp credentials if statement
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