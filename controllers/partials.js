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

 	// navigation partials
 	main_menu: {
		path: '/partials/menus/main',
		get: function(req, res) {
			res.render('partials/menus/main');
		}
	},
	navigation: {
		path: '/partials/menus/navigation',
		get: function(req, res) {
			res.render('partials/menus/navigation');
		}
	},

	// module viewport partials
	facebook_module_notifications: {
		path: '/partials/modules/facebook-notifications',
		get: function(req, res) {
			res.render('partials/modules/facebook-notifications');
		}
	},

 	// help viewport partials
 	notifications: {
 		path: '/partials/help/notifications',
 		get: function(req, res) {
 			res.render('partials/help/notifications');
 		}
 	},
 	facebook_likes: {
 		path: '/partials/help/facebook-likes',
 		get: function(req, res) {
 			res.render('partials/help/facebook-likes');
 		}
 	},

 	// options viewport partials
 	facebook_options_notifications: {
 		path: '/partials/management/facebook-notifications',
 		get: function(req, res) {
 			res.render('partials/management/facebook-notifications');
 		}
 	},
}

module.exports = PartialsController;