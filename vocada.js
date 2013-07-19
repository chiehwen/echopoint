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

var sys = require('sys');
var oauth = require('oauth');
var _twitterConsumerKey = "9DFn7r4ir7Z4uPSy7ZEQbA";
var _twitterConsumerSecret = "W94Yo4iCRvltpktHCvsAUWD3qBNdyD0bBwk9r34";
 
/*function consumer() {
  return new oauth.OAuth(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token", 
    _twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://badgestar.com/sessions/callback", "HMAC-SHA1");   
}

  consumer().getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results){
    if (error) {
      console.log("Error getting OAuth request token : " + sys.inspect(error), 500);
    } else {  
      console.log(oauthToken);
      console.log(oauthTokenSecret);
      console.log(oauthToken);      
    }
  });*/

// END TEMP