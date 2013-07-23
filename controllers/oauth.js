/**
 * Oauth Controller
 */

var Model = Model || Object,
	Auth = require('../server/auth').getInstance();

var OauthController = {

	facebook: {
		get: function(req, res) {
			if(req.session.passport.user) {
				var id = req.session.passport.user;

				Model.User.findById(id, function(err, user) {
					if (err) return next(err);

					if(req.session.facebookState && req.session.facebookState == req.query.state) {
						
						//var code = req.query.code;
						if(req.query.error) {
							// user might have disallowed the app
							res.send('login-error ' + req.query.error_description);
						} else if(!req.query.code) {
							res.redirect('/social/facebook');
						}

						facebook = Auth.load('facebook');

						facebook.authorize('get', "/oauth/access_token", {
							client_id: facebook.client.facebook.id,
							client_secret: facebook.client.facebook.secret,
							redirect_uri: facebook.client.facebook.redirect,
							code: req.query.code
						}, function(err, result) {
							if(err) res.redirect('/social/facebook');

							facebook.authorize('get', "/oauth/access_token", {
								client_id: facebook.client.facebook.id,
								client_secret: facebook.client.facebook.secret,
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
 	foursquare: {
		get: function(req, res) {
			if(req.session.passport.user) {
				var id = req.session.passport.user;

				Model.User.findById(id, function(err, user) {
					if (err) return next(err);

					if(req.query.error) {
						// user might have disallowed the app
						res.send('login-error ' + req.query.error_description);
					} else if(!req.query.code) {
						res.redirect('/social/foursquare');
					}

					foursquare = Auth.load('foursquare');
					
					foursquare.getAccessToken(
						{code: req.query.code},
						function (err, oauthAccessToken) {
							if(err) {
								res.send('An error was thrown: ' + err.message);
							} else {
								var timestamp = Math.round(new Date().getTime()/ 1000);
									
								var credentials = {
									oauthAccessToken: oauthAccessToken,
									created: timestamp
								};
								req.session.foursquare = credentials;

								// Put Access tokens into the database
								user.Social.foursquare = credentials;
								user.save(function(err) {
									req.session.messages.push(err);
								});

								req.session.foursquareConnected = true;
								req.session.messages.push("Connected to Foursquare.");
								res.redirect('/social/foursquare');
							}
					});
				});
			}
		}
 	},

 	bitly: {
		get: function(req, res) {
			if(req.session.passport.user) {
				var id = req.session.passport.user;

				Model.User.findById(id, function(err, user) {
					if (err) return next(err);

					if(req.session.bitlyState && req.session.bitlyState == req.query.state) {

						if(req.query.error) {
							// user might have disallowed the app
							res.send('login-error ' + req.query.error_description);
						} else if(!req.query.code) {
							res.redirect('/tools/bitly');
						}

						bitly = Auth.load('bitly');
req.session.messages.push(bitly);
						bitly.authorize('post', "https://api-ssl.bitly.com/oauth/access_token?", {
							client_id: bitly.client.bitly.id,
							client_secret: bitly.client.bitly.secret,
							redirect_uri: bitly.client.bitly.redirect,
							code: req.query.code,
							state: req.query.state
						}, function(err, result) {
							if(err) res.redirect('/tools/bitly');
req.session.messages.push(result);
							//var date = new Date(),
							var timestamp = Math.round(new Date().getTime()/ 1000);

							var credentials = {
								oauthAccessToken: result.access_token,
								username: result.login,
								//expires: result.expires,
								created: timestamp
							}

							req.session.bitly = credentials;

							// Put Access token into the database
							user.Tools.bitly = credentials;
							user.save(function(err) {
								req.session.messages.push(err);
							});

							req.session.bitlyConnected = true;
							req.session.messages.push(result);
							res.redirect('/tools/bitly');
							
							
						});
					}
				});
			}
		}
 	},
}

module.exports = OauthController;