/**
 * Module dependencies.
 */
var fs = require('fs'),
	bcrypt = require('bcrypt'),
	passport = require('passport'),
	oauth = require('oauth'),
	Model = Model || Object,
	LocalStrategy = require('passport-local').Strategy,
	Facebook = require('fbgraph'),
	Twit = require('twit');

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

				if(typeof Facebook.app == 'undefined') {
					Facebook.app = {
						id: Config.facebook.appId,
						secret: Config.facebook.appSecret,
						redirect: Config.facebook.callbackUri
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
				    Config.twitter.callbackUri,
				    Config.twitter.signatureMethod
				); 			
			},
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

		var redirectEndpoint = function(type, parameters) {
			
			var redirectParameters = '?'; 
			for(var index in parameters) {
				redirectParameters += (index + '=' + parameters[index] + '&'); 
			}

			switch(type) {
				case 'facebook':
					return Config.facebook.redirectEndpoint + redirectParameters + 'client_id=' + Config.facebook.appId + '&redirect_uri=' + Config.facebook.callbackUri + '&scope=' + Config.facebook.scope;
					break;
				case 'twitter':
					return Config.twitter.redirectEndpoint + redirectParameters;
					break;
			}
			
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

			getRedirectEndpoint: function(type, parameters) {
				return redirectEndpoint(type, parameters);
			},

			setFacebookAccessToken: function(oauthAccessToken) {
				Facebook.setAccessToken(oauthAccessToken);
			},

			checkFacebook: function(callback) {
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