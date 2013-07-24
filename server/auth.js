/**
 * Module dependencies.
 */
var fs = require('fs'),
		bcrypt = require('bcrypt'),
		passport = require('passport'),
		oauth = require('oauth'),
		Model = Model || Object,
		LocalStrategy = require('passport-local').Strategy,
		Facebook = null, //require('fbgraph'),
		Twitter = null,
		Bitly = null,
		Foursquare = null, // require('node-foursquare'),
		Instagram = null,
		Twit = require('twit'),
		Yelp = require('yelp'),
		Api = require('socialite');

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
			twitter: function() {
				return new oauth.OAuth(
				    Config.twitter.requestUrl,
				    Config.twitter.accessUrl, 
				    Config.twitter.consumerKey,
				    Config.twitter.consumerSecret,
				    Config.twitter.version,
				    Config.twitter.callback,
				    Config.twitter.signature
				);
				/*if(!Twitter) {
					Twitter = new Api('twitter');
					Twitter.client = {
						key: Config.twitter.consumerKey,
						secret: Config.twitter.consumerSecret,
						redirect: Config.twitter.callback
					};
				}

				return Twitter;*/		
			},
			yelp: function() {
				return Yelp.createClient({
					consumer_key: Config.yelp.consumerKey,
					consumer_secret: Config.yelp.consumerSecret,
					token: Config.yelp.token,
					token_secret: Config.yelp.tokenSecret
					//version: Config.yelp.version
				});	
			},
			foursquare: function() {
				/*return Foursquare({
					secrets: {
						clientId: Config.foursquare.clientId,
						clientSecret: Config.foursquare.clientSecret,
						redirectUrl: Config.foursquare.callbackUri
					}
				});*/
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
			
			var redirectParameters = '?'; 
			for(var index in params) {
				redirectParameters += (index + '=' + params[index] + '&'); 
			}

			switch(type) {
				case 'facebook':
					params.client_id = Config.facebook.id;
					params.redirect_uri = Config.facebook.callback;
					params.scope = Config.facebook.scope;
					break;
				case 'twitter':
					return Config.twitter.dialog + redirectParameters;
					break;
				case 'bitly':
					params.client_id = Config.bitly.id;
					params.redirect_uri = Config.bitly.callback;
					break;
				case 'foursquare':
					params.client_id = Config.foursquare.id;
					params.redirect_uri = Config.foursquare.callback;
					break;
				case 'instagram':
					params.client_id = Config.instagram.id;
					params.redirect_uri = Config.instagram.callback;
					params.scope = Config.instagram.scope;
					break;
			}

			var api = strategy[type]();
			return api.getOauthUrl(params);
		}

		function _salt(callback) {
			bcrypt.genSalt(this.saltWorkFactor, function(err, salt) {
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
				//if(typeof Api.client == 'undefined')
					//Api.client = {};
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

			//setFacebookAccessToken: function(oauthAccessToken) {
			//	Api.setAccessToken(oauthAccessToken);
			//},

			checkFacebook: function(callback) {
				//this.load('facebook');
				Facebook.get('me', function(err, response) {
					callback(err, response);
				})
			},

			initTwit: function(oauthAccessToken, oauthAccessTokenSecret, callback) {
		      var Twitter = new Twit({
		      	consumer_key: Config.twitter.consumerKey,
		      	consumer_secret: Config.twitter.consumerSecret,
		      	access_token: oauthAccessToken,
		      	access_token_secret: oauthAccessTokenSecret
		      });

		      Twitter.get('account/verify_credentials', {include_entities: false, skip_status: true}, function(err, reply) {
		      	if(err) {
		      		callback(err);
		      	} else {
		      		callback(null, Twitter);
		      	}
		      });
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
				if(req.session.passport.user) {
					next();
				} else {
					if(req.url != '/login' && req.url != '/logout' && !~req.url.indexOf('/oauth/'))
						req.session.returnTo = req.url;
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