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

		//if(typeof req.session.facebook == 'undefined')
			//req.session.facebook = {};
		if(typeof req.session.twitter == 'undefined')
			req.session.twitter = {};

		if(req.session.passport.user) {
			var id = req.session.passport.user;

 			Model.User.findById(id, function(err, user) {
 				if (err) return next(err);

				// check twitter
				if(typeof req.session.twitterConnected == 'undefined' || !req.session.twitterConnected) {
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
								user.Social.twitter = {};
								user.save(function(err) {
									req.session.messages.push(err);
								});

								req.session.twitterConnected = false;

							} else {
								req.session.messages.push("Connected to Twitter.");
								
								req.session.twitter = {
									oauthAccessToken: oauthAccessToken,
			      					oauthAccessTokenSecret: oauthAccessTokenSecret
			      				}

			      				req.session.twitterConnected = true;
							}
						});
					}
				} // end twitter check


/*				
				// check facebook
				if(!req.session.facebookConnected) {
					// at anytime you may set req.session.facebookConnected = false to reload facebook
req.session.messages.push('and do we get into here ever');
					if(
						typeof user.Social.facebook.oauthAccessToken !== 'undefined'
						&& typeof user.Social.facebook.expires !== 'undefined'
						&& typeof user.Social.facebook.created !== 'undefined'
						&& user.Social.facebook.oauthAccessToken != ''
						&& user.Social.facebook.expires != '' && user.Social.facebook.expires != 0
						&& user.Social.facebook.created != '' && user.Social.facebook.created != 0
						&& user.Social.facebook.oauthAccessToken
						&& user.Social.facebook.expires
						&& user.Social.facebook.created
						&& ((user.Social.facebook.created + user.Social.facebook.expires) * 1000 > Date.now())
					) {
						var oauthAccessToken = user.Social.facebook.oauthAccessToken;
req.session.messages.push(oauthAccessToken);	
facebook = Auth.load('facebook');
facebook.authorize({
client_id: facebook.app.id,
client_secret: facebook.app.secret,
grant_type: 'fb_exchange_token',
fb_exchange_token: oauthAccessToken
}, function (err, response) {
req.session.messages.push(err);
req.session.messages.push(response);
})

						Auth.checkFacebook(facebook, function(err, response) {
req.session.messages.push('are we in FB town?');
req.session.messages.push(err);
req.session.messages.push(response);	
						    if(err) {
						      	req.session.messages.push("Error connecting to Facebook!");
req.session.messages.push('are we in err town?');
req.session.messages.push(err);				      		
						      	// lets remove the invalid tokens
								Model.User.update(
									{_id: id},
									{$set: {
										Social: {
											facebook: {
												oauthAccessToken: '',
												expires: 0,
												createdTimestamp: 0
											}
										} 
									}},
									function(err){
										if (err) return next(err);
										req.session.messages.push("Removed invalid/expired Facebook credentials");
									}
								);

								req.session.facebookConnected = false;
								//req.session.socialSessionsLoaded = true;

							} else {
								req.session.messages.push("Connected to Facebook.");
req.session.messages.push(response);								

			      				if(typeof req.session.facebook == 'undefined')
			      					req.session.facebook = {oauthAccessToken: oauthAccessToken};
			      				else
									req.session.facebook.oauthAccessToken = oauthAccessToken;
								
			      				req.session.facebookConnected = true;
			      				//req.session.socialSessionsLoaded = true;	
							}
						});

//Facebook.setAccessToken('CAATiMh6T640BACGIYRbC4MQrZBo5bZAVPpkLEjqKX4ZAZCtPHfXiNbZBpZAmCSeRneRy2dyTW1wSCM5cqnn7WumoHO3zUynkZAZCKVQskQNwyqhzhZClkxXuqifS2vrlkUa47ZAkYZAgKEnjQjZBNNRfJKwG');
facebook.get('me', function(err, response){
		req.session.messages.push(err);
	req.session.messages.push(response);
});
req.session.messages.push(facebook);
					}
					//next();
				} // end facebook check
*/
				next();
			});	
		} else {
			next();
		}
	} 
};

module.exports.Middleware = Middleware;