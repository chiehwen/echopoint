// Module dependencies.
var Auth = require('./auth').getInstance(),
		Helper = require('./helpers'),
		Notification = require('./notification'),
		Session = require('./session'),
		Model = Model || Object;


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
	 				Helper.getUser(passportUserId, function(err, user) {
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
		 				Helper.getUser(passportUserId, function(err, user) {
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
						Helper.getUser(passportUserId, function(err, user) {
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
		 				Helper.getUser(passportUserId, function(err, user) {
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
		 				Helper.getUser(passportUserId, function(err, user) {
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
						Helper.getUser(passportUserId, function(err, user) {
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
						Helper.getUser(passportUserId, function(err, user) {
							if(err || !user) callback({success: false, error: err || 'no user found!'});
							
							var timestamp = Helper.timestamp(true) + Helper.randomInt(10000, 99999),
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
				yelp: {
					save: function(data, callback) {
						if(!passportUserId) 
							return callback({success: false, error: err || 'user id error!'});
						
						Helper.getUser(passportUserId, function(err, user) {
							if(err || !user) callback({success: false, error: err || 'no user found!'});

							var yelp = Auth.load('yelp'),
									error = false;

							if(data.id) {
								checkYelpId(data.id, function(success) {
									if(success) {
										user.Business[data.businessIndex].Social.yelp = {id: data.id}
										user.save(function(err) {
											if(err) console.log(err);
										});
										callback(null, {success: true})
										return;
									} else {
										error = 'Invalid Yelp Business ID'
							
									}
								})
							} else {

								if(data.url) {
									var yelpId = processYelpUrl(data.url);
									if(!yelpId) {
										error = 'Invalid Yelp Business URL'
									} else {
										checkYelpId(yelpId, function(success) {
											if(success) {
												user.Business[data.businessIndex].Social.yelp = {id: yelpId}
												user.save(function(err) {
													if(err) console.log(err);
												});
											} else {
												error = 'Invalid Yelp Business URL'
											}
										})
									}
								}
								
								if(data.name && data.city) {
									var location = data.state ? (data.city + ', ' + data.state) : data.city;

									yelp.search({term: data.name.trim(), location: location.trim()}, function(err, response) {
										if(err || response.error) 
											console.log(err, response);
										if(response.businesses && response.businesses.length)
											callback(null, {list: response});
										else
											error = 'No businesses were found'
										return;
									})
								} else {
									error = 'Business name and city are required for search'
								}
							}
							if(error)
								callback(error);

							function processYelpUrl(url) {
								var page = decodeURIComponent(url);
								if (page.indexOf('yelp.com/') == -1)
									return false;

								if (page.indexOf('http://') != -1 || page.indexOf('https://') != -1)
									page = 'http://' + page;

								var path = url.parse(page).pathname;
								return path.substring(path.lastIndexOf('/') + 1);
							}

							function checkYelpId(id, callback) {
								yelp.business(id, function(err, response) {
									callback(err||response.error ? false : true);
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