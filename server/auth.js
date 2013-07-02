/**
 * Module dependencies.
 */
var //Class = require('./libraries/class'),
		bcrypt = require('bcrypt'),
		passport = require('passport'),
		Model = Model || Object,
		LocalStrategy = require('passport-local').Strategy;

var Auth = (function() {

// Private attribute that holds the single instance
var authInstance;

	function constructor() {

		// private variables
		var saltWorkFactor = 10;

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
			loadStrategy: function(type) {
				strategy[type]();
				return this;
			},
			loadSession: function(type) {
				session[type]();
				return this;
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