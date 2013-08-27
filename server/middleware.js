var Auth = require('../server/auth').getInstance(),
		Helper = require('./helpers'),
		Model = Model || Object;

var Middleware = {
	sessionMessages: function(req, res, next){
		var msgs = req.session.messages || [];
		// expose "messages" local variable
		res.locals.messages = msgs;
		// expose "hasMessages"
		res.locals.hasMessages = msgs.length;
		next();
		// if the session was destroyed this variable won't exist
		if(typeof req.session != 'undefined')
			// "flush" the messages so they don't build up
			req.session.messages = [];
	},

	uidSessionVariable: function(req, res, next) {
		if(req.session.passport.user) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 				if(err) console.log(err);
 				res.locals.uid = user.uid;
 				next();
 			});
 		} else {
	 		next();
	 	}

	},

	loadBusiness: function(req, res, next) {
		if(req.session.passport.user && typeof req.session.Business === 'undefined' && !Helper.isPath(req.url, ['/login', '/logout', '/business/select', '/business/create', '/user/create'], [])) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 				if (err || !user) return next(err);
 				if(user.meta.Business.current && user.meta.Business.current.id != '' && user.meta.Business.current.id ) {
 					req.session.Business = user.meta.Business.current;
 					next();
 				} else {
 					res.redirect('/business/select');
 				}
 			}); 
 		} else {
 			next();
 		}
	},

	analyticNotifications: function(req, res, next) {

	}
};

module.exports.Middleware = Middleware;