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
 	template: {
 		get: function(req, res) {
 			res.render('partials/template');
 		}
 	},
 	loading: {
 		restricted: false,
		get: function(req, res) {
 			res.render('partials/loading');
 		}
 	},
 	social: {
 		path: '/partials/social/index',
 		get: function(req, res) {
 			res.render('partials/social/index');
 		}
 	},
 	social_connect: {
 		path: '/partials/social/connect',
 		get: function(req, res) {
 			res.render('partials/social/connect');
 		}
 	},
 	social_business_select: {
 		path: '/partials/social/select',
 		get: function(req, res) {
 			res.render('partials/social/select');
 		}
 	},
 	module: {
 		restricted: false,
 		get: function(req, res) {
 			res.render('partials/module');
 		}
 	},
 	viewport: {
 		restricted: false,
 		get: function(req, res) {
 			res.render('partials/viewport');
 		}
 	},
 	menu: {
 		restricted: false,
 		get: function(req, res) {
 			res.render('partials/menu');
 		}
 	},

 	// navigation partials
 	header: {
 		restricted: false,
		path: '/partials/header',
		get: function(req, res) {
			res.render('partials/header');
		}
	},
	navigation: {
		restricted: false,
		path: '/partials/menus/navigation',
		get: function(req, res) {
			res.render('partials/menus/navigation');
		}
	},

	// social network specific setup partials
	yelp_login: {
		path: '/partials/social/yelp/index',
		get: function(req, res) {
			res.render('partials/social/yelp/index');
		}
	},
	yelp_setup: {
		path: '/partials/social/yelp/setup',
		get: function(req, res) {
			res.render('partials/social/yelp/setup');
		}
	},	
	// module loading partial
	module_loading: {
		restricted: false,
		path: '/partials/modules/loading',
		get: function(req, res) {
			res.render('partials/modules/loading');
		}
	},

	// module viewport partials
	facebook_tip: {
		restricted: false,
		path: '/partials/modules/facebook/tip/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/tip/index');
		}
	},
	facebook_notifications: {
		restricted: false,
		path: '/partials/modules/facebook/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/notifications/index');
		}
	},
	facebook_statistics: {
		restricted: false,
		path: '/partials/modules/facebook/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/statistics/index');
		}
	},
	facebook_posts: {
		restricted: false,
		path: '/partials/modules/facebook/posts/index',
		get: function(req, res) {
			res.render('partials/modules/facebook/posts/index');
		}
	},

 	// help viewport partials
 	facebook_notifications_help: {
 		restricted: false,
 		path: '/partials/modules/facebook/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/notifications/help');
 		}
 	},
 	facebook_statistics_help: {
 		restricted: false,
 		path: '/partials/modules/facebook/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/statistics/help');
 		}
 	},
 	facebook_posts_help: {
 		restricted: false,
 		path: '/partials/modules/facebook/posts/help',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/posts/help');
 		}
 	},

 	// options viewport partials
 	facebook_notifications_management: {
 		restricted: false,
 		path: '/partials/modules/facebook/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/notifications/management');
 		}
 	},
 	facebook_statistics_management: {
 		restricted: false,
 		path: '/partials/modules/facebook/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/statistics/management');
 		}
 	},
 	facebook_posts_management: {
 		restricted: false,
 		path: '/partials/modules/facebook/posts/management',
 		get: function(req, res) {
 			res.render('partials/modules/facebook/posts/management');
 		}
 	},

}

module.exports = PartialsController;