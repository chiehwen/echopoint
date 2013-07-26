/**
 * Social Controller
 */

var Auth = require('./auth').getInstance(),
		Helper = require('./helpers'),
		Cron = require('cron').CronJob,
		Model = Model || Object;

var facebookCron = new Cron({
	cronTime: '0 * * * * *',
	onTick: function() {

		//console.log('You will see this message every hour');
		Model.User.find(function(err, users) {
			users.forEach(function(user) {

				var f = user.Social.facebook;
				if (
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

						var facebook = Auth.load('facebook'),
								analytics = user.Analytics.facebook.sort(Helper.sortBy('timestamp', false, parseInt)),
								since = analytics.length ? analytics[0].timestamp : 0,
								data = null;

						facebook.setAccessToken(f.oauthAccessToken);

						facebook.get('me', {fields: 'feed.since(' + since + ').fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
							if(err || typeof response.error !== 'undefined')
								data = {timestamp: 1, posts: [{id: response.error}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
								var data = {
									timestamp: Helper.timestamp(),
									posts: []
								}

								response.feed.data.forEach(function(element, index, array) {
									data.posts.push(element);
								});
							}

							if(data) {
								user.Analytics.facebook.push(data);
								user.save(function(err,res){});
							}
						});
					}
			});
		});
	},

	start: false
});



var twitterCron = new Cron({
	cronTime: '0 0 * * * *',
	onTick: function() {

		//console.log('You will see this message every hour');
		Model.User.find(function(err, users) {
			users.forEach(function(user) {

				var t = user.Social.twitter;
				if (
						typeof t.oauthAccessToken !== 'undefined'
						&& typeof t.oauthAccessTokenSecret !== 'undefined'
						&& t.oauthAccessToken != ''
						&& t.oauthAccessTokenSecret != ''
						&& t.oauthAccessToken
						&& t.oauthAccessTokenSecret
					) {

						var twitter = Auth.load('twitter'),
								analytics = user.Analytics.twitter.sort(Helper.sortBy('timestamp', false, parseInt)),
								since = analytics.length ? analytics[0].timestamp : 0,
								data = null;

						twitter.setAccessTokens(t.oauthAccessToken, t.oauthAccessTokenSecret);

						twitter.get('search/tweets', {q: '@speaksocial'}, function(err, response) {
							if(err || typeof response.error !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(typeof response.id !== 'undefined' && response.feed.data.length) {
								var data = {
									timestamp: Helper.timestamp(),
									tweets: []
								}

								//response.feed.data.forEach(function(element, index, array) {
									//data.posts.push(element);
								//});
							}

							if(data) {
								user.Analytics.twitter.push(data);
								user.save(function(err,res){});
							}
						});
					}
			});
		});
	},

	start: false
});


module.exports = facebookCron;