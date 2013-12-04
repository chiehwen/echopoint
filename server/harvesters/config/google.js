/*
 * Instagram Harvester
 *
 * Rate limit: 5000 hr [application by access_token] / 5000 hr [user by client_id]
 *
 */

var Log = require('../../logger').getInstance().getLogger();

module.exports = (function() {

	// Private attribute that holds the single instance
	var google;

	function constructor() {

		var googleTimestampHash = null;

		return {
			getTimestampHash: function() {
				return googleTimestampHash;
			},
			setTimestampHash: function(string) {
				googleTimestampHash = string;
				return this;
			}
		}
	}

	return {
		getInstance: function() {
			if(!google)
				google = constructor()
			return google;
		}
	}
})();