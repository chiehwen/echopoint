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
								analytics = f.analytics.updates.sort(Helper.sortBy('timestamp', false, parseInt)),
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
								user.Social.facebook.analytics.updates.push(data);
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
	cronTime: '0 * * * * *',
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
								analytics = t.analytics.sort(Helper.sortBy('since_id', false, parseInt)),
								since = analytics.length ? analytics[0].since_id : 0,
								data = null;

						twitter.setAccessTokens(t.oauthAccessToken, t.oauthAccessTokenSecret);

						var params = {
							q: '@speaksocial',
							count: 100,
							since_id: since,
							result_type: 'recent', 
							include_entities: true
						};

						//if(analytics.length)
							//params.since_id = analytics[0].since_id;

						twitter.get('search/tweets', params, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(typeof response.statuses !== 'undefined' && response.statuses.length) {
								var data = {
									since_id: response.statuses[0].id_str,
									tweets: []
								}

								response.statuses.forEach(function(element, index, array) {
									data.tweets.push(element);
								});
							}

							if(data) {
								user.Social.twitter.analytics.push(data);
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