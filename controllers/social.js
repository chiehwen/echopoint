/**
 * Social Controller
 */

var crypto = require('crypto'),
		oauth = require('oauth'),
		url = require('url'),
		request = require('request'),
		Auth = require('../server/auth').getInstance(),
		Log = require('../server/logger').getInstance().getLogger(),
		Error = require('../server/error').getInstance(),
		Utils = require('../server/utilities'),
		Model = Model || Object,
		Harvester = {
			facebook: require('../server/harvesters/facebook'),
			twitter: require('../server/harvesters/twitter'),
			foursquare: require('../server/harvesters/foursquare'),
			//google: require('../server/harvesters/google'),
			//yelp: require('../server/harvesters/yelp'),
			klout: require('../server/harvesters/klout')
		};

var SocialController = {

	facebook: {
		get: function(req, res) {
			res.render(Utils.bootstrapRoute);
		}
	},
	twitter: {
		get: function(req, res) {
			res.render(Utils.bootstrapRoute);
		}
	},
	foursquare: {
		get: function(req, res) {
			res.render(Utils.bootstrapRoute);
		}
	},
	google_plus: {
		path: '/social/google/plus',
		get: function(req, res) {
			req.session.googleChildNetwork = 'plus'
			res.render(Utils.bootstrapRoute);
		}
	},
	google_places: {
		path: '/social/google/places',
		get: function(req, res) {
			req.session.googleChildNetwork = 'places'
			res.render(Utils.bootstrapRoute);
		}
	},
	yelp: {
		get: function(req, res) {
			res.render(Utils.bootstrapRoute);
		}
	},
	instagram: {
		get: function(req, res) {
			res.render(Utils.bootstrapRoute);
		}
	},


	facebook_connect: {
		path: '/social/facebook/connect',
		json: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load business array index and subsequent facebook credentials
				var indx = req.session.Business.index,
						f = user.Business[indx].Social.facebook;

				// if we have a facebook session loaded and no forced login GET param then lets load facebook
				if(req.session.facebook && req.session.facebook.oauthAccessToken && !req.query.login) {

						// load facebook api
					var facebook = Auth.load('facebook');

					// if we have an id GET param from the below select page lets load it into the business
					if(req.query.id)
						facebook.get('me', {fields: 'id,accounts.fields(id,access_token)'}, function(err, response) {
							if(err || response.error) {
								Error.handler('facebook', err || response.error, err, response, {user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								return res.redirect('/social/facebook/connect?login=true')
							}

							// if facebook user id is somehow missing from the credentials then load it in
							if(!f.id)
								user.Business[indx].Social.facebook.id = response.id;

							// accounts list and found boolean
							var accounts = response.accounts.data,
									found = false;

							// iterate through each business and save basic data
							// more complete data will be saved on inital page load by the harvester
							for(var i = 0, l = accounts.length; i < l; i++)
								if(accounts[i].id == req.query.id) {
									user.Business[indx].Social.facebook.account.id = req.query.id;
									user.Business[indx].Social.facebook.account.oauthAccessToken = accounts[i].access_token;

									user.save(function(err) {
										if(err) {
											Log.error('Error saving Facebook credentials', {error: err, user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
											req.session.messages.push('Error saving Facebook credentials to application')
											res.redirect('/social/facebook/connect?login=true');
										}
									});
									found = true;
									break;
								}

							// redirect back to facebook connect to 
							return res.redirect('/social/facebook/connect' + (found ? '' : '?login=true'));
							//return res.json({success: found});
						})

					// if select GET param is passed then bring up user business pages list 
					else if(!f.account.id || !f.account.oauthAccessToken || req.query.select)
						facebook.get('me', {fields: 'accounts.fields(name,picture.type(square),id)'}, function(err, response) {
							if(err || response.error) {						
								Error.handler('facebook', err || response.error, err, response, {user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								return res.redirect('/social/facebook/connect?login=true')
							}

							return res.json({
								success: true,
								connected: true,
								account: false,
								data: {businesses: response.accounts.data},
								url: null
							})
						})

					// if we have database data and session is loaded then we are good to go
					else if(f.account.id && f.account.oauthAccessToken)

						// if this is the first time loading Facebook initilize the data Facebook harvester
						if(!user.Business[indx].Social.facebook.account.populated) {
							var harvest = new Harvester.facebook;

							harvest.getMetrics({
								methods: ['page', 'posts', 'page_insights', 'posts_insights'],
								user: user._id,
								analytics_id: user.Business[indx].Analytics.id,
								index: indx,
								network_id: f.account.id,
								auth_token: f.account.oauthAccessToken
							}, function(err) {
								if (err) {
									// if things didn't load properly log error and force user to relogin to facebook
									Log.error(err, {error: err, user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									return res.redirect('/social/facebook/connect?login=true')
								}			

								// all is good
								console.log('Facebook initial populate callback complete!')

								Model.User.findById(user._id, function(err, saveUser) {
									if(err) {
										Log.error('Error querying User collection', {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
										return res.redirect('/social/facebook/connect?login=true')
									}
									saveUser.Business[indx].Social.facebook.account.populated = true;
									saveUser.save(function(err) {
										if(err) {
											Log.error('Error saving to User collection', {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
											return res.redirect('/social/facebook/connect?login=true')
										}

										res.json({
											success: true,
											connected: true,
											account: true,
											data: {businesses: null},
											url: null
										});
									})
								})			
							});
						} else {
							// we have everything we need so lets load the facebook page
							res.json({
								success: true,
								connected: true,
								account: true,
								data: {businesses: null}, //response,
								url: null
							});
						}
					// if all else failed force the user to relogin to facebook	
					else
						res.redirect('/social/facebook/connect?login=true')

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login 
					&& f.auth.oauthAccessToken
					&& f.auth.expires
					&& f.auth.created
					&& ((f.auth.created + f.auth.expires) * 1000 > Date.now())
				) {

					// load facebook api and set access tokens from database
					var facebook = Auth.load('facebook').setAccessToken(f.oauthAccessToken);

					// load facebook session
					req.session.facebook = {
						id: f.id,
						oauthAccessToken: f.auth.oauthAccessToken,
						expires: f.auth.expires,
						created: f.auth.created
					}

					// reload page now that session is set
					res.redirect('/social/facebook/connect');

				} else {
					// we have nothing, create a state for auth and load the app authorization dialog url
					req.session.facebookState = crypto.randomBytes(10).toString('hex');
			
					res.json({
						success: true,
						connected: false,
						account: false,
						data: null,
						url: Auth.getOauthDialogUrl('facebook', {state: req.session.facebookState, response_type: 'code'})
					})
				} // end facebook processing
			})
		}
	},

	twitter_connect: {
		path: '/social/twitter/connect',
		get: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load twitter api and database twitter credentials
				var	twitter = Auth.load('twitter'),
						indx = req.session.Business.index,
						t = user.Business[indx].Social.twitter;

				// if we have all the needed session variables then lets load the page
				if(req.session.twitter && req.session.twitter.oauthAccessToken && req.session.twitter.oauthAccessTokenSecret && req.session.twitter.id && !req.query.login) {
						
						// if this is the first time loading Twitter initilize the data Twitter harvester
						if(!user.Business[indx].Social.twitter.populated) {
							var harvest = new Harvester.twitter;

							harvest.getMetrics({
								methods: ['credentials', 'timeline', 'dm', 'mentions', 'retweets', 'favorited', 'retweeters', 'friends', 'followers'],
								user: user._id,
								analytics_id: user.Business[indx].Analytics.id,
								index: indx,
								network_id: t.id || req.session.twitter.id,
								auth_token: t.auth.oauthAccessToken || req.session.twitter.oauthAccessToken,
								token_secret: t.auth.oauthAccessTokenSecret || req.session.twitter.oauthAccessTokenSecret
							}, function(err) {
								if (err) {
									// if things didn't load properly log error and force user to relogin to twitter
									Log.error(err, {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									return res.redirect('/social/twitter/connect?login=true')
								}

								// all is good
								console.log('Twitter initial populate callback complete!')

								Model.User.findById(user._id, function(err, saveUser) {
									if(err) {
										Log.error('Error querying User collection', {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
										return res.redirect('/social/twitter/connect?login=true')
									}
									saveUser.Business[indx].Social.twitter.populated = true;
									saveUser.save(function(err) {
										if(err) {
											Log.error('Error saving to User collection', {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
											return res.redirect('/social/twitter/connect?login=true')
										}

										res.json({
											success: true,
											connected: true,
											account: true,
											data: {businesses: null},
											url: null
										});
									})
								})				
							});
						} else {
							res.json({
								success: true,
								connected: true,
								account: null,
								data: {success: true},
								url: null
							})
						}

				} else if (
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& t.auth.oauthAccessToken
					&& t.auth.oauthAccessTokenSecret
					&& t.id
				) {
					// set twitter access tokens from database
					twitter.setAccessTokens(t.auth.oauthAccessToken, t.auth.oauthAccessTokenSecret);

					// load twitter session and reload page now that session is set
					req.session.twitter = {
						id: t.id,
						oauthAccessToken: t.auth.oauthAccessToken,
						oauthAccessTokenSecret: t.auth.oauthAccessTokenSecret,
					}
					res.redirect('/social/twitter/connect');

				} else {
					// seems we have nothing. lets get the request token used for the app oauth dialog url
					twitter.oauth.getOAuthRequestToken(function(err, oauthRequestToken, oauthRequestTokenSecret, response) {
						if (err || (response && response.errors) || !oauthRequestToken || !oauthRequestTokenSecret) {
							Log.error('Error getting twitter request tokens for initial authorize url', {error: err, response: response, request_token: oauthRequestToken, token_secret: oauthRequestTokenSecret, user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber()})
							//Error.handler('twitter', err ? err : 'Error getting twitter request tokens for initial authorize url', err, response, {request_token: oauthRequestToken, token_secret: oauthRequestTokenSecret, user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return res.json({success: false, error: 'Error getting OAuth request token : ' + JSON.stringify(err)});
						}

						// save request tokens to session and send back the app authorization dialog url
						req.session.twitter = {
							oauthRequestToken: oauthRequestToken,
							oauthRequestTokenSecret: oauthRequestTokenSecret
						}

						res.json({
							success: true,
							connected: false,
							account: null,
							data: null,
							url: Auth.getOauthDialogUrl('twitter', {oauth_token: oauthRequestToken})
						});

					});
				} // end twitter processing
			});
		}
	},

	foursquare_connect: {
		path: '/social/foursquare/connect',
		get: function(req, res) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load foursquare business credentials
				var indx = req.session.Business.index,
						f = user.Business[indx].Social.foursquare;

				// if we have a foursquare session loaded and no forced login GET param then lets load foursquare
				if(req.session.foursquare && req.session.foursquare.oauthAccessToken && !req.query.login) {

					// load foursquare api
					foursquare = Auth.load('foursquare');

					// if select GET param is passed then bring up user's managed venues list
					if(f.venue.id && f.auth.oauthAccessToken && !req.query.id && !req.query.select)

						// if this is the first time loading Foursquare initilize the data Twitter harvester
						if(!user.Business[indx].Social.foursquare.venue.populated) {
							var harvest = new Harvester.foursquare;

							harvest.getMetrics({
								methods: ['venue', 'stats'],
								user: user._id,
								analytics_id: user.Business[indx].Analytics.id,
								index: indx,
								network_id: f.id,
								network_id: f.venue.id,
								auth_token: f.auth.oauthAccessToken
							}, function(err) {
								if (err) {
									// if things didn't load properly log error and force user to relogin to foursquare
									Log.error(err, {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									return res.redirect('/social/foursquare/connect?login=true')
								}

								// all is good
								console.log('Foursquare initial populate callback complete!')

								Model.User.findById(user._id, function(err, saveUser) {
									if(err) {
										Log.error('Error querying User collection', {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
										return res.redirect('/social/foursquare/connect?login=true')
									}
									saveUser.Business[indx].Social.foursquare.venue.populated = true;
									saveUser.save(function(err) {
										if(err) {
											Log.error('Error saving to User collection', {error: err, user_id: user._id.toString(), business_id: user.Business[indx]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
											return res.redirect('/social/foursquare/connect?login=true')
										}

										res.json({
											success: true,
											connected: true,
											account: true,
											data: {businesses: null},
											url: null
										});
									})
								})
								
							});
						} else {
							res.json({
								success: true,
								connected: true,
								venue: true,
								data: {},
								url: null
							})
						}
					// if we have database data and session is loaded then we are good to go
					else if(req.query.id)
						foursquare.get('venues/managed', {v: foursquare.client.verified}, function(err, response) {
							if(err || response.meta.code !== 200 || response.meta.errorType) {
								Error.handler('foursquare', err || response.meta.errorType, err, response, {user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber()})
								return res.redirect('/social/foursquare/connect?login=true');
							}

							// venues list and wasFound boolean
							var venues = response.response.venues.items,
									found = false;

							// iterate through each venue and if we find a match then load needed venue credentials
							for(var i = 0, l = venues.length; i < l; i++) {
								if(venues[i].id == req.query.id) {
									user.Business[req.session.Business.index].Social.foursquare.venue = {
										id: req.query.id,
										name: venues[i].name,
										data: venues[i]
									}

									user.save(function(err) {
										if(err) {
											Log.error('Error saving Foursquare credentials', {error: err, user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
											req.session.messages.push('Error saving Foursquare credentials to application')
											res.redirect('/social/foursquare/connect?login=true');
										}
									});
									found = true;
									break;
								}
							}

							// res.json({success: found})
							res.redirect('/social/foursquare/connect' + (found ? '' : '?login=true'));
						})

					// send back user business pages list
					else if(f.auth.oauthAccessToken)

						foursquare.get('venues/managed', {v: foursquare.client.verified}, function(err, response) {
							if(err || response.meta.code !== 200 || response.meta.errorType) {
								Error.handler('foursquare', err || response.meta.errorType, err, response, {user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber()})
								return res.redirect('/social/foursquare/connect?login=true');
							}

							// send back our venues list
							res.json({
								success: true,
								connected: true,
								venue: false,
								data: {businesses:response.response.venues.items},
 								url: null
							})
						})

					// if all else failed force the user to relogin to foursquare	
					else
						res.redirect('/social/foursquare/connect?login=true')
							
				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& f.auth.oauthAccessToken
				) {

 					// load foursquare api and set access tokens from database
 					var foursquare = Auth.load('foursquare').setAccessToken(f.auth.oauthAccessToken);
					req.session.foursquare = {
						oauthAccessToken: f.auth.oauthAccessToken
					}

					// reload page now that session is set
					res.redirect('/social/foursquare/connect');

				} else {
					// we have nothing so load the app authorization dialog url
					res.json({
						success: true,
						connected: false,
						venue: false,
						data: null,
						url: Auth.getOauthDialogUrl('foursquare', {response_type: 'code'})
					})
				}
			})
		}
	},

	google_connect: {
		path: '/social/google/connect',
		json: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})	
				}

				// load google business credentials
				var g = user.Business[req.session.Business.index].Social.google,
						network = req.query.child_network || req.session.googleChildNetwork || 'plus';

				// if we have a google session loaded and no forced login GET param then lets load google
				if(req.session.google && req.session.google.oauthAccessToken && req.session.google.oauthRefreshToken && !req.query.login) {

					if(network === 'plus') {
						if(!g.plus.id || !g.plus.populated)
							res.json({
								success: true,
								connected: true,
								data: false,
								search: true,
								child_network: network
							})
						else
							res.json({
								success: true,
								connected: true,
								data: {success: true},
								child_network: network
							})
					} else {
						if(!g.places.id || !g.places.reference || !g.places.populated)
							res.json({
								success: true,
								connected: true,
								data: false,
								search: true,
								child_network: network
							})
						else
							res.json({
								success: true,
								connected: true,
								data: {success: true},
								child_network: network
							})
					}

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& g.auth.oauthAccessToken
					&& g.auth.oauthRefreshToken
				) {

					// load google api and set access tokens from database
					google = Auth.load('google_discovery');
					google.oauth.setCredentials({
						access_token: g.auth.oauthAccessToken,
						refresh_token: g.auth.oauthRefreshToken
					});

					// load google session and reload page now that session is set
					req.session.google = {
						oauthAccessToken: g.auth.oauthAccessToken,
						oauthRefreshToken: g.auth.oauthRefreshToken,
						expires: g.auth.expires,
						created: g.auth.created
					}
					res.redirect('/social/google/connect');
				
				} else {
					// we have nothing, create a state for auth and load the app authorization dialog url
					var state = crypto.randomBytes(10).toString('hex');
					req.session.googleState = state;
					req.session.googleChildNetwork = network;

					res.json({
						success: true,
						connected: false,
						venue: false,
						data: null,
						url: Auth.getOauthDialogUrl('google', {response_type: 'code', access_type: 'offline', state: state, approval_prompt: 'force'})
					})
				}
			})
		}
	},

	yelp_connect: {
		path: '/social/yelp/connect',
		get: function(req, res) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load google business credentials
				var indx = req.session.Business.index,
						y = user.Business[indx].Social.yelp;

				// if we have yelp credentials then load the page data
				if (y.id && y.populated && !req.query.setup)	{
					res.json({
						success: true,
						connected: true,
						data: true //response.body
					})
				} else {
					res.json({
						success: true,
						connected: false,
						//setup: req.query.setup ? true : false,
						search: true,
						data: null
					});
				}
			});
		}
	},

	instagram_connect: {
		path: '/social/instagram/connect',
		get: function(req, res) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

 			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}	

				// load instagram business credentials
				var i = user.Business[req.session.Business.index].Social.instagram;

				// if we have a instagram session loaded and no forced login GET param then lets load instagram
				if(req.session.instagram && req.session.instagram.oauthAccessToken && !req.query.login) {
					
					// load instagram api
					instagram = Auth.load('instagram');

					// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)

					// load feed just to check connect (will most likely be removed)
					instagram.get('users/self/feed', function(err, response) {
						if(err || (response.meta && (response.meta.code !== 200 || response.meta.error_type))) {
							Error.handler('instagram', err || response.meta, response.meta, response, {user_id: user._id.toString(), business_id: user.Business[req.session.Business.index]._id.toString(), file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							res.redirect('/social/instagram/connect?login=true');
						}

						res.json({
							success: true,
							connected: true,
							data: response,
		 					url: null
						})
					});

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& i.auth.oauthAccessToken
				) {

					// load facebook api and set access tokens from database
					var instagram = Auth.load('instagram');
					instagram.setAccessToken(i.auth.oauthAccessToken);

					// load facebook session
					req.session.instagram = {
						oauthAccessToken: i.auth.oauthAccessToken
					}

					// reload page now that session is set
					res.redirect('/social/instagram/connect');

				} else {

					// we have nothing, create a state for auth and load the app authorization dialog url
					req.session.instagramState = crypto.randomBytes(10).toString('hex');
					res.json({
						success: true,
						connected: false,
						url: Auth.getOauthDialogUrl('instagram', {response_type: 'code', state: req.session.instagramState})
					})

				}
			})
		}
	},
}

module.exports = SocialController;