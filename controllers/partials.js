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
 	app: {
 		get: function(req, res) {
 			res.render('partials/app');
 		}
 	},
 	loading: {
		get: function(req, res) {
 			res.render('partials/loading');
 		}
 	},
 	social: {
 		get: function(req, res) {
 			res.render('partials/social');
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
 	header: {
		path: '/partials/header',
		get: function(req, res) {
			res.render('partials/header');
		}
	},
	navigation: {
		path: '/partials/menus/navigation',
		get: function(req, res) {
			res.render('partials/menus/navigation');
		}
	},

	// module loading partial
	module_loading: {
		path: '/partials/modules/loading',
		get: function(req, res) {
			res.render('partials/modules/loading');
		}
	},

	// module viewport partials
	facebook_tip: {
		path: '/partials/modules/facebook/tip/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/tip/index');
		}
	},
	facebook_notifications: {
		path: '/partials/modules/facebook/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/notifications/index');
		}
	},
	facebook_statistics: {
		path: '/partials/modules/facebook/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/statistics/index');
		}
	},
	facebook_posts: {
		path: '/partials/modules/facebook/posts/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/posts/index');
		}
	},

 	// help viewport partials
 	facebook_notifications_help: {
 		path: '/partials/modules/facebook/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/notifications/help');
 		}
 	},
 	facebook_statistics_help: {
 		path: '/partials/modules/facebook/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/statistics/help');
 		}
 	},
 	facebook_posts_help: {
 		path: '/partials/modules/facebook/posts/help',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/posts/help');
 		}
 	},

 	// options viewport partials
 	facebook_notifications_management: {
 		path: '/partials/modules/facebook/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/notifications/management');
 		}
 	},
 	facebook_statistics_management: {
 		path: '/partials/modules/facebook/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/statistics/management');
 		}
 	},
 	facebook_posts_management: {
 		path: '/partials/modules/facebook/posts/management',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/posts/management');
 		}
 	},

}

module.exports = PartialsController;