/**
 * User Controller
 */

// controller dependencies
var passport = require('passport'),
		Log = require('../server/logger').getInstance().getLogger(),
		Helper = require('../server/helpers'),
		Model = Model || Object,
		googleTimestampHash = require('../server/harvesters/config/google').getInstance();

var UserController = {
	login: {
		path: '/login',
		restricted: false,
		login: true,

		get: function(req, res){
			if(req.session.passport.user)
				if(req.session.returnTo)
					res.redirect(req.session.returnTo);
				else
					res.redirect('/dashboard');
			else
				res.render(
					'user/login', 
					{
					 	title: 'Vocada | Login',
					 	message: req.session.messages
					}
				);
		},
		post: passport.authenticate('local', 
			{ 
				successRedirect: '/business/select',
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
				if (err) {
					Log.error(err, {error: err, user_email: req.body.email, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error with database query')
					return res.redirect('/logout')
				}

				if(user) {
					req.session.messages.push("This email is already registered");
					return res.redirect('/login')
				}

				var newUser = new Model.User({
					name: req.body.name,
					email: req.body.email,
					password: req.body.password
				});

				newUser.save(function(err){
					if (err) {
						Log.error(err, {error: err, user_email: req.body.email, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						req.session.messages.push('Error with mongoose save')
						return res.redirect('/logout')
					}
					req.login(newUser, function(err) {
					  if (err) {
							Log.error(err, {error: err, user_email: req.body.email, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
							req.session.messages.push('Error with automatic user login')
							return res.redirect('/logout')
						}
					  res.redirect('/business/select')
					});
				});
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

	account: {
		path: '/account/settings',
		get: function(req, res) {
			res.render(
				Helper.bootstrapRoute, //'user/profile', 
				{
			  	title: 'Vocada | User Account Settings'
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

	/* TEMP */ // needs to be done using Angular
	google_hash: {
		path: '/admin/google-hash',
		get: function(req, res) {
			if(!req.session.passport.user)
				res.redirect('/login')

			if(req.query.ghash)
				googleTimestampHash.setTimestampHash(req.query.ghash)

			res.render(
				'user/google_hash', 
				{
					title: 'Vocada | Google Hash',
					current_hash: googleTimestampHash.getTimestampHash() || Helper.googleTimestampHash
				}
			)
		}
	},

	delete: {
		get: function(req, res) {
				//res.send(req.session.passport.user);
		},
		delete: function(req, res) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Model.User.remove({ _id: req.session.passport.user}, function (err) {
			  if (err) {
					Log.error(err, {error: err, user_email: req.body.email, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error with mongoose remove for User')
					return res.redirect('/logout')
				}

			  req.session.destroy(function(){
				  res.redirect('/user/create');
				});
			});	
			
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
						"modules": [
							{ 
								"name": "tip", 
								"type": "text",
								"sortable": false,
								"dashboarded": null,
								"hidden": false,
								"sizing": false,
								"large": true,
								"closeable": true,
								"menu": false,
								"settings": []
							},
							{
								"name": "notifications",
								"type": "list",
								"sortable": false,
								"dashboarded": true,
								"hidden": false,
								"sizing": false,
								"large": false,
								"menu": [],
								"icon": "globe",
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
							{
								"name": "statistics",
								"title": "quick stats",
								"type": "list",
								"sortable": false,
								"dashboarded": false,
								"hidden": false,
								"sizing": false,
								"large": false,
								"menu": [],
								"settings": [
									{"type": "post_count", "val": true},
									{"type": "total_likes", "val": true},
									{"type": "page_visits", "val": true},
									{"type": "unique_page_visits", "val": true},
									{"type": "total_checkins", "val": true},
									{"type": "latest_viral_score", "val": true},
									{"type": "highest_viral_score", "val": true}
								]
							},
							{
								"name": "posts",
								"title": "wall posts",
								"type": "graph",
								"sortable": true,
								"dashboarded": false,
								"hidden": false,
								"sizing": true,
								"large": true,
								"menu": { 
									custom: [
										{
											label: 'display column view', 
											icon: 'bar-chart',
											action: 'changeDisplay(column)', // 'dashboard', 'hide', 'help', 'resize', 'timeframe'
											current: null, // 'onDashboard', 'offDashboard', 'large', 'small', '30day', '60day'
											meta: null,
											divider: true
										}
									],
									timeframes: ['15 days', '30 days', '90 days']
								},
								"timeframe": "15 days",
								"settings": []
							}
						]
					}
				}
			)
		}
	}

}

module.exports = UserController;