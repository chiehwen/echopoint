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
//Model.User.remove(function(err){if(err) throw err});Model.Analytics.remove(function(err){if(err) throw err});Model.Followers.remove(function(err){if(err) throw err});
//console.log(Model.User.schema);`
Model.Analytics.find(function(err, analytic) {
	analytic.forEach(function(user) {
		//console.log(user.facebook.tracking.posts[0]);
		
		//for(var x=0,l=user.twitter.timeline.tweets.length;x<l;x++)
			//console.log(x);
			//console.log(user.twitter.timeline.tweets[x].retweets);

			//if(user.facebook.tracking.posts[x].insights)
		//console.log(user.twitter.tracking.followers.dropped);

			Model.Followers.findOne({id: user.id},function(err, followers) {
				//console.log(followers);
				//followers.twitter = [];followers.save(function(err){})
			})

			//console.log(user.twitter.tracking)
		//console.log('new array: ', user.twitter.friends.new.length);
		//console.log('new array: ', user.twitter.followers.new.length);

		//user.twitter.friends.active = [];
		//user.twitter.friends.new = [];
		//user.save(function(err,res){});

//		console.log(user.twitter.mentions.list[0])
		for(var i=0,l=user.twitter.timeline.tweets.length; i<l;i++) {
			if(user.twitter.timeline.tweets[i].retweets)
				if(user.twitter.timeline.tweets[i].retweets.retweeters) {
					//console.log(user.twitter.timeline.tweets[i])
					break;
				}
		}
		/*var hol = 0;
		for(var i=0,l=user.google.reviews.active.length; i<l;i++) {
			//if(user.google.reviews.active[i].user.id)
				//console.log(user.google.reviews.active[i])
			hol += user.google.reviews.active[i].review.rating;
		}*/

		//console.log((hol / (user.google.reviews.active.length * 1000)).toFixed(2));

		//user.google.reviews.active = [];
		//user.save(function(err,res){});

	});
});

var request = require('request');
var OAuth2 = require('oauth').OAuth2; 
console.log(new Buffer('xvz1evFS4wEEPTGEFPHBog:L8qq9PZyRg6ieKGEKhZolGC0vJWLw8iEJ88DRdyOg').toString('base64'))
/*request.post('https://api.twitter.com/1.1/oauth2/token', 
	{ 
		//form: {
		//	"f.req": '["' + Analytics.google.business.page.local.id + '",null,[null,null,[[28,' + pagination + ',' + count + ',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}],[30,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{}]]],[null,null,false,true,3,true]]', 
		//	at: 'AObGSAiOtoNHKnLAO-PWRdWXOASNwMAl4g:1379699578795'
		//},
		headers: {
			'Authorization': 'Basic ' + new Buffer('ymPfLoyL7T53O5vPRByMA:QrMG1wV0Pn3SmuNyXoHaDCdbCK3CsEIm0pDoSg3U').toString('base64'),
			//'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		},
		form: {
			grant_type: "client_credentials"
		}
		//body: "grant_type=client_credentials".toString()
	}, 
	function(err, ressy) {
		console.log(err, ressy.body)
	}
)*/
var oauth2 = new OAuth2('ymPfLoyL7T53O5vPRByMA', 'QrMG1wV0Pn3SmuNyXoHaDCdbCK3CsEIm0pDoSg3U', 'https://api.twitter.com/', null, 'oauth2/token', null);

oauth2.getOAuthAccessToken('', {
    'grant_type': 'client_credentials'
  }, function (e, access_token) {
      console.log(e, access_token); //string that we can use to authenticate request
});

//Model.Twitter.remove(function(err){if(err) throw err})
//var connections = new Model.Connections({});
//connections.save(function(err,com) {});
Model.Connections.find(function(err, con) {
	console.log('Twitter document length: ', con.length)
	//con.forEach(function(use) {
		//use.push({id: 1922})
		//use.save(function(er,s) {})
	//console.log(use)
//console.log(use.Klout.id("525880ff3d9ae1ad50000023"));
	//});
});

var Helper = require('./server/helpers');
Model.Connections.findOne(
{
	klout_id: {$exists: false}, 
	$or: [
		{twitter_id: {$exists: true}}, 
		{google_id: {$exists: true}}
	], 
	$or: [
		{'meta.klout.attempt_timestamp': {$exists: false}}, 
		{
			$and: [
				{'meta.klout.success': {$exists: false}}, 
				{'meta.klout.attempt_timestamp': {$lt: Helper.timestamp() - 1296000 /* 1296000 = 15 days */} }
			]
		}
	] 
}, function(err, con) {
	//console.log(err, con);
	console.log('Twitter OR query: ', con)
	//con.forEach(function(use) {
		//use.push({id: 1922})
		//use.save(function(er,s) {})
	//console.log(use)
//console.log(use.Klout.id("525880ff3d9ae1ad50000023"));
	//});
});

