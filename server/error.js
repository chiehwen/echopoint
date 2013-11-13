/*
 * Error handling abstration layer
 */

var Log = require('./logger').getInstance(),
		Helper = require('./helpers');

var ErrorHandler = (function() {

	// Private attribute that holds the single instance
	var errorHandlerInstance;

	function constructor() {

		// private variables
		var loggers = {};
		
		// private functions
		error = {
			facebook: function(message, err, response, meta) {
				// https://developers.facebook.com/docs/reference/api/errors/
				if(!loggers.facebook)
					loggers.facebook = Log.getLogger('facebook')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1),
						level = meta.level || 'warn';

				if(response && response.error && response.error.code) {
					if(response.error.code < 5 || response.error.code === 17) {
						loggers.facebook.error(message || response.error.message, {err: err, facebook_error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return true
					}

					loggers.facebook.warn(message || response.error.message, {err: err, facebook_error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.error_subcode > 457 && response.error.error_subcode < 468) {
							// remove the user token and force user to login again. 
							// TODO: alert and notify user since analytics have stopped being gathered 
						}
					})
				} else {
					loggers.facebook[level](message || err, {error: err, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			twitter: function(message, err, response, meta) {
				// https://dev.twitter.com/docs/error-codes-responses
				if(!loggers.twitter)
					loggers.twitter = Log.getLogger('twitter')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1),
						level = meta.level || 'warn';

				if(response && response.errors && response.errors.code) {
					if(
						response.errors.code === 34 
						|| response.errors.code === 68
						|| response.errors.code === 88 // the dreaded rate limit error!
						|| response.errors.code === 251
					) {
						loggers.twitter.error(message || response.error.message, {err: err, twitter_error: response.errors, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return true
					}

					loggers.twitter.warn(message || response.errors.message, {err: err, twitter_error: response.errors, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.errors.code === 32 || response.errors.code === 135 || response.errors.code === 215) {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}

						if(response.errors.code === 64) {
							// user account has been suspended, alert them ASAP
							// TODO: alert and notify user since analytics have stopped being gathered 

						}

						if(response.errors.code === 89) {
							// invalid/expired token, remove current token and alert user to authenticate again
							// TODO: alert and notify user since analytics have stopped being gathered 
						
						}
					})
				} else {
					loggers.twitter[level](message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			foursquare: function(message, err, response, meta) {
				// https://developer.foursquare.com/overview/responses
				if(!loggers.foursquare)
					loggers.foursquare = Log.getLogger('foursquare')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1),
						level = meta.level || 'warn';

				if(response && response.meta && (response.meta.code !== 200 || response.meta.errorType)) {
					if(
						response.meta.errorType === 'param_error' 
						|| response.errors.errorType === 'endpoint_error'
						|| response.errors.errorType === 'rate_limit_exceeded' // the dreaded rate limit error!
						|| response.errors.errorType === 'not_authorized'
						|| response.errors.errorType === 'deprecated'
					) {
						loggers.foursquare.error(message || response.meta, {err: err, foursquare_error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return true
					}

					loggers.foursquare.warn(message || response.meta, {err: err, foursquare_error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.errors.errorType === 'invalid_auth') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})
				} else {
					loggers.foursquare[level](message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			google: function(message, err, response, meta) {
				// none... way to go Google  // http://stackoverflow.com/questions/18126720/overview-of-google-api-error-codes
				if(!loggers.google)
					loggers.google = Log.getLogger('google')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1),
						level = meta.level || 'warn';

				loggers.google[level](message || err || 'Google API error', {err: err, google_data: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				return true
			},

			yelp: function(message, err, response, meta) {
				// http://www.yelp.com/developers/documentation/v2/errors
				if(!loggers.yelp)
					loggers.yelp = Log.getLogger('yelp')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1),
						level = meta.level || 'warn';

				if(response && response.error) {
					loggers.yelp.error(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return true

					/*loggers.yelp.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/

				} else {
					loggers.yelp[level](message || err || 'Yelp API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			instagram: function(message, err, response, meta) {
				// http://instagram.com/developer/authentication/
				if(!loggers.instagram)
					loggers.instagram = Log.getLogger('instagram')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(response && response.meta && (response.meta.code !== 200 || response.meta.error_type)) {
					loggers.instagram.error(message || response.meta.error_message, {error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return true

					/*loggers.instagram.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/

				} else {
					loggers.instagram[level](message || err || 'Instagram API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			klout: function(message, err, response, meta) {
				// http://klout.com/s/developers/v2
				if(!loggers.klout)
					loggers.klout = Log.getLogger('klout')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(response && response.error) {
					loggers.klout.error(message || response.description, {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return true
				} else {
					loggers.klout[level](message || err || 'Klout API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			bitly: function(message, err, response, meta) {
				// http://dev.bitly.com/formats.html
				if(!loggers.bitly)
					loggers.bitly = Log.getLogger('bitly')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(response && response.status_code !== 200) {
					loggers.bitly.error(message || response.status_txt, {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return true
				} else {
					loggers.bitly[level](message || err || 'Bitly API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return true
			},

			//sentiment: function(data, meta) { // sentiment140.com

			//}
		}

		// public members
		return {
			handler: function(type) {
				return error[type](arguments[1], arguments[2], arguments[3], arguments[4]);
			}
		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!errorHandlerInstance)
				errorHandlerInstance = constructor();
			return errorHandlerInstance;
		}
	}
})();

module.exports = ErrorHandler;