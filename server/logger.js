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
		var logger = null;
		
		// private functions
		function loadLogger() {
			if(!logger)		
				logger = new (winston.Logger)({
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
							filename: 'server/logs/information.log',
							level: 'info',
							json: true
						}),
						new (winston.transports.File)({
							handleExceptions: false,
							name: 'warnings',
							filename: 'server/logs/warnings.log',
							level: 'warn',
							json: true
						}),
						new (winston.transports.File)({
							handleExceptions: false,
							name: 'errors',
							filename: 'server/logs/errors.log',
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
							filename: 'server/logs/excemptions.log',
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

			return logger;
		}

		// public members
		return {
			getLogger: function() {
				return loadLogger();
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