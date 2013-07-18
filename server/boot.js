/**
 * Module dependencies.
 */
var express = require('express'),
		path = require('path'),
		Class = require('../server/libraries/class'),
		passport = require('passport'),
		Middleware = require('./middleware').Middleware;

var AppSetup = (function() {
	return {
		start: function(callback){
			this.construct();
			this.application = express();
			callback(this.setup());
		},
		construct: function() {
			// extend native objects here
			String.prototype.capitalize = function() {
				return this.charAt(0).toUpperCase() + this.slice(1);
			}
		},
		setup: function() {
			var app = this.application;

			// all environments
			app
				.set('port', process.env.PORT || 3000)
				.set('views', __dirname + '/../views')
				.set('view engine', 'jade');

			// express middleware
			app
				.use(express.favicon())
				.use(express.logger('dev'))
				.use(express.bodyParser())
				.use(express.methodOverride())
				.use(express.cookieParser('The world is full of secrets!'))
				.use(express.session('Yes, even wizards have secrets...'))

				// passport setup
				.use(passport.initialize())
				.use(passport.session())

				// custom middleware
				.use(Middleware.sessionMessages)
				.use(Middleware.loadSocialSessions)
			
				// route conditions
				.use(app.router)
				.use(require('less-middleware')({ src: __dirname + '/../public' }))
				.use(express.static(path.join(__dirname, '../public')));

			return app;
		}
	}
})();

module.exports.Bootup = AppSetup;