/**
 * Partials Controller
 */

var Helper = require('../server/helpers'),
		Model = Model || Object;

var PartialsController = {
	index: {
 		//restricted: false,
 		get: function(req, res) {
 			res.render('partials/index');
 		}
 	},
 	data: {
 		get: function(req, res) {
 			res.render('partials/data');
 		}
 	},
 	module: {
 		get: function(req, res) {
 			res.render('partials/module');
 		}
 	},
 	viewport: {
 		get: function(req, res) {
 			res.render('partials/viewport');
 		}
 	},
 	menu: {
 		get: function(req, res) {
 			res.render('partials/menu');
 		}
 	},
 	help: {
 		get: function(req, res) {
 			res.render('partials/help');
 		}
 	}
}

module.exports = PartialsController;