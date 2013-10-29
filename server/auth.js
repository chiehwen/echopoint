/**
 * Module dependencies.
 */
var fs = require('fs'),
		qs = require('querystring'),
		bcrypt = require('bcrypt-nodejs'),
		passport = require('passport'),
		oauth = require('oauth'),
		Log = require('./logger').getInstance().getLogger(),
		Helper = require('./helpers'),
		Model = Model || Object,
		LocalStrategy = require('passport-local').Strategy,
		Api = require('socialite'),
		Facebook = null,
		Twitter = null,
		Foursquare = null,
		Google = null,
		GoogleDiscoveryApi = null,
		Instagram = null,
		Yelp = null,
		Bitly = null,
		Klout = null,
		nTwitter = require('ntwitter'),
		//GoogleOAuth = require('googleapis').OAuth2Client,
		googleapis = require('googleapis'),
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
				    	if (err) {
								Log.error('Error on Mongoose User.findOne query', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								return callback(err)
							}

							if(!user) 
								return callback(null, false, {message: 'email-password-error'})

							// check if password is a match
							user.authenticate(password, function(err, match) {
								if (err) {
									Log.error('Error on authenticating user', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
									return callback(err)
								}
								if(!match) return callback(null, false, {message: 'email-password-error'});
								return callback(null, user);
							});
						});
					 }
				));
			},
			
			facebook: function() {
				if(!Facebook) {
					Facebook = new Api('facebook')
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
						access_token_key: oauthAccessToken ? oauthAccessToken : null,
						access_token_secret: oauthAccessTokenSecret ? oauthAccessTokenSecret : null,
					}

					Twitter = new nTwitter(credentials)

					/*Twitter.oauth = new oauth.OAuth(
						Config.twitter.requestUrl,
						Config.twitter.accessUrl, 
						Config.twitter.consumerKey,
						Config.twitter.consumerSecret,
						Config.twitter.version,
						Config.twitter.callback,
						Config.twitter.signature
					);*/

					Twitter.setAccessTokens = function(oauthAccessToken, oauthAccessTokenSecret) {
						this.options.access_token_key = oauthAccessToken;
						this.options.access_token_secret = oauthAccessTokenSecret;
						return this;
					}

					Twitter.setBearerToken = function(oauthBearerToken) {
						this.options.headers.Authorization = 'Bearer ' + oauthBearerToken;
						return this;
					}
				}

				return Twitter;
			},

			google: function() {
				if(!Google) {
					Google = new Api('google')
					Google.client = {
						id: Config.google.id,
						key: Config.google.key,
						consumerSecret: Config.google.consumerSecret,
						redirect: Config.google.callback
					}
				}

				return Google;
			},

			google_discovery: function() {
				if(!GoogleDiscoveryApi) {
					GoogleDiscoveryApi = googleapis;
					var GoogleOAuth = GoogleDiscoveryApi.OAuth2Client
					GoogleDiscoveryApi.oauth = new GoogleOAuth(
						Config.google.id,
						Config.google.consumerSecret,
						Config.google.callback 
					);

					GoogleDiscoveryApi.oauth.setAccessTokens = function(tokens) {
						this.credentials = tokens;
						return this;
					}

					GoogleDiscoveryApi.apiKey = Config.google.key;
				}
				return GoogleDiscoveryApi
			},

			yelp: function() {
				if(!Yelp)
					Yelp = YelpApi.createClient({
						consumer_key: Config.yelp.consumerKey,
						consumer_secret: Config.yelp.consumerSecret,
						token: Config.yelp.token,
						token_secret: Config.yelp.tokenSecret
					})

				return Yelp;
			},

			foursquare: function() {
				if(!Foursquare) {
					Foursquare = new Api('foursquare')
					Foursquare.client = {
						id: Config.foursquare.id,
						secret: Config.foursquare.secret,
						redirect: Config.foursquare.callback,
						verified: Config.foursquare.verified // this is the foursquare verfied date (https://developer.foursquare.com/overview/versioning)
					}
				}

				return Foursquare;	
			},

			instagram: function() {
				if(!Instagram) {
					Instagram = new Api('instagram')
					Instagram.client = {
						id: Config.instagram.id,
						secret: Config.instagram.secret,
						redirect: Config.instagram.callback
					}
				}

				return Instagram;
			},

			bitly: function() {
				if(!Bitly) {
					Bitly = new Api('bitly')
					Bitly.client = {
						id: Config.bitly.id,
						secret: Config.bitly.secret,
						redirect: Config.bitly.callback
					}
				}

				return Bitly;
			},

			klout: function() {
				if(!Klout) {
					Klout = new Api('klout')
					Klout.client = {
						key: Config.klout.key,
						secret: Config.klout.secret,
						redirect: Config.klout.callback
					}
				}

				return Klout;
			}
		};

		var session = {
			local: function() {
				passport.serializeUser(function(user, callback) {
				  callback(null, user._id);
				});

				passport.deserializeUser(function(id, callback) {
				  Model.User.findById(id, function(err, user) {
				  	if(err)
				  		Log.error('Error on Mongoose User.findById query', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
				    callback(err, user);
				  });
				});				
			}
		}

		var oauthDialogUrl = function(type, params) {
			
			if(type === 'twitter')
					return Config.twitter.dialog + '?' + qs.stringify(params);

			if(typeof Config[type].scope !== 'undefined')
				params.scope = Config[type].scope;

			//if(type === 'google')
				//return Google.generateAuthUrl(params);

			params.client_id = Config[type].id;
			params.redirect_uri = Config[type].callback;

			var api = strategy[type]();
			return api.getOauthUrl(params);
		}

		function _salt(callback) {
			bcrypt.genSalt(saltWorkFactor, function(err, salt) {
				if (err) {
					Log.error('Error with bcrypt salt generation (bcrypt.genSalt) @ _salt function in auth.js file', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					callback(err)
				}
				callback(null, salt)
			});
		};

		function _hash(password, callback) {
			_salt(function(err, salt){
				if (err) callback(err);
				// hash the password using our salt
				bcrypt.hash(password, salt, function(progress){}, function(err, hash) {
					if (err) {
						Log.error('Error with bcrypt hashing (bcrypt.hash) @ _hash function in auth.js file', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						callback(err)
					}
					callback(null, hash)
				});
			});
		};

		// public members
		return {
			// public getter functions
			load: function(type) {
				return strategy[type](arguments[1], arguments[2]);
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
					if (err) {
						Log.error('Error with bcrypt compare (bcrypt.compare) @ authenticate function in auth.js file', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						return callback(err)
					}
					callback(null, match)
				})
			},
			encrypt: function(password, callback) {
				_hash(password, function(err, encrypted) {
					if(err) return callback(err)
					callback(null, encrypted)
				})
			},

			// These are Authorization functions
			restrict: function(req, res, next) {
				if(!Helper.isPath(req.url))
					req.session.returnTo = req.url;

				if(!req.session.passport.user) {
					if(typeof req.session.returnTo === 'undefined' || !req.session.returnTo) 
						req.session.returnTo = '/dashboard';
					req.session.messages = 'please login to continue';
					res.redirect('/login');
					return
				}
					
				// attempted to put this in middleware but got page load glitches, works fine here
				if(!req.session.Business && !Helper.isPath(req.url, ['/login', '/logout', '/business/select', '/business/create', '/user/create'], [])) {
		 			Helper.getUser(req.session.passport.user, function(err, user) {
		 				if (err) {
							Log.error('Helper.getUser error @ restrict() in auth.js file', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
							res.redirect('/logout')
							return
						}	

	 					if(!user) {
	 						Log.warn('No User found @ restrict() in auth.js file', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
							req.session.messages.push("Error finding user")
	 						res.redirect('/login')
	 						return next(err)
	 					}

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

				if(req.session.returnTo)
					res.locals.returnTo = req.session.returnTo;
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