/**
 * User Routing
 */

// Module dependencies
passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;

exports.user = {
	login: {
		get: function(req, res){
		  res.render('user/login', {
		  	title: 'Vocada | Login',
		  	message: req.session.messages
		  });
		},
		post: passport.authenticate('local', 
			{ 
				successRedirect: '/dashboard',
				failureRedirect: '/login',
				failureMessage: true 
			}
		)
	},
	logout: {
		get: function(req, res) {
			req.session.destroy(function(){
			  res.redirect('/login');
			});
		},
		post: null
	},
	create: {
		get: function(req, res){
		  res.render('user/create', {
		  	title: 'Vocada | Create User'
		  });
		},
		post: null
	},
	list: {
		get: function(req, res){
			res.send("respond with a resource");
		}
	}
}
