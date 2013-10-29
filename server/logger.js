/*
 * Winston logging abstration layer
 */

var winston = require('winston'),
		Helper = require('./helpers');

		require('winston-mail').Mail;
		require('winston-papertrail').Papertrail;

var Logger = (function() {

	// Private attribute that holds the single instance
	var loggerInstance;

	function constructor() {

		// private variables
		var logger = {};
		
		// private functions
		Loggers = {
			vocada: function() {
				if(!logger.vocada)		
					logger.vocada = new (winston.Logger)({
						colors: {
							info: 'blue'
						},
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'information',
								filename: 'server/logs/information.json',
								level: 'info',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'warnings',
								filename: 'server/logs/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'errors',
								filename: 'server/logs/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],
						exceptionHandlers: [
							new (winston.transports.File)({
								handleExceptions: true,
								filename: 'server/logs/excemptions.json',
								json: true
							}),
							/*new (winston.transports.Mail)({
								handleExceptions: true,
								to: 'scottcarlsonjr@gmail.com',
								from: 'error@vocada.co',
								subject: 'Excemption Error on Vacada!',
								host: 'smtp.gmail.com',
								username: 'scottcarlsonjr',
								password: 'h34dtr1p',
								ssl: true
							}),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })*/
						],
						exitOnError: false
					})

				return logger.vocada
			},

			facebook: function () {
				if(!logger.facebook)
					logger.facebook = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'fb_warnings',
								filename: 'server/logs/social/facebook/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'fb_errors',
								filename: 'server/logs/social/facebook/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.facebook
			},

			twitter: function () {
				if(!logger.twitter)
					logger.twitter = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'tw_warnings',
								filename: 'server/logs/social/twitter/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'tw_errors',
								filename: 'server/logs/social/twitter/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.twitter
			},

			foursquare: function () {
				if(!logger.foursquare)
					logger.foursquare = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'fs_warnings',
								filename: 'server/logs/social/foursquare/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'fs_errors',
								filename: 'server/logs/social/foursquare/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.foursquare
			},

			google: function () {
				if(!logger.google)
					logger.google = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'google_warnings',
								filename: 'server/logs/social/google/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'google_errors',
								filename: 'server/logs/social/google/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.google
			},

			yelp: function () {
				if(!logger.yelp)
					logger.yelp = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'yelp_warnings',
								filename: 'server/logs/social/yelp/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'yelp_errors',
								filename: 'server/logs/social/yelp/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.yelp
			},

			instagram: function () {
				if(!logger.instagram)
					logger.instagram = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'instagram_warnings',
								filename: 'server/logs/social/instagram/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'instagram_errors',
								filename: 'server/logs/social/instagram/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.instagram
			},

			klout: function () {
				if(!logger.klout)
					logger.klout = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'klout_warnings',
								filename: 'server/logs/social/klout/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'klout_errors',
								filename: 'server/logs/social/klout/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.klout
			},

			bitly: function () {
				if(!logger.bitly)
					logger.bitly = new (winston.Logger)({
						transports: [
							new winston.transports.Console({
								colorize: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'bitly_warnings',
								filename: 'server/logs/social/bitly/warnings.json',
								level: 'warn',
								json: true
							}),
							new (winston.transports.File)({
								handleExceptions: false,
								name: 'bitly_errors',
								filename: 'server/logs/social/bitly/errors.json',
								level: 'error',
								json: true
							}),
	/*
							new (winston.transports.Loggly)(
								{
									subdomain: "vocada",
									inputToken: "3373e727-da7a-4d97-a317-20464e47d77e", 
									json: true
								}
							),
							new (winston.transports.Papertrail)({
								host: 'logs.papertrailapp.com',
								port: 28648
			        })
	*/
						],

						exitOnError: false
					})

				return logger.bitly
			},

			//sentiment: function () { // sentiment140.com

			//},
		}

		// public members
		return {
			getLogger: function(type) {
				return Loggers[type || 'vocada']();
			}
		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!loggerInstance)
				loggerInstance = constructor();
			return loggerInstance;
		}
	}
})();

module.exports = Logger;