/**
 * Module dependencies.
 */
var Boot = require('./server/boot').Bootup,
		Server = require('./server/load').Server,
		Auth = require('./server/auth');

Boot.start(function(app) {
	Server = Server.getInstance(app);
	Server.load();
	
	Auth.getInstance().loadStrategy('local').loadSession('local');

	Server.create();
});



// TEMP: removes all users from User collection
var Model = Model || Object;
//Model.User.remove(function(err){if(err) throw err});
//console.log(Model.User.schema);
Model.User.find(function(err, users) {
		users.forEach(function(user) {
		//console.log(user);
	});
});
Model.User.findOne({email: "123"}, function(err, user) {
	//console.log(user);
});
// END TEMP