/*
 * Error handling abstration layer
 */

var Log = require('./logger').getInstance(),
		Utils = require('./utilities');

var ErrorHandler = (function() {

	// Private attribute that holds the single instance
	var errorHandlerInstance;

	function constructor() {

		// private variables
		var loggers = {};
		
		// private functions
		error = {
			facebook: function(message, meta) {
				// https://developers.facebook.com/docs/reference/api/errors/
				if(!loggers.facebook)
					loggers.facebook = Log.getLogger('facebook')

				var error,
						meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				if(meta.error && meta.error.code)
					error = meta.error
				else if(meta.response && meta.response.error && meta.response.error.code)
					error = meta.response.error

				if(error) {
					if(
							error.code < 5 // 1-2 = api error (see subcode); 4 = too many api calls,
							|| error.code === 17 // dreaded api rate limit for user!
							|| error.code === 100 // unsupported GET request (bad api endpoint!)
						) {
						loggers.facebook.error(message || error.message || error.code, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
					}

					loggers.facebook.warn(message || error.message || error.code, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.error_subcode > 457 && response.error.error_subcode < 468) {
							// remove the user token and force user to login again. 
							// TODO: alert and notify user since analytics have stopped being gathered 
						}
					})
				} else {
					loggers.facebook[level](message || meta.error || meta.response.error, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			twitter: function(message, meta) {
				// https://dev.twitter.com/docs/error-codes-responses
				if(!loggers.twitter)
					loggers.twitter = Log.getLogger('twitter')

				var error,
						meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				// nTwitter module puts response errors into "err" return variable automatically, so "response" should really never exist unless API change breaks the nTwitter error abstraction layer 
				if (meta.error && meta.error.data && meta.error.data.errors && meta.error.data.errors.code)
					error = meta.error.data.errors
				else if(meta.response && meta.response.errors && meta.response.errors.code)
					error = meta.response.errors

				if(error) {
					if(
						error.code === 34 // not a valid API endpoint or page does not exist
						|| error.code === 68 // the Twitter REST API v1 is no longer active. Please migrate to API v1.1 (we should never have this)
						|| error.code === 88 // the dreaded rate limit error!
						|| error.code === 251 // this endpoint has been retired (a dev should be notified immediately)
					) {
						loggers.twitter.error(message || error.message, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						// TODO: any of the above (besides 88) should email dev
						return
					}

					loggers.twitter.warn(message || error.message, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(error.code === 32 || error.code === 135 || response.errors.code === 215) {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
							// TODO: alert and notify user since analytics have stopped being gathered 
						}

						if(error.code === 64) {
							// user account has been suspended, alert them ASAP
							// TODO: alert and notify user since analytics have stopped being gathered 

						}

						if(error.code === 89) {
							// invalid/expired token, remove current token and alert user to authenticate again
							// TODO: alert and notify user since analytics have stopped being gathered 
						
						}
					})
				} else {
					loggers.twitter[level](message || meta.error.message, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			foursquare: function(message, meta) {
				// https://developer.foursquare.com/overview/responses
				if(!loggers.foursquare)
					loggers.foursquare = Log.getLogger('foursquare')
				
				var response = meta.response,
						meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				if(response && response.meta && (response.meta.code !== 200 || response.meta.errorType)) {
					if(
						response.meta.errorType === 'param_error' 
						|| response.meta.errorType === 'endpoint_error'
						|| response.meta.errorType === 'rate_limit_exceeded' // the dreaded rate limit error!
						|| response.meta.errorType === 'not_authorized'
						|| response.meta.errorType === 'deprecated'
					) {
						loggers.foursquare.error(message || response.meta, {error: meta.error, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
					}

					loggers.foursquare.warn(message || response.meta, {error: meta.error, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.meta.errorType === 'invalid_auth') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})
				} else {
					loggers.foursquare[level](message || meta.error, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			google: function(message, meta) {
				// none... way to go Google  // http://stackoverflow.com/questions/18126720/overview-of-google-api-error-codes
				if(!loggers.google)
					loggers.google = Log.getLogger('google')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				loggers.google[level](message || meta.error || 'Google API error', {error: meta.error, response: mea.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				return
			},

			yelp: function(message, meta) {
				// http://www.yelp.com/developers/documentation/v2/errors
				if(!loggers.yelp)
					loggers.yelp = Log.getLogger('yelp')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				if(meta.response && meta.response.error) {
					loggers.yelp.error(message || meta.response.error.text, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return

					/*loggers.yelp.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/

				} else {
					loggers.yelp[level](message || meta.error || 'Yelp API error', {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			instagram: function(message, meta) {
				// http://instagram.com/developer/authentication/
				if(!loggers.instagram)
					loggers.instagram = Log.getLogger('instagram')
				
				var response = meta.response,
						meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				if(response && response.meta && (response.meta.code !== 200 || response.meta.error_type)) {
					loggers.instagram.error(message || response.meta.error_message, {error: meta.error, response: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return

					/*loggers.instagram.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/

				} else {
					loggers.instagram[level](message || meta.error || 'Instagram API error', {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			klout: function(message, meta) {
				// http://klout.com/s/developers/v2
				if(!loggers.klout)
					loggers.klout = Log.getLogger('klout')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				if(meta.response && meta.response.error) {
					loggers.klout.error(message || meta.response.description, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				} else {
					loggers.klout[level](message || meta.error || 'Klout API error', {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			// this is setup incorrectly!!
			sentiment140: function(message, meta) {
				if(!loggers.sentiment140)
					loggers.sentiment140 = Log.getLogger('sentiment140')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				loggers.sentiment140[level](message || meta.error || 'Sentiment API error', {file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})

				return
			},

			bitly: function(message, meta) {
				// http://dev.bitly.com/formats.html
				if(!loggers.bitly)
					loggers.bitly = Log.getLogger('bitly')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Utils.timestamp(),
						level = meta.level || 'warn';

				if(meta.response && meta.response.status_code !== 200) {
					loggers.bitly.error(message || meta.response.status_txt, {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				} else {
					loggers.bitly[level](message || meta.error || 'Bitly API error', {error: meta.error, response: meta.response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			//sentiment: function(data, meta) { // sentiment140.com

			//}
		}

		// public members
		return {
			handler: function(type) {
				return error[type](arguments[1], arguments[2]);
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