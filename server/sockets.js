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

	io.sockets.on('connection', function (socket) {
		// init is called on initial page load 
		// it checks to see if user is logged in
		// and then returns the uid for firebase
		socket.on('init', function(data, callback) {
			var sid = data.sid.replace('s:','').split('.')[0],
					passportUserId = JSON.parse(Session.store.sessions[sid]).passport.user;

			if(passportUserId && passportUserId != '') {
 				Helper.getUser(passportUserId, function(err, user) {
 					if (err || !user) callback(false, null, '');
 					callback(true, passportUserId, user.uid);
				});
			} else {
				callback(false, null, '');
			}
			
		});

		socket.on('setUid', function(data, callback) {
			if(data.passport) {
 				Helper.getUser(data.passport, function(err, user) {
 					if (err || !user) callback(err);
 					user.uid = data.uid;
 					user.save(function(err){
 						if(err) callback(err);
 						callback(null);
 					});
				});
			} else {
				callback('not logged it!');
			}
		});

		//setTimeout(function() {
			socket.on('getModules', function(data, callback) {
console.log(callback);
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
								title: 'notifications',
								type: 'list', // 'graph', 'text'
								icon: 'globe',
								menu: [
									//['manage', 'dashboard'],
									//['hide'],
									//['help']

								/*	{
										label: 'manage notification', 
										icon: 'wrench',
										action: 'manage', // 'dashboard', 'hide', 'help', 'resize', 'timeframe'
										current: null, // 'onDashboard', 'offDashboard', 'large', 'small', '30day', '60day'
										meta: null,
										divider: false
									},
									{
										label: 'add to dashboard', 
										icon: 'flag-alt',
										action: 'dashboard', // 'dashboard', 'hide', 'help', 'resize', 'timeframe'
										current: false, // 'onDashboard(or false)', 'offDashboard(or true)', 'large', 'small', '30day', '60day'
										meta: null,
										divider: false
									},
									{
										label: 'hide notification box', 
										icon: 'eye-close',
										action: 'hide', // 'dashboard', 'hide', 'help', 'resize', 'timeframe'
										current: null, // 'onDashboard(or false)', 'offDashboard(or true)', 'large', 'small', '30day', '60day'
										meta: null,
										divider: true
									},
									{
										label: 'help', 
										icon: 'question-sign',
										action: 'help', // 'dashboard', 'hide', 'help', 'resize', 'timeframe'
										current: null, // 'onDashboard(or false)', 'offDashboard(or true)', 'large', 'small', '30day', '60day'
										meta: null,
										divider: true
									} */
								],
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
									viewport: [],
									help: ''
								}
							}
						]
					});
				}
			});
		//}, 5000);
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