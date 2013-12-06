/*
 * Cron-based Analytics Processing
 *
 * Rate limit: 5000 hr [application by access_token] / 5000 hr [user by client_id]
 * http://instagram.com/developer/endpoints/#limits
 *
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {instagram: require('../harvesters/instagram')};


var InstagramCron = function() {

	// private functions
	var jobs = {
		metrics: function(methods) {
			var harvest = new Harvester.instagram

			harvest.getMetrics({
				methods: methods
			}, function(err) {
				console.log('Instagram callbacks complete [' + methods.toString() + ']')
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

module.exports = InstagramCron;