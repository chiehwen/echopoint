var Auth = require('../server/auth').getInstance(),
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
	loadSocialSessions: function(req, res, next) {
		if(!req.session.socialSessionsLoaded && req.session.passport.user) {
			var id = req.session.passport.user;

 			Model.User.findById(id, function(err, user) {
 				if (err) return next(err);

				// check twitter
				if(!req.session.twitterConnected) {
					// at anytime you may set req.session.twitterConnected = false to reload twitter
					if(
						typeof user.Social.twitter.oauthAccessToken !== 'undefined'
						&& typeof user.Social.twitter.oauthAccessTokenSecret !== 'undefined'
						&& user.Social.twitter.oauthAccessToken != ''
						&& user.Social.twitter.oauthAccessTokenSecret != ''
						&& user.Social.twitter.oauthAccessToken
						&& user.Social.twitter.oauthAccessTokenSecret
					) {
						var oauthAccessToken = user.Social.twitter.oauthAccessToken,
							oauthAccessTokenSecret = user.Social.twitter.oauthAccessTokenSecret;

						Auth.initTwit(oauthAccessToken, oauthAccessTokenSecret, function(err, Twitter) {
						    if(err) {
						      	req.session.messages.push("Error connecting to Twitter!");
						      		
						      	// lets remove the invalid tokens
								Model.User.update(
									{_id: id},
									{$set: {
										Social: {
											twitter: {
												oauthAccessToken: '',
												oauthAccessTokenSecret: ''
											}
										} 
									}},
									function(err){
										if (err) return next(err);
										req.session.messages.push("Removed invalid Twitter credentials");
									}
								);

								req.session.twitterConnected = false;
								req.session.socialSessionsLoaded = true;

							} else {
								req.session.messages.push("Connected to Twitter.");
								
								req.session.twitter = {
									oauthAccessToken: oauthAccessToken,
			      					oauthAccessTokenSecret: oauthAccessTokenSecret
			      				}

			      				req.session.twitterConnected = true;
			      				req.session.socialSessionsLoaded = true;	
							}
							//next();
						});
					}
					//next();
				} // end twitter check

				//if(!req.session.facebookConnected) {

				//}

				next();
			});	
		} else {
			next();
		}
	} 
};

module.exports.Middleware = Middleware;