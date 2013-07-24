/**
 * Social Controller
 */

var Auth = require('../server/auth').getInstance(),
		Cron = require('cron').CronJob,
		Model = Model || Object;


var facebookCron = new Cron({
	cronTime: '*/15 * * * * *',
	onTick: function() {
		console.log('You will see this message every second');
		Model.User.findOne({email: "123"}, function(err, user) {
			//user.Analytics.yelp.push({id: "work harder at it"});
			//user.save(function(err) {});

		});

		Model.User.find(function(err, users) {
				users.forEach(function(user) {

				var f = user.Social.facebook;

				if(
						typeof f.oauthAccessToken !== 'undefined'
						&& typeof f.expires !== 'undefined'
						&& typeof f.created !== 'undefined'
						&& f.oauthAccessToken != ''
						&& f.expires != 0
						&& f.created != 0
						&& f.oauthAccessToken
						&& f.expires
						&& f.created
						&& ((f.created + f.expires) * 1000 > Date.now())
					) {

						var facebook = Auth.load('facebook');
						facebook.setAccessToken(f.oauthAccessToken);

						facebook.get('me', function(err, res) {
							user.Social.yelp.id = JSON.stringify(res);
							user.save(function(err,res){});
						});
				}

			});
		});


	},
	start: false
});

module.exports = facebookCron;