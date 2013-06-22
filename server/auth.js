/**
 * Module dependencies.
 */
var Interface = require('./libraries/class'),
		//crypto = require('crypto'),
		bcrypt = require('bcrypt');

module.exports = Auth = Interface.Class.extend({
	init: function() {
		this.saltWorkFactor = 10;
	},
	encrypt: function(password, callback) {
		this._hash(password, function(err, encrypted){
			if(err) callback(err);
			else callback(null, encrypted);
		});
	},
	_salt: function(callback) {
		bcrypt.genSalt(this.saltWorkFactor, function(err, salt) {
    	if (err) callback(err);
    	callback(null, salt);
    });
	},
	_hash: function(password, callback) {
		this._salt(function(err, salt){
			if (err) callback(err);
			// hash the password using our salt
	    bcrypt.hash(password, salt, function(err, hash) {
				if (err) callback(err);
				callback(null, hash);
			});
		});
	},
	authenticate: function(unverified, password, callback) {
		bcrypt.compare(unverified, password, function(err, match) {
       if (err) return callback(err);
       callback(null, match);
    });
	},

	/*authenticate: function(user, pass, callback) {
	  if (!module.parent) console.log('authenticating %s:%s', user, pass);

	  if (!user) return callback(new Error('cannot find user'));

	  // apply the same algorithm to the POSTed password, applying
	  // the hash against the pass / salt, if there is a match we
	  // found the user
	  this.hash(pass, user.salt, function(err, hash){
	  	if (err) return callback(err);
	    if (hash.toString('base64') == user.hash.buffer.toString('base64')) return callback(null, user);
	    callback(new Error('invalid password'));
	  })
	},
	hash: function (password, salt, callback){
		// from https://github.com/visionmedia/node-pwd
		iterations = this.iterations;
		length = this.len;
	  if (3 == arguments.length) {
	    if (!password) return callback(new Error('password missing'));
	    if (!salt) return callback(new Error('salt missing'));
	    crypto.pbkdf2(password, salt, iterations, length, callback);
	  } else {
	    callback = salt;
	    if (!password) return callback(new Error('password missing'));
	    crypto.randomBytes(length, function(err, salt){
	      if (err) return callback(err);
	      salt = salt.toString('base64');
	      crypto.pbkdf2(password, salt, iterations, length, function(err, hash){
	        if (err) return callback(err);
	        callback(null, salt, hash);
	      });
	    });
	  }
	},
	length: function(n){
  	if (0 == arguments.length) return this.len;
  	this.len = n;
	},
	iterations: function(n){
  	if (0 == arguments.length) return iterations;
  	iterations = n;
	},*/
	restrict: function(req, res, next) {
		if(req.session.passport.user) {
			next();
		} else {
			req.session.messages = 'please login to continue';
	    res.redirect('/login');
		}
	},
});