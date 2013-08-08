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

				user.Business.forEach(function(business) {

				var f = business.Social.facebook;
				if (
						typeof f.auth.oauthAccessToken !== 'undefined'
						&& typeof f.auth.expires !== 'undefined'
						&& typeof f.auth.created !== 'undefined'
						&& f.auth.oauthAccessToken != ''
						&& f.auth.expires != 0
						&& f.auth.created != 0
						&& f.auth.oauthAccessToken
						&& f.auth.expires
						&& f.auth.created
						&& ((f.auth.created + f.auth.expires) * 1000 > Date.now())
					) {

						Model.Analytics.findOne({id: business.Analytics.id}, function(err, Analytics) {

						var facebook = Auth.load('facebook'),
								updates = Analytics.facebook.updates.sort(Helper.sortBy('timestamp', false, parseInt)),
								since = updates.length ? updates[0].timestamp : 0;
								
						facebook.setAccessToken(f.auth.oauthAccessToken);

						facebook.get('me', {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
						//facebook.get('me', {fields: 'feed.since(' + since + ')'}, function(err, response) {
						//facebook.get('127692573953699', {fields: 'feed.since(' + since + ').fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
							if(err || typeof response.error !== 'undefined')
								console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
						
							if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
								var results = response.feed.data,
										data = {
											timestamp: Helper.timestamp(),
											posts: []
										}

								//response.feed.data.forEach(function(element, index, array) {
								for(var i = 0, l = results.length; i < l; i++) {
									data.posts.push(results[i]);

									var tracking = {
										id: results[i].id,
										timestamp: 0,//Helper.timestamp(),
										likes: {},
										comments: {},
										shares: {}
									};

									if(typeof results[i].likes !== 'undefined')
										tracking.likes = {
											meta: [{
												timestamp: Helper.timestamp(),
												new: results[i].likes.data.length,
											}],
											total: results[i].likes.data.length,
											data: results[i].likes.data
										}

									if(typeof results[i].comments !== 'undefined')
										tracking.comments = {
											meta: [{
												timestamp: Helper.timestamp(),
												new: results[i].comments.data.length
											}],
											total: results[i].comments.data.length,
											data: results[i].comments.data
										}

									if(typeof results[i].shares !== 'undefined')
										tracking.shares = {
											meta: [{
												timestamp: Helper.timestamp(),
												new: parseInt(results[i].shares.count, 10)
											}],
											total: parseInt(results[i].shares.count, 10)
										}


									if(typeof tracking.likes.total !== 'undefined' || typeof tracking.comments.total !== 'undefined' || typeof tracking.shares.total !== 'undefined')
										tracking.timestamp = Helper.timestamp();

									Analytics.facebook.tracking.push(tracking);
								}

								Analytics.facebook.updates.push(data);
								Analytics.save(function(err,response){});
console.log('saved new feed item(s) and related tracking...');			
							}
						});

						facebook.get('me', {fields: 'feed.until(' + since + ').limit(100).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
							if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
								
								var update = false,
										results = response.feed.data;
								//response.feed.data.forEach(function(element, index, array) {
								for(var x = 0, l = results.length; x < l; x++) {
									for(var y = 0, len = Analytics.facebook.tracking.length; y < len; y++) {
										
										if(Analytics.facebook.tracking[y].id == results[x].id) {
											
											if(typeof results[x].likes !== 'undefined' && results[x].likes.data.length != Analytics.facebook.tracking[y].likes.total) {
												Analytics.facebook.tracking[y].likes.meta.push({
													timestamp: Helper.timestamp(),
													new: (typeof Analytics.facebook.tracking[y].likes.total !== 'undefined') ? (results[x].likes.data.length - Analytics.facebook.tracking[y].likes.total) : results[x].likes.data.length
												});
												Analytics.facebook.tracking[y].likes.total = results[x].likes.data.length,
												Analytics.facebook.tracking[y].likes.data = results[x].likes.data;
												update = true;
											}

											if(typeof results[x].comments !== 'undefined' && results[x].comments.data.length != Analytics.facebook.tracking[y].comments.total) {
												Analytics.facebook.tracking[y].comments.meta.push({
													timestamp: Helper.timestamp(),
													new: (typeof Analytics.facebook.tracking[y].comments.total !== 'undefined') ? (results[x].comments.data.length - Analytics.facebook.tracking[y].comments.total) : results[x].comments.data.length
												});
												Analytics.facebook.tracking[y].comments.total = results[x].comments.data.length,
												Analytics.facebook.tracking[y].comments.data = results[x].comments.data;
												update = true;
											}

											if(typeof results[x].shares !== 'undefined' && parseInt(results[x].shares.count, 10) != Analytics.facebook.tracking[y].shares.total) {
												Analytics.facebook.tracking[y].shares.meta.push({
													timestamp: Helper.timestamp(),
													new: (typeof Analytics.facebook.tracking[y].shares.total !== 'undefined') ? (parseInt(results[x].shares.count, 10) - Analytics.facebook.tracking[y].shares.total) : parseInt(results[x].shares.count, 10)
												});
												Analytics.facebook.tracking[y].shares.total = parseInt(results[x].shares.count, 10);
												update = true;
											}

											break;
										}
									}
								}

								if(update) {
									Analytics.save(function(err,response){});
console.log('saved updated tracking...');
								}

							}
						})

						});
					}

				});
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

				user.Business.forEach(function(business) {

				var t = business.Social.twitter;
				if (
						typeof t.auth.oauthAccessToken !== 'undefined'
						&& typeof t.auth.oauthAccessTokenSecret !== 'undefined'
						&& typeof t.id !== 'undefined'
						&& t.auth.oauthAccessToken != ''
						&& t.auth.oauthAccessTokenSecret != ''
						&& t.auth.oauthAccessToken
						&& t.auth.oauthAccessTokenSecret
						&& t.id
					) {

						Model.Analytics.findOne({id: business.Analytics.id}, function(err, Analytics) {

						var twitter = Auth.load('twitter'),
								sorted = {
									updates: Analytics.twitter.updates.sort(Helper.sortBy('since_id', false, parseInt)),
									mentions: Analytics.twitter.tracking.mentions.sort(Helper.sortBy('since_id', false, parseInt)),
									messages: Analytics.twitter.tracking.messages.sort(Helper.sortBy('since_id', false, parseInt))
								},
								since = {
									updates: sorted.updates.length ? sorted.updates[0].since_id : 1,
									mentions: sorted.mentions.length ? sorted.mentions[0].since_id : 1,
									messages: sorted.messages.length ? sorted.messages[0].since_id : 1
								};

						twitter.setAccessTokens(t.auth.oauthAccessToken, t.auth.oauthAccessTokenSecret);
/*
						var params = {
							q: '@speaksocial',
							count: 100,
							since_id: since,
							result_type: 'recent', 
							include_entities: true
						};
*/
						//if(Analytics.length)
							//params.since_id = analytics[0].since_id;
						//twitter.get('search/tweets', params, function(err, response) {

						twitter.get('statuses/user_timeline', {user_id: t.id, since_id: since.updates, count: 100, contributor_details: true}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(response.length) {
								var data = {
									since_id: response[0].id_str,
									timestamp: Helper.timestamp(),
									tweets: []
								}

								for(var i = 0, l = response.length; i < l; i++) {
									data.tweets.push(response[i]);
								}
console.log('saved twitter user timeline...');
								Analytics.twitter.updates.push(data);
								Analytics.save(function(err,res){});
							}
						});

						// @ mentions tracking
						twitter.get('statuses/mentions_timeline', {since_id: since.mentions, count: 200, contributor_details: true, include_rts: true}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(response.length) {
								var data = {
									since_id: response[0].id_str,
									timestamp: Helper.timestamp(),
									mentions: []
								}

								for(var i = 0, l = response.length; i < l; i++) {
									data.mentions.push(response[i]);
								}
console.log('saved user @ mentions...');
								Analytics.twitter.tracking.mentions.push(data);
								Analytics.save(function(err,res){});
							}
						});


						// Retweets tracking
						twitter.get('statuses/retweets_of_me', {count: 100, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(response.length) {
								var update = false;
								for(var x = 0, l = response.length; x < l; x++) {
									var found = false;
									for(var y = 0, len = Analytics.twitter.tracking.retweets.length; y < len; y++) {
										if(Analytics.twitter.tracking.retweets[y].id == response[x].id_str) {
											found = true;
											var count = parseInt(response[x].retweet_count, 10);
											if(Analytics.twitter.tracking.retweets[y].total != count) {
												update = true;
												Analytics.twitter.tracking.retweets[y].meta.push({
													timestamp: Helper.timestamp(),
													new: (count - Analytics.twitter.tracking.retweets[y].total)
												});
												Analytics.twitter.tracking.retweets[y].total = count;
											}
											break;
										}
									}

									if(!found) {
										update = true;
										var count = parseInt(response[x].retweet_count, 10),
												retweet = {
													id: response[x].id_str,
													meta: [{
														timestamp: Helper.timestamp(),
														new: count
													}],
													timestamp: Helper.timestamp(),
													total: count,
													new: count
												}
										Analytics.twitter.tracking.retweets.push(retweet);
									}
								};

								if(update) {
console.log('saved retweets count...');
									Analytics.save(function(err,res){});
								}
							}
						});

/*
						// Direct message tracking
						twitter.get('direct_messages', {since_id: since.messages, count: 200}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

							if(response.length) {
								var data = {
									since_id: response[0].id_str,
									timestamp: Helper.timestamp(),
									messages: []
								}

								for(var i = 0, l = response.length; i < l; i++) {
									data.messages.push(response[i]);
								}
console.log('saved new DM\'s...');
								Analytics.twitter.tracking.messages.push(data);
								Analytics.save(function(err,res){});
							}
						});
*/
					
					}); // End of Analytics model array
					} // End of twitter credentials if statement
				
				}); // End of business forEach
			}); // End of users forEach
		}); // End of Model users array
	}, // End of onTick Cron function

	start: false
});


module.exports = twitterCron;