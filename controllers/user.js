/**
 * User Controller
 */

// controller dependencies
var passport = require('passport'),
		Helper = require('../server/helpers'),
		Model = Model || Object;

var UserController = {
	login: {
		
		path: '/login',
		restricted: false,
		login: true,
		get: function(req, res){
			if(req.session.passport.user) {
				if(typeof req.session.returnTo !== 'undefined' && req.session.returnTo)
					res.redirect(req.session.returnTo);
				else
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
				successRedirect: '/business/select',
				//successReturnToOrRedirect: '/dashboard',
				failureRedirect: '/login',
				failureMessage: true 
			}
		)
	},

	logout: {

		path: '/logout',
		restricted: false,

		get: function(req, res) {
			req.session.destroy(function(){
			  res.redirect('/login');
			});
		}
	},

	create: {

		restricted: false,
		get: function(req, res) {
			res.render(
				'user/create', 
				{
			  	title: 'Vocada | Create User'
			 	}
			)
		},
		post: function(req, res, next) {
			Model.User.findOne({email: req.body.email}, function(err, user) {
				if (err) return next(err);
				if(!user) {
					var newUser = new Model.User({
						email: req.body.email,
						password: req.body.password
					});

					newUser.save(function(err){
						if (err) return next(err);
						req.login(newUser, function(err) {
						  if (err) return next(err);
						  res.redirect('/business/select');
						});
					});
				} else {
					req.session.messages.push("This email is already registered");
					res.redirect('/user/create');
				}
			});		
		}
	},

	dashboard: {
		path: '/dashboard',
		get: function(req, res) {
			res.render(
				Helper.bootstrapRoute, //'user/dashboard', 
				{
			  	title: 'Vocada | User Dashboard'
			 	}
			)
		}
	},

	profile: {

		path: '/profile',
		get: function(req, res) {
			res.render(
				Helper.bootstrapRoute, //'user/profile', 
				{
			  	title: 'Vocada | User Profile'
			 	}
			)
		},
		put: function(req, res) {

		}
	},

	wizard: {
		// may need to move to business controller
		path: '/wizard',
		get: function(req, res) {

		}
	},

	delete: {
		get: function(req, res) {
				//res.send(req.session.passport.user);
		},
		delete: function(req, res) {
			if(req.session.passport.user) {
				Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);	
					req.session.destroy(function(){
						res.redirect('/user/create');
					});
				});
			}
		}
	},

	settings: {
		json: function(req, res) {
			res.json(
				{
					"dashboard": {
						"modules": {
							"facebook": ["notifications"],
							"twitter": ["notifications"],
							"foursquare": ["notifications"],
							"yelp": ["notifications"]
						}
					},
					"facebook": {
						"modules": {
							"notifications": {
								"type": "list",
								"dashboarded": true,
								"hidden": false,
								"size": false,
								"settings": [
									{"type": "post", "val": true},
									{"type": "like", "val": true},
									{"type": "comment", "val": true},
									{"type": "share", "val": true},
									{"type": "top_commenter", "val": true},
									{"type": "top_liking_user", "val": true},
									{"type": "top_sharer", "val": true},
									{"type": "profile", "val": true}
								]
							},
							"likes": {
								"type": "graph",
								"dashboarded": false,
								"hidden": false,
								"size": true,
								"timeframes": ["15day", "30day", "90day"],
								"settings": []
							}
						}
					}
				}
			)
		}
	}

}

module.exports = UserController;