// from https://github.com/visionmedia/node-pwd

/**
 * Module dependencies.
 */

var crypto = require('crypto');

/**
 * Bytesize.
 */

var len = 128;

/**
 * Iterations. ~300ms
 */

var iterations = 12000;

/**
 * Set length to `n`.
 *
 * @param {Number} n
 * @api public
 */

exports.length = function(n){
  if (0 == arguments.length) return len;
  len = n;
};

/**
 * Set iterations to `n`.
 *
 * @param {Number} n
 * @api public
 */

exports.iterations = function(n){
  if (0 == arguments.length) return iterations;
  iterations = n;
};

/**
 * Hashes a password with optional `salt`, otherwise
 * generate a salt for `pass` and invoke `callback(err, salt, hash)`.
 *
 * @param {String} password to hash
 * @param {String} optional salt
 * @param {Function} callback
 * @api public
 */

exports.hash = function(pwd, salt, callback){
  if (3 == arguments.length) {
    if (!pwd) return callback(new Error('password missing'));
    if (!salt) return callback(new Error('salt missing'));
    crypto.pbkdf2(pwd, salt, iterations, len, callback);
  } else {
    callback = salt;
    if (!pwd) return callback(new Error('password missing'));
    crypto.randomBytes(len, function(err, salt){
      if (err) return callback(err);
      salt = salt.toString('base64');
      crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash){
        if (err) return callback(err);
        callback(null, salt, Buffer(hash, 'binary'));
      });
    });
  }
};