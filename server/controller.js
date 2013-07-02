/**
 * Parent Controller
 */
		String.prototype.capitalize = function() {
			return this.charAt(0).toUpperCase() + this.slice(1);
		}

// Module dependencies
var fs = require('fs'),
		Model = Model || Object,
		Controller = Object;

	// read through the controllers directory
	fs.readdirSync(__dirname + '/../controllers').forEach(function(name){

		// Remove .js from controller file names 
		name = name.slice(0, -3);
		objectName = name.capitalize() + 'Controller';

		// Export Controller as an object literal
		Controller[objectName] = (function() {

			var controllerInstance; // Private attribute that holds the single instance

			var constructor = require('../controllers/' + name);
			/*
			var constructor = function construct() {
				var _meta = {
					name: 'user',
					engine: 'jade',
				};

				return {
					login: (function() { return {
						
						path: '/login',
						restricted: false,
						get: function(req, res){
							if(req.session.passport.user) {
								res.redirect('/dashboard');
							} else {
								res.render(
									'user/login', 
									{
									 	title: 'Vocada | Login',
									 	message: req.session.messages
									}
								);
							}
						},
						post: passport.authenticate('local', 
							{ 
								successRedirect: '/dashboard',
								failureRedirect: '/login',
								failureMessage: true 
							}
						)
					}})(),
				}
			} */

			return {
				getInstance: function() {
					if(!controllerInstance) {
						controllerInstance = constructor();
					}
					return controllerInstance;
				}
			}

		})();

});

module.exports = Controller;