var Auth = require('../server/auth').getInstance(),
		Log = require('./logger').getInstance().getLogger(),
		Utils = require('./utilities'),
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

	sessionVariables: function(req, res, next) {
		if(req.session.passport.user)
 			Utils.getUser(req.session.passport.user, function(err, user) {
 				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					req.session.messages.push('Error finding user')
					res.redirect('/logout')
					return next(err);
				}

 				res.locals.username = user.name;
 				res.locals.uid = user.id;
 				res.locals.email = user.email;
 				if(req.session.Business) {
 					res.locals.bid = user.Business[req.session.Business.index].id;
 					res.locals.business = user.Business[req.session.Business.index].name;
 				}
 				next();
 			});
 		else
	 		next();
	},

	loadBusiness: function(req, res, next) {
		if(req.session.passport.user && !req.session.Business && !Utils.isPath(req.url, ['/login', '/logout', '/business/select', '/business/create', '/user/create'], []))
 			Utils.getUser(req.session.passport.user, function(err, user) {
 				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					req.session.messages.push('Error finding user')
					res.redirect('/logout')
					return next(err);
				}
 				if(user.meta.Business.current && user.meta.Business.current.id != '' && user.meta.Business.current.id ) {
 					req.session.Business = user.meta.Business.current;
 					next();
 				} else {
 					res.redirect('/business/select');
 				}
 			}); 
 		else
 			next();
	},

	analyticNotifications: function(req, res, next) {

	}
};

module.exports.Middleware = Middleware;