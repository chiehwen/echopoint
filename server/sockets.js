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
			socket.on('notifications', function(callback) {
				callback({ 
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

				});
			});
		//}, 5000);
  	//socket.on('my other event', function (data) {
			//console.log(data);
		//});
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