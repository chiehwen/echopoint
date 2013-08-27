/**
 * Module dependencies.
 */
var express = require('express'),
		path = require('path'),
		Class = require('../server/libraries/class'),
		passport = require('passport'),
		Middleware = require('./middleware').Middleware,
		Session = require('./session');

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
			var app = this.application,
					store = new express.session.MemoryStore;			
			
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
				.use(express.session({secret: 'Yes, even wizards have secrets...', store: store, cookie: {httpOnly: false}}))
	
				// passport setup
				.use(passport.initialize())
				.use(passport.session())

				// custom middleware
				.use(Middleware.sessionMessages)
				.use(Middleware.uidSessionVariable)
				//.use(Middleware.loadBusiness)				
			
				// route conditions
				.use(app.router)
				.use(require('less-middleware')({ src: __dirname + '/../public' }))
				.use(express.static(path.join(__dirname, '../public')));

			// create reference to session store
			Session.store = store;

			return app;
		}
	}
})();

module.exports.Bootup = AppSetup;