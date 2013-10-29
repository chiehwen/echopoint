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
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.error) {
					if(!loggers.facebook)
						loggers.facebook = Log.getLogger('facebook')

					if(response.error.code < 5 || response.error.code === 17) {
						loggers.facebook.error(message || response.error.message, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
					}

					loggers.facebook.warn(message || response.error.message, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.error_subcode > 457 && response.error.error_subcode < 468) {
							// remove the user token and force user to login again. 
							// TODO: alert and notify user since analytics have stopped being gathered 
						}
					})
				}
			},

			twitter: function(message, err, response, meta) {
				// https://dev.twitter.com/docs/error-codes-responses
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.errors) {
					if(!loggers.twitter)
						loggers.twitter = Log.getLogger('twitter')

					if(
						response.errors.code === 34 
						|| response.errors.code === 68
						|| response.errors.code === 88 // the dreaded rate limit error!
						|| response.errors.code === 251
					) {
						loggers.twitter.error(message || response.error.message, {error: response.errors, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
					}

					loggers.twitter.warn(message || response.errors.message, {error: response.errors, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
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
				}
			},

			foursquare: function(message, err, response, meta) {
				// https://developer.foursquare.com/overview/responses
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.meta.code !== 200 || response.meta.errorType) {
					if(!loggers.foursquare)
						loggers.foursquare = Log.getLogger('foursquare')

					if(
						response.meta.errorType === 'param_error' 
						|| response.errors.errorType === 'endpoint_error'
						|| response.errors.errorType === 'rate_limit_exceeded' // the dreaded rate limit error!
						|| response.errors.errorType === 'not_authorized'
						|| response.errors.errorType === 'deprecated'
					) {
						loggers.foursquare.error(message || response.meta, {error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
					}

					loggers.foursquare.warn(message || response.meta, {error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.errors.errorType === 'invalid_auth') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})
				}
			},

			google: function(message, err, response, meta) {
				// none... way to go Google  // http://stackoverflow.com/questions/18126720/overview-of-google-api-error-codes
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(!loggers.google)
					loggers.google = Log.getLogger('google')

				loggers.google.error(message || 'Google API error', {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				return
			},

			yelp: function(message, err, response, meta) {
				// http://www.yelp.com/developers/documentation/v2/errors
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.error) {
					if(!loggers.yelp)
						loggers.yelp = Log.getLogger('yelp')

					loggers.yelp.error(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return

					/*loggers.yelp.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/
				}
			},

			instagram: function(message, err, response, meta) {
				// http://instagram.com/developer/authentication/
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.meta && (response.meta.code !== 200 || response.meta.error_type)) {
					if(!loggers.instagram)
						loggers.instagram = Log.getLogger('instagram')

					loggers.instagram.error(message || response.meta.error_message, {error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return

					/*loggers.instagram.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/
				}
			},

			klout: function(message, err, response, meta) {
				// http://klout.com/s/developers/v2
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.error) {
					if(!loggers.klout)
						loggers.klout = Log.getLogger('klout')

					loggers.klout.error(message || response.description, {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}
			},

			bitly: function(message, err, response, meta) {
				// http://dev.bitly.com/formats.html
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(1);

				if(err) {
					Log.error(message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}

				if(response.status_code !== 200) {
					if(!loggers.bitly)
						loggers.bitly = Log.getLogger('bitly')

					loggers.bitly.error(message || response.status_txt, {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				}
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