//Model.Klout.remove(function(err){if(err) throw err});
//var newAnalytics = new Model.Klout({
							//id: i,
							//handle: 'scottrcarlson'
							//name: req.body.name
						//});


//Model.Klout.collection.insert([{id: i}, {id: i+100}], function(er, s) {console.log(er, s);})


//Model.Connections.remove(function(err){if(err) throw err});

//Model.Connections.collection.insert(usersArray, {continueOnError: true}, function(er, s) {console.log(er, s);})
//30399302251492452
Model.Connections.findOne({klout_id: 30399302251492452}, function(err, dat) {
 console.log(dat)
})

Model.Connections.find({twitter_id: {$exists: true}, Twitter: {$exists: false}}, null, {/*limit: 10*/}, function(err, users) {
console.log('len: ', users.length, users[0])
//con.klout_id = 123;
//con.Klout = {id: 123};
//con.save(function(err,s){});
	//con.forEach(function(use) {
		//console.log('twit: ', use)
	//})
})
//newAnalytics.push()
//newAnalytics.save(function(err, sav) {})

//, {Klout: {$elemMatch: {handle: {$exists: true}}}},
	//Model.Klout.find({handle: {$exists: false}}, /*{$elemMatch: {Klout: {$exists: true}}},*/ function(err, connection) {
	//console.log(connection); //connection.Klout[0]
//})

Model.User.findOne({email: "123"}, function(err, user) {
//	console.log(user);
	//console.log(user.Business[0]);

	//console.log(user.Business[0].Social.google.auth.oauthAccessToken);
	//user.Business[0].Social.google.auth.oauthAccessToken = '';
	//user.Business[0].Social.yelp.id = '';
	//user.Business[0].Social.facebook = {}
	//user.Business[0].Social.facebook = {}
	//user.uid = '';
//	console.log(user.Social.facebook.analytics.updates[0]);
//	console.log(user.Social.facebook.analytics.tracking[21]);
//	console.log(user.Social.twitter.analytics.updates[0]);
//	console.log(user.Business[0].Social.yelp.id);
//user.Business[0].Social.yelp.id = '';
//user.save(function(err,res){});
//console.log(user.Business[0]);

	//console.log(user.Social.twitter.analytics[0]['entities']);
	//console.log(user.Social.facebook.analytics.updates[1]);
	//console.log(user.Social.facebook.analytics.updates[4]);
	//console.log(user.Analytics.meta.update);
	//user.Social.twitter.oauthAccessToken = null;
	//user.Social.twitter.oauthAccessTokenSecret = null;

	/*Model.User.findOne({email: "123", 'Business._id': user.Business[3]._id}, {'Business.$': 1}, {lean: false}, function(err, biz) {
		console.log(biz);
		biz.Business[0].name = 'silly co';
		biz.save(function(err, res){});
	})*/
	//user.Business = [];
	//user.save(function(err,res){});
});




	var Cron = require('./server/cron');
	// !!!! IMPORTANT: BELOW IS THE TOGGLE FOR 
	// !!!! CRON TESTING !!!
	
//Cron.facebook.feed.start();
//Cron.facebook.insights.start();

//Cron.twitter.timeline.start();
//Cron.twitter.connections.start();
//Cron.twitter.users.start();

//Cron.foursquare.start();

//Cron.google.start();

//Cron.yelp.start();

Cron.klout.start();


var googlePageData = require('./server/harvesters/tmpPageData/googlePage'); // TEMP

//console.log(googlePageData.json[0][1][11][0][1][5]);

		var reviews = googlePageData.json[0][1][11][0],
				reviewObjects = [];

		for(var i=0, l=reviews.length; i<l;i++) {
			reviewObjects.push({
				user: {
					name: reviews[i][0][0][1],
					page: reviews[i][0][0][3][0] || reviews[i][0][0][0],
					photo: reviews[i][0][1]
				},
				review: {
					complete: reviews[i][3],
					summary: reviews[i][4]
				},
				lang_code: reviews[i][30],
				relative_time:reviews[i][5],
				reference: reviews[i][33],
				//timestamp: Helper.timestamp()
			});
		}

//console.log(reviewObjects);


	// !!!!0

// END TEMP