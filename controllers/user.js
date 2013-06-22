/**
 * User Controller
 */

// Module dependencies
var Interface = require('../server/libraries/class'),
    Auth = require('../server/auth'),
    Route = require('../routes/user'),
    UserModel = require('../models/user');

// Export Controller as an object of class based actions
module.exports = UserController = {
	_meta: {
		name: 'user',
		engine: 'jade',
		_before: function() {

		},
		_after: function() {

		},
	},

	login: Interface.Class.extend({
		init: function() {
			this.method = 'mutliple';
			this.path = '/login';
			this.restricted = false;
		},
		get: Route.user.login.get,
		post: Route.user.login.post
	}),
	logout: Interface.Class.extend({
		init: function() {
			this.method = 'get';
			this.path = '/logout';
			this.restricted = false;
		},
		get: Route.user.logout.get
	}),
	create: Interface.Class.extend({
		init: function() {
			this.method = 'mutliple';
			this.path = '/user/create';
			this.restricted = false;
		},
		get: Route.user.create.get,
		post: function(req, res) {
			User = new UserModel({
				email: req.body.email,
				password: req.body.password
			});

			User.save(function(err){
				if (err) throw err;
				res.redirect('/login');
			});
		}
	}),
	dashboard: Interface.Class.extend({
		init: function() {
			this.method = 'get';
			this.path = '/dashboard';
		},
		get: function(req, res) {
			res.send('Dashboard will go here <a href="/logout">logout</a>');
		}
	}),
	wizard: Interface.Class.extend({
		// May need to move to business controller
		init: function() {
			this.method = 'get';
			this.path = '/wizard';
		},
		get: function(req, res) {

		}
	}),
	profile: Interface.Class.extend({
		init: function() {
			this.method = 'get';
			this.path = '/profile';
		},
		get: function(req, res) {
			res.send('Profile will go here <a href="/logout">logout</a>');
		}
	}),
	update: Interface.Class.extend({
		init: function() {
			this.method = 'put';
			this.path = '/user/update';
		},
		put: function(req, res) {

		}
	}),
	delete: Interface.Class.extend({
		init: function() {
			this.method = 'multiple';
			this.path = '/user/delete';
		},
		get: function(req, res) {

		},
		delete: function(req, res) {

		}
	}),

};