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

 	// user partials
 	dashboard: {
 		path: '/partials/user/dashboard',
		get: function(req, res) {
 			res.render('partials/user/dashboard');
 		}
 	},
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

	// social network specific setup partials
	google_plus_search: {
		path: '/partials/social/google/plus/search',
		get: function(req, res) {
			res.render('partials/social/google/plus/search');
		}
	},
	google_places_search: {
		path: '/partials/social/google/places/search',
		get: function(req, res) {
			res.render('partials/social/google/places/search');
		}
	},
	google_plus_select: {
		path: '/partials/social/google/plus/select',
		get: function(req, res) {
			res.render('partials/social/google/plus/select');
		}
	},
	google_places_select: {
		path: '/partials/social/google/places/select',
		get: function(req, res) {
			res.render('partials/social/google/places/select');
		}
	},
	yelp_search: {
		path: '/partials/social/yelp/search',
		get: function(req, res) {
			res.render('partials/social/yelp/search');
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

	// Facebook module viewport partials 
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

 	// Facebook help viewport partials
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

 	// Facebook options viewport partials
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


 	// Twitter module viewport partials 
	twitter_tip: {
		restricted: false,
		path: '/partials/modules/twitter/tip/index',
		get: function(req, res) {
			res.render('partials/modules/twitter/tip/index');
		}
	},
	twitter_notifications: {
		restricted: false,
		path: '/partials/modules/twitter/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/twitter/notifications/index');
		}
	},
	twitter_statistics: {
		restricted: false,
		path: '/partials/modules/twitter/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/twitter/statistics/index');
		}
	},
	twitter_tweets: {
		restricted: false,
		path: '/partials/modules/twitter/tweets/index',
		get: function(req, res) {
			res.render('partials/modules/twitter/tweets/index');
		}
	},
	twitter_mentions: {
		restricted: false,
		path: '/partials/modules/twitter/mentions/index',
		get: function(req, res) {
			res.render('partials/modules/twitter/mentions/index');
		}
	},

 	// Twitter help viewport partials
 	twitter_notifications_help: {
 		restricted: false,
 		path: '/partials/modules/twitter/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/notifications/help');
 		}
 	},
 	twitter_statistics_help: {
 		restricted: false,
 		path: '/partials/modules/twitter/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/statistics/help');
 		}
 	},
 	twitter_tweets_help: {
 		restricted: false,
 		path: '/partials/modules/twitter/tweets/help',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/tweets/help');
 		}
 	},
 	twitter_mentions_help: {
 		restricted: false,
 		path: '/partials/modules/twitter/mentions/help',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/mentions/help');
 		}
 	},

 	// Twitter options viewport partials
 	twitter_notifications_management: {
 		restricted: false,
 		path: '/partials/modules/twitter/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/notifications/management');
 		}
 	},
 	twitter_statistics_management: {
 		restricted: false,
 		path: '/partials/modules/twitter/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/statistics/management');
 		}
 	},
 	twitter_tweets_management: {
 		restricted: false,
 		path: '/partials/modules/twitter/tweets/management',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/tweets/management');
 		}
 	},
 	twitter_mentions_management: {
 		restricted: false,
 		path: '/partials/modules/twitter/mentions/management',
 		get: function(req, res) {
 			res.render('partials/modules/twitter/mentions/management');
 		}
 	},


 	// Foursquare module viewport partials 
	foursquare_tip: {
		restricted: false,
		path: '/partials/modules/foursquare/tip/index',
		get: function(req, res) {
			res.render('partials/modules/foursquare/tip/index');
		}
	},
	foursquare_notifications: {
		restricted: false,
		path: '/partials/modules/foursquare/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/foursquare/notifications/index');
		}
	},
	foursquare_statistics: {
		restricted: false,
		path: '/partials/modules/foursquare/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/foursquare/statistics/index');
		}
	},
	foursquare_posts: {
		restricted: false,
		path: '/partials/modules/foursquare/posts/index',
		get: function(req, res) {
			res.render('partials/modules/foursquare/posts/index');
		}
	},

 	// Foursquare help viewport partials
 	foursquare_notifications_help: {
 		restricted: false,
 		path: '/partials/modules/foursquare/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/foursquare/notifications/help');
 		}
 	},
 	foursquare_statistics_help: {
 		restricted: false,
 		path: '/partials/modules/foursquare/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/foursquare/statistics/help');
 		}
 	},
 	foursquare_posts_help: {
 		restricted: false,
 		path: '/partials/modules/foursquare/posts/help',
 		get: function(req, res) {
 			res.render('partials/modules/foursquare/posts/help');
 		}
 	},

 	// Foursquare options viewport partials
 	foursquare_notifications_management: {
 		restricted: false,
 		path: '/partials/modules/foursquare/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/foursquare/notifications/management');
 		}
 	},
 	foursquare_statistics_management: {
 		restricted: false,
 		path: '/partials/modules/foursquare/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/foursquare/statistics/management');
 		}
 	},
 	foursquare_posts_management: {
 		restricted: false,
 		path: '/partials/modules/foursquare/posts/management',
 		get: function(req, res) {
 			res.render('partials/modules/foursquare/posts/management');
 		}
 	},


 	// Google+ module viewport partials 
	google_plus_tip: {
		restricted: false,
		path: '/partials/modules/google/plus/tip/index',
		get: function(req, res) {
			res.render('partials/modules/google/plus/tip/index');
		}
	},
	google_plus_notifications: {
		restricted: false,
		path: '/partials/modules/google/plus/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/google/plus/notifications/index');
		}
	},
	google_plus_statistics: {
		restricted: false,
		path: '/partials/modules/google/plus/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/google/plus/statistics/index');
		}
	},
	google_plus_posts: {
		restricted: false,
		path: '/partials/modules/google/plus/posts/index',
		get: function(req, res) {
			res.render('partials/modules/google/plus/posts/index');
		}
	},

 	// Google+ help viewport partials
 	google_plus_notifications_help: {
 		restricted: false,
 		path: '/partials/modules/google/plus/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/google/plus/notifications/help');
 		}
 	},
 	google_plus_statistics_help: {
 		restricted: false,
 		path: '/partials/modules/google/plus/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/google/plus/statistics/help');
 		}
 	},
 	google_plus_posts_help: {
 		restricted: false,
 		path: '/partials/modules/google/plus/posts/help',
 		get: function(req, res) {
 			res.render('partials/modules/google/plus/posts/help');
 		}
 	},

 	// Google+ options viewport partials
 	google_plus_notifications_management: {
 		restricted: false,
 		path: '/partials/modules/google/plus/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/google/plus/notifications/management');
 		}
 	},
 	google_plus_statistics_management: {
 		restricted: false,
 		path: '/partials/modules/google/plus/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/google/plus/statistics/management');
 		}
 	},
 	google_plus_posts_management: {
 		restricted: false,
 		path: '/partials/modules/google/plus/posts/management',
 		get: function(req, res) {
 			res.render('partials/modules/google/plus/posts/management');
 		}
 	},


 	// Google Places module viewport partials 
	google_places_tip: {
		restricted: false,
		path: '/partials/modules/google/places/tip/index',
		get: function(req, res) {
			res.render('partials/modules/google/places/tip/index');
		}
	},
	google_places_notifications: {
		restricted: false,
		path: '/partials/modules/google/places/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/google/places/notifications/index');
		}
	},
	google_places_statistics: {
		restricted: false,
		path: '/partials/modules/google/places/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/google/places/statistics/index');
		}
	},
	google_places_posts: {
		restricted: false,
		path: '/partials/modules/google/places/posts/index',
		get: function(req, res) {
			res.render('partials/modules/google/places/posts/index');
		}
	},

 	// Google Places help viewport partials
 	google_places_notifications_help: {
 		restricted: false,
 		path: '/partials/modules/google/places/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/google/places/notifications/help');
 		}
 	},
 	google_places_statistics_help: {
 		restricted: false,
 		path: '/partials/modules/google/places/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/google/places/statistics/help');
 		}
 	},
 	google_places_posts_help: {
 		restricted: false,
 		path: '/partials/modules/google/places/posts/help',
 		get: function(req, res) {
 			res.render('partials/modules/google/places/posts/help');
 		}
 	},

 	// Google Places options viewport partials
 	google_places_notifications_management: {
 		restricted: false,
 		path: '/partials/modules/google/places/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/google/places/notifications/management');
 		}
 	},
 	google_places_statistics_management: {
 		restricted: false,
 		path: '/partials/modules/google/places/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/google/places/statistics/management');
 		}
 	},
 	google_places_posts_management: {
 		restricted: false,
 		path: '/partials/modules/google/places/posts/management',
 		get: function(req, res) {
 			res.render('partials/modules/google/places/posts/management');
 		}
 	},


 	// Yelp module viewport partials 
	yelp_tip: {
		restricted: false,
		path: '/partials/modules/yelp/tip/index',
		get: function(req, res) {
			res.render('partials/modules/yelp/tip/index');
		}
	},
	yelp_notifications: {
		restricted: false,
		path: '/partials/modules/yelp/notifications/index',
		get: function(req, res) {
			res.render('partials/modules/yelp/notifications/index');
		}
	},
	yelp_statistics: {
		restricted: false,
		path: '/partials/modules/yelp/statistics/index',
		get: function(req, res) {
			res.render('partials/modules/yelp/statistics/index');
		}
	},
	yelp_posts: {
		restricted: false,
		path: '/partials/modules/yelp/posts/index',
		get: function(req, res) {
			res.render('partials/modules/yelp/posts/index');
		}
	},

 	// Yelp help viewport partials
 	yelp_notifications_help: {
 		restricted: false,
 		path: '/partials/modules/yelp/notifications/help',
 		get: function(req, res) {
 			res.render('partials/modules/yelp/notifications/help');
 		}
 	},
 	yelp_statistics_help: {
 		restricted: false,
 		path: '/partials/modules/yelp/statistics/help',
 		get: function(req, res) {
 			res.render('partials/modules/yelp/statistics/help');
 		}
 	},
 	yelp_posts_help: {
 		restricted: false,
 		path: '/partials/modules/yelp/posts/help',
 		get: function(req, res) {
 			res.render('partials/modules/yelp/posts/help');
 		}
 	},

 	// Yelp options viewport partials
 	yelp_notifications_management: {
 		restricted: false,
 		path: '/partials/modules/yelp/notifications/management',
 		get: function(req, res) {
 			res.render('partials/modules/yelp/notifications/management');
 		}
 	},
 	yelp_statistics_management: {
 		restricted: false,
 		path: '/partials/modules/yelp/statistics/management',
 		get: function(req, res) {
 			res.render('partials/modules/yelp/statistics/management');
 		}
 	},
 	yelp_posts_management: {
 		restricted: false,
 		path: '/partials/modules/yelp/posts/management',
 		get: function(req, res) {
 			res.render('partials/modules/yelp/posts/management');
 		}
 	},

}

module.exports = PartialsController;