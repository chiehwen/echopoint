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

				var error,
						meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(),
						level = meta.level || 'warn';

				if(err && error.code)
					error = err
				else if(response && response.error && response.error.code)
					error = response.error

				if(error) {
					if(
							error.code < 5 // 1-2 = api error (see subcode); 4 = too many api calls,
							|| error.code === 17 // dreaded api rate limit for user!
							|| error.code === 100 // unsupported GET request (bad api endpoint!)
						) {
						loggers.facebook.error(message || response.error.message, {err: err, facebook_error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
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
				return
			},

			twitter: function(message, err, response, meta) {
				// https://dev.twitter.com/docs/error-codes-responses
				if(!loggers.twitter)
					loggers.twitter = Log.getLogger('twitter')

				var error,
						meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(),
						level = meta.level || 'warn';

				// nTwitter module puts response errors into "err" return variable automatically, so "response" should really never exist unless API change breaks the nTwitter error abstraction layer 
				if(response && response.errors && response.errors.code)
					error = response.errors
				else if (err && err.data && err.data.errors && err.data.errors.code)
					error = err.data.errors

				if(error) {
					if(
						error.code === 34 // not a valid API endpoint or page does not exist
						|| error.code === 68 // the Twitter REST API v1 is no longer active. Please migrate to API v1.1 (we should never have this)
						|| error.code === 88 // the dreaded rate limit error!
						|| error.code === 251 // this endpoint has been retired (a dev should be notified immediately)
					) {
						loggers.twitter.error(error.message, {err: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						// TODO: any of the above (besides 88) should email dev
						return
					}

					loggers.twitter.warn(error.message, {err: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(error.code === 32 || error.code === 135 || response.errors.code === 215) {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
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
					loggers.twitter[level](message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			foursquare: function(message, err, response, meta) {
				// https://developer.foursquare.com/overview/responses
				if(!loggers.foursquare)
					loggers.foursquare = Log.getLogger('foursquare')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(),
						level = meta.level || 'warn';

				if(response && response.meta && (response.meta.code !== 200 || response.meta.errorType)) {
					if(
						response.meta.errorType === 'param_error' 
						|| response.meta.errorType === 'endpoint_error'
						|| response.meta.errorType === 'rate_limit_exceeded' // the dreaded rate limit error!
						|| response.meta.errorType === 'not_authorized'
						|| response.meta.errorType === 'deprecated'
					) {
						loggers.foursquare.error(message || response.meta, {err: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
						return
					}

					loggers.foursquare.warn(message || response.meta, {err: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.meta.errorType === 'invalid_auth') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})
				} else {
					loggers.foursquare[level](message || err, {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			google: function(message, err, response, meta) {
				// none... way to go Google  // http://stackoverflow.com/questions/18126720/overview-of-google-api-error-codes
				if(!loggers.google)
					loggers.google = Log.getLogger('google')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(),
						level = meta.level || 'warn';

				loggers.google[level](message || err || 'Google API error', {err: err, google_data: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				return
			},

			yelp: function(message, err, response, meta) {
				// http://www.yelp.com/developers/documentation/v2/errors
				if(!loggers.yelp)
					loggers.yelp = Log.getLogger('yelp')

				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp(),
						level = meta.level || 'warn';

				if(response && response.error) {
					loggers.yelp.error(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return

					/*loggers.yelp.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/

				} else {
					loggers.yelp[level](message || err || 'Yelp API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			instagram: function(message, err, response, meta) {
				// http://instagram.com/developer/authentication/
				if(!loggers.instagram)
					loggers.instagram = Log.getLogger('instagram')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp();

				if(response && response.meta && (response.meta.code !== 200 || response.meta.error_type)) {
					loggers.instagram.error(message || response.meta.error_message, {error: response.meta, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return

					/*loggers.instagram.warn(message || response.error.text, {error: response.error, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta}, function () {
						if(response.error.id === '') {
							// could not authenticate user! check logs and site for details
							//  alert them and force them through the auth process again
						}
					})*/

				} else {
					loggers.instagram[level](message || err || 'Instagram API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			klout: function(message, err, response, meta) {
				// http://klout.com/s/developers/v2
				if(!loggers.klout)
					loggers.klout = Log.getLogger('klout')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp();

				if(response && response.error) {
					loggers.klout.error(message || response.description, {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				} else {
					loggers.klout[level](message || err || 'Klout API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
			},

			bitly: function(message, err, response, meta) {
				// http://dev.bitly.com/formats.html
				if(!loggers.bitly)
					loggers.bitly = Log.getLogger('bitly')
				
				var meta = meta || {},
						date = new Date().toUTCString(),
						timestamp = Helper.timestamp();

				if(response && response.status_code !== 200) {
					loggers.bitly.error(message || response.status_txt, {error: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
					return
				} else {
					loggers.bitly[level](message || err || 'Bitly API error', {error: err, response: response, file: meta.file, line: meta.line, time: date, timestamp: timestamp, meta: meta})
				}
				return
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