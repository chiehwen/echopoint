// Module dependencies.
var Auth = require('./auth').getInstance(),
		Log = require('./logger').getInstance().getLogger(),
		Error = require('./error').getInstance(),
		Utils = require('./utilities'),
		Notification = require('./notification'),
		Session = require('./session'),
		Url = require('url'),
		Model = Model || Object,Harvester = {
			google: require('./harvesters/google'),
			yelp: require('./harvesters/yelp')
		};

var Socket = (function() {

	// Private attribute that holds the single instance
	var socketInstance;

	function constructor(io) {

	var passportUserId = '',
			currentBusinessId = '';

	var packet = {
		incoming: {
			init: function(data, callback) {
				var sid = data.sid.replace('s:','').split('.')[0];
				passportUserId = JSON.parse(Session.store.sessions[sid]).passport.user;

				if(passportUserId && passportUserId != '') {
	 				Utils.getUser(passportUserId, function(err, user) {
	 					if (err || !user) callback({loggedIn: false, error: err});
	 					var response = {
	 						loggedIn: true,
	 						id: user._id,
	 						uid: user.id,
	 						passport: passportUserId,
	 						name: user.name,
	 						email: user.email,
	 						businesses: {
	 							list: user.Business,
	 							current: user.meta.Business.current
	 						}
	 					}
	 					callback(response);
					});
				} else {
					callback({loggedIn: false, error: 'not logged in'});
				}				
			},
			user: {
				setUid: function(data, callback) {
					if(passportUserId) {				
		 				Utils.getUser(passportUserId, function(err, user) {
		 					if (err || !user) callback({success: false, error: err});
		 					user.id = data.uid;
		 					
		 					user.save(function(err){
		 						if(err) callback({success: false, error: err});
		 						callback(null);
		 					});
						});
					} else {
						callback({success: false, error: 'Not logged in'})
					}				
				},
				update: function(data, callback) {
					if(passportUserId) {
						Utils.getUser(passportUserId, function(err, user) {
							if(err || !user) callback({success: false, error: err || 'no user found!'});
				
							if(data.name)
								user.name = data.name;

							if(data.email)
								user.email = data.email;

							user.save(function(err,res){
								if(err) callback({success: false, error: err});
								callback(null, {success: true});
							});

	 					});
					} else {
						callback({success: false, error: 'not logged in'})
					}
				},
			},

			business: {
				setBid: function(data, callback) {
					if(passportUserId) {				
		 				Utils.getUser(passportUserId, function(err, user) {
		 					if (err || !user) callback({success: false, error: err});
		 					user.Business[data.index].id = data.bid;
		 					
		 					user.save(function(err){
		 						if(err) callback({success: false, error: err});
		 						callback(null);
		 					});
						});
					} else {
						callback({success: false, error: 'Not logged in'})
					}				
				},
				select: function(data, callback) {
					if(passportUserId) {				
		 				Utils.getUser(passportUserId, function(err, user) {
		 					for(var i=0,l=user.Business.length; i<l; i++) {
		 						if(user.Business[i]._id == data.id) {
		 							user.meta.Business.current = {
		 								id: user.Business[i]._id,
										bid: user.Business[i].id,
										index: i
		 							}
		 							callback(null, {success: true, data: {bid: user.Business[i].id}})
		 							break;
		 						}
		 					}
		 				})
		 			} else {
						callback({success: false, error: 'Not logged in'})
					}	
				},
				update: function(data, callback) {
					if(passportUserId) {
						Utils.getUser(passportUserId, function(err, user) {
							if(err || !user) callback({success: false, error: err || 'no user found!'});
						
							for(var x=0, l=user.Business.length;x<l;x++) {
								for(var y=0, len=data.length;y<len;y++) {
									if(user.Business[x]._id == data[y].id) {
										user.Business[x].name = data[y].name;
										break;
									}
								}
							}
							user.save(function(err,res){
								if(err) callback({success: false, error: err});
								callback(null, {success: true});
							});

	 					});
					} else {
						callback({success: false, error: 'not logged in'})
					}
				},
				create: function(data, callback) {
					if(passportUserId && data.bid) {
						Utils.getUser(passportUserId, function(err, user) {
							if(err || !user) callback({success: false, error: err || 'no user found!'});
							
							var timestamp = Utils.timestamp(true) + Utils.randomInt(10000, 99999),
	 								newBusiness = {
	 									id: data.bid,
			 							name: data.name,
			 							Analytics: {id: timestamp}
			 						},
			 						newAnalytics = new Model.Analytics({
										id: timestamp,
										name: data.name
									});
	 						
	 						user.Business.push(newBusiness);

	 						user.save(function(err, response){
	 							if(err) callback({success: false, error: err});
								newAnalytics.save(function(err){
									if (err) callback({success: false, error: err});
									callback(null, {success: true});
								});
	 						});
	 					});
					} else {
						callback({success: false, error: 'not logged in'})
					}
				}
			},
			social: {
				google: {
					save: function(data, callback) {
						if(!passportUserId) 
							return callback(err || 'user id error!');
						
						Utils.getUser(passportUserId, function(err, user) {
							if(err || !user) 
								return callback(err || 'no user found!');

							var g = user.Business[data.index].Social.google;

							// load proper api request module
							if(data.network === 'plus')
								var google = Auth.load('google_discovery');
							else
								var google = Auth.load('google')

							var search = {
								plus: function(cb) {

									google.oauth.setAccessTokens({
										access_token: g.auth.oauthAccessToken,
										refresh_token: g.auth.oauthRefreshToken
									})

									google
										.discover('plus', 'v1')
										.execute(function(err, client) {
											client
											.plus.people.search({ query: data.name })
											.withAuthClient(google.oauth)
											.execute(function(err, response) {
												if(err || !response) {
													Error.handler('google', 'Failure on google plus execute after oauth process', err, data, {user_id: user._id, business_id: user.Business[req.session.Business.index]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
													return cb(err || 'No data returned from Google')
												}

												if(!response.items || !response.items.length)
													return cb('No results found')

												cb(null, response.items)
											})
										})
								},
								places: function(cb) {
									if(!data.name || !data.city)
										cb(msg || 'No search parameters provided')

									var location = data.state ? (data.city + ', ' + data.state) : data.city;

									google.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {key: google.client.key, query: data.name.trim() + ' ,' + location.trim(), sensor: false}, function(err, response) {
										if(err || response.error)
											return cb(err || response.error)

										if(response.results && response.results.length)
											cb(null, response.results)
										else
											cb('No businesses were found')
									})
								}
							}

							var details = {
								plus: function(id, cb) {

									google.oauth.setAccessTokens({
										access_token: g.auth.oauthAccessToken,
										refresh_token: g.auth.oauthRefreshToken
									});

									google
										.discover('plus', 'v1')
										.execute(function(err, client) {
											if(err || !client) {
												// LOG ERROR HERE
												return cb(err || 'No response returned from google')
											}

											client
												.plus.people.get({ userId: id })
												.withAuthClient(google.oauth)
												.execute(function(err, response) {

													if(err || !response || response.error) {
														// LOG ERROR HERE
														return cb(err || 'No response returned from google')
													}

													cb(null, response);
												})
										})
								},
								places: function(ref, cb) {
									google.get('https://maps.googleapis.com/maps/api/place/details/json', {key: google.client.key, reference: ref, sensor: false, review_summary: true}, function(err, response) {
										if(err || response.error)
											return cb(err || response.error)
//console.log(response);
										if(response.result)
											cb(null, response.result)
										else
											cb('No businesses was found by search reference')
									})
								}
							}

							if(data.id)
								details.plus(data.id, function(err, result) {
									if(err)
										return callback('Invalid Google+ ID');

									user.Business[data.index].Social.google.plus = {id: result.id}

									var harvest = new Harvester.google;

									harvest.getMetrics(user, {
										methods: ['plus', 'activity'],
										user_id: user._id,
										business_id: user.Business[data.index]._id,
										analytics_id: user.Business[data.index].Analytics.id,
										index: data.index,
										network_id: result.id,
										accessToken: g.auth.oauthAccessToken,
										refreshToken: g.auth.oauthRefreshToken
									}, function(err, update) {
										console.log('Google+ initial populate callback complete!')

										user.save(function(err, save) {
											if(err && err.name !== 'VersionError') {
												Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
												return callback('Error saving to User collection')
											}

											// if we have a versioning overwrite error than load up the analytics document again
											if(err && err.name === 'VersionError')
												Model.User.findById(user._id, function(err, saveUser) {
													if(err) {
														Log.error('Error querying User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
														return callback('Error querying to User collection')
													}

													saveUser.Business[data.index].Social.google = user.Business[data.index].Social.google;
													saveUser.markModified('.Business['+index+'].Social.google')

													saveUser.save(function(err, save) {
														if(err) {
															Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
															return callback('Error saving to user collection')
														}
														callback(null, {success: true})
													})
												})
											else
												callback(null, {success: true})
										})
									})

								})
							else if(data.ref)
								details.places(data.ref, function(err, result) {									
									if(err)
										return callback('Invalid Google details reference');

									user.Business[data.index].Social.google.places = {
										//id: result.id,
										id: parseGoogleUrl(result.url),
										reference: g.places.reference
									}
									
									var harvest = new Harvester.google;

									harvest.getMetrics(user, {
										methods: ['places', 'reviews'],
										user_id: user._id,
										business_id: user.Business[data.index]._id,
										analytics_id: user.Business[data.index].Analytics.id,
										index: data.index,
										network_id: user.Business[data.index].Social.google.places.id,
										network_ref: data.ref
									}, function(err, update) {
										console.log('Google Places initial populate callback complete!')

										user.save(function(err, save) {
											if(err && err.name !== 'VersionError') {
												Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
												return callback('Error saving to User collection')
											}

											// if we have a versioning overwrite error than load up the analytics document again
											if(err && err.name === 'VersionError')
												Model.User.findById(user._id, function(err, saveUser) {
													if(err) {
														Log.error('Error querying User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
														return callback('Error querying to User collection')
													}

													saveUser.Business[data.index].Social.google = user.Business[data.index].Social.google;
													saveUser.markModified('.Business['+index+'].Social.google')

													saveUser.save(function(err, save) {
														if(err) {
															Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
															return callback('Error saving to user collection')
														}
														callback(null, {success: true})
													})
												})
											else
												callback(null, {success: true})
										})
									})

								})
							else 
								search[data.network](function(err, list) {
									if(err || !list)
										return callback(err || 'No results we\'re returned');
									callback(null, {list: list});
								})
							

							function parseGoogleUrl(url) {
								var address = decodeURIComponent(url);
								if (address.indexOf('plus.google.com/') === -1)
									return false;

								//if (address.indexOf('http://') === -1 && address.indexOf('https://') === -1)
									//address = 'https://' + address;

								var path = Url.parse(address).pathname.replace('/about', '');
								return path.substring(path.lastIndexOf('/') + 1);
							}

							function checkGoogleId(id, cb) {
								var google = Auth.load('google_discovery');

								google.oauth.setAccessTokens({
									access_token: g.auth.oauthAccessToken,
									refresh_token: g.auth.oauthRefreshToken
								});

								google
									.discover('plus', 'v1')
									.execute(function(err, client) {
										client
											.plus.people.get({ userId: id })
											.withAuthClient(google.oauth)
											.execute(function(err, response) {
		console.log(response);
												cb(err||response.error ? false : response);
											})
									})
							}

							function checkGooglePlacesDetails(ref, cb) {
								var google = Auth.load('google');

								google.get('https://maps.googleapis.com/maps/api/place/details/json', {key: google.client.key, reference: ref, sensor: false, review_summary: true}, function(err, response) {
									if(err || response.error)
										return cb(err || response.error)
console.log(response);
									if(response.result)
										cb(null, response.result)
									else
										cb('No businesses was found by search reference')
								})
							}
						})
					}
				},

				yelp: {
					save: function(data, callback) {
						if(!passportUserId) 
							return callback(err || 'user id error!');
						
						Utils.getUser(passportUserId, function(err, user) {
							if(err || !user) return callback(err || 'no user found!');

							var yelp = Auth.load('yelp');

							// load dependencies for processing yelp requests
							var request = require('request'),
									qs = require('querystring');

							if(data.id)
								checkYelpId(data.id, function(success) {
									if(!success)
										return callback('Invalid Yelp Business ID');
								
									user.Business[data.index].Social.yelp = {id: data.id}

									var harvest = new Harvester.yelp

									harvest.getMetrics(user, {
										methods: ['business', 'reviews'],
										index: data.index,
										network_id: data.id
									}, function(err, update) {
										console.log('Yelp initial populate callback complete!')
										
										user.save(function(err, save) {
											if(err && err.name !== 'VersionError') {
												Log.error('Error saving to User table', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
												return callback('Error querying User collection')
											}

											// if we have a versioning overwrite error than load up the analytics document again
											if(err && err.name === 'VersionError')
												Model.User.findById(passportUserId, function(err, saveUser) {
													if(err) {
														Log.error('Error querying User collection', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
														return callback('Error querying User collection')
													}

													saveUser.Business[data.index].Social.yelp = user.Business[index].Social.yelp;
													saveUser.markModified('.Business['+indx+'].Social.yelp')

													saveUser.save(function(err, save) {
														if(err) {
															Log.error('Error saving to User collection', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
															return res.json({success: false})
														}

														callback(null, {success: true})
													})
												})
											else
												callback(null, {success: true})
										})
									})
								})
							else 
								processYelpSearch(function(err, list) {
									if(err || !list)
										return callback(err || 'No results we\'re returned');
									callback(null, list);
								})

							function processYelpSearch(cb, retry) {
								if(!data.name || !data.city)
									cb(msg || 'No search parameters provided')

								var location = data.state ? (data.city + ', ' + data.state) : data.city;

								request.get({
									url: yelp.base + 'search?' + qs.stringify({term: data.name.trim(), location: location.trim()}),
									oauth: yelp.client,
									json: true
								},
								function(err, response) {
									// if a connection error occurs retry request (up to 3 attempts) 
									if(err && (response.statusCode === 503 || response.statusCode === 504 || retries.indexOf(err.code) > -1)) {
										if(retry && retry > 2) {
											Error.handler('yelp', 'Yelp business method failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
											return callback(err || response.statusCode || 'Error reaching Yelp');
										}

										return processYelpSearch(cb, retry ? ++retry : 1)
									}

									// error handling
									if(err || (response && response.statusCode !== 200)) {	
										Error.handler('yelp', err || response.statusCode, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
										return callback(err || response.statusCode || 'Error querying Yelp');
									}

									if(response.body && response.body.businesses && response.body.businesses.length)
										cb(null, {list: response.body})
									else
										cb('No businesses were found')
								})
							}

							function checkYelpId(id, cb, retry) {
								request.get({
									url: yelp.base + 'business/' + id,
									oauth: yelp.client,
									json: true
								},
								function(err, response) {
									// if a connection error occurs retry request (up to 3 attempts) 
									if(err && (response.statusCode === 503 || response.statusCode === 504 || retries.indexOf(err.code) > -1)) {
										if(retry && retry > 2) {
											Error.handler('yelp', 'Yelp business method failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
											return cb(false)
										}

										return checkYelpId(id, cb, retry ? ++retry : 1)
									}

									// error handling
									if(err || (response && response.statusCode !== 200) || !response || !response.body) {	
										Error.handler('yelp', err || response.statusCode, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
										return cb(false)
									}

									cb(true);
								})
							}
						})
						
					}
				}
				
			}
		},

		outgoing: {

		}
	}

	io.sockets.on('connection', function (socket) {
		// init is called on initial page load 
		// it checks to see if user is logged in
		// and then returns the uid for firebase
		socket.on('init', function(data, callback) {
			packet.incoming.init(data, callback);
		});

		socket.on('setUid', function(data, callback) {
			packet.incoming.user.setUid(data, callback);
		});

		socket.on('updateUser', function(data, callback) {
			packet.incoming.user.update(data, callback);
		});

		socket.on('setBid', function(data, callback) {
			packet.incoming.business.setBid(data, callback);
		});

		socket.on('updateBusiness', function(data, callback) {
			packet.incoming.business.update(data, callback);
		});

		socket.on('setBusiness', function(data, callback) {
			packet.incoming.business.select(data, callback);
		});

		// not used yet, still handled by server page
		/*socket.on('createBusiness', function(data, callback) {
			packet.incoming.business.create(data, callback);
		});*/

		socket.on('saveGoogle', function(data, callback) {
			packet.incoming.social.google.save(data, callback);
		});

		socket.on('saveYelp', function(data, callback) {
			packet.incoming.social.yelp.save(data, callback);
		});


			socket.on('getModules', function(data, callback) {
console.log(data);
				if(callback) {			
					/*callback({ 
						alerts: 'world2',
						facebook: {
							count: 10,
							messages: [{
								headline: 'New user comment on a Facebook post',
								link: '/social/facebook/notifications'
							}]
						},
						twitter: {
							count: 20,
							messages: [{
								headline: 'New mentions via Twitter',
								link: '/social/twitter/notifications'
							}]
						}

					});*/
					callback({
						modules: [
							{
								id: 'facebook',
								title: 'tip',
								type: 'text', // 'graph', 'text'
								menu: false,
								closeable: true,
								data: {
									viewport: []
								}
							},

							{
								id: 'facebook',
								title: 'notifications',
								type: 'list', // 'graph', 'text'
								icon: 'globe',
								menu: [],
								data: {
									viewport: [],
									help: ''
								}
							},

							{
								id: 'facebook',
								title: 'quick stats',
								class: 'statistics',
								type: 'list', // 'graph', 'text'
								menu: [],
								data: {
									viewport: [],
									help: ''
								}
							},

							{
								id: 'facebook',
								title: 'wall posts',
								class: 'posts', 
								type: 'graph', // 'graph', 'text'
								menu: { 
									custom: [
										{
											label: 'display column view', 
											icon: 'bar-chart',
											action: 'changeDisplay(column)', // 'dashboard', 'hide', 'help', 'resize', 'timeframe'
											current: null, // 'onDashboard', 'offDashboard', 'large', 'small', '30day', '60day'
											meta: null,
											divider: true
										}
									],
									timeframe: ['15 days', '30 days', '90 days']
								},
								data: {
									viewport: []
								}
							},
						]
					});
				}
			});

  	//socket.on('my other event', function (data) {
			//console.log(data);
		//});


		socket.emit('name', {data: 'testing'});
	});

		// public members
		return {
			// public getter functions
			load: function(type) {
				return strategy[type]();
			},

		} // end return object
	} // end constructor

	return {
		getInstance: function(io) {
			if(!socketInstance)
				socketInstance = constructor(io);
			return socketInstance;
		}
	}

})();

module.exports = Socket;