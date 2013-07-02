var Middleware = {
	sessionMessages: function(req, res, next){
		var msgs = req.session.messages || [];
	  // expose "messages" local variable
	  res.locals.messages = msgs;
	  // expose "hasMessages"
	  res.locals.hasMessages = msgs.length;
		next();
		// if the session was destroyed this variable won't exist
		if(typeof req.session != 'undefined') {
			// "flush" the messages so they don't build up
	  	req.session.messages = [];
		}
	}
};

module.exports.Middleware = Middleware;