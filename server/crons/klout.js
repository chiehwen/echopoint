/*
 * Cron-based Analytics Processing
 */
var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		Harvester = {klout: require('../harvesters/klout')};


var kloutCron = function() {

	// private functions
	var jobs = {
		metrics: function(methods) {
			var harvest = new Harvester.klout

			harvest.getMetrics({
				methods: methods
			}, function(err) {
				console.log('Klout callbacks complete [' + methods.toString() + ']')
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

module.exports = kloutCron;