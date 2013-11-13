/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {klout: require('../harvesters/klout')};


var kloutCron = (function() {

	// Private attribute that holds the single instance
	var klout;

	function constructor() {

		// private functions
		var jobs = {
			metrics: function(methods) {
				Harvester.klout.getMetrics({
					methods: methods
				}, function(err) {
					console.log('Klout callbacks complete')
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
			if(!klout)
				klout = constructor();
			return klout;
		}
	}
})();

module.exports = kloutCron;