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
				return this.charAt(0).toUpperCase() + this.slice(1)
			}

			// attach the .equals method to Array's prototype
			Array.prototype.equals = function (array) {
				if (!array)
        	return false;

				// compare lengths - can save a lot of time
				if (this.length !== array.length)
					return false;

				for (var i=0,l=this.length;i<l;i++)
					// Check if we have nested arrays
					if (this[i] instanceof Array && array[i] instanceof Array)
						// recurse into the nested arrays
						if (!this[i].equals(array[i]))
							return false;
					else if (this[i] !== array[i])
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
            
				return true;
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
				.use(Middleware.sessionVariables)
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