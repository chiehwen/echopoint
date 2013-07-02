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
			app.set('port', process.env.PORT || 3000);
			app.set('views', __dirname + '/../views');
			app.set('view engine', 'jade');

			// express middleware
			app.use(express.favicon());
			app.use(express.logger('dev'));
			app.use(express.bodyParser());
			app.use(express.methodOverride());
			app.use(express.cookieParser('The world is full of secrets!'));
			app.use(express.session('Yes, even wizards have secrets...'));
			
			// passport setup
			app.use(passport.initialize());
			app.use(passport.session());

			// custom middleware
			app.use(Middleware.sessionMessages);

			// route conditions
			app.use(app.router);
			app.use(require('less-middleware')({ src: __dirname + '/../public' }));
			app.use(express.static(path.join(__dirname, '../public')));

			return app;
		}
	}
})();

module.exports.Bootup = AppSetup;