/*
 * Cron-based Analytics Processing
 */

var Auth = require('./auth').getInstance(),
		Helper = require('./helpers'),
		Cron = require('cron').CronJob,
		Model = Model || Object;

var CronJobs = {
	facebook: new Cron({
		cronTime: '0 * * * * *',
		onTick: function() {

			//console.log('You will see this message every hour');
			Model.User.find(function(err, users) {
				users.forEach(function(user) {

					user.Business.forEach(function(business, indx) {

					var f = business.Social.facebook;
					if (
							typeof f.auth.oauthAccessToken !== 'undefined'
							&& typeof f.auth.expires !== 'undefined'
							&& typeof f.auth.created !== 'undefined'
							&& typeof f.account.id !== 'undefined'
							&& typeof f.account.oauthAccessToken !== 'undefined'
							&& f.auth.oauthAccessToken != ''
							&& f.auth.expires != 0
							&& f.auth.created != 0
							&& f.account.id != ''
							&& f.account.oauthAccessToken != ''
							&& f.auth.oauthAccessToken
							&& f.auth.expires
							&& f.auth.created
							&& f.account.id
							&& f.account.oauthAccessToken
							&& ((f.auth.created + f.auth.expires) * 1000 > Date.now())
						) {

							Model.Analytics.findOne({id: business.Analytics.id}, function(err, Analytics) {

							var facebook = Auth.load('facebook'),
									posts = Analytics.facebook.tracking.posts.sort(Helper.sortBy('timestamp', false, parseInt)),
									since = posts.length ? posts[0].timestamp : 0;
									
							facebook.setAccessToken(f.auth.oauthAccessToken);

							// check for updates to general business information
							facebook.get(f.account.id, {fields: 'name,category,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
								if(err || typeof response.error !== 'undefined')
									console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

									var cached = Analytics.facebook.business.changes,
									update = false;

									if(typeof cached === 'undefined') {
										update = true;
										Analytics.facebook.business = {
											timestamp: Helper.timestamp(),
											changes: response
										}
									} else if(response.name != cached.name || response.category != cached.category || response.description != cached.description || response.about != cached.about || response.location.street != cached.location.street || response.website != cached.website || response.username != cached.username) {
										update = true;
										Analytics.facebook.business = {
											timestamp: Helper.timestamp(),
											changes: {
												name: (response.name != cached.name) ? response.name : null,
												category: (response.category != cached.category) ? response.category : null,
												description: (response.description != cached.description) ? response.description : null,
												about: (response.about != cached.about) ? response.about : null,
												location: (response.location.street != cached.location.street) ? response.location : null,
												website: (response.website != cached.website) ? response.website : null,
												username: (response.username != cached.username) ? response.username : null
											}
										}	
									}

									if(update) {
										user.Business[indx].Social.facebook.account.data = response;
										user.save(function(err) {console.log(err)});
									}

									if(response.likes != Analytics.facebook.tracking.page.likes.total) {
										Analytics.facebook.tracking.page.likes.meta.push({
											timestamp: Helper.timestamp(),
											total: response.likes
										});
										Analytics.facebook.tracking.page.likes.total = response.likes;
										Analytics.facebook.tracking.page.likes.timestamp = Helper.timestamp();
									}

									if(response.checkins != Analytics.facebook.tracking.page.checkins.total) {
										Analytics.facebook.tracking.page.checkins.meta.push({
											timestamp: Helper.timestamp(),
											total: response.checkins
										});
										Analytics.facebook.tracking.page.checkins.total = response.checkins;
										Analytics.facebook.tracking.page.checkins.timestamp = Helper.timestamp();
									}

									//if(response.talking != Analytics.facebook.tracking.page.talking.total) {
										//update = true;
										Analytics.facebook.tracking.page.talking.meta.push({
											timestamp: Helper.timestamp(),
											total: response.talking_about_count
										});
										//Analytics.facebook.tracking.page.talking.total = response.talking_about_count;
										Analytics.facebook.tracking.page.talking.timestamp = Helper.timestamp();
									//}

									if(response.were_here_count != Analytics.facebook.tracking.page.were_here.total) {
										Analytics.facebook.tracking.page.were_here.meta.push({
											timestamp: Helper.timestamp(),
											total: response.were_here_count
										});
										Analytics.facebook.tracking.page.were_here.total = response.were_here_count;
										Analytics.facebook.tracking.page.were_here.timestamp = Helper.timestamp();
									}

									Analytics.save(function(err,response){});
console.log('saved updated business info and initial tracking info');	
							});

							facebook.get('me', {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
							//facebook.get('me', {fields: 'feed.since(' + since + ')'}, function(err, response) {
							//facebook.get('127692573953699', {fields: 'feed.since(' + since + ').fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
								if(err || typeof response.error !== 'undefined')
									console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
							
								if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
									var results = response.feed.data;

									for(var i = 0, l = results.length; i < l; i++) {

										var post = {
											id: results[i].id,
											timestamp: Helper.timestamp(),
											data: results[i],
											likes: {},
											comments: {},
											shares: {}
										};

										if(typeof results[i].likes !== 'undefined')
											post.likes = {
												meta: [{
													timestamp: Helper.timestamp(),
													total: results[i].likes.data.length
													//new: results[i].likes.data.length,
												}],
												timestamp: Helper.timestamp(),
												total: results[i].likes.data.length,
												data: results[i].likes.data
											}

										if(typeof results[i].comments !== 'undefined')
											post.comments = {
												meta: [{
													timestamp: Helper.timestamp(),
													total: results[i].comments.data.length
													//new: results[i].comments.data.length
												}],
												timestamp: Helper.timestamp(),
												total: results[i].comments.data.length,
												data: results[i].comments.data
											}

										if(typeof results[i].shares !== 'undefined')
											post.shares = {
												meta: [{
													timestamp: Helper.timestamp(),
													total: parseInt(results[i].shares.count, 10)
													//new: parseInt(results[i].shares.count, 10)
												}],
												timestamp: Helper.timestamp(),
												total: parseInt(results[i].shares.count, 10)
											}


										//if(typeof tracking.likes.total !== 'undefined' || typeof tracking.comments.total !== 'undefined' || typeof tracking.shares.total !== 'undefined')
											//tracking.timestamp = Helper.timestamp();

										Analytics.facebook.tracking.posts.push(post);
									}

									//Analytics.facebook.updates.push(data);
									Analytics.save(function(err,response){});
	console.log('saved new feed item(s) and related tracking...');			
								}
							});

							facebook.get('me', {fields: 'feed.until(' + since + ').limit(200).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
								if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
									
									var update = false,
											results = response.feed.data;
									//response.feed.data.forEach(function(element, index, array) {
									for(var x = 0, l = results.length; x < l; x++) {
										for(var y = 0, len = Analytics.facebook.tracking.posts.length; y < len; y++) {
											
											if(Analytics.facebook.tracking.posts[y].id == results[x].id) {
												
												if(typeof results[x].likes !== 'undefined' && results[x].likes.data.length != Analytics.facebook.tracking.posts[y].likes.total) {
													Analytics.facebook.tracking.posts[y].likes.meta.push({
														timestamp: Helper.timestamp(),
														total: results[x].likes.data.length
														//new: (typeof Analytics.facebook.tracking.posts[y].likes.total !== 'undefined') ? (results[x].likes.data.length - Analytics.facebook.tracking.posts[y].likes.total) : results[x].likes.data.length
													});
													Analytics.facebook.tracking.posts[y].likes.timestamp = Helper.timestamp();
													Analytics.facebook.tracking.posts[y].likes.total = results[x].likes.data.length,
													Analytics.facebook.tracking.posts[y].likes.data = results[x].likes.data;
													update = true;
												}

												if(typeof results[x].comments !== 'undefined' && results[x].comments.data.length != Analytics.facebook.tracking.posts[y].comments.total) {
													Analytics.facebook.tracking.posts[y].comments.meta.push({
														timestamp: Helper.timestamp(),
														total: results[x].comments.data.length
														//new: (typeof Analytics.facebook.tracking.posts[y].comments.total !== 'undefined') ? (results[x].comments.data.length - Analytics.facebook.tracking.posts[y].comments.total) : results[x].comments.data.length
													});
													Analytics.facebook.tracking.posts[y].comments.timestamp = Helper.timestamp();
													Analytics.facebook.tracking.posts[y].comments.total = results[x].comments.data.length,
													Analytics.facebook.tracking.posts[y].comments.data = results[x].comments.data;
													update = true;
												}

												if(typeof results[x].shares !== 'undefined' && parseInt(results[x].shares.count, 10) != Analytics.facebook.tracking.posts[y].shares.total) {
													Analytics.facebook.tracking.posts[y].shares.meta.push({
														timestamp: Helper.timestamp(),
														total: parseInt(results[x].shares.count, 10)
														//new: (typeof Analytics.facebook.tracking.posts[y].shares.total !== 'undefined') ? (parseInt(results[x].shares.count, 10) - Analytics.facebook.tracking.posts[y].shares.total) : parseInt(results[x].shares.count, 10)
													});
													Analytics.facebook.tracking.posts[y].shares.timestamp = Helper.timestamp();
													Analytics.facebook.tracking.posts[y].shares.total = parseInt(results[x].shares.count, 10);
													update = true;
												}

												break;
											}
										}
									}

									if(update) {
										Analytics.save(function(err){});
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
	}),


	twitter: new Cron({
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
							twitter.get('statuses/mentions_timeline', {since_id: since.mentions, count: (since.updates === 1 ? 1 : 200), contributor_details: true, include_rts: true}, function(err, response) {
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
										Analytics.save(function(err){});
									}
								}
							});

	/*
							// Direct message tracking
							twitter.get('direct_messages', {since_id: since.messages, count: (since.updates === 1 ? 1 : 200)}, function(err, response) {
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
	}),



	foursquare: new Cron({
		cronTime: '0 */15 * * * *',
		onTick: function() {

			//console.log('You will see this message every hour');
			Model.User.find(function(err, users) {
				users.forEach(function(user) {

					user.Business.forEach(function(business, indx) {

						var f = business.Social.foursquare;
						if (
								typeof f.auth.oauthAccessToken !== 'undefined'
								//&& typeof f.id !== 'undefined'
								&& typeof f.venue.id !== 'undefined'
								&& f.auth.oauthAccessToken != ''
								//&& f.id != ''
								&& f.venue.id != ''
								&& f.auth.oauthAccessToken
								//&& f.id
								&& f.venue.id
							) {

								Model.Analytics.findOne({id: business.Analytics.id}, function(err, Analytics) {

									var foursquare = Auth.load('foursquare'),
											//updates = Analytics.foursquare.updates.sort(Helper.sortBy('timestamp', false, parseInt)),
											//since = updates.length ? updates[0].timestamp : 0;
											multi =		'/venues/' + f.venue.id +
																',/venues/' + f.venue.id + '/stats',
																//',/venues/' + f.venue.id + '/likes' +
																//',/venues/' + f.venue.id + '/tips?limit=25' +
																//',/venues/' + f.venue.id + '/photos?group=venue&limit=20',
											params = {
												v: foursquare.client.verified,
												requests: multi
											},
											update = false,
											venue = null,
											stats = null;

									foursquare.setAccessToken(f.auth.oauthAccessToken);

									//foursquare.get(('venues/' + f.venue.id), {v: foursquare.client.verified}, function(err, response) {
									foursquare.post('multi', params, function(err, response) {
										if(err || response.meta.code != 200) 
											console.log(response.meta.code);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

											// TODO: build into a for loop
											if(response.response.responses[0].response.venue !== 'undefined') { // really foursquare? you couldn't add a few more 'reponses' in there?
												venue = response.response.responses[0].response.venue;
												stats = response.response.responses[1].response.stats

											} else {
												venue = response.response.responses[1].response.venue;
												stats = response.response.responses[0].response.stats;
											}

										if(venue && stats) {
											venue.cached = f.venue.data;

											var catLength = typeof venue.cached.categories !== 'undefined' ? venue.cached.categories.length : 0,
													tagsLength = typeof venue.cached.tags !== 'undefined' ? venue.cached.tags.length : 0;

											if(venue.name != venue.cached.name || venue.contact.phone != venue.cached.contact.phone || venue.contact.twitter != venue.cached.contact.twitter || venue.location.address != venue.cached.location.address || venue.categories.length != catLength || venue.tags.length != tagsLength) {
												update = true;
												Analytics.foursquare.update = {
													timestamp: Helper.timestamp(),
													changes: {
														name: (venue.name != venue.cached.name) ? venue.name : null,
														contact: (venue.contact.phone != venue.cached.contact.phone || venue.contact.twitter != venue.cached.contact.twitter) ? venue.contact : null,
														location: (venue.location.address != venue.cached.location.address) ? venue.location : null,
														categories: (venue.categories.length != catLength) ? venue.categories : null,
														tags: (venue.tags.length != tagsLength) ? venue.tags : null
													}
												}

												user.Business[indx].Social.foursquare.venue.name = venue.name;
												user.Business[indx].Social.foursquare.venue.data = venue;
												user.save(function(err) {console.log(err)});
											}
											
											// if we have no new checkins we don't need to process the checkins and mayor 
											if(venue.stats.checkinsCount != Analytics.foursquare.tracking.checkins.total) {
												update = true;
											
												// Lets update basic checkin stats
												Analytics.foursquare.tracking.checkins.meta.push({
													timestamp: Helper.timestamp(),
													total: parseInt(venue.stats.checkinsCount, 10),
													//new: (typeof Analytics.foursquare.tracking.checkins.total !== 'undefined') ? parseInt(stats.totalCheckins, 10) - Analytics.foursquare.tracking.checkins.total : parseInt(stats.totalCheckins, 10),
													//foursquare_new: parseInt(venue.stats.checkinsCount, 10), // This is from last login to foursquare (I think)
													//unique_visitors: parseInt(stats.uniqueVisitors, 10)
												})
												Analytics.foursquare.tracking.checkins.total = parseInt(venue.stats.checkinsCount, 10);
												Analytics.foursquare.tracking.checkins.timestamp = Helper.timestamp();


												if(venue.mayor.user.id != Analytics.foursquare.tracking.mayor.user_id) {
													// Yay! new mayor
													Analytics.foursquare.tracking.mayor.meta.push({
														timestamp: Helper.timestamp(),
														total: parseInt(venue.mayor.count, 10),
														//new: parseInt(venue.mayor.count, 10) - Analytics.foursquare.tracking.mayor.total,
														user: venue.mayor.user
													});
													Analytics.foursquare.tracking.mayor.total = parseInt(venue.mayor.count, 10);
													Analytics.foursquare.tracking.mayor.user_id = venue.mayor.user.id;
													Analytics.foursquare.tracking.mayor.timestamp = Helper.timestamp();

												}
											}

											// If it seems odd that we are comparing two different stat fields it's because foursquare doesn't report the checkins in the venue call the same as the checkins count in the stats call.
											// Further more, the stats section gets updated far less often it seems while the venue call is nearly instant. I have no idea why this is
											if(stats.totalCheckins != Analytics.foursquare.tracking.checkins.stats.total) {
												update = true;

												// Update unique visitors
												if(stats.uniqueVisitors != stats.Analytics.foursquare.tracking.unique.total) {
													Analytics.foursquare.tracking.unique.meta.push({
														timestamp: Helper.timestamp(),
														total: parseInt(stats.uniqueVisitors, 10)
													});
													Analytics.foursquare.tracking.unique.total = parseInt(stats.uniqueVisitors, 10);
												}

												// Update social sharing stats
												if(stats.sharing.facebook != Analytics.foursquare.tracking.shares.facebook || stats.sharing.twitter != Analytics.foursquare.tracking.shares.twitter) {
													Analytics.foursquare.tracking.shares.meta.push({
														timestamp: Helper.timestamp(),
														total: {
															facebook: parseInt(stats.sharing.facebook, 10),
															twitter: parseInt(stats.sharing.twitter, 10)
														},
														//new: {
														//	facebook: parseInt(stats.sharing.facebook, 10) - Analytics.foursquare.tracking.shares.facebook,
														//	twitter: parseInt(stats.sharing.twitter, 10) - Analytics.foursquare.tracking.shares.twitter
														//}
													})
													Analytics.foursquare.tracking.shares.facebook = parseInt(stats.sharing.facebook, 10);
													Analytics.foursquare.tracking.shares.twitter =parseInt(stats.sharing.twitter, 10);
													Analytics.foursquare.tracking.shares.timestamp = Helper.timestamp();
												}

												// Conditional in case gender data isn't supplied 
												if(stats.genderBreakdown.male != Analytics.foursquare.tracking.gender.male || stats.genderBreakdown.female != Analytics.foursquare.tracking.gender.female) {
													// Update visitor gender stats
													Analytics.foursquare.tracking.gender.meta.push({
														timestamp: Helper.timestamp(),
														total: {
															male: parseInt(stats.genderBreakdown.male, 10),
															female: parseInt(stats.genderBreakdown.female, 10)
														},
														//new: {
														//	male: parseInt(stats.genderBreakdown.male, 10) - Analytics.foursquare.tracking.gender.male,
														//	female: parseInt(stats.genderBreakdown.female, 10) - Analytics.foursquare.tracking.gender.female
														//}
													})
													Analytics.foursquare.tracking.gender.male = parseInt(stats.genderBreakdown.male, 10);
													Analytics.foursquare.tracking.gender.female =parseInt(stats.genderBreakdown.female, 10);
													Analytics.foursquare.tracking.gender.timestamp = Helper.timestamp();			
												}

												// Update age statistics
												Analytics.foursquare.tracking.age.meta.push({
													timestamp: Helper.timestamp(),
													data: stats.ageBreakdown
												});
												Analytics.foursquare.tracking.age.timestamp = Helper.timestamp();

												// Update hour breakdown statistics
												Analytics.foursquare.tracking.hourBreakdown.meta.push({
													timestamp: Helper.timestamp(),
													data: stats.hourBreakdown
												});
												Analytics.foursquare.tracking.hourBreakdown.timestamp = Helper.timestamp();

												// Update visit counts histogram
												Analytics.foursquare.tracking.visitsHistogram.meta.push({
													timestamp: Helper.timestamp(),
													data: stats.visitCountHistogram
												});
												Analytics.foursquare.tracking.visitsHistogram.timestamp = Helper.timestamp();

												// Update top visitors list
												Analytics.foursquare.tracking.topVisitors = stats.topVisitors;

												// Update recent visitors list
												Analytics.foursquare.tracking.recentVisitors = stats.recentVisitors;

											}

											// These can be unrelated to any actual checkin
											if(parseInt(venue.likes.count, 10) != Analytics.foursquare.tracking.likes.total) {
												// Lets update tips left for the venue
												var likesCount = parseInt(venue.likes.count, 10);
												Analytics.foursquare.tracking.likes.meta.push({
													timestamp: Helper.timestamp(),
													total: likesCount,
													//new: likesCount - Analytics.foursquare.tracking.likes.total
												})
												Analytics.foursquare.tracking.likes.total = likesCount;
												Analytics.foursquare.tracking.likes.timestamp = Helper.timestamp();

												update = true;
											}

											if(parseInt(venue.tips.count, 10) != Analytics.foursquare.tracking.tips.total) {
												// Lets update tips left for the venue
												var tipsCount = parseInt(venue.tips.count, 10);
												Analytics.foursquare.tracking.tips.meta.push({
													timestamp: Helper.timestamp(),
													total: tipsCount,
													//new: tipsCount - Analytics.foursquare.tracking.tips.total
												})
												Analytics.foursquare.tracking.tips.total = tipsCount;
												Analytics.foursquare.tracking.tips.timestamp = Helper.timestamp();

												update = true;
											}

											if(parseInt(venue.photos.count, 10) != Analytics.foursquare.tracking.photos.total) {
												// Lets update the photo count for the venue
												var photosCount = parseInt(venue.photos.count, 10);
												Analytics.foursquare.tracking.photos.meta.push({
													timestamp: Helper.timestamp(),
													total: photosCount,
													//new: photosCount - Analytics.foursquare.tracking.photos.total
												})
												Analytics.foursquare.tracking.photos.total = photosCount;
												Analytics.foursquare.tracking.photos.timestamp = Helper.timestamp();

												update = true;
											}

										} else {
											// venue or stats data wasn't returned 
										}

										if(update) {
											Analytics.save(function(err, res){
												if(err) console.log(err);
	console.log('saved updated tracking...');									
											});
										}

									});

								}); // end Analytics model
						} // End of foursquare credentials if statement

					});
				});
			});
		},

		start: false
	}),

	yelp: new Cron({
		cronTime: '0 * * * * *',
		onTick: function() {

			//console.log('You will see this message every hour');
			Model.User.find(function(err, users) {
				users.forEach(function(user) {

					user.Business.forEach(function(business, indx) {

						var y = business.Social.yelp;
						if (typeof y.id !== 'undefined' && y.id != '' && y.id) {

								Model.Analytics.findOne({id: business.Analytics.id}, function(err, Analytics) {

				 					yelp = Auth.load('yelp');
				 					yelp.business(y.id, function(err, response) {
				 						if(err) console.log(err);

				 							var cached = Analytics.yelp.update.changes,
				 									update = false;

											if(response.id != cached.id || response.name != cached.name || response.is_claimed != cached.is_claimed || response.is_closed != cached.is_closed || response.image_url != cached.image_url || response.url != cached.url || response.phone != cached.phone || response.snippet_text != cached.snippet || response.location.address != cached.location.address || response.location.city != cached.location.city || response.location.state_code != cached.location.state || response.location.postal_code != cached.location.postal) {
												update = true;
												Analytics.yelp.update = {
													timestamp: Helper.timestamp(),
													changes: {
														id: (response.id != cached.id) ? response.id : null,
														name: (response.name != cached.name) ? response.name : null,
														is_claimed: (response.is_claimed != cached.is_claimed) ? response.is_claimed : null,
														is_closed: (response.is_closed != cached.is_closed) ? response.is_closed : null,
														image_url: (response.image_url != cached.image_url) ? response.image_url : null,
														url: (response.url != cached.url) ? response.url : null,
														phone: (response.phone != cached.phone) ? response.phone : null,
														snippet: (response.snippet_text != cached.snippet) ? response.snippet_text : null,
														location: {
															address: (response.location.address != cached.location.address) ? response.location.address : null,
															city: (response.location.city != cached.location.city) ? response.location.city : null,
															state: (response.location.state_code != cached.location.state) ? response.location.state_code : null,
															postal: (response.location.postal_code != cached.location.postal) ? response.location.postal_code : null
														}
													}
												}

												user.Business[indx].Social.yelp.business = response;
												user.save(function(err) {console.log(err)});
											}

											if(response.review_count != Analytics.yelp.tracking.reviews.total) {
												update = true;
												Analytics.yelp.tracking.reviews.meta.push({
													timestamp: Helper.timestamp(),
													total: parseInt(response.review_count, 10),
													data: response.reviews
												})
												Analytics.yelp.tracking.reviews.total = parseInt(response.review_count, 10);
												Analytics.yelp.tracking.reviews.timestamp = Helper.timestamp();
											}

											if(response.rating != Analytics.yelp.tracking.ratings.rating) {
												update = true;
												Analytics.yelp.tracking.ratings.meta.push({
													timestamp: Helper.timestamp(),
													rating: parseFloat(response.rating),
													data: {
														image: {
															small: response.rating_img_url_small,
															medium: response.rating_img_url,
															large: response.rating_img_url_large,
														}
													}
												})
												Analytics.yelp.tracking.ratings.rating = parseFloat(response.rating);
												Analytics.yelp.tracking.ratings.timestamp = Helper.timestamp();
											}

											if(update) {
	//console.log(Analytics.yelp.update);	
	//console.log(Analytics.yelp.tracking);	
												Analytics.save(function(err, res){
													if(err) console.log('error: ', err);
	console.log('saved updated tracking...');									
												});
											}

				 					});

								}); // end Analytics model
						} // End of Yelp credentials if statement

					});
				});
			});
		},

		start: false
	})
} // end cronjobs namespace

module.exports = CronJobs;