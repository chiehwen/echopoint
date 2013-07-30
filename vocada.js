/**
 * Module dependencies.
 */
var Boot = require('./server/boot').Bootup,
		Server = require('./server/load').Server,
		Auth = require('./server/auth'),
		Sockets = require('./server/sockets');

Boot.start(function(app) {
	Server = Server.getInstance(app);
	Server.load();
	
	Auth.getInstance().loadStrategy('local').loadSession('local');

	Sockets.getInstance(Server.create());
});




// TEMP: removes all users from User collection
var Model = Model || Object;
//console.log(Model.User.Business);
//Model.User.remove(function(err){if(err) throw err});
//console.log(Model.User.schema);`
Model.User.find(function(err, users) {
		users.forEach(function(user) {
		//console.log(user.Business);
	});
});
Model.User.findOne({email: "123"}, function(err, user) {
	console.log(user);
	console.log(user.Social.twitter.analytics[0]);
	console.log(user.Social.twitter.analytics[0]['entities']);
	//console.log(user.Analytics.facebook[2]);
	//console.log(user.Analytics.facebook[3]);
	//console.log(user.Analytics.meta.update);
	//user.Social.twitter.oauthAccessToken = null;
	//user.Social.twitter.oauthAccessTokenSecret = null;

	//user.Analytics.twitter = [];user.save(function(err,res){});
});




	var Cron = require('./server/analytics');
	// !!!! IMPORTANT: BELOW IS THE TOGGLE FOR 
	// !!!! CRON TESTING !!!
	
Cron.start();

	// !!!!!





// END TEMP