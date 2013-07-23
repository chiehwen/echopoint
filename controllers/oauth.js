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
							client_id: facebook.client.id,
							client_secret: facebook.client.secret,
							redirect_uri: facebook.client.redirect,
							code: req.query.code
						}, function(err, result) {
							if(err) res.redirect('/social/facebook');

							facebook.authorize('get', "/oauth/access_token", {
								client_id: facebook.client.id,
								client_secret: facebook.client.secret,
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
			
					foursquare.authorize('get', 'https://foursquare.com/oauth2/access_token',
						{
							client_id: foursquare.client.id,
							client_secret: foursquare.client.secret,
							redirect_uri: foursquare.client.redirect,
							grant_type: 'authorization_code',
							code: req.query.code
						},
						function (err, result) {
							if(err) {
								req.session.messages.push(err);
								//res.send('An error was thrown: ' + err);
								res.redirect('/social/foursquare');
							} else {
								var timestamp = Math.round(new Date().getTime()/ 1000);
									
								var credentials = {
									oauthAccessToken: result.access_token,
									created: timestamp
								};
								req.session.foursquare = credentials;

								// Put Access tokens into the database
								user.Social.foursquare = credentials;
								user.save(function(err) {
									req.session.messages.push(err);
								});

								req.session.foursquareConnected = true;
								res.redirect('/social/foursquare');
							}
					});
				});
			}
		}
 	},

 	instagram: {
		get: function(req, res) {
			if(req.session.passport.user) {
				var id = req.session.passport.user;

				Model.User.findById(id, function(err, user) {
					if (err) return next(err);

					if(req.session.instagramState && req.session.instagramState == req.query.state) {

						if(req.query.error) {
							// user might have disallowed the app
							res.send('login-error ' + req.query.error_description);
						} else if(!req.query.code) {
							res.redirect('/social/instagram');
						}

						instagram = Auth.load('instagram');
				
						instagram.authorize('post', 'https://api.instagram.com/oauth/access_token?',
							{
								client_id: instagram.client.id,
								client_secret: instagram.client.secret,
								redirect_uri: instagram.client.redirect,
								grant_type: 'authorization_code',
								code: req.query.code
							},
							function (err, result) {
								if(err) {
									req.session.messages.push(err);
									//res.send('An error was thrown: ' + err);
									res.redirect('/social/instagram');
								} else {
									var timestamp = Math.round(new Date().getTime()/ 1000);
										
									var credentials = {
										oauthAccessToken: result.access_token,
										created: timestamp
									};
									req.session.instagram = credentials;

									// Put Access tokens into the database
									user.Social.instagram = credentials;
									user.save(function(err) {
										req.session.messages.push(err);
									});

									req.session.instagramConnected = true;
									res.redirect('/social/instagram');
								}
						});
					}
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
							client_id: bitly.client.id,
							client_secret: bitly.client.secret,
							redirect_uri: bitly.client.redirect,
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