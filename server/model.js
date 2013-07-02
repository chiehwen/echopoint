/**
 * User Model
 */

// Module dependencies
var fs = require('fs'),
    Auth = require('../server/auth').getInstance(),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Models = Object;

// read through the controllers directory
fs.readdirSync(__dirname + '/../models').forEach(function(name){

  // remove .js from model file names 
  var name = name.slice(0, -3),
      objectName = name.capitalize() + 'Model';

  var model = require('../models/' + name);

  // create model singleton
  Models[objectName] = (function() {

    // Private attribute that holds the single instance
    var modelInstance;

    function constructor() {
      var schema = model.Architecture.schema;
      var options = model.Architecture.options;
      var associations = model.Architecture.associations;

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
          var ModelSchema = new Schema(schema, options);

          // handle middlware
          for (action in model.Middleware.pre) {
            ModelSchema.pre(action, model.Middleware.pre[action]);
          }

          for (action in model.Middleware.post) {
            ModelSchema.post(action, model.Middleware.post[action]);
          }

          // handle custom methods
          for (method in model.Custom.methods) {
            ModelSchema.methods[method] = model.Custom.methods[method];
          }

          return mongoose.model(name.capitalize(), ModelSchema);    
        }

      } // end return object
    } // end constructor

    return {
      getInstance: function() {
        if(!modelInstance)
          modelInstance = constructor();
        return modelInstance;
      }
    }

  })();

});

module.exports = Models;