/**
 * Oauth Controller
 */

var Model = Model || Object,
		Auth = require('../server/auth').getInstance(),
		Log = require('../server/logger').getInstance().getLogger(),
		Error = require('../server/error').getInstance(),
		Utils = require('../server/utilities');

var OauthController = {

	facebook: {
		get: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			// get user from database 
			Utils.getUser(req.session.passport.user, function(err, user) {
				// default error handler for database query error
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting to Facebook')
					return res.redirect(err ? '/logout' : '/login')
					
				}

				// check if code return state param matches the user state in session variable 
				if(!req.session.facebookState || req.session.facebookState != req.query.state) {
					Log.error(!req.session.facebookState ? 'Missing facebook oauth state in session' : 'Facebook oauth state discrepancy', {error: 'Facebook oauth state discrepancy or missing state in session', user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.facebookState, returned: req.query.state}, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting Vocada application to Facebook.')
					return res.redirect('/social/facebook?error=true')
				}

				// check if facebook returned an error (perhaps user disallowed app?) or is missing the needed authorize code
				if(req.query.error || !req.query.code) {
					Error.handler('facebook', req.query.error ? 'Facebook oauth query error' : 'No query code returned', req.query.error_description, req.query, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: req.query.error ? 'error' : 'warn'})
					req.session.messages.push('Error connecting Vocada application to Facebook. You must allow Vocada to connect to your personal Facebook account')
					return res.redirect('/social/facebook?error=true')
				}

				// load facebook
				facebook = Auth.load('facebook');

				// exchange our returned oauth code for a facebook access token
				facebook.authorize('get', "/oauth/access_token", {
					client_id: facebook.client.id,
					client_secret: facebook.client.secret,
					redirect_uri: facebook.client.redirect,
					code: req.query.code
				}, function(err, result) {

					// log and redirect if error occured or token is missing
					if(err || result.error || !result.access_token) {
						Error.handler('facebook', err || result.error || 'No access token!', err, result, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						req.session.messages.push('Error authorizing user for Facebook')
						return res.redirect('/social/facebook?error=true')
					}

					// exchange our basic access token for a long-lived access token
					facebook.authorize('get', "/oauth/access_token", {
						client_id: facebook.client.id,
						client_secret: facebook.client.secret,
						grant_type: 'fb_exchange_token',
						fb_exchange_token: result.access_token
					}, function (err, result) {

						// log and redirect if error occured or token is missing
						if(err || result.error || !result.access_token) {
							Error.handler('facebook', err || result.error || 'Error Authorizing exchange (extended) Facebook token for user', err, result, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							req.session.messages.push('Error authorizing user for Facebook')
							return res.redirect('/social/facebook?error=true')
						}
// TODO: get true expiration of token 
// https://developers.facebook.com/docs/facebook-login/access-tokens/
						// create session and database params from our newly received facebook token
						var timestamp = Utils.timestamp(),
								credentials = {
									oauthAccessToken: result.access_token,
									// 120000 = 2.7379 months
									expires: timestamp + 120000, //result.expires, Seems they removed the expired endpoint, I swear you can never rely facebook
									created: timestamp
								}

						// create session variables for connected facebook user
						req.session.facebook = credentials;

						// Put access token into the database
						user.Business[req.session.Business.index].Social.facebook.auth = credentials;
						user.save(function(err) {
							if(err) {
								// default error handler for database save error
								Log.error('Error saving Facebook credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								req.session.messages.push('Error saving Facebook credentials to application')
								return res.redirect('/social/facebook?error=true')
							}
						});

						// redirect back to facebook page
						res.redirect('/social/facebook');
					})	
				})
			})
		}
 	},

	twitter: {
		get: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting to Twitter')
					return res.redirect(err ? '/logout' : '/login')
				}

				if(req.query.denied || !req.query.oauth_verifier) {
					// user might have disallowed the app
					Error.handler('twitter', req.query.denied ? 'Vocada app denied by User or Twitter' : 'No oauth verifier token returned', req.query.error, req.query, {params_returned: req.query, denied: req.query.denied, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber()})
					req.session.messages.push('You must allow Vocada to connect to your business Twitter account')
					return res.redirect('/social/twitter?error=true')
				}

				if(!req.query.oauth_token || req.query.oauth_token !== req.session.twitter.oauthRequestToken) {
					Error.handler('twitter', !req.query.oauth_token ? 'No oauth request token was returned by Twitter' : 'Returned Twitter oauth request token does not match session request token', req.query.error, req.query, { returned_token: req.query.oauth_token, session_oauth_token: req.session.twitter.oauthRequestToken, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber()})
					req.session.messages.push('Error connecting Vocada application to Foursquare')
					return res.redirect('/social/twitter?error=true')
				}

				twitter = Auth.load('twitter');
				
				twitter.oauth.getOAuthAccessToken(req.session.twitter.oauthRequestToken, req.session.twitter.oauthRequestTokenSecret, req.query.oauth_verifier, function(err, oauthAccessToken, oauthAccessTokenSecret, verified) {
					if (err || verified.errors || !oauthAccessToken || !oauthAccessTokenSecret) {
						Error.handler('twitter', err ? err : 'Twitter oauth tokens not returned', err, verified, {access_token: oauthAccessToken, token_secret: oauthAccessTokenSecret, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						req.session.messages.push('Error authorizing user for Twitter')
						return res.redirect('/social/twitter?error=true');
					}

					twitter
						.setAccessTokens(oauthAccessToken, oauthAccessTokenSecret)
						.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, response) {
							if (err || response.errors) {
								Error.handler('twitter', 'Error verifying user with Twitter', err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								req.session.messages.push('Error connecting to Twitter!')
								return res.redirect('/social/twitter?error=true');
							}

							var credentials = {
								id: response.id_str,
								username: response.screen_name,
								oauthAccessToken: oauthAccessToken,
								oauthAccessTokenSecret: oauthAccessTokenSecret,
								created: Utils.timestamp()
							};
							req.session.twitter = credentials;

							// Put access tokens into the database
							user.Business[req.session.Business.index].Social.twitter.auth = credentials;
							user.Business[req.session.Business.index].Social.twitter.id = credentials.id;
							user.Business[req.session.Business.index].Social.twitter.username = credentials.username;
							user.save(function(err) {
								if(err) {
									Log.error('Error saving Twitter credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									req.session.messages.push('Error saving Twitter credentials to application')
									return res.redirect('/social/twitter?error=true');
								}
							});

							// redirect back to twitter page
							res.redirect('/social/twitter');
					});

				});
			});

		}
	},

	foursquare: {
		get: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting to Foursquare')
					return res.redirect(err ? '/logout' : '/login')
				}

				if(req.query.error || !req.query.code) {
					// user might have disallowed the app
					Error.handler('foursquare', req.query.error ? 'Facebook oauth query error' : 'No query code returned', req.query.error_description, req.query, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: req.query.error ? 'error' : 'warn'})
					req.session.messages.push('Error connecting Vocada application to Foursquare')
					return res.redirect('/social/foursquare?error=true')
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
						// log and redirect if error occured or token is missing
						if(err || !response.access_token) {
							Error.handler('foursquare', err || 'Error getting foursquare access code for user', err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber()})
							req.session.messages.push('Error authorizing user for Foursquare')
							return res.redirect('/social/foursquare?error=true')
						}

						var credentials = {
							oauthAccessToken: response.access_token,
							created: Utils.timestamp()
						};
						req.session.foursquare = credentials;

						// put access tokens into the database
						user.Business[req.session.Business.index].Social.foursquare.auth  = credentials;
						user.save(function(err) {
							if(err) {
								Log.error('Error saving Foursquare credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								req.session.messages.push('Error saving Foursquare credentials to application')
								return res.redirect('/social/foursquare?error=true');
							}
						});

						// redirect back to foursquare page
						res.redirect('/social/foursquare');
				})
			})
		}
	},

	google: {
		get: function(req, res) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting to Google')
					return res.redirect(err ? '/logout' : '/login')
				}

				var network = req.session.googleChildNetwork || 'plus';

				// check if code return state param matches the user state in session variable 
				if(!req.session.googleState || req.session.googleState != req.query.state) {
					Log.error(!req.session.googleState ? 'Missing google oauth state in session' : 'Google oauth state discrepancy', {error: 'Google oauth state discrepancy or missing state in session', user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.googleState, returned: req.query.state}, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting Vocada application to Google.')
					return res.redirect('/social/google/'+network+'?error=true')
				}

				// check if google returned an error (perhaps user disallowed app?) or is missing the needed authorize code
				if(req.query.error || !req.query.code) {
					Error.handler('google', req.query.error ? 'Google oauth query error' : 'No query code returned', req.query.error_description, req.query, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: req.query.error ? 'error' : 'warn'})
					req.session.messages.push('Error connecting Vocada application to Google. You must allow Vocada to connect to your personal Google account')
					return res.redirect('/social/google/'+network+'?error=true')
				}

				google = Auth.load('google_discovery');


				google.oauth.getToken(req.query.code, function(err, result) {
					if(err || result.error || !result.access_token) {
						Error.handler('google', err || result.error || 'No access token!', err, result, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						req.session.messages.push('Error authorizing user for Google')
						return res.redirect('/social/google/'+network+'?error=true')
					}

					var tokens = {access_token: result.access_token},
							credentials = {
								oauthAccessToken: result.access_token,
								expires: result.expires_in,
								created: Utils.timestamp(),
								network: network
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
							if(err || !data) {
								Error.handler('google', 'Failure on google plus execute after oauth process', err, data, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								req.session.messages.push(err);
								return res.redirect('/social/google/'+network+'?error=true');
							}

							// Put access token credentials into the database
							user.Business[req.session.Business.index].Social.google.auth = credentials;

							user.Business[req.session.Business.index].Social.google.user.id = data.id;
							user.Business[req.session.Business.index].Social.google.user.data = data;
							
							user.save(function(err) {
								if(err) {
									Log.error('Error saving Google credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									req.session.messages.push('Error saving Google credentials to application')
									return res.redirect('/social/google/'+network+'?error=true');
								}
							});

							// redirect back to google page
							res.redirect('/social/google/' + network);				
						})
					})
				})
			});
		}
	},

	instagram: {
		get: function(req, res) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting to Instagram')
					return res.redirect(err ? '/logout' : '/login')
				}

				if(!req.session.instagramState || req.session.instagramState != req.query.state) {
					Log.error(!req.session.instagramState ? 'Missing instagram oauth state in session' : 'Instagram oauth state discrepancy', {error: 'Instagram oauth state discrepancy or missing state in session', user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.instagramState, returned: req.query.state}, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting Vocada application to Instagram.')
					return res.redirect('/social/instagram?error=true')
				}

				if(req.query.error || !req.query.code) {
					Error.handler('instagram', req.query.error ? 'Instagram oauth query error' : 'No query code returned', req.query.error_description, req.query, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: req.query.error ? 'error' : 'warn'})
					req.session.messages.push('Error connecting Vocada application to Instagram')
					return res.redirect('/social/instagram?error=true')
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
						if(err || !response.access_token || (response.meta && (response.meta.code !== 200 || response.meta.error_type))) {
							Error.handler('instagram', err || response.meta || 'Missing access token', response.meta, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							req.session.messages.push(err || 'Missing access token');
							return res.redirect('/social/instagram?error=true');
						} 

						var credentials = {
							oauthAccessToken: response.access_token,
							created: Utils.timestamp()
						};
						req.session.instagram = credentials;

						// put access tokens into the database
						user.Business[req.session.Business.index].Social.instagram.auth  = credentials;
						user.save(function(err) {
							if(err) {
								Log.error('Error saving Instagram credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								req.session.messages.push('Error saving Instagram credentials to application')
								return res.redirect('/social/instagram?error=true');
							}
						});

						// redirect back to instagram page
						res.redirect('/social/instagram');
					}
				);
			});
		}
	},

	bitly: {
		get: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting to Bitly')
					return res.redirect(err ? '/logout' : '/login')
				}

				// check if code return state param matches the user state in session variable 
				if(!req.session.bitlyState || req.session.bitlyState != req.query.state) {
					Log.error(!req.session.bitlyState ? 'Missing bitly oauth state in session' : 'Bitly oauth state discrepancy', {error: 'Bitly oauth state discrepancy or missing state in session', user_id: user._id, business_id: user.Business[req.session.Business.index]._id, state: {session: req.session.bitlyState, returned: req.query.state}, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					req.session.messages.push('Error connecting Vocada application to Bitly.')
					return res.redirect('/tools/bitly?error=true')
				}

				// check if bitly returned an error (perhaps user disallowed app?) or is missing the needed authorize code
				if(req.query.error || !req.query.code) {
					Error.handler('bitly', req.query.error ? 'Bitly oauth query error' : 'No query code returned', req.query.error_description, req.query, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: req.query.error ? 'error' : 'warn'})
					req.session.messages.push('Error connecting Vocada application to Bitly. You must allow Vocada to connect to your personal Bitly account')
					return res.redirect('/tools/bitly?error=true')
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

					if(err || !response.access_token) {
						Error.handler('bitly', err || 'Missing access token', err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						req.session.messages.push(err || 'Missing access token');
						return res.redirect('/social/bitly?error=true');
					}

					var credentials = {
						oauthAccessToken: result.access_token,
						login: result.login,
						created: Utils.timestamp()
					}

					req.session.bitly = credentials;

					// Put Access token into the database
					user.Business[req.session.Business.index].Tools.bitly.auth = credentials;
					user.save(function(err) {
						if(err) {
							Log.error('Error saving Bitly credentials', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							req.session.messages.push('Error saving Bitly credentials to application')
							return res.redirect('/social/bitly?error=true');
						}
					});

					// redirect back to bitly page
					res.redirect('/tools/bitly');	
				});
			});
		}
	},
}

module.exports = OauthController;