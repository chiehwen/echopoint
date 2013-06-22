/**
 * User Model
 */

// Module dependencies
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Auth = require('../server/auth');

// Create Schema with mongoose Schema
var UserSchema = new Schema({
    name: {type: String},
    email: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    //salt: { type: String, required: true},
    //hash: { type: Buffer, required: true},
    meta: {
        created: { type: Date, default: Date.now},
        createdTimestamp: {type: Number, default: Date.now() },
        guide: {type: Boolean, default: 1}
    }   
}, {autoIndex: true});

// beforeSave functionality
UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    auth = new Auth();
    auth.encrypt(user.password, function(err, encrypted){
      if (err) return next(err);
      user.password = encrypted;
      next();
    });
});

// Connect Auth authenticate to instatiated user schema
UserSchema.methods.authenticate = function(unverified, callback) {
  //console.log(this);
    auth = new Auth();
    auth.authenticate(unverified, this.password, function(err, match){
      if (err) callback(err)
      callback(null, match)
    });
};

module.exports = mongoose.model('User', UserSchema);