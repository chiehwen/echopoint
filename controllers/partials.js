/**
 * Partials Controller
 */

var Helper = require('../server/helpers'),
		Model = Model || Object;

var PartialsController = {
	index: {
 		//restricted: false,
 		get: function(req, res) {
 			res.render(
 				'partials/index', 
 				{
 			  	title: 'Vocada | Test Template'
 			 	}
 			);
 		}
 	},
 	template: {
 		//restricted: false,
 		get: function(req, res) {
 			res.render(
 				'partials/template', 
 				{
 			  	title: 'Vocada | Test Template'
 			 	}
 			);
 		}
 	},
 	module: {
 		//restricted: false,
 		get: function(req, res) {
 			res.render(
 				'partials/module', 
 				{
 			  	title: 'Vocada | Test Template'
 			 	}
 			);
 		}
 	},
}

module.exports = PartialsController;