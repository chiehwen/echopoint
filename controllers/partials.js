/**
 * Partials Controller
 */

var Model = Model || Object;

var PartialsController = {
	// primary partials
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

 	// account partials
 	account: {
 		path: '/partials/user/account',
		get: function(req, res) {
 			res.render('partials/user/account');
 		}
 	},

 	//business partials
	business_create: {
 		path: '/partials/business/create',
 		get: function(req, res) {
 			res.render('partials/business/create');
 		}
 	},
 	business_select: {
 		path: '/partials/business/select',
 		get: function(req, res) {
 			res.render('partials/business/select');
 		}
 	},

 	// social partials
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

 	// core module partials 
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
	google_setup: {
		path: '/partials/social/google/setup',
		get: function(req, res) {
			res.render('partials/social/google/setup');
		}
	},
	google_select: {
		path: '/partials/social/google/select',
		get: function(req, res) {
			res.render('partials/social/google/select');
		}
	},
	yelp_setup: {
		path: '/partials/social/yelp/setup',
		get: function(req, res) {
			res.render('partials/social/yelp/setup');
		}
	},
	yelp_select: {
		path: '/partials/social/yelp/select',
		get: function(req, res) {
			res.render('partials/social/yelp/select');
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