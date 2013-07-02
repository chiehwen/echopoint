/**
 * User Controller
 */

// module dependencies
var Model = Model || Object,
    passport = require('passport');

// export controller as an object literal
var UserController = function constructor() {
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

			logout: (function() { return {

				path: '/logout',
				restricted: false,

				get: function(req, res) {
					req.session.destroy(function(){
					  res.redirect('/login');
					});
				}
			}})(),

			create: (function() { return {

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
								  res.redirect('/dashboard');
								});
							});
						} else {
							req.session.messages.push("This email is already registered");
							res.redirect('/user/create');
						}
					});		
				}
			}})(),

			list: (function() { return {
				get: function(req, res) {
					res.send("respond with a resource")
				}
			}})(),

			dashboard: (function() { return {

				path: '/dashboard',
				get: function(req, res) {
					res.render(
						'user/dashboard', 
						{
					  	title: 'Vocada | User Dashboard'
					 	}
					)
				}
			}})(),

			wizard: (function() { return {
				// may need to move to business controller
				path: '/wizard',
				get: function(req, res) {

				}
			}})(),

			profile: (function() { return {

				path: '/profile',
				get: function(req, res) {
					res.render(
						'user/profile', 
						{
					  	title: 'Vocada | User Profile'
					 	}
					)
				}
			}})(),

			update: (function() { return {
				put: function(req, res) {

				}
			}})(),

			delete: (function() { return {
				get: function(req, res) {
						res.send(req.session.passport.user);
				},
				delete: function(req, res) {
					if(req.session.passport.user) {
						var id = req.session.passport.user;
						Model.User.remove({ _id: id }, function (err) {
						  if (err) throw err;
						  req.session.destroy(function(){
							  res.redirect('/user/create');
							});
						});
					}
				}
			}})()

		} // end return object 
	} // end constructor


module.exports = UserController;