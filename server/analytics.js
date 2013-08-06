/**
 * Cron-based Analytics Processing
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
								tracked = f.analytics.tracking.sort(Helper.sortBy('timestamp', false, parseInt)),
								data = null;

						facebook.setAccessToken(f.oauthAccessToken);

						facebook.get('me', {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
						//facebook.get('me', {fields: 'feed.since(' + since + ')'}, function(err, response) {
						//facebook.get('127692573953699', {fields: 'feed.since(' + since + ').fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
							if(err || typeof response.error !== 'undefined')
								data = {timestamp: 1, posts: [{id: response.error}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
//data = {timestamp: 1, posts: [{id: JSON.stringify(response), timestamp: since}]}							
							if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
								var data = {
									timestamp: Helper.timestamp(),
									posts: []
								}

								response.feed.data.forEach(function(element, index, array) {
									data.posts.push(element);

									var tracking = {
										id: element.id,
										timestamp: Helper.timestamp(),
										likes: {},
										comments: {},
										shares: {}
									};

									if(typeof element.likes !== 'undefined')
										tracking.likes = {
											total: parseInt(element.likes.count, 10),
											new: parseInt(element.likes.count, 10),
											data: element.likes.data
										}

									if(typeof element.comments !== 'undefined')
										tracking.comments = {
											total: element.comments.data.length,
											new: element.comments.data.length,
											data: element.comments.data
										}

									if(typeof element.shares !== 'undefined')
										tracking.shares = {
											total: parseInt(element.shares.count, 10),
											new: parseInt(element.shares.count, 10)
										}

									if(typeof tracking.likes.total !== 'undefined' || typeof tracking.comments.total !== 'undefined' || typeof tracking.shares.total !== 'undefined')
										user.Social.facebook.analytics.tracking.push(tracking);
								});
							}

							if(data) {
								user.Social.facebook.analytics.updates.push(data);
								user.save(function(err,response){});
							}
						});

						facebook.get('me', {fields: 'feed.until(' + since + ').limit(100).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
							if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
								response.feed.data.forEach(function(element, index, array) {
									
									var found = false,
									tracking = {
										id: element.id,
										timestamp: Helper.timestamp(),
										likes: {},
										comments: {},
										shares: {}
									};

									for(var i = 0, l = tracked.length; i < l; i++) {
										
										if(tracked[i].id == element.id) {
											found = true;

											if(typeof element.likes !== 'undefined' && element.likes.count != tracked[i].likes.total)
												tracking.likes = {
													total: parseInt(element.likes.count, 10),
													new: (typeof tracked[i].likes.total !== 'undefined') ? parseInt(element.likes.count - tracked[i].likes.total, 10) : parseInt(element.likes.count, 10),
													data: element.likes.data
												}

											if(typeof element.comments !== 'undefined' && element.comments.length != tracked[i].comments.total)
												tracking.comments = {
													total: element.comments.data.length,
													new: (typeof tracked[i].comments.total !== 'undefined') ? parseInt(element.comments.data.length - tracked[i].comments.total, 10) : parseInt(element.comments.data.length, 10),
													data: element.comments.data
												}

											if(typeof element.shares !== 'undefined' && (element.shares.count != tracked[i].shares.total || typeof tracked[i].shares === 'undefined'))
												tracking.shares = {
													total: parseInt(element.shares.count, 10),
													new: (typeof tracked[i].shares.total !== 'undefined') ? parseInt(element.shares.count - tracked[i].shares.total, 10) : parseInt(element.shares.count, 10)
												}

											break;
										}
									}

									if(!found) {

											if(typeof element.likes !== 'undefined')
												tracking.likes = {
													total: parseInt(element.likes.count, 10),
													new: parseInt(element.likes.count, 10),
													data: element.likes.data
												}

											if(typeof element.comments !== 'undefined')
												tracking.comments = {
													total: element.comments.length,
													new: element.comments.length,
													data: element.comments.data
												}

											if(typeof element.shares !== 'undefined')
												tracking.shares = {
													total: parseInt(element.shares.count, 10),
													new: parseInt(element.shares.count, 10)
												}								
									}

									if(typeof tracking.likes.total !== 'undefined' || typeof tracking.comments.total !== 'undefined' || typeof tracking.shares.total !== 'undefined') {
										user.Social.facebook.analytics.tracking.push(tracking);
										user.save(function(err,response){});
									}

								})
							}
						})
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