var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var TwitterHarvester = (function() {

	var Analytics,
			twitter,
			data,
			update = false,
			connections = [],
			next = function(i, cb) {
				var i = i+1;
				if(data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {

		search: function(itr, cb) {
			
		},

		// this is used to gather new follower count, 
		// profile updates, favorites data, friends data, # of statuses(tweets) ever posted, etc 
		credentials: function(itr, cb) {
			twitter.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, credentials) {

				var timestamp = Helper.timestamp(),
						localUpdate = false;

				// friends
				if(Analytics.twitter.tracking.friends.total != credentials.friends_count) {
					update = localUpdate = true;
					Analytics.twitter.tracking.friends.history.push({
						timestamp: timestamp,
						total: credentials.friends_count
					})
					Analytics.twitter.tracking.friends.total = credentials.friends_count;
					Analytics.twitter.tracking.friends.timestamp = timestamp;
					Analytics.twitter.tracking.friends.update = true;
				}

				// followers
				if(Analytics.twitter.tracking.followers.total != credentials.followers_count) {
					update = localUpdate = true;
					Analytics.twitter.tracking.followers.history.push({
						timestamp: timestamp,
						total: credentials.followers_count
					})
					Analytics.twitter.tracking.followers.total = credentials.followers_count;
					Analytics.twitter.tracking.followers.timestamp = timestamp;
					Analytics.twitter.tracking.followers.update = true;
				}

				// favorited_count
				if(Analytics.twitter.tracking.favorited_count.total != credentials.favourites_count) {
					update = localUpdate = true;
					Analytics.twitter.tracking.favorited_count.change = true;
					Analytics.twitter.tracking.favorited_count.history.push({
						timestamp: timestamp,
						total: credentials.favourites_count
					})
					Analytics.twitter.tracking.favorited_count.total = credentials.favourites_count;
					Analytics.twitter.tracking.favorited_count.timestamp = timestamp;
				}

				// total_tweets
				if(Analytics.twitter.tracking.total_tweets.total != credentials.statuses_count) {
					update = localUpdate = true;
					Analytics.twitter.tracking.total_tweets.history.push({
						timestamp: timestamp,
						total: credentials.statuses_count
					})
					Analytics.twitter.tracking.total_tweets.total = credentials.statuses_count;
					Analytics.twitter.tracking.total_tweets.timestamp = timestamp;
				}

				// list_count
				if(Analytics.twitter.tracking.list_count.total != credentials.listed_count) {
					update = localUpdate = true;
					Analytics.twitter.tracking.list_count.history.push({
						timestamp: timestamp,
						total: credentials.listed_count
					})
					Analytics.twitter.tracking.list_count.total = credentials.listed_count;
					Analytics.twitter.tracking.list_count.timestamp = timestamp;
				}

				if(localUpdate) console.log('updates to Twitter user tracking stats [friends, followers, favorited, total tweets, and list count]');

				next(itr, cb);
			})
		},

		// new tweets 
		timeline: function(itr, cb) {

			twitter.get('/statuses/user_timeline.json', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 100, contributor_details: true, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
				if(!response.length)
					return next(itr, cb);

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
					//response[i].retweets = {history:[{timestamp:timestamp,total:parseInt(response[i].retweet_count, 10)}],total:parseInt(response[i].retweet_count, 10), timestamp: timestamp};
					//response[i].favorited_count = {};
					response[i].timestamp = Helper.timestamp();
					Analytics.twitter.timeline.tweets.push(response[i]);
				}

				Analytics.twitter.timeline.since_id = response[0].id_str;
				Analytics.twitter.timeline.timestamp = Helper.timestamp();

				console.log('saved twitter user timeline...');

				next(itr, cb);
			})
		},

		// @ mentions tracking
		mentions: function(itr, cb) {

			twitter.get('/statuses/mentions_timeline.json', {since_id: Analytics.twitter.mentions.since_id, count: 200, contributor_details: true, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
				if(!response.length)
					return next(itr, cb);

				var //usersArray = [],
						timestamp = Helper.timestamp();

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
					response[i].timestamp = timestamp;
					Analytics.twitter.mentions.list.splice(i, 0, response[i]);
					connections.push({twitter_id: response[i].user.id_str})
				}

				Analytics.twitter.mentions.since_id = response[0].id_str;
				Analytics.twitter.mentions.timestamp = timestamp;

				// insert user ids into Twitter user model for cron lookup 
				//Model.Connections.collection.insert(usersArray, {continueOnError: true}, function(err, save) {
					// TODO: put any errors in logs
				//})
				
				console.log('saved user @ mentions...');

				next(itr, cb);
			})
		},

		// retweets tracking
		retweets: function(itr, cb) {
			twitter.get('/statuses/retweets_of_me.json', {count: 100, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
				if(!response.length)
					return next(itr, cb);

				var timestamp = Helper.timestamp(),
						localUpdate = false;

				for(var x = 0, l = response.length; x < l; x++) {
					for(var y = 0, len = Analytics.twitter.timeline.tweets.length; y < len; y++) {

						if(Analytics.twitter.timeline.tweets[y].id != response[x].id_str)
							continue;

						var count = parseInt(response[x].retweet_count, 10);
							
						if(!Analytics.twitter.timeline.tweets[y].retweets) {
							update = localUpdate = true;
							Analytics.twitter.timeline.tweets[y].retweets = {
								history: [{
									timestamp: timestamp,
									total: count // parseInt(response[x].retweet_count, 10),
								}],
								timestamp: timestamp,
								total: count,
								updated: true
							}
							Analytics.markModified('twitter.timeline.tweets');
						} else if(Analytics.twitter.timeline.tweets[y].retweets.total != count) {
							update = localUpdate = true;
							Analytics.twitter.timeline.tweets[y].retweets.history.push({
								timestamp: timestamp,
								total: count
							});
							Analytics.twitter.timeline.tweets[y].retweets.timestamp = timestamp;
							Analytics.twitter.timeline.tweets[y].retweets.total = count;
							Analytics.twitter.timeline.tweets[y].retweets.updated = (count <= 1200) ? true : false; // for rate limiting purposes, we no longer update over 1200 retweets
						}
						break;

					}
				}

				if(localUpdate)
					console.log('saved retweets count update...');
				
				next(itr, cb);
			})
		},

		// load retweeters list for tweets
		retweeters: function(itr, cb, tweet, iteration) {

			if(iteration > 11)
				return next(itr, cb);

			var tweet = tweet || false;

			if(!tweet)
				for(var i=0, l=Analytics.twitter.timeline.tweets.length; i < l; i++)
					if(Analytics.twitter.timeline.tweets[i].retweets && Analytics.twitter.timeline.tweets[i].retweets.update) {
						// If the tweet already has 1200+ ids stored then don't bother updating because of twitter rate limits
						if(Analytics.twitter.timeline.tweets[i].retweets.retweeters && Analytics.twitter.timeline.tweets[i].retweets.retweeters.length > 1199) {
							Analytics.twitter.timeline.tweets[i].retweets.update = false,
							update = true;
							continue;
						}

						tweet = {
							id: Analytics.twitter.timeline.tweets[i].id,
							index: i,
							cursor: -1,
							iteration: 0
						}
						Analytics.twitter.timeline.tweets[i].retweets.retweeters = [];
						break;
					}


			if(tweet)
				twitter.get('/statuses/retweeters/ids.json', {id: tweet.id, cursor: tweet.cursor, stringify_ids: true}, function(err, response) {
					if(err || response.errors)
						console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
					
					if(!response.ids || !response.ids.length)
						return next(itr, cb);

					var //usersArray = [],
							timestamp = Helper.timestamp(),
							localUpdate = false;

					for(var i=0, l=response.ids.length; i<l; i++) {
						Analytics.twitter.timeline.tweets[tweet.index].retweets.retweeters.push(response.ids[i])
						connections.push({twitter_id: response.ids[i]})
					}

					// insert user ids into Twitter user model for cron lookup 
					//Model.Connections.collection.insert(usersArray, {continueOnError: true}, function(err, save) {
						// TODO: put any errors in logs
					//})

					if(response.next_cursor > 0) {
						tweet.iteration++;
						tweet.cursor = response.next_cursor_str;
						return Harvest.retweeters(itr, cb, tweet, tweet.iteration);
					}

					if(localUpdate)
						console.log('saved/updated retweeters id list to tweet...');
					
					Analytics.markModified('twitter.timeline.tweets');
					next(itr, cb);
				})
			else
				next(itr, cb);
		},

		friends: function(itr, cb, params, iteration) {
			//if(!Analytics.twitter.tracking.friends.update)
				//return next(itr, cb);

			// If the twitter id count is close to 30,000 then no update is needed 
			// NVM: we might use this to mark and display new friends/followers so always keep up-to-date
			/*if(Analytics.twitter.friends.length > 28000) {
				Analytics.twitter.tracking.friends.update = false;
				update = true;
				return next(itr, cb);
			} */

			var params = params || false,
					iteration = iteration || 0;

			if(!params)
				params = {cursor: -1}

			if(params)
				twitter.get('/friends/ids.json', {user_id: data.network_id, cursor: params.cursor, stringify_ids: true, count: 5000}, function(err, response) {
					if(err || response.errors)
						console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

					if(!response.ids || !response.ids.length)
						return next(itr, cb);

					var //usersArray = [],
							timestamp = Helper.timestamp(),
							localUpdate = false;

					if(!iteration) {
						Analytics.twitter.friends.previous = Analytics.twitter.friends.active;
						Analytics.twitter.friends.active = [];
					}

					for(var i=0, l=response.ids.length; i<l; i++) {
						Analytics.twitter.friends.active.push(response.ids[i])
						connections.push({twitter_id: response.ids[i]})
					}

					// insert user ids into Twitter user model for cron lookup 
					/*Model.Connections.collection.insert(usersArray, {continueOnError: true}, function(err, save) {
						// TODO: put any errors in logs
						console.log('error!: ', err);
						console.log('save: ', save);
					})*/

					if(response.next_cursor > 0 && iteration < 5) {
						iteration++;
						params.cursor = parseInt(response.next_cursor_str, 10);
						return Harvest.friends(itr, cb, params, iteration);
					}


					var initialMatch = false,
							droppedArray = [];

					previousUsersLoop:
					for(var x=0, l=Analytics.twitter.friends.previous.length; x<l; x++) {
						for(var y=0, len=Analytics.twitter.friends.active.length; y<len; y++) {
							if(Analytics.twitter.friends.previous[x] == Analytics.twitter.friends.active[y]) {
								if(initialMatch === false)
									initialMatch = y;
								continue previousUsersLoop;
							}
						}

						if(initialMatch && Analytics.twitter.tracking.friends.total < 28000) {
							Analytics.twitter.friends.dropped.push(Analytics.twitter.friends.previous[x])
						}
					}

					if(initialMatch)
						for(var i=0, l=initialMatch; i<l; i++)
							Analytics.twitter.friends.new.push(Analytics.twitter.friends.active[i])

					update = localUpdate = true;
					Analytics.twitter.friends.previous = [],
					Analytics.twitter.tracking.friends.update = false;

					if(localUpdate)
						console.log('saved/updated users friends id list...');

					Analytics.markModified('twitter.friends.active', 'twitter.friends.previous', 'twitter.friends.new', 'twitter.friends.dropped')
					//Analytics.markModified('twitter.friends.previous')
					//Analytics.markModified('twitter.friends.new')
					//Analytics.markModified('twitter.friends.dropped')
					next(itr, cb);
				})

		},

		followers: function(itr, cb, params, iteration) {
			//if(!Analytics.twitter.tracking.followers.update)
				//return next(itr, cb);

			// If the twitter id count is close to 30,000 then no update is needed 
			// NVM: we might use this to mark and display new friends/followers so always keep up-to-date
			/*if(Analytics.twitter.friends.length > 28000) {
				Analytics.twitter.tracking.friends.update = false;
				update = true;
				return next(itr, cb);
			} */

			var params = params || false,
					iteration = iteration || 0;

			if(!params)
				params = {cursor: -1}

			if(params)
				twitter.get('/followers/ids.json', {user_id: data.network_id, cursor: params.cursor, stringify_ids: true, count: 5000}, function(err, response) {
					if(err || response.errors)
						console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

					if(!response.ids || !response.ids.length)
						return next(itr, cb);

					var //usersArray = [],
							//timestamp = Helper.timestamp(),
							localUpdate = false;

					if(!iteration) {
						Analytics.twitter.followers.previous = Analytics.twitter.followers.active;
						Analytics.twitter.followers.active = [];
					}

					for(var i=0, l=response.ids.length; i<l; i++) {
						Analytics.twitter.followers.active.push(response.ids[i])
						connections.push({twitter_id: response.ids[i]})
					}

					// insert user ids into Twitter user model for cron lookup 
					/*Model.Connections.collection.update(usersArray, {continueOnError: true}, function(err, save) {
						// TODO: put any errors in logs
						console.log('error!: ', err);
						console.log('save: ', save);
					})*/

					if(response.next_cursor > 0 && iteration < 5) {
						iteration++;
						params.cursor = parseInt(response.next_cursor_str, 10);
						return Harvest.followers(itr, cb, params, iteration);
					}


					var initialMatch = false,
							droppedArray = [];

					previousUsersLoop:
					for(var x=0, l=Analytics.twitter.followers.previous.length; x<l; x++) {
						for(var y=0, len=Analytics.twitter.followers.active.length; y<len; y++) {
							if(Analytics.twitter.followers.previous[x] == Analytics.twitter.followers.active[y]) {
								if(initialMatch === false)
									initialMatch = y;
								continue previousUsersLoop;
							}
						}

						if(initialMatch && Analytics.twitter.tracking.followers.total < 28000) {
							Analytics.twitter.followers.dropped.push(Analytics.twitter.followers.previous[x])
						}
					}

					if(initialMatch)
						for(var i=0, l=initialMatch; i<l; i++)
							Analytics.twitter.followers.new.push(Analytics.twitter.followers.active[i])

					update = localUpdate = true;
					Analytics.twitter.followers.previous = [],
					Analytics.twitter.tracking.followers.update = false;

					if(localUpdate)
						console.log('saved/updated users followers id list...');

					Analytics.markModified('twitter.followers.active','twitter.followers.previous', 'twitter.followers.new', 'twitter.followers.dropped')
					//Analytics.markModified('twitter.followers.previous')
					//Analytics.markModified('twitter.followers.new')
					//Analytics.markModified('twitter.followers.dropped')
					next(itr, cb);
				})

		},

		// direct message tracking
		dm: function(itr, cb) {
			twitter.get('/direct_messages.json', {since_id: Analytics.twitter.messages.since_id, count: 200}, function(err, response) {
				if(err || response.errors)
					console.log(err);
				
				if(!response.length)
					return next(itr, cb);

				var //usersArray = [],
						timestamp = Helper.timestamp();

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
					response[i].timestamp = timestamp;
					response[i].recipient = null;
					Analytics.twitter.messages.list.push(response[i])
					connections.push({twitter_id: response[i].sender.id_str})
				}

				Analytics.twitter.messages.since_id = response[0].id_str;
				Analytics.twitter.messages.timestamp = timestamp;
				
				// insert user ids into Twitter user model for cron lookup 
				//Model.Connections.collection.insert(usersArray, {continueOnError: true}, function(err, save) {
					// TODO: put any errors in logs
				//})

				console.log('saved new direct messages...');

				next(itr, cb);
			})
		},

		// find new favorited tweets
		favorited: function(itr, cb) {

			twitter.get('/statuses/user_timeline.json', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 200, contributor_details: false, trim_user: true, exclude_replies: false, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err);
				
				if(!response.length)
					return next(itr, cb);

				var timestamp = Helper.timestamp(),
						localUpdate = false;

				for(var x = 0, l = response.length; x < l; x++) {
					for(var y = 0, len = Analytics.twitter.timeline.tweets.length; y < len; y++) {

						if(Analytics.twitter.timeline.tweets[y].id != response[x].id_str)
							continue;

						var count = parseInt(response[x].favorite_count, 10);
						if(!Analytics.twitter.timeline.tweets[y].favorited_count) {
							update = localUpdate = true;
							Analytics.twitter.timeline.tweets[y].favorited_count = {
								history: [{
									timestamp: timestamp,
									total: count
								}],
								timestamp: timestamp,
								total: count
							}
							Analytics.markModified('twitter.timeline.tweets');
						} else if(Analytics.twitter.timeline.tweets[y].favorited_count.total != count) {
							update = localUpdate = true;
							Analytics.twitter.timeline.tweets[y].favorited_count.history.push({
								timestamp: timestamp,
								total: count
							});
							Analytics.twitter.timeline.tweets[y].favorited_count.timestamp = timestamp;
							Analytics.twitter.timeline.tweets[y].favorited_count.total = count;
						}
						break;
					}
				}

				if(localUpdate)
					console.log('saved tweet favorited count update...');

				next(itr, cb);
			})
		},

		// check for dropped followers, only run every 24 at night
		// note these accounts may also have been deleted
		dropped_followers: function(itr, cb, cursor, callCount) {

			// check if enough time has passed to load new data
			//if(!Analytics.twitter.tracking.followers.change)
				//return next(itr, cb);

			// we'll stop after 5 calls, that's 25000 followers! 
			callCount = callCount + 1 || 1;
			Model.Followers.findOne({id: data.analytics_id}, function(err, Followers) {
				if(err)
					console.log(err);

				twitter.get('/followers/ids.json', {user_id: data.network_id, cursor: (cursor ? cursor : -1), stringify_ids: true, count: 1000}, function(err, followers) {
					if(err || followers.errors)
						console.log(err, followers);
console.log(followers);
return;
					if(!Followers.twitter.length) {
						Followers.twitter = followers.ids;
						Followers.save(function(err, success) {
							console.log('saved first round of followers to Followers Model');
							return next(itr, cb);
						})
					} else {

						var newFollowers = true,
								newFollowersArray = [],
								droppedFollowersArray = [];
						
						for(var x = 0, l = Followers.twitter.length; x < l; x++) {
							var found = false;
							for(var y = 0, len = followers.ids.length; y < len; y++)
								if(newFollowers && followers.ids[y] !== Followers.twitter[x]) {
									newFollowersArray = followers.ids[y];
									break;
								} else if(followers.ids[y] === Followers.twitter[x]) {
									if(newFollowers)
										newFollowers = false, x = 0;
									else
										found = true;

									break;
								}

							// these are dropped/deleted followers
							if(!newFollowers && !found)
								droppedFollowersArray.push(Followers.twitter[x]);				
						}

						// add new followers to database followers array
						if(newFollowersArray.length) {
							for(var b=newFollowersArray.length-1; b>=0; b--)
								Followers.twitter.unshift(newFollowersArray[b]);
							
							Followers.save(function(err, success) {
								console.log('we have saved new followers from the dropped followers twitter function');
							})
						}

						// add dropped followers to database
						if(droppedFollowersArray.length) {
							var usersIdString = '';
							update = true;

							for(var a=0,length=droppedFollowersArray.length; a<length; a++)
								usersIdString += droppedFollowersArray[a] + ','

							twitter.get('/users/lookup.json', {user_id: usersIdString.toString().slice(0,-1), include_entities: false}, function(err, leavers) {
								if(err || leavers.errors)
									console.log(err, leavers);

								var timestamp = Helper.timestamp();

								for(var c=leavers.length-1;c>=0;c--)
									// check if user has been removed from twitter, don't log them
									for(var d=0,lengthy=droppedFollowersArray.length;d<lengthy;d++)
										if(droppedFollowersArray[d] === leavers[c].id_str) {
											droppedFollowersArray[d].timestamp = timestamp;
											Analytics.twitter.tracking.followers.dropped.unshift(droppedFollowersArray[d]);
											break;
										}

								console.log('we have dropped twitter followers! Call: ' + callCount);
						
								var cursorInt = parseInt(followers.next_cursor_str, 10);
								if(cursorInt > 0 && callCount < 6)
									Harvest.dropped_followers(itr, cb, cursorInt, callCount);
								else
									next(itr, cb);

							})
						}

					}
				})
			})
		},

		post_test: function(itr, cb) {
			twitter.post('/users/lookup.json', {user_id: '892550918,543937651', include_entities: false}, function(err, users) {
				if(err || users.errors)
					console.log(err, users);

				console.log(users),
				next(itr, cb);
			})

		},

		// this one needs some explaining 
		// this is only called on the actual Twitter 
		// page load (not in cron). We grab the newest
		// followers always, but compare it to the previous
		// list saved from last page view. Always show 20 
		// newest followers but highlight the true new 
		// followers since previous login. Use timestamp 
		// to only check every 15 minutes but
		// only when user is logged in!
		newest_followers: function(itr, cb) {

			// check if enough time has passed to load new data
			if(Analytics.twitter.tracking.followers.newest.timestamp > Helper.timestamp() - 900)
				return next(itr, cb);

			twitter.get('/followers/list.json', {user_id: data.network_id, skip_status: true, include_user_entities: false}, function(err, response) {
				if(err || response.errors)
					console.log(err);
				var users = {
							data: [],
							new: 0
						}

				response_loop:
					for(var x = 0, l = response.users.length; x < l; x++) {
						for(var y = 0, l = Analytics.twitter.tracking.followers.newest.list.length; y < l; y++)
							if(Analytics.twitter.tracking.followers.newest.list.id == response.users[x].id_str)
								break response_loop;
					
						users.data.push(response.users[x]);
						// TODO: rate the user based on stats such as followers, followers/friends ratio, status count, klout checkup, favorites count, age of account, # of lists featured in, is verfied, etc
						// and also rate a good follower fit based on the users location and language (gen 2) 
						users.new++; 
					}

				if(users.new < response.users.length)
					for(var i = 0, l = (response.users.length - users.new); i < l; i++) 
						users.data.push(Analytics.twitter.tracking.followers.newest.list[i]);

				// always update to correct newest.true_new variable
				update = true;
				Analytics.twitter.tracking.followers.newest.true_new = users.new;
			
			})
		},

		user_data: function(itr, cb) {

		}

	} // End Harvest

	return {
		getData: function(params, callback) {
			twitter = Auth.load('twitter', params.auth_token, params.token_secret),
			data = params,
			update = false;

			Model.Analytics.findOne({id: data.analytics_id}, function(err, analytics) {
				Analytics = analytics;
				Harvest[data.methods[0]](0, function() {
					
					if(update) {
						if(connections.length)
							Model.Connections.collection.insert(connections, {safe: true, continueOnError: true}, function(err, save) {
								// TODO: put any errors in logs
								console.log('error!: ', err);
								console.log('save: ', save);
							})

						Analytics.save(function(err,r){
							// TODO: handle err 
							//console.log('saved all twitter analytic data from multiple methods');
							callback(null);
						})
					} else {
						callback(null);//callback({err: 'error occured'});
					}
				});
			})
		}
	}

})();

module.exports = TwitterHarvester;