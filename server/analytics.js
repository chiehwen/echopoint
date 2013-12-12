/*
 * Analytics Processing
 */
var Auth = require('./auth').getInstance(),
		Utils = require('./utilities'),
		Model = Model || Object;

var Analytics = (function() {

	// Private attribute that holds the single instance
	var analyticsInstance;

	function constructor() {

		var graphData = {

			facebook: function(type, length) {

			}

		}

		return {
			getGraphData: function(source, type, length) {
				graphData[source](type, length);
			}

		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!analyticsInstance)
				analyticsInstance = constructor();
			return analyticsInstance;
		}
	}

})();

module.exports = Analytics;