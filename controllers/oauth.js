/**
 * Oauth Controller
 */

var Model = Model || Object,
		Auth = require('../server/auth').getInstance(),
		Log = require('../server/logger').getInstance().getLogger(),
		Helper = require('../server/helpers');

var OauthController = {

	facebook: {
		get: function(req, res, next) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Facebook')
					res.redirect(err ? '/logout' : '/login')
					return
				}

				if(req.query.error || !req.query.code || !req.session.facebookState || req.session.facebookState != req.query.state) {
					if(!req.session.facebookState || req.session.facebookState != req.query.state)
						var error = 'Facebook oauth state discrepancy'
					else // user might have disallowed the app
						var error = req.query.error ? 'Facebook oauth query error' : 'No query code returned'

					Log.error(error, {error: req.query.error, msg: req.query.error_description, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.facebookState, returned: req.query.state}, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting Vocada application to Facebook. You must allow Vocada to connect to your personal Facebook account')
					res.redirect('/social/facebook?error=true')
					return
				}

				facebook = Auth.load('facebook');

				facebook.authorize('get', "/oauth/access_token", {
					client_id: facebook.client.id,
					client_secret: facebook.client.secret,
					redirect_uri: facebook.client.redirect,
					code: req.query.code
				}, function(err, result) {

					if(err || result.error || !result.access_token) {
						Error.handler('facebook', err || result.error.message || 'No access token!', err, result, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber()})
						req.session.messages.push('Error authorizing user for Facebook')
						res.redirect('/social/facebook?error=true')
						return
					}

					facebook.authorize('get', "/oauth/access_token", {
						client_id: facebook.client.id,
						client_secret: facebook.client.secret,
						grant_type: 'fb_exchange_token',
						fb_exchange_token: result.access_token
					}, function (err, result) {
						if(err || result.error || !result.access_token) {
							Error.handler('facebook', err || result.error.message || 'Error Authorizing exchange (extended) Facebook token for user', err, result, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber()})
							req.session.messages.push('Error authorizing user for Facebook')
							res.redirect('/social/facebook?error=true')
							return
						}
// TODO: get true expiration of token 
// https://developers.facebook.com/docs/facebook-login/access-tokens/
						var timestamp = Helper.timestamp(),
								credentials = {
									oauthAccessToken: result.access_token,
									// 120000 = 2.7379 months
									expires: timestamp + 120000, //result.expires, Seems they removed the expired endpoint, I swear you can never rely facebook
									created: timestamp
								}

						req.session.facebook = credentials;

						// Put access token into the database
						user.Business[req.session.Business.index].Social.facebook.auth = credentials;
						user.save(function(err) {
							if(err) {
								Log.error('Error saving Facebook credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								req.session.messages.push('Error saving Facebook credentials to application')
								res.redirect('/social/facebook?error=true')
								return
							}
						});

						req.session.facebookConnected = true;
						res.redirect('/social/facebook');
					});			
				});
			});
		}
 	},

	twitter: {
		get: function(req, res, next) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Twitter')
					res.redirect(err ? '/logout' : '/login')
					return
				}

				if(req.query.denied || !req.query.oauth_verifier) {
					// user might have disallowed the app
					Log.error(req.query.denied ? 'Vocada app denied by User or Twitter' : 'No oauth verifier token returned', {error: req.query.error, denied: req.query.denied, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('You must allow Vocada to connect to your business Twitter account')
					res.redirect('/social/twitter?error=true')
					return
				}

				if(!req.query.oauth_token || req.query.oauth_token !== req.session.twitter.oauthRequestToken) {
					Log.error(!req.query.oauth_token ? 'No oauth request token was returned by Twitter' : 'Returned Twitter oauth request token does not match session request token', {error: req.query.error, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting Vocada application to Foursquare')
					res.redirect('/social/twitter?error=true')
					return
				}

				twitter = Auth.load('twitter');
				
				twitter.oauth.getOAuthAccessToken(req.session.twitter.oauthRequestToken, req.session.twitter.oauthRequestTokenSecret, req.query.oauth_verifier, function(err, oauthAccessToken, oauthAccessTokenSecret, results) {
					if (err) {
						Log.error('Error getting Twitter access token', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						req.session.messages.push('Error authorizing user for Twitter')
						res.redirect('/social/twitter?error=true');
						return
					}

					twitter
						.setAccessTokens(oauthAccessToken, oauthAccessTokenSecret)
						.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, response) {
							if (err) {
								Log.error('Error verifying user with Twitter', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								req.session.messages.push('Error connecting to Twitter!')
								res.redirect('/social/twitter?error=true');
								return
							}

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
								if(err) {
									Log.error('Error saving Twitter credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
									req.session.messages.push('Error saving Twitter credentials to application')
									res.redirect('/social/twitter?error=true');
									return
								}
							});

							req.session.twitterConnected = true;
							req.session.messages.push("Connected to Twitter.");
							res.redirect('/social/twitter');
					});

				});
			});

		}
	},

	foursquare: {
		get: function(req, res, next) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Foursquare')
					res.redirect(err ? '/logout' : '/login')
					return
				}

				if(req.query.error || !req.query.code) {
					// user might have disallowed the app
					Log.error(req.query.error ? 'Foursquare oauth query error' : 'No query code returned', {error: req.query.error, msg: req.query.error, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting Vocada application to Foursquare')
					res.redirect('/social/foursquare?error=true')
					return
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
							res.redirect('/social/foursquare?error=true');
						} else {

							var credentials = {
								oauthAccessToken: response.access_token,
								created: Helper.timestamp()
							};
							req.session.foursquare = credentials;

							// put access tokens into the database
							user.Business[req.session.Business.index].Social.foursquare.auth  = credentials;
							user.save(function(err) {
								if(err) {
									Log.error('Error saving Foursquare credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
									req.session.messages.push('Error saving Foursquare credentials to application')
									res.redirect('/social/foursquare?error=true');
									return
								}
							});

							req.session.foursquareConnected = true;
							res.redirect('/social/foursquare');
						}
				});
			});

		}
	},

	google: {
		get: function(req, res) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Google')
					res.redirect(err ? '/logout' : '/login')
					return
				}

				if(req.query.error || !req.query.code || !req.session.googleState || req.session.googleState != req.query.state) {
					if(!req.session.googleState || req.session.googleState != req.query.state)
						var error = 'Google oauth state discrepancy'
					else // user might have disallowed the app
						var error = req.query.error ? 'Google oauth query error' : 'No query code returned'

					Log.error(eror, {error: req.query.error, msg: req.query.error, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.googleState, returned: req.query.state}, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting Vocada application to Google')
					res.redirect('/social/google?error=true')
					return
				}

				google = Auth.load('google_discovery');


				google.oauth.getToken(req.query.code, function(err, result) {
					if(err || !result.access_token) res.send('login-error 2: ' + req.query.error_description); //res.redirect('/social/google');

					var tokens = {access_token: result.access_token},
							credentials = {
								oauthAccessToken: result.access_token,
								expires: result.expires_in,
								created: Helper.timestamp()
							}
							

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
								if(err) {
									Log.error('Error saving Google credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
									req.session.messages.push('Error saving Google credentials to application')
									res.redirect('/social/google?error=true');
									return
								}
							});

							req.session.googleConnected = true;
							res.redirect('/social/google');
											
						})
					})
				})

			});
		}
	},

	instagram: {
		get: function(req, res) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Instagram')
					res.redirect(err ? '/logout' : '/login')
					return
				}

				if(req.query.error || !req.query.code || !req.session.instagramState || req.session.instagramState != req.query.state) {
					if(!req.session.instagramState || req.session.instagramState != req.query.state)
						var error = 'Instagram oauth state discrepancy'
					else // user might have disallowed the app
						var error = req.query.error ? 'Google oauth query error' : 'No query code returned'

					Log.error(eror, {error: req.query.error, msg: req.query.error, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.instagramState, returned: req.query.state}, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting Vocada application to Instagram')
					res.redirect('/social/instagram?error=true')
					return
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
							res.redirect('/social/instagram?error=true');
						} 

						var credentials = {
							oauthAccessToken: response.access_token,
							created: Helper.timestamp()
						};
						req.session.instagram = credentials;

						// put access tokens into the database
						user.Business[req.session.Business.index].Social.instagram.auth  = credentials;
						user.save(function(err) {
							if(err) {
								Log.error('Error saving Instagram credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								req.session.messages.push('Error saving Instagram credentials to application')
								res.redirect('/social/instagram?error=true');
								return
							}
						});

						req.session.instagramConnected = true;
						res.redirect('/social/instagram');
					}
				);
			});
		}
	},

	bitly: {
		get: function(req, res, next) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Bitly')
					res.redirect(err ? '/logout' : '/login')
					return
				}

				if(req.query.error || !req.query.code || !req.session.bitlyState || req.session.bitlyState != req.query.state) {
					if(!req.session.bitlyState || req.session.bitlyState != req.query.state)
						var error = 'Bitly oauth state discrepancy'
					else // user might have disallowed the app
						var error = req.query.error ? 'Bitly oauth query error' : 'No query code returned'

					Log.error(eror, {error: req.query.error, msg: req.query.error, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.bitlyState, returned: req.query.state}, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting Vocada application to Bitly')
					res.redirect('/social/bitly?error=true')
					return
				}

				bitly = Auth.load('bitly');

				bitly.authorize('post', 'https://api-ssl.bitly.com/oauth/access_token?', {
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
						if(err) {
							Log.error('Error saving Bitly credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
							req.session.messages.push('Error saving Bitly credentials to application')
							res.redirect('/social/bitly?error=true');
							return
						}
					});

					req.session.bitlyConnected = true;
					res.redirect('/tools/bitly');	
				});
			});
		}
	},
}

module.exports = OauthController;