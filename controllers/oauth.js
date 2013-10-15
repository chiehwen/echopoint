/**
 * Oauth Controller
 */

var Model = Model || Object,
		Auth = require('../server/auth').getInstance(),
		Helper = require('../server/helpers');

var OauthController = {

	facebook: {
		get: function(req, res) {		
			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);	

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
							if(err || !result.access_token) res.send('login-error 2: ' + req.query.error_description); //res.redirect('/social/facebook');

							facebook.authorize('get', "/oauth/access_token", {
								client_id: facebook.client.id,
								client_secret: facebook.client.secret,
								grant_type: 'fb_exchange_token',
								fb_exchange_token: result.access_token
							}, function (err, result) {
								if(err) res.send('login-error 3: ' + req.query.error_description); //req.session.messages.push(err);

								var credentials = {
									oauthAccessToken: result.access_token,
									expires: 128000,//result.expires, // Seems they removed the expired endpoint, I swear you can never rely facebook
									created: Helper.timestamp()
								}

								req.session.facebook = credentials;

								// Put access token into the database
								user.Business[req.session.Business.index].Social.facebook.auth = credentials;

								// This is now done after business selection in the social controller
								/*if(typeof user.Business[req.session.Business.index].Social.facebook.id === 'undefined') {
									facebook.get('me', {fields: 'id'}, function(err, response_id) {
										if(err) res.redirect('/social/facebook?login=true');
										user.Business[req.session.Business.index].Social.facebook.id = response_id.id
									})
								}*/

								user.save(function(err) {
									req.session.messages.push(err);
								});

								req.session.facebookConnected = true;
								res.redirect('/social/facebook');
								//res.send('login-error: ' + JSON.stringify(result));
							});			
						});
					}
			});
		}
 	},

	twitter: {
		get: function(req, res) {
			if(req.session.passport.user) {

				Helper.getUser(req.session.passport.user, function(err, user) {
					if (err) return next(err);

					twitter = Auth.load('twitter');
					
					twitter.oauth.getOAuthAccessToken(req.session.twitter.oauthRequestToken, req.session.twitter.oauthRequestTokenSecret, req.query.oauth_verifier, function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
						if (err) {
							res.send("Error getting OAuth access token : ["+oauthAccessToken+"]" + "["+oauthAccessTokenSecret+"]", 500);
						} else {

							twitter
								.setAccessTokens(oauthAccessToken, oauthAccessTokenSecret)
								.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, response) {
									if(err) {
										req.session.messages.push("Error connecting to Twitter!");
										req.session.messages.push(err);
										res.redirect('/social/twitter?error=true');
									} else {

										var credentials = {
											id: parseInt(response.id_str, 10),
											username: response.screen_name,
											oauthAccessToken: oauthAccessToken,
											oauthAccessTokenSecret: oauthAccessTokenSecret,
											created: Helper.timestamp()
										};
										req.session.twitter = credentials;

										// Put access tokens into the database
										user.Business[req.session.Business.index].Social.twitter.auth = credentials;
										user.Business[req.session.Business.index].Social.twitter.id = credentials.id;
										user.Business[req.session.Business.index].Social.twitter.username = credentials.username;
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
							code: req.query.code,
							v: foursquare.client.verified
						},
						function (err, response) {
							if(err) {
								req.session.messages.push(err);
								res.redirect('/social/foursquare');
							} else {

								var credentials = {
									oauthAccessToken: response.access_token,
									created: Helper.timestamp()
								};
								req.session.foursquare = credentials;

								// put access tokens into the database
								user.Business[req.session.Business.index].Social.foursquare.auth  = credentials;
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

	google: {
		get: function(req, res) {
			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) console.log(err);	

					if(req.session.googleState && req.session.googleState == req.query.state) {
			
						if(req.query.error) {
							// user might have disallowed the app
							res.send('login-error ' + req.query.error);
						} else if(!req.query.code) {
							res.redirect('/social/google');
						}

						google = Auth.load('google_discovery');

	/*					google.authorize('post', 'https://accounts.google.com/o/oauth2/token', {
							code: req.query.code,
							client_id: google.client.id,
							client_secret: google.client.consumerSecret,
							redirect_uri: google.client.redirect,
							grant_type: 'authorization_code'
						}, function(err, result) {
console.log(err);
console.log(result); */
						//})

						google.oauth.getToken(req.query.code, function(err, result) {
							if(err || !result.access_token) res.send('login-error 2: ' + req.query.error_description); //res.redirect('/social/google');

							var credentials = {
										oauthAccessToken: result.access_token,
										expires: result.expires_in,
										created: Helper.timestamp()
									},
									tokens = {access_token: result.access_token}

							if(result.refresh_token)
								credentials.oauthRefreshToken = tokens.refresh_token = result.refresh_token;

							req.session.google = credentials;

							if(result.id_token)
								credentials.idToken = result.id_token;

							google.oauth.setAccessTokens(tokens);
								
							google
								.discover('plus', 'v1')
								.execute(function(err, client) {
									client
										.plus.people.get({ userId: 'me' })
										.withAuthClient(google.oauth)
										.execute(function(err, data) {
											if(err) {
												console.log(err, data);
												res.redirect('/social/google/login');
												return;
											}

							// Put access token credentials into the database
							user.Business[req.session.Business.index].Social.google.auth = credentials;

							user.Business[req.session.Business.index].Social.google.user.id = data.id;
							user.Business[req.session.Business.index].Social.google.user.data = data;
							
							user.save(function(err) {
								req.session.messages.push(err);
							});

							//google.oauth.setAccessTokens(tokens);

							req.session.googleConnected = true;
							res.redirect('/social/google');
									
									})
							})
						})
					}
			});
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
							function (err, response) {
								if(err) {
									req.session.messages.push(err);
									res.redirect('/social/instagram');
								} else {

									var credentials = {
										oauthAccessToken: response.access_token,
										created: Helper.timestamp()
									};
									req.session.instagram = credentials;

									// put access tokens into the database
									user.Business[req.session.Business.index].Social.instagram.auth  = credentials;
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
			Helper.getUser(req.session.passport.user, function(err, user) {
 				if (err || !user) return next(err);

				if(req.session.bitlyState && req.session.bitlyState == req.query.state) {

					if(req.query.error) {
						// user might have disallowed the app
						res.send('login-error ' + req.query.error_description);
					} else if(!req.query.code) {
						res.redirect('/tools/bitly');
					}

					bitly = Auth.load('bitly');

					bitly.authorize('post', "https://api-ssl.bitly.com/oauth/access_token?", {
						client_id: bitly.client.id,
						client_secret: bitly.client.secret,
						redirect_uri: bitly.client.redirect,
						code: req.query.code,
						state: req.query.state
					}, function(err, result) {
						if(err) res.redirect('/tools/bitly');

						var credentials = {
							oauthAccessToken: result.access_token,
							login: result.login,
							created: Helper.timestamp()
						}

						req.session.bitly = credentials;

						// Put Access token into the database
						user.Business[req.session.Business.index].Tools.bitly.auth = credentials;
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
 	},
}

module.exports = OauthController;