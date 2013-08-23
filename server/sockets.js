// Module dependencies.
var Auth = require('./auth').getInstance(),
		Notification = require('./notification'),
		Model = Model || Object;


var Socket = (function() {

	// Private attribute that holds the single instance
	var socketInstance;

	function constructor(io) {

	io.sockets.on('connection', function (socket) {
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
								title: 'quick stats',
								class: 'facebook-likes',
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