/**
 * Business Model
 */

// Module dependencies
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BusinessModel = (function() {

	var modelInstance; // Private attribute that holds the single instance

	function constructor() { 
		var schema = {
			id: { type: Number, default: -1},
			name: { type: String},
			meta: {
				created: { type: Date, default: Date.now},
				createdTimestamp: { type: Number, default: Date.now() },
			}   
		};
		var options = {autoIndex: true};
		var associations = {
			belongsTo : ['user'],
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
				var BusinessSchema = new Schema(schema, options);

				return mongoose.model('Business', BusinessSchema);    
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

module.exports = BusinessModel;