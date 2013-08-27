/**
 * Module dependencies.
 */
var fs = require('fs'),
		qs = require('querystring'),
		bcrypt = require('bcrypt'),
		passport = require('passport'),
		oauth = require('oauth'),
		Helper = require('./helpers'),
		Model = Model || Object,
		LocalStrategy = require('passport-local').Strategy,
		Api = require('socialite'),
		Facebook = null, //require('fbgraph'),
		Twitter = null,
		Foursquare = null, // require('node-foursquare'),
		Instagram = null,
		Yelp = null,
		Bitly = null,
		Twit = require('twit'),
		YelpApi = require('yelp');

var Auth = (function() {

	// Private attribute that holds the single instance
	var authInstance;

	function constructor() {

		// private variables
		var saltWorkFactor = 10,
			Config = JSON.parse(fs.readFileSync('./server/config/api.json'));

		// private functions
		var strategy = {
			local: function() {
				passport.use(new LocalStrategy({
				    usernameField: 'email'
				  },
				  function(email, password, callback) {
				    Model.User.findOne({ email: email }, function(err, user) {
				    	if (err) return callback(err);

							if(!user) return callback(null, false, {message: 'email-password-error'});

							// check if password is a match
							user.authenticate(password, function(err, match) {
								if (err) return callback(err);
								if(!match) return callback(null, false, {message: 'email-password-error'});
								return callback(null, user);
							});
						});
					 }
				));
			},
			
			facebook: function() {
				if(!Facebook) {
					Facebook = new Api('facebook');
					Facebook.client = {
						id: Config.facebook.id,
						secret: Config.facebook.secret,
						redirect: Config.facebook.callback
					};
				}

				return Facebook;
			},

			twitter: function(oauthAccessToken, oauthAccessTokenSecret) {

				if(!Twitter) {

					var credentials = {
						consumer_key: Config.twitter.consumerKey,
						consumer_secret: Config.twitter.consumerSecret,
						access_token: typeof oauthAccessToken !== 'undefined' ? oauthAccessToken : 'faux',
						access_token_secret: typeof oauthAccessTokenSecret !== 'undefined' ? oauthAccessTokenSecret : 'faux',
					}

					Twitter = new Twit(credentials);

					Twitter.oauth = new oauth.OAuth(
						Config.twitter.requestUrl,
						Config.twitter.accessUrl, 
						Config.twitter.consumerKey,
						Config.twitter.consumerSecret,
						Config.twitter.version,
						Config.twitter.callback,
						Config.twitter.signature
					);

					Twitter.setAccessTokens = function(oauthAccessToken, oauthAccessTokenSecret) {
						this.auth.config.access_token = oauthAccessToken;
						this.auth.config.access_token_secret = oauthAccessTokenSecret;
						return this;
					}
				}

				return Twitter;
			},

			yelp: function() {
				if(!Yelp) {
					Yelp = YelpApi.createClient({
						consumer_key: Config.yelp.consumerKey,
						consumer_secret: Config.yelp.consumerSecret,
						token: Config.yelp.token,
						token_secret: Config.yelp.tokenSecret
					});
				}

				return Yelp;
			},

			foursquare: function() {
				if(!Foursquare) {
					Foursquare = new Api('foursquare');
					Foursquare.client = {
						id: Config.foursquare.id,
						secret: Config.foursquare.secret,
						redirect: Config.foursquare.callback,
						verified: Config.foursquare.verified // this is the foursquare verfied date (https://developer.foursquare.com/overview/versioning)
					};
				}

				return Foursquare;	
			},

			instagram: function() {
				if(!Instagram) {
					Instagram = new Api('instagram');
					Instagram.client = {
						id: Config.instagram.id,
						secret: Config.instagram.secret,
						redirect: Config.instagram.callback
					};
				}

				return Instagram;
			},

			bitly: function() {
				if(!Bitly) {
					Bitly = new Api('bitly');
					Bitly.client = {
						id: Config.bitly.id,
						secret: Config.bitly.secret,
						redirect: Config.bitly.callback
					};
				}

				return Bitly;
			}
		};

		var session = {
			local: function() {
				passport.serializeUser(function(user, callback) {
				  callback(null, user._id);
				});

				passport.deserializeUser(function(id, callback) {
				  Model.User.findById(id, function(err, user) {
				    callback(err, user);
				  });
				});				
			}
		}

		var oauthDialogUrl = function(type, params) {
			
			if(type == 'twitter')
					return Config.twitter.dialog + '?' + qs.stringify(params);

			params.client_id = Config[type].id;
			params.redirect_uri = Config[type].callback;

			if(typeof Config[type].scope !== 'undefined')
				params.scope = Config[type].scope;

			var api = strategy[type]();
			return api.getOauthUrl(params);
		}

		function _salt(callback) {
			bcrypt.genSalt(saltWorkFactor, function(err, salt) {
				if (err) callback(err);
				callback(null, salt);
			});
		};

		function _hash(password, callback) {
			_salt(function(err, salt){
				if (err) callback(err);
				// hash the password using our salt
				bcrypt.hash(password, salt, function(err, hash) {
					if (err) callback(err);
					callback(null, hash);
				});
			});
		};

		// public members
		return {
			// public getter functions
			load: function(type) {
				return strategy[type]();
			},

			loadStrategy: function(type) {
				strategy[type]();
				return this;
			},

			loadSession: function(type) {
				session[type]();
				return this;
			},

			getOauthDialogUrl: function(type, params) {
				return oauthDialogUrl(type, params);
			},

			// These are Authentication functions
			authenticate: function(unverified, password, callback) {
				bcrypt.compare(unverified, password, function(err, match) {
					if (err) return callback(err);
						callback(null, match);
				});
			},
			encrypt: function(password, callback) {
				_hash(password, function(err, encrypted){
					if(err) callback(err);
					else callback(null, encrypted);
				});
			},

			// These are Authorization functions
			restrict: function(req, res, next) {
				if(!Helper.isPath(req.url))
					req.session.returnTo = req.url;
				if(req.session.passport.user) {
					
					// attempted to put this in middleware but got page load glitches, works fine here
					if(typeof req.session.Business === 'undefined' && !Helper.isPath(req.url, ['/login', '/logout', '/business/select', '/business/create', '/user/create'], [])) {
			 			Helper.getUser(req.session.passport.user, function(err, user) {
			 				if (err || !user) return next(err);
			 				if(user.meta.Business.current && user.meta.Business.current.id != '' && user.meta.Business.current.id ) {
			 					req.session.Business = user.meta.Business.current;
			 					next();
			 				} else {
			 					res.redirect('/business/select');
			 				}
			 			}); 
			 		} else {
						next(); 
					}

				} else {
					if(typeof req.session.returnTo === 'undefined' || !req.session.returnTo) 
						req.session.returnTo = '/dashboard';
					req.session.messages = 'please login to continue';
					res.redirect('/login');
				}
			}

		} // end return object
	} // end constructor

	return {
		getInstance: function() {
			if(!authInstance)
				authInstance = constructor();
			return authInstance;
		}
	}

})();

module.exports = Auth;