/**
 * Oauth Controller
 */

var Model = Model || Object,
	Auth = require('../server/auth').getInstance();
	//Facebook = require('fb'),
	//Twit = require('twit');

var OauthController = {

	/*load: {
		get: function(req, res) {
			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);

 					var redirect = req.session.returnTo;
 					req.session.socialSessionsLoaded = false;

					// check twitter
					req.session.twitterConnected = false;
					if(
						typeof user.Social.twitter.oauthRequestToken !== 'undefined'
						&& typeof user.Social.twitter.oauthRequestTokenSecret !== 'undefined'
						&& user.Social.twitter.oauthRequestToken != ''
						&& user.Social.twitter.oauthRequestTokenSecret != ''
						&& user.Social.twitter.oauthRequestToken
						&& user.Social.twitter.oauthRequestTokenSecret
					) {
						var oauthAccessToken = user.Social.twitter.oauthRequestToken,
							oauthAccessTokenSecret = user.Social.twitter.oauthRequestTokenSecret;

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
										req.session.messages.push("Hooray! New business has been created!");
										//res.redirect('/dashboard');										
									}
								);
								req.session.socialSessionsLoaded = true;
								res.redirect(redirect);

					      	} else {
					      		/*Twitter.get('search/tweets', 
					      			{ q: 'banana since:2011-11-11', count: 10 }, 
					      			function(err, reply) {
										res.send(JSON.stringify(reply))
									}
								);*
					      		req.session.messages.push("Connected to Twitter.");
					      		req.session.twitterConnected = true;
								req.session.oauthAccessToken = oauthAccessToken;
		      					req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
		      					req.session.socialSessionsLoaded = true;
		      					res.redirect(redirect);
					      	}
					    });

					}
					// end twitter check
				})
			}
		} 
	},*/

	facebook: {
		get: function(req, res) {
			if(req.session.passport.user) {
				var id = req.session.passport.user;

				Model.User.findById(id, function(err, user) {
					if (err) return next(err);

					if(req.session.facebookState && req.session.facebookState == req.query.state) {
						
						var code = req.query.code;

						if(req.query.error) {
							// user might have disallowed the app
							res.send('login-error ' + req.query.error_description);
						} else if(!code) {
							res.redirect('/social/facebook');
						}

						facebook = Auth.load('facebook');

						facebook.authorize({
							client_id: facebook.app.id,
							client_secret: facebook.app.secret,
							redirect_uri: facebook.app.redirect,
							code: code
						}, function(err, result) {
							if(err) res.redirect('/social/facebook');

							facebook.authorize({
								client_id: facebook.app.id,
								client_secret: facebook.app.secret,
								grant_type: 'fb_exchange_token',
								fb_exchange_token: result.access_token
							}, function (err, result) {
								if(err) req.session.messages.push(err);

								//var date = new Date(),
								var timestamp = Math.round(new Date().getTime()/ 1000);

								var credentials = {
									oauthAccessToken: result.access_token,
									expires: result.expires,
									created: timestamp
								}

								req.session.facebook = credentials;

								// Put Access token into the database
								user.Social.facebook = credentials;
								user.save(function(err) {
									req.session.messages.push(err);
								});

								req.session.facebookConnected = true;
								req.session.messages.push(result);
								res.redirect('/social/facebook');
							});
							
						});
					}

				});
			
			}
		}
 	},

	twitter: {
		get: function(req, res) {
			if(req.session.passport.user) {
				var id = req.session.passport.user;

				Model.User.findById(id, function(err, user) {
					if (err) return next(err);

					twitter = Auth.load('twitter');
					
					twitter.getOAuthAccessToken(req.session.twitter.oauthRequestToken, req.session.twitter.oauthRequestTokenSecret, req.query.oauth_verifier, function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
						if (err) {
							res.send("Error getting OAuth access token : ["+oauthAccessToken+"]" + "["+oauthAccessTokenSecret+"]", 500);
						} else {
							
							Auth.initTwit(oauthAccessToken, oauthAccessTokenSecret, function(err, Twitter) {
								if(err) {
									req.session.messages.push("Error connecting to Twitter!");
									req.session.messages.push(err);
									res.redirect('/social/twitter');
								} else {

									var timestamp = Math.round(new Date().getTime()/ 1000);
									
									var credentials = {
										oauthAccessToken: oauthAccessToken,
										oauthAccessTokenSecret: oauthAccessTokenSecret,
										created: timestamp
									};
									req.session.twitter = credentials;

									// Put Access tokens into the database
									user.Social.twitter = credentials;
									user.save(function(err) {
										req.session.messages.push(err);
									});

									req.session.twitterConnected = true;
									req.session.messages.push("Connected to Twitter.");
									res.redirect('/social/twitter');
								}
		      				});
		    			}
					});
				});
			
			}
		}
 	},

}

module.exports = OauthController;