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
	//console.log(user.Analytics.yelp[0]);
	//user.Social.twitter.oauthAccessToken = null;
	//user.Social.twitter.oauthAccessTokenSecret = null;
	//user.Analytics.yelp = [];
	//user.save(function(err,res){});
	/*Model.User.update({email: '123'}, {$set: {
										Social: {
											twitter: {
												oauthAccessToken: null,
												oauthAccessTokenSecret: null
											}
										} 
									}},
									function(err){
										if (err) return next(err);

										}
									);*/
});


var Cron = require('./server/analytics');
//Cron.start();

// END TEMP