/**
 * Module dependencies.
 */
var crypto = require('crypto'),
		cl = require('./libraries/class');

module.exports = Auth = cl.Class.extend({
	init: function() {
		// Bytesize.
		this.len = 128;

		//Iterations. ~300ms
		this.iterations = 12000;
	},
	authenticate: function(user, pass, callback) {
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
	},
	restrict: function(req, res, next) {
	  if (req.session.user) {
	    next();
	  } else {
	    req.session.error = 'Access denied!';
	    res.redirect('/login');
	  }
	},
});