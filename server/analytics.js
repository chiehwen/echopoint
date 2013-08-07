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
											total: element.likes.data.length,
											new: element.likes.data.length,
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
console.log('saved new feed item(s)...');								
							}
						});

						facebook.get('me', {fields: 'feed.until(' + since + ').limit(100).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
							if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
								response.feed.data.forEach(function(element, index, array) {
									
									var found = false,
											update = false,
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

											if(typeof element.likes !== 'undefined' && element.likes.data.length != tracked[i].likes.total) {
												tracking.likes = {
													total: element.likes.data.length,
													new: (typeof tracked[i].likes.total !== 'undefined') ? (element.likes.data.length - tracked[i].likes.total) : element.likes.data.length,
													data: element.likes.data
												}
												update = true;
											} else {
												tracking.likes.total = tracked[i].likes.total;
											}

											if(typeof element.comments !== 'undefined' && element.comments.data.length != tracked[i].comments.total) {
												tracking.comments = {
													total: element.comments.data.length,
													new: (typeof tracked[i].comments.total !== 'undefined') ? (element.comments.data.length - tracked[i].comments.total) : element.comments.data.length,
													data: element.comments.data
												}
												update = true;
											} else {
												tracking.comments.total = tracked[i].comments.total;
											}

											if(typeof element.shares !== 'undefined' && parseInt(element.shares.count, 10) != tracked[i].shares.total) {
												tracking.shares = {
													total: parseInt(element.shares.count, 10),
													new: (typeof tracked[i].shares.total !== 'undefined') ? (parseInt(element.shares.count, 10) - tracked[i].shares.total) : parseInt(element.shares.count, 10)
												}
												update = true;
											} else {
												tracking.shares.total = tracked[i].shares.total;
											}

											if(update) {

												user.Social.facebook.analytics.tracking.push(tracking);
												user.save(function(err,response){});
console.log('saved updated tracking...');
											}

											break;
										}
									}

									if(!found) {

											if(typeof element.likes !== 'undefined')
												tracking.likes = {
													total: element.likes.data.length,
													new: element.likes.data.length,
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

											if(typeof tracking.likes.total !== 'undefined' || typeof tracking.comments.total !== 'undefined' || typeof tracking.shares.total !== 'undefined') {
												user.Social.facebook.analytics.tracking.push(tracking);
												user.save(function(err,response){});
		console.log('saved new tracking...');
											}																		
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
						&& typeof t.id !== 'undefined'
						&& t.oauthAccessToken != ''
						&& t.oauthAccessTokenSecret != ''
						&& t.oauthAccessToken
						&& t.oauthAccessTokenSecret
						&& t.id
					) {

						var twitter = Auth.load('twitter'),
								sorted = {
									updates: t.analytics.updates.sort(Helper.sortBy('since_id', false, parseInt)),
									mentions: t.analytics.tracking.mentions.sort(Helper.sortBy('since_id', false, parseInt)),
									messages: t.analytics.tracking.messages.sort(Helper.sortBy('since_id', false, parseInt))
								},
								since = {
									updates: sorted.updates.length ? sorted.updates[0].since_id : 0,
									mentions: sorted.mentions.length ? sorted.mentions[0].since_id : 0,
									messages: sorted.messages.length ? sorted.messages[0].since_id : 0
								},
								data = null;

						twitter.setAccessTokens(t.oauthAccessToken, t.oauthAccessTokenSecret);
/*
						var params = {
							q: '@speaksocial',
							count: 100,
							since_id: since,
							result_type: 'recent', 
							include_entities: true
						};
*/
						//if(analytics.length)
							//params.since_id = analytics[0].since_id;

						//twitter.get('search/tweets', params, function(err, response) {
						twitter.get('statuses/user_timeline', {user_id: req.session.twitter.id, since_id: since.updates, count: 100, contributor_details: true}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							//if(typeof response.statuses !== 'undefined' && response.statuses.length) {
							if(response.length) {
								var data = {
									since_id: response[0].id_str,
									timestamp: Helper.timestamp(),
									tweets: []
								}

								response.forEach(function(element, index, array) {
									data.tweets.push(element);
								});
							}

							if(data) {
								user.Social.twitter.analytics.updates.push(data);
								user.save(function(err,res){});
							}
						});

						// @ mentions tracking
						twitter.get('statuses/mentions_timeline', {since_id: since.mentions, count: 200, contributor_details: true, include_rts: true}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							//if(typeof response.statuses !== 'undefined' && response.statuses.length) {
							if(response.length) {
								var data = {
									since_id: response[0].id_str,
									timestamp: Helper.timestamp(),
									mentions: []
								}

								response.forEach(function(element, index, array) {
									data.mentions.push(element);
								});
							}

							if(data) {
								user.Social.twitter.analytics.tracking.mentions.push(data);
								user.save(function(err,res){});
							}
						});


				// Retweets tracking
						twitter.get('statuses/retweets_of_me', {since_id: since.messages, count: 100, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							if(response.length) {

								//response.forEach(function(element, index, array) {
								for(var x = 0, l = response.length; x < l; x++) {
									var found = false;
									for(var y = 0, len = t.analytics.tracking.retweets.length; y < len; y++) {
										if(t.analytics.tracking.retweets[y].id == response[x].id_str) {
											found = true;
											var count = parseInt(response[x].retweet_count, 10);
											if(t.analytics.tracking.retweets[y].total != count) {
												user.Social.twitter.analytics.tracking.retweets[y].meta.push({
													timestamp: Helper.timestamp(),
													new: (count - t.analytics.tracking.retweets[y].total)
												});
												user.Social.twitter.analytics.tracking.retweets[y].total = count;
											}
											break;
										}
									}

									if(!found) {
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
										user.Social.twitter.analytics.tracking.retweets.push(retweet);
									}
								};

								user.save(function(err,res){});
							}

						});


						// Direct message tracking
						twitter.get('direct_messages', {since_id: since.messages, count: 200}, function(err, response) {
							if(err || typeof response.errors !== 'undefined')
								console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
							//if(typeof response.statuses !== 'undefined' && response.statuses.length) {
							if(response.length) {
								var data = {
									since_id: response[0].id_str,
									timestamp: Helper.timestamp(),
									messages: []
								}

								response.forEach(function(element, index, array) {
									data.messagess.push(element);
								});
							}

							if(data) {
								user.Social.twitter.analytics.tracking.messages.push(data);
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