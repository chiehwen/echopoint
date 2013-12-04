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


var InstagramCron = (function() {

	// Private attribute that holds the single instance
	var instagram;

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Harvester.instagram.getMetrics({
					methods: methods
				}, function(err) {
					console.log('Instagram callbacks complete')
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
			if(!instagram)
				instagram = constructor();
			return instagram;
		}
	}
})();

module.exports = InstagramCron;