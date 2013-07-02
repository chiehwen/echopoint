/**
 * User Model
 */

// Module dependencies
var Auth = require('../server/auth').getInstance(),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;
    
var UserModel = (function() {

  var modelInstance; // Private attribute that holds the single instance

  function constructor() {
    var schema = {
      name: { type: String},
      email: { type: String, required: true, index: { unique: true } },
      password: { type: String, required: true },
      meta: {
        created: { type: Date, default: Date.now},
        createdTimestamp: { type: Number, default: Date.now() },
        guide: { type: Boolean, default: 1}
      }   
    };
    var options = {autoIndex: true};
    var associations = {
      hasOne: [],
      hasMany: ['business'],
      notNested: {}
    };

    return {
      getSchema: function() {
        return schema;
      },
      updateSchema: function(name, update) {
        schema[name] = update;
      },
      getOptions: function() {
        return options;
      },
      getAssociations: function() {
        return associations;
      },
      create: function() {
        // create schema with mongoose schema
        var UserSchema = new Schema(schema, options);

        // beforeSave functionality
        UserSchema.pre('save', function(next) {
            var user = this;

            // only hash the password if it has been modified (or is new)
            if (!user.isModified('password')) return next();

            Auth.encrypt(user.password, function(err, encrypted){
              if (err) return next(err);
              user.password = encrypted;
              next();
            });
        });

        // Connect Auth authenticate to instatiated user schema
        UserSchema.methods.authenticate = function(unverified, callback) {
            Auth.authenticate(unverified, this.password, function(err, match){
              if (err) callback(err)
              callback(null, match)
            });
        };

        return mongoose.model('User', UserSchema);    
      }
    }
  } // end constructor

  return {
    getInstance: function() {
      if(!modelInstance)
        modelInstance = constructor();
      return modelInstance;
    }
  }

})();

module.exports = UserModel;