/**
 * Social Controller
 */

var crypto = require('crypto'),
		oauth = require('oauth'),
		url = require('url'),
		Auth = require('../server/auth').getInstance(),
		Log = require('../server/logger').getInstance().getLogger(),
		Error = require('../server/error').getInstance(),
		Helper = require('../server/helpers'),
		Model = Model || Object,
		Harvester = {
			facebook: require('../server/harvesters/facebook'),
			twitter: require('../server/harvesters/twitter'),
			foursquare: require('../server/harvesters/foursquare'),
			google: require('../server/harvesters/google'),
			yelp: require('../server/harvesters/yelp'),
			klout: require('../server/harvesters/klout')
		};

var SocialController = {

	facebook: {
		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
	},
	twitter: {
		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
	},
	foursquare: {
		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
	},
	google_plus: {
		path: '/social/google/plus',
		get: function(req, res) {
			req.session.googleChildNetwork = 'plus'
			res.render(Helper.bootstrapRoute);
		}
	},
	google_places: {
		path: '/social/google/places',
		get: function(req, res) {
			req.session.googleChildNetwork = 'places'
			res.render(Helper.bootstrapRoute);
		}
	},
	yelp: {
		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
	},
	instagram: {
		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
	},


	facebook_connect: {
		path: '/social/facebook/connect',
		json: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
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
								Error.handler('facebook', err || response.error, err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
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
											Log.error('Error saving Facebook credentials', {error: err, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
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
								Error.handler('facebook', err || response.error, err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
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
						// note: this can take a good bit of time, warn user and show loading 
						if(!user.Business[indx].Social.facebook.account.data) {
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
									Log.error(err, {error: err, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
									return res.redirect('/social/facebook/connect?login=true')
								}			

								// all is good
								console.log('loaded inital Facebook data')
								res.json({
									success: true,
									connected: true,
									account: true,
									data: {businesses: null},
									url: null
								});
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

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load twitter api and database twitter credentials
				var	twitter = Auth.load('twitter'),
						t = user.Business[req.session.Business.index].Social.twitter;

				// if we have all the needed session variables then lets load the page
				if(req.session.twitter && req.session.twitter.oauthAccessToken && req.session.twitter.oauthAccessTokenSecret && req.session.twitter.id && !req.query.login) {
					// note: we used to verify credentials but since the harvester is always running any anomaly should reset the access tokens and force the user to relogin
					// twitter.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, response) {})
						
						// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)
						res.json({
							success: true,
							connected: true,
							account: null,
							data: {success: true},
							url: null
						})

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
console.log('we should be in here');
					// seems we have nothing. lets get the request token used for the app oauth dialog url
					twitter.oauth.getOAuthRequestToken(function(err, oauthRequestToken, oauthRequestTokenSecret, response) {
						if (err || response.errors || !oauthRequestToken || !oauthRequestTokenSecret) {
							Error.handler('twitter', err ? err : 'Error getting twitter request tokens for initial authorize url', err, response, {request_token: oauthRequestToken, token_secret: oauthRequestTokenSecret, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
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

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load foursquare business credentials
				var f = user.Business[req.session.Business.index].Social.foursquare;

				// if we have a foursquare session loaded and no forced login GET param then lets load foursquare
				if(req.session.foursquare && req.session.foursquare.oauthAccessToken && !req.query.login) {

					// load foursquare api
					foursquare = Auth.load('foursquare');

					// if select GET param is passed then bring up user's managed venues list
					if(f.venue.id && !req.query.id && !req.query.select)

						// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)
						res.json({
							success: true,
							connected: true,
							venue: true,
							data: {},
							url: null
						})

					// if we have database data and session is loaded then we are good to go
					else if(req.query.id)
						foursquare.get('venues/managed', {v: foursquare.client.verified}, function(err, response) {
							if(err || response.meta.code !== 200 || response.meta.errorType) {
								Error.handler('foursquare', err || response.meta.errorType, err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber()})
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
											Log.error('Error saving Foursquare credentials', {error: err, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
											req.session.messages.push('Error saving Foursquare credentials to application')
											res.redirect('/social/foursquare/connect?login=true');
										}
									});
									found = true;
									break;
								}
							}

							// return success
							res.json({success: found}) // res.redirect('/social/foursquare/connect' + (found ? '' : '?login=true'));
						})

					// send back user business pages list
					else if(f.auth.oauthAccessToken)

						foursquare.get('venues/managed', {v: foursquare.client.verified}, function(err, response) {
							if(err || response.meta.code !== 200 || response.meta.errorType) {
								Error.handler('foursquare', err || response.meta.errorType, err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber()})
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

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})	
				}

				// load google business credentials
				var g = user.Business[req.session.Business.index].Social.google,
						network = req.query.child_network || req.session.googleChildNetwork || 'plus';
console.log('child_network', network);
//console.log(g.business.data);
				// if we have a google session loaded and no forced login GET param then lets load foursquare
				if(req.session.google && req.session.google.oauthAccessToken && req.session.google.oauthRefreshToken && !req.query.login) {

					// if tokens have expired then force user to relogin to google plus
					// Scratch this, I believe that the google_discovery api will automatically update token with refresh token
					//if((req.session.google.created + req.session.google.expires) * 1000 <= Date.now())
						//res.redirect('/social/google/login');

					// TODO: fix this cluster f**k below
					// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)
					if(g.places.id && g.places.data.reference) {

						google = Auth.load('google_discovery');

						var tokens = {
							access_token: g.auth.oauthAccessToken,
							refresh_token: g.auth.oauthRefreshToken
						}

						google.oauth.setAccessTokens(tokens);

						google
							.discover('plus', 'v1')
							.execute(function(err, client) {
								client
								.plus.people.search({ query: 'Speak Social' })
								//.plus.people.get({ userId: 'me' })
								//.plus.people.get({ userId: '100941364374251988809' }) // andy
								//.plus.activities.list({ userId: '100941364374251988809', collection: 'public' })
								.withAuthClient(google.oauth)
								.execute(function(err, data) {
									if(err || !data) {
										Error.handler('google', 'Failure on google plus execute after oauth process', err, data, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
										req.session.messages.push(err);
										//return res.redirect('/social/google?error=true');
										data = err || 'error';
									}


									res.json({
										success: true,
										connected: true,
										data: {success: true, plus: data}, //data,
										child_network: network
									})

								})
							})

						
					} else {
						user.Business[req.session.Business.index].Social.google.places = {
							id: 'e4353411a15c29a7f2f815a3d9cecf4fcad0c87f',
							data: { 
								formatted_address: '5350 Burnet Road #2, Austin, TX, United States',
					       icon: 'http://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png',
					       id: 'e4353411a15c29a7f2f815a3d9cecf4fcad0c87f',
					       name: 'Roll On Sushi Diner',
					       price_level: 2,
					       rating: 4.6,
					       reference: 'CoQBdQAAALO078NBmk-qhyi42NaMhwIoKqdJtkyIHvnfI5YnmBKWNR8nhk61XtxUtr_lxFKSCRbcZDbLYp2rdQaxw8GVY7mm5fO8EqNPP9QAZp9Sc11pYzdqrv93uEiAbOxeYfYG6PiPiADUFnRAvnpxCxFGDd43-OHoVEgNSKjSiX3DAtAqEhCBICO8NNA9HK2jes1iDUN5GhRdhjetEewmfhY_P2-MIutpL3Pzcw',
					     }
						}
						user.save(function(err, save) {

						})
						// set this up via sockets and not GET http request
						/*google = Auth.load('google');
						google.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {key: google.client.key, query: 'Roll On Sushi Diner, Austin, Texas', sensor: false}, function(err, response) {
							console.log(err, response);
							res.json({
								success: true,
								connected: true,
								account: true,
								data: {success: true}, //data,
							})
						})*/

						res.json({
							success: true,
							connected: true,
							setup: true,
							data: {success: true}, //data,
							child_network: network
						})
					}

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& g.auth.oauthAccessToken
					&& g.auth.oauthRefreshToken
					//&& g.auth.expires
					//&& g.auth.created
					//&& ((g.auth.created + g.auth.expires) * 1000 > Date.now())
				) {

					// load google api and set access tokens from database
					google = Auth.load('google_discovery');
					google.oauth.setAccessTokens({
						access_token: g.auth.oauthAccessToken,
						refresh_token: g.auth.oauthRefreshToken
					});

					// load google session and reload page now that session is set
					req.session.google = {
						oauthAccessToken: g.auth.oauthAccessToken,
						oauthRefreshToken: g.auth.oauthRefreshToken,
						expires: g.auth.expires,
						created: g.auth.created
						//network: network
					}
					res.redirect('/social/google/connect');
				
				} else {
					// we have nothing, create a state for auth and load the app authorization dialog url
					req.session.googleState = crypto.randomBytes(10).toString('hex');
					req.session.googleChildNetwork = network;

					res.json({
						success: true,
						connected: false,
						venue: false,
						data: null,
						url: Auth.getOauthDialogUrl('google', {response_type: 'code', access_type: 'offline', state: req.session.googleState, approval_prompt: 'force'})
					})
				}
			})
		}
	},

	google_plus_connect: {
		path: '/social/google/plus/connect',
		json: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})	
				}

				// load google business credentials
				var g = user.Business[req.session.Business.index].Social.google;
console.log(g.business.data);
				// if we have a google session loaded and no forced login GET param then lets load foursquare
				if(req.session.google && req.session.google.oauthAccessToken && req.session.google.oauthRefreshToken && !req.query.login) {

					// if tokens have expired then force user to relogin to google plus
					if((req.session.google.created + req.session.google.expires) * 1000 <= Date.now())
						res.redirect('/social/google/login');

					// TODO: fix this cluster f**k below
					// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)
					if(g.business.id && g.business.data.reference) {

						google = Auth.load('google_discovery');

						var tokens = {
							access_token: g.auth.oauthAccessToken,
							refresh_token: g.auth.oauthRefreshToken
						}

						google.oauth.setAccessTokens(tokens);

						google
							.discover('plus', 'v1')
							.execute(function(err, client) {
								client
								.plus.people.search({ query: 'Speak Social' })
								//.plus.people.get({ userId: 'me' })
								//.plus.people.get({ userId: '100941364374251988809' }) // andy
								//.plus.activities.list({ userId: '100941364374251988809', collection: 'public' })
								.withAuthClient(google.oauth)
								.execute(function(err, data) {
									if(err || !data) {
										Error.handler('google', 'Failure on google plus execute after oauth process', err, data, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
										req.session.messages.push(err);
										//return res.redirect('/social/google?error=true');
										data = err || 'error';
									}


									res.json({
										success: true,
										connected: true,
										data: {success: true, plus: data} //data,
									})

								})
							})

						
					} else {
						user.Business[req.session.Business.index].Social.google.places = {
							id: 'e4353411a15c29a7f2f815a3d9cecf4fcad0c87f',
							data: { 
								formatted_address: '5350 Burnet Road #2, Austin, TX, United States',
					       icon: 'http://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png',
					       id: 'e4353411a15c29a7f2f815a3d9cecf4fcad0c87f',
					       name: 'Roll On Sushi Diner',
					       price_level: 2,
					       rating: 4.6,
					       reference: 'CoQBdQAAALO078NBmk-qhyi42NaMhwIoKqdJtkyIHvnfI5YnmBKWNR8nhk61XtxUtr_lxFKSCRbcZDbLYp2rdQaxw8GVY7mm5fO8EqNPP9QAZp9Sc11pYzdqrv93uEiAbOxeYfYG6PiPiADUFnRAvnpxCxFGDd43-OHoVEgNSKjSiX3DAtAqEhCBICO8NNA9HK2jes1iDUN5GhRdhjetEewmfhY_P2-MIutpL3Pzcw',
					     }
						}
						user.save(function(err, save) {

						})
						// set this up via sockets and not GET http request
						/*google = Auth.load('google');
						google.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {key: google.client.key, query: 'Roll On Sushi Diner, Austin, Texas', sensor: false}, function(err, response) {
							console.log(err, response);
							res.json({
								success: true,
								connected: true,
								account: true,
								data: {success: true}, //data,
							})
						})*/

						res.json({
							success: true,
							connected: true,
							setup: true,
							data: {success: true} //data,
						})
					}

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& g.auth.oauthAccessToken
					&& g.auth.oauthRefreshToken
					&& g.auth.expires
					&& g.auth.created
					&& ((g.auth.created + g.auth.expires) * 1000 > Date.now())
				) {

					// load google api and set access tokens from database
					google = Auth.load('google_discovery');
					google.oauth.setAccessTokens({
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
					req.session.googleState = crypto.randomBytes(10).toString('hex');
					
					res.json({
						success: true,
						connected: false,
						venue: false,
						data: null,
						url: Auth.getOauthDialogUrl('google', {response_type: 'code', access_type: 'offline', state: req.session.googleState, approval_prompt: 'force'})
					})
				}
			})
		}
	},


	google_places_connect: {
		path: '/social/google/places/connect',
		json: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})	
				}

				// load google business credentials
				var g = user.Business[req.session.Business.index].Social.google;
console.log(g.business.data);
				// if we have a google session loaded and no forced login GET param then lets load foursquare
				if(req.session.google && req.session.google.oauthAccessToken && req.session.google.oauthRefreshToken && !req.query.login) {

					// if tokens have expired then force user to relogin to google plus
					if((req.session.google.created + req.session.google.expires) * 1000 <= Date.now())
						res.redirect('/social/google/login');

					// TODO: fix this cluster f**k below
					// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)
					if(g.business.id && g.business.data.reference) {

						google = Auth.load('google_discovery');

						var tokens = {
							access_token: g.auth.oauthAccessToken,
							refresh_token: g.auth.oauthRefreshToken
						}

						google.oauth.setAccessTokens(tokens);

						google
							.discover('plus', 'v1')
							.execute(function(err, client) {
								client
								.plus.people.search({ query: 'Speak Social' })
								//.plus.people.get({ userId: 'me' })
								//.plus.people.get({ userId: '100941364374251988809' }) // andy
								//.plus.activities.list({ userId: '100941364374251988809', collection: 'public' })
								.withAuthClient(google.oauth)
								.execute(function(err, data) {
									if(err || !data) {
										Error.handler('google', 'Failure on google plus execute after oauth process', err, data, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
										req.session.messages.push(err);
										//return res.redirect('/social/google?error=true');
										data = err || 'error';
									}


									res.json({
										success: true,
										connected: true,
										data: {success: true, plus: data} //data,
									})

								})
							})

						
					} else {
						user.Business[req.session.Business.index].Social.google.places = {
							id: 'e4353411a15c29a7f2f815a3d9cecf4fcad0c87f',
							data: { 
								formatted_address: '5350 Burnet Road #2, Austin, TX, United States',
					       icon: 'http://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png',
					       id: 'e4353411a15c29a7f2f815a3d9cecf4fcad0c87f',
					       name: 'Roll On Sushi Diner',
					       price_level: 2,
					       rating: 4.6,
					       reference: 'CoQBdQAAALO078NBmk-qhyi42NaMhwIoKqdJtkyIHvnfI5YnmBKWNR8nhk61XtxUtr_lxFKSCRbcZDbLYp2rdQaxw8GVY7mm5fO8EqNPP9QAZp9Sc11pYzdqrv93uEiAbOxeYfYG6PiPiADUFnRAvnpxCxFGDd43-OHoVEgNSKjSiX3DAtAqEhCBICO8NNA9HK2jes1iDUN5GhRdhjetEewmfhY_P2-MIutpL3Pzcw',
					     }
						}
						user.save(function(err, save) {

						})
						// set this up via sockets and not GET http request
						/*google = Auth.load('google');
						google.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {key: google.client.key, query: 'Roll On Sushi Diner, Austin, Texas', sensor: false}, function(err, response) {
							console.log(err, response);
							res.json({
								success: true,
								connected: true,
								account: true,
								data: {success: true}, //data,
							})
						})*/

						res.json({
							success: true,
							connected: true,
							setup: true,
							data: {success: true} //data,
						})
					}

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& g.auth.oauthAccessToken
					&& g.auth.oauthRefreshToken
					&& g.auth.expires
					&& g.auth.created
					&& ((g.auth.created + g.auth.expires) * 1000 > Date.now())
				) {

					// load google api and set access tokens from database
					google = Auth.load('google_discovery');
					google.oauth.setAccessTokens({
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
					req.session.googleState = crypto.randomBytes(10).toString('hex');
					
					res.json({
						success: true,
						connected: false,
						venue: false,
						data: null,
						url: Auth.getOauthDialogUrl('google', {response_type: 'code', access_type: 'offline', state: req.session.googleState, approval_prompt: 'force'})
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

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
					return res.redirect(err ? '/logout' : '/login') //return res.json({success: false, error: 'User is not logged in'})
				}

				// load google business credentials
				var y = user.Business[req.session.Business.index].Social.yelp;

				// if url GET param is sent then process if it's valid and load into business
				if (req.query.url) {
					// uri decode the sent url
					var page = decodeURIComponent(req.query.url);

					// check if url is a proper yelp.com address
					if (page.indexOf('yelp.com/') === -1) {
						req.session.messages.push('Invalid Yelp URL');
						res.redirect('/social/yelp/connect?setup=true');
					}

					// if http/https is missing from link then add it
					if (page.indexOf('http://') != -1 || page.indexOf('https://') != -1)
						page = 'http://' + page;

					// use node built in url module to get path data
					var path = url.parse(page).pathname;

					// get business name from last index in path and load into database
					user.Business[req.session.Business.index].Social.yelp = {
						id: path.substring(path.lastIndexOf('/') + 1)
					}

					user.save(function(err) {
						if(err) {
							Log.error('Error saving Yelp url', {error: err, user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							req.session.messages.push('Error saving Yelp url to application')
							res.redirect('/social/yelp/connect?setup=true');
						}
					});
					res.redirect('/social/yelp/connect');	

				} else if (y.id && !req.query.setup)	{

					// load yelp api
					yelp = Auth.load('yelp');
					yelp.business(y.id, function(err, response) {
						if(err || (response && response.error)) {
							Error.handler('yelp', err || response.error, err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return res.redirect('/social/yelp/connect?setup=true')
						}

						res.json({
							success: true,
							connected: true,
							data: response
						});
					});

				} else {

					// load yelp api
					yelp = Auth.load('yelp');
					yelp.search({term: 'Roll On Sushi Diner', location: 'Austin'}, function(err, response){
						if(err || (response && response.error)) {
							Error.handler('yelp', err || response.error, err, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return res.redirect('/social/yelp/connect?setup=true')
						}

						res.json({
							success: true,
							connected: false,
							setup: req.query.setup ? true : false,
							data: null
						});
					})
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

 			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
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
							Error.handler('instagram', err || response.meta, response.meta, response, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
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