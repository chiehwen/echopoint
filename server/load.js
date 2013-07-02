// Module dependencies.
var http = require('http'),
		fs = require('fs'),
		Database = require('./database').getInstance(),
		Auth = require('./auth').getInstance(),
		Model = Model || Object;

var LoadServer = (function() {

	// Private attribute that holds the single instance
	var serverInstance;

	function constructor(parent, options) {

		// private variables
		var app = parent,
				verbs = ['get', 'post', 'put', 'delete', 'del', 'json'],
				ModelClasses = Object;

		// private functions
		function database() {
			// Connect to database
			Database.connect('mongoose');
		};

		function instatiate(type, name) {
			// get model data from file and return instatiation
			return require('../' + type + 's' + '/' + name).getInstance();
		}

		function models() {

			var models = [];
			var Models = require('./model');

			// read through the models directory
			fs.readdirSync(__dirname + '/../models').forEach(function(name){
		
				// remove ".js" from model file names 
				name = name.slice(0, -3);

				// make sure a controller exists for the model
				fs.exists(__dirname + '/../controllers/' + name + '.js', function(exists) {
					if(!exists) {
						console.log('No matching Controller! Please create a file named ' + name + '.js in the controllers directory to avoid potential errors.');
					}
				});

				// add model name to the local models variable
				models.push(name);
				// add "instatiated" model to the local ModelClasses variable
				ModelClasses[name] = Models[name.capitalize() + 'Model'].getInstance();//instatiate('model', name);
			});

			// a safety break variable for while loop in case of error
			var safety = 0;
			while(models.length > 0 && safety < 80){

				modelArrayLoop:
				for(var i = 0; i < models.length; i++){
					name = models[i];

					// check if a hasOne association is defined and not empty
					if(typeof ModelClasses[name].getAssociations().hasOne != 'undefined' && ModelClasses[name].getAssociations().hasOne.length > 0) {
						for(var child in ModelClasses[name].getAssociations().hasOne) {
							childModelName = ModelClasses[name].getAssociations().hasOne[child]

							// if the child model hasn't been created yet and removed
							// from models array we break from outer for loop
							if(models.indexOf(childModelName) > -1) 
								continue modelArrayLoop;
							// if it has been created add it's schema to the parent model
							else if(typeof Model[childModelName.capitalize()] != 'undefined') {
								var currentSchema = typeof ModelClasses[name].getSchema();
								if(typeof currentSchema[childModelName.capitalize()] == 'undefined')
									ModelClasses[name].updateSchema(childModelName.capitalize(), Model[childModelName.capitalize()].schema);
							}
						}
					}

					// check if a hasMany association is defined and not empty
					if(typeof ModelClasses[name].getAssociations().hasMany != 'undefined' && ModelClasses[name].getAssociations().hasMany.length > 0) {
						for(var child in ModelClasses[name].getAssociations().hasMany) {
							childModelName = ModelClasses[name].getAssociations().hasMany[child]

							// if the child model hasn't been created yet and removed
							// from models array we break from outer for loop
							if(models.indexOf(childModelName) > -1) 
								continue modelArrayLoop;
							// if it has been created add it's schema to the parent model (in an array since this is a hasMany relationship)
							else if(typeof Model[childModelName.capitalize()] != 'undefined') {
								var currentSchema = typeof ModelClasses[name].getSchema();
								if(typeof currentSchema[childModelName.capitalize()] == 'undefined')
									ModelClasses[name].updateSchema(childModelName.capitalize(), [Model[childModelName.capitalize()].schema]);
						}	}
					}

					// if we didn't "continue" back to the outer loop than create the model
					Model[name.capitalize()] = ModelClasses[name].create();

					// remove the created model from the models array
					var index = models.indexOf(name);
					models.splice(index, 1);
				};

				// safety first (while loop protection)
				safety++;
			}
		};

		function controllers() {
			var Controllers = require('./controller');

			// read through the controllers directory
			fs.readdirSync(__dirname + '/../controllers').forEach(function(name){

				// Remove .js from controller file names 
				name = name.slice(0, -3);

				Controller = Controllers[name.capitalize() + 'Controller'].getInstance();

				for(var route in Controller) {

					var Route = Controller[route];
						
					// if no path is given build default based on controller/route
					if(typeof Route.path == 'undefined')
						Route.path = '/' + name + '/' + route;

					// check if page is restricted
					if(typeof Route.restricted == 'undefined' || Route.restricted)
						Route.restricted = Auth.restrict;

					for(var verb in Route) {
						// check if we have an acceptable express HTTP verb
						if(verbs.indexOf(verb) === -1) continue;

						if(!Route.restricted)
							app[verb](Route.path, Route[verb]);
						else
							app[verb](Route.path, Route.restricted, Route[verb]);
					}
				}
			});
		};

		// public members
		return {
			load: function() {
				database();
				models();
				controllers();
			},
			create: function() {
				// create the http server listener for our express app
				http.createServer(app).listen(app.get('port'), function(){
				  console.log('Express server listening on port ' + app.get('port'));
				});
			}

		} // end return object
	} // end constructor 

	return {
		getInstance: function(parent, options) {
			if(!serverInstance)
				serverInstance = constructor(parent, options);
			return serverInstance;
		}
	}

})();

module.exports.Server = LoadServer;