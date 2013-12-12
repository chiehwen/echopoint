/*
 * Twitter Harvester
 *
 * Rate limit: dependent on endpoint
 * https://dev.twitter.com/docs/rate-limiting/1.1
 *
 */

var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object;

var TwitterHarvester = function() {

	var Analytics,
			Engagers = [],
			twitter,
			data,
			update = false,
			retries = Utils.retryErrorCodes,
			next = function(i, cb, stop) {
				var i = i+1;
				if(!stop && data.methods[i])
					Harvest[Harvest.type][data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {

		metrics: {

			// call every minute NOTE: let user know that search tweets will be removed after 30 days 
			search: function(itr, cb, retry) {
	console.log('at twitter search method');

				var tweets = Analytics.twitter.search.tweets.sort(Utils.sortBy('created_timestamp', false, parseInt)),
					localUpdate = false;

				twitter.get('/search/tweets.json', {q: '"Roll On Sushi Diner" "Roll On Sushi"', since_id: Analytics.twitter.search.since_id, result_type: 'recent', count: 20, include_entities: true}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter search failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.search(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}

					if(!response.statuses || !response.statuses.length)
						return next(itr, cb);

					if(tweets.length && response.statuses[0].id_str === tweets[0].id)
						return next(itr, cb);

					update = localUpdate = true;

					searchTweetsLoop:
					for(var x=0, l=response.statuses.length; x<l; x++) {
						for(var y=0, l=tweets.length; y<l; y++)
							if(response.statuses[x].id_str === tweets[y].id)
								break searchTweetsLoop;

						Analytics.twitter.search.tweets.push({
							id: response.statuses[x].id_str,
							created_timestamp: Utils.timestamp(response.statuses[x].created_at),
							timestamp: Utils.timestamp(),
							data: response.statuses[x]
						});

						//Engagers.push({twitter_id: response.statuses[x].id_str, meta: {twitter: {analytics_id: Analytics._id}}})
					}

					if(localUpdate)
						console.log('saving twitter user search...');

					next(itr, cb);
				})
			},

			// this is used to gather new follower count, profile updates, favorites data, friends data, # of statuses(tweets) ever posted, etc 
			credentials: function(itr, cb, retry) {
console.log('at twitter credentials update method');
				twitter.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, credentials) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter credentials method failed to connect in 3 attempts!', err, credentials, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.credentials(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !credentials || credentials.errors) {
						Error.handler('twitter', err || credentials, err, credentials, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}

					var timestamp = Utils.timestamp(),
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
			timeline: function(itr, cb, retry) {
console.log('at twitter timeline update method');
				twitter.get('/statuses/user_timeline.json', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 100, contributor_details: true, include_rts: true}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter timeline method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.timeline(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}
					
					if(!response || !response.length)
						return next(itr, cb);

					update = true;
					for(var i = 0, l = response.length; i < l; i++) {
						//response[i].retweets = {history:[{timestamp:timestamp,total:parseInt(response[i].retweet_count, 10)}],total:parseInt(response[i].retweet_count, 10), timestamp: timestamp};
						//response[i].favorited_count = {};
						response[i].timestamp = Utils.timestamp();
						Analytics.twitter.timeline.tweets.push(response[i]);
					}

					Analytics.twitter.timeline.since_id = response[0].id_str;
					Analytics.twitter.timeline.timestamp = Utils.timestamp();

					console.log('saving twitter user timeline...');

					next(itr, cb);
				})
			},

			// direct message tracking
			dm: function(itr, cb, retry) {
console.log('at twitter new direct messages method');
				twitter.get('/direct_messages.json', {since_id: Analytics.twitter.messages.since_id, count: 200}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter dm method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.dm(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}
					
					if(!response.length)
						return next(itr, cb);

					var timestamp = Utils.timestamp();

					update = true;
					for(var i = 0, l = response.length; i < l; i++) {
						response[i].timestamp = timestamp;
						response[i].recipient = null;
						Analytics.twitter.messages.list.push(response[i])
						Engagers.push({twitter_id: response[i].sender.id_str, meta: {twitter: {analytics_id: Analytics._id}}})
					}

					Analytics.twitter.messages.since_id = response[0].id_str;
					Analytics.twitter.messages.timestamp = timestamp;

					console.log('saving new direct messages...');

					next(itr, cb);
				})
			},

			// @ mentions tracking
			mentions: function(itr, cb, retry) {
console.log('at twitter new mentions method');
				twitter.get('/statuses/mentions_timeline.json', {since_id: Analytics.twitter.mentions.since_id, count: 200, contributor_details: true, include_rts: true}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter mentions method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.mentions(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}
					
					if(!response || !response.length)
						return next(itr, cb);

					var //usersArray = [],
							timestamp = Utils.timestamp();

					update = true;
					for(var i = 0, l = response.length; i < l; i++) {
						response[i].timestamp = timestamp;
						Analytics.twitter.mentions.list.splice(i, 0, response[i]);
						Engagers.push({twitter_id: response[i].user.id_str, meta: {twitter: {analytics_id: Analytics._id}}})
					}

					Analytics.twitter.mentions.since_id = response[0].id_str;
					Analytics.twitter.mentions.timestamp = timestamp;

					// insert user ids into Twitter user model for cron lookup 
					//Model.Engagers.collection.insert(usersArray, {continueOnError: true}, function(err, save) {
						// TODO: put any errors in logs
					//})
					
					console.log('saving user @ mentions...');

					next(itr, cb);
				})
			},

			// retweets tracking
			retweets: function(itr, cb, retry) {
console.log('at twitter retweets method');
				twitter.get('/statuses/retweets_of_me.json', {count: 100, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter retweets method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.retweets(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}
					
					if(!response || !response.length)
						return next(itr, cb);

					var timestamp = Utils.timestamp(),
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
									update: true
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
								Analytics.twitter.timeline.tweets[y].retweets.update = (count <= 1000) ? true : false; // for rate limiting purposes, we no longer update over 1200 retweets
							}
							break;

						}
					}

					if(localUpdate)
						console.log('saving retweets count update...');
					
					next(itr, cb);
				})
			},

			// find new favorited tweets
			favorited: function(itr, cb, retry) {
console.log('at twitter new favorited tweets method');			
				twitter.get('/statuses/user_timeline.json', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 200, contributor_details: false, trim_user: true, exclude_replies: false, include_rts: true}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('twitter', 'Twitter favorited method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.metrics.favorited(itr, cb, retry ? ++retry : 1)
					}

					// error handling
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}
					
					if(!response.length)
						return next(itr, cb);

					var timestamp = Utils.timestamp(),
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
						console.log('saving tweet favorited count update...');

					next(itr, cb);
				})
			},


			// load retweeters list for tweets
			retweeters: function(itr, cb, tweet, iteration) {
console.log('at twitter list of retweeters method');
				if(iteration > 11)
					return next(itr, cb);

				var tweet = tweet || false,
						previousRetweeters = [],
						localUpdate = false;

				if(!tweet)
					for(var i=0, l=Analytics.twitter.timeline.tweets.length; i < l; i++)
						if(Analytics.twitter.timeline.tweets[i].retweets && Analytics.twitter.timeline.tweets[i].retweets.update) {
							// If the tweet already has 1000+ ids stored then don't bother updating because of twitter rate limits
							if(Analytics.twitter.timeline.tweets[i].retweets.retweeters && Analytics.twitter.timeline.tweets[i].retweets.retweeters.length > 1000) {
								Analytics.twitter.timeline.tweets[i].retweets.update = false,
								update = true;
								Analytics.markModified('twitter.timeline.tweets')
								continue;
							}

							tweet = {
								id: Analytics.twitter.timeline.tweets[i].id_str,
								index: i,
								cursor: -1,
								iteration: 0
							}


							if(Analytics.twitter.timeline.tweets[i].retweets.retweeters && Analytics.twitter.timeline.tweets[i].retweets.retweeters.length)
								previousRetweeters = Analytics.twitter.timeline.tweets[i].retweets.retweeters;

							Analytics.twitter.timeline.tweets[i].retweets.update = false;
							//Analytics.twitter.timeline.tweets[i].retweets.retweeters = [];
							//Analytics.markModified('twitter.timeline.tweets')
							break;
						}


// TODO: set this up so that we load the old list of retweeters and loop through, if we come accross an Id from before then break out that way we only see new retweeters and save on api calls
				if(tweet)
					twitter.get('/statuses/retweeters/ids.json', {id: tweet.id, cursor: tweet.cursor, stringify_ids: true}, function(err, response) {
						if (err || !response || response.errors) {
							Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}				

						if(!response.ids || !response.ids.length)
							return next(itr, cb);

						var timestamp = Utils.timestamp();

						Analytics.twitter.timeline.tweets[tweet.index].retweets.update = false;

						if(!Analytics.twitter.timeline.tweets[tweet.index].retweets.retweeters)
							Analytics.twitter.timeline.tweets[tweet.index].retweets.retweeters = [];

						retweetersLoop:
						for(var x=0, l=response.ids.length; x<l; x++) {
							for(var y=0, len=previousRetweeters.length; y<len; y++)
								if(response.ids[x] === previousRetweeters[y])
									break retweetersLoop;

							update = localUpdate = true;
							Analytics.twitter.timeline.tweets[tweet.index].retweets.retweeters.push(response.ids[x])
							Engagers.push({twitter_id: response.ids[x], meta: {twitter: {analytics_id: Analytics._id}}})
						}

						if(localUpdate && response.next_cursor > 0) {
							tweet.iteration++;
							tweet.cursor = response.next_cursor_str;
							return Harvest.retweeters(itr, cb, tweet, tweet.iteration);
						}
						
						if(localUpdate) {
							console.log('saving/updating retweeters id list to tweet...');	
							Analytics.markModified('twitter.timeline.tweets');
						}

						next(itr, cb);
					})
				else
					next(itr, cb);
			},

			friends: function(itr, cb, params, iteration) {
console.log('at twitter list of friends method');				
				if(!Analytics.twitter.tracking.friends.update)
					return next(itr, cb);

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
						if (err || !response || response.errors) {
							Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(!response.ids || !response.ids.length)
							return next(itr, cb);

						var timestamp = Utils.timestamp(),
								localUpdate = false;

						if(!iteration) {
							Analytics.twitter.friends.previous = Analytics.twitter.friends.active;
							Analytics.twitter.friends.active = [];
						}

						for(var i=0, l=response.ids.length; i<l; i++) {
							Analytics.twitter.friends.active.push(response.ids[i])
							Engagers.push({twitter_id: response.ids[i], meta: {twitter: {analytics_id: Analytics._id}}})
						}

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
							console.log('saving/updating users friends id list...');

						Analytics.markModified('twitter.friends.active', 'twitter.friends.previous', 'twitter.friends.new', 'twitter.friends.dropped')
						next(itr, cb);
					})

			},

			followers: function(itr, cb, params, iteration) {
console.log('at twitter list of followers method');		
				if(!Analytics.twitter.tracking.followers.update)
					return next(itr, cb);

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
						if (err || !response || response.errors) {
							Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(!response.ids || !response.ids.length)
							return next(itr, cb);

						var localUpdate = false;

						if(!iteration) {
							Analytics.twitter.followers.previous = Analytics.twitter.followers.active;
							Analytics.twitter.followers.active = [];
						}

						for(var i=0, l=response.ids.length; i<l; i++) {
							Analytics.twitter.followers.active.push(response.ids[i])
							Engagers.push({twitter_id: response.ids[i], meta: {twitter: {analytics_id: Analytics._id}}})
						}

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
							console.log('saving/updating users followers id list...');

						Analytics.markModified('twitter.followers.active','twitter.followers.previous', 'twitter.followers.new', 'twitter.followers.dropped')
						//Analytics.markModified('twitter.followers.previous')
						//Analytics.markModified('twitter.followers.new')
						//Analytics.markModified('twitter.followers.dropped')
						next(itr, cb);
					})

			},



			// check for dropped followers, only run every 24 at night
			// note these accounts may also have been deleted
			dropped_followers: function(itr, cb, cursor, callCount) {
// CURRENTLLY BROKEN
// TODO: FIX
				// check if enough time has passed to load new data
				//if(!Analytics.twitter.tracking.followers.change)
					//return next(itr, cb);

				// we'll stop after 5 calls, that's 25000 followers! 
				callCount = callCount + 1 || 1;
				// WRONG MODEL TABLE
				Model.Followers.findOne({id: data.analytics_id}, function(err, Followers) {
					if(err)
						console.log(err);

					twitter.get('/followers/ids.json', {user_id: data.network_id, cursor: (cursor ? cursor : -1), stringify_ids: true, count: 1000}, function(err, followers) {
						if (err || !followers || followers.errors) {
							Error.handler('twitter', err || followers, err, followers, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

	console.log(followers);
	return;
						if(!Followers.twitter.length) {
							Followers.twitter = followers.ids;
							Followers.save(function(err, success) {
								if(err)
									return Log.error('Error saving to Engager table', {error: err, engager_id: users[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								console.log('saving first round of followers to Followers Model');
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
									if(err)
										return Log.error('Error saving to Engager table', {error: err, engager_id: users[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
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
									if (err || !leavers || leavers.errors) {
										Error.handler('twitter', err || leavers, err, leavers, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
										return next(itr, cb)
									}

									var timestamp = Utils.timestamp();

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

			post_example: function(itr, cb) {
				twitter.post('/users/lookup.json', {user_id: '892550918,543937651', include_entities: false}, function(err, user) {
					console.log(err, user),
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
				if(Analytics.twitter.tracking.followers.newest.timestamp > Utils.timestamp() - 900)
					return next(itr, cb);

				twitter.get('/followers/list.json', {user_id: data.network_id, skip_status: true, include_user_entities: false}, function(err, response) {
					if (err || !response || response.errors) {
						Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}

					var users = { data: [], new: 0 }

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
			}
		}, // end metrics methods



		engagers: {

			// call every 5 seconds (both populateBy... functions together, if ids list is emtpy then screen_names will process instead)
			populateById: function(itr, cb, retry) {
				Model.Engagers.find({twitter_id: {$exists: true}, Twitter: {$exists: false}}, null, {limit: 99}, function(err, engagers) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

					if(!engagers.length)
						return next(itr, cb);

					Model.User.find({Business: {$exists: true}}, {'Business': {$elemMatch: {'Analytics.id': engagers[0].meta.twitter.analytics_id}}}, function(err, user) {
						if(err) {
							Log.error('Error querying User table', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							return next(itr, cb);
						}

						if(!user[0] || !user[0].Business || !user[0].Business.length || !user[0].Business[0].Analytics.id || !user[0].Business[0].Social.twitter.auth.oauthAccessToken || user[0].Business[0].Social.twitter.auth.oauthAccessTokenSecret || user[0].Business[0].Social.twitter.id)
							twitter = Auth.load('twitter').setBearerToken()
						else 
							twitter = Auth.load('twitter', user[0].Business[0].Social.twitter.auth.oauthAccessToken, user[0].Business[0].Social.twitter.auth.oauthAccessTokenSecret)

						var timestamp = Utils.timestamp(),
								twitterUsersCsv = '';

						for(var i=0, l=engagers.length; i<l; i++) {
							// create the query string for twitter api
							twitterUsersCsv += engagers[i].twitter_id + ',';

							// mark this lookup attempt
							engagers[i].meta.twitter.discovery.timestamp = timestamp;
						}

						// why are we adding a static id at the end? because if all ids in id engagers list
						// are for removed/deleted accounts then this endpoint returns a 404 error
						// previously we added a special case error handling to skip if it returned 404 but 
						// if twitter is down and returns a 404 then all those ids get marked as deleted!
						// here we add the numeric id for twitter's own account "twitter"
						twitterUsersCsv += '783214'

						twitter.get('/users/lookup.json', {user_id: twitterUsersCsv, include_entities: false}, function(err, response) {
							// if a connection error occurs retry request (up to 3 attempts) 
							if(err && retries.indexOf(err.code) > -1) {
								if(retry && retry > 2) {
									Error.handler('twitter', 'Twitter populateById method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
									return next(itr, cb);
								}

								return Harvest.engagers.populateById(itr, cb, retry ? ++retry : 1)
							}

							// error handling
							if (err || !response || response.errors) {
								Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								return next(itr, cb)
							}

							localEngagingUsers:
							for(var x=0, l=engagers.length; x<l; x++) {
								for(var y=0, len=response.length; y<len; y++)
									if(response[y].id_str == engagers[x].twitter_id && response[y].id_str !== '783214') {
										response[y].status = null;
										engagers[x].Twitter = {
											id: engagers[x].twitter_id,
											screen_name: response[y].screen_name,
											screen_name_lower: response[y].screen_name.toLowerCase(),
											timestamp: timestamp, // this is the update timestamp as well
											data: response[y]
										}
										//engagers[i].meta.twitter.update.timestamp = timestamp;
										engagers[x].save(function(err, save) {
											if(err)
												return Log.error('Error saving to Engager table', {error: err, engager_id: engagers[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})							
											console.log('saved Twitter user to Engagers via ID');
										})
										continue localEngagingUsers;
									}

								// if we reached here it means the twitter_id returned no data from twitter (user removed or account deleted)
								// remove the twitter_id
								engagers[x].twitter_id = undefined;
								engagers[x].save(function(err, save) {
									if(err)
										return Log.error('Error saving to Engager table', {error: err, engager_id: engagers[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									console.log('removed twitter id from engagers at populateById');
								})
							}

							// stop here if we found engagers to not exceed api limits
							// once all id'ed engagers are taken care of we will then process screen name only
							next(itr, cb, true)
						})
					})
				})
			},

			populateByScreenName: function(itr, cb, retry) {
				Model.Engagers.find({'meta.foursquare.twitter_handle': {$exists: true}, twitter_id: {$exists: false}, Twitter: {$exists: false}}, null, {limit: 99}, function(err, engagers) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

					if(!engagers.length)
						return next(itr, cb);

					Model.User.find({Business: {$exists: true}}, {'Business': {$elemMatch: {'Analytics.id': engagers[0].meta.twitter.analytics_id}}}, function(err, user) {
						if(err) {
							Log.error('Error querying User table', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							return next(itr, cb);
						}

						if(!user[0] || !user[0].Business || !user[0].Business.length || !user[0].Business[0].Analytics.id || !user[0].Business[0].Social.twitter.auth.oauthAccessToken || user[0].Business[0].Social.twitter.auth.oauthAccessTokenSecret || user[0].Business[0].Social.twitter.id)
							twitter = Auth.load('twitter').setBearerToken()
						else 
							twitter = Auth.load('twitter', user[0].Business[0].Social.twitter.auth.oauthAccessToken, user[0].Business[0].Social.twitter.auth.oauthAccessTokenSecret)

						var timestamp = Utils.timestamp(),
								twitterUserHandlesCsv;

						for(var i=0, l=engagers.length; i<l; i++) {
							twitterUserHandlesCsv += engagers[i].meta.foursquare.twitter_handle + ',';
							
							// mark this lookup attempt
							engagers[i].meta.twitter.discovery.timestamp = timestamp;
						}

						// why are we adding a static screens_name(SN) at the end? because if all SNs in SN engagers list
						// are for removed accounts then this endpoint returns a 404 error
						// previously we added a special case error handling to skip if it returned 404 but 
						// if twitter is down and returns a 404 then all those SNs get marked as deleted!
						// here we add the SN for twitter's own account: "twitter"
						twitterUsersCsv += 'twitter'

						twitter.get('/users/lookup.json', {screen_name: twitterUserHandlesCsv, include_entities: false}, function(err, response) {
							// if a connection error occurs retry request (up to 3 attempts) 
							if(err && retries.indexOf(err.code) > -1) {
								if(retry && retry > 2) {
									Error.handler('twitter', 'Twitter populateByScreenName method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
									return next(itr, cb);
								}

								return Harvest.engagers.populateByScreenName(itr, cb, retry ? ++retry : 1)
							}
							
							// error handling
							if (err || !response || response.errors) {
								Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								return next(itr, cb)
							}

							localEngagingUsers:
							for(var x=0, l=engagers.length; x<l; x++) {
								for(var y=0, len=response.length; y<len; y++)
									if(response[y].screen_name == engagers[x].meta.foursquare.twitter_handle) {
										engagers[x].twitter_id = response[y].id_str;

										response[y].status = null;
										engagers[x].Twitter = {
											id: response[y].id_str,
											screen_name: response[y].screen_name,
											screen_name_lower: response[y].screen_name.toLowerCase(),
											timestamp: timestamp, // this is the update timestamp as well
											data: response[y]
										}
										engagers[x].save(function(err, save) {
											// TODO
											//if(err.indexOf('E11000 duplicate key error') > -1)
												// we have a duplicate. we need to direct this to merge these twitter Id's
											if(err)
												return Log.error('Error saving to Engager table', {error: err, engager_id: engagers[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
											console.log('saved Twitter users to engagers via Screen Names');
										})
										continue localEngagingUsers;
									}

								// if we reached here it means the screen_name supplied returned no data from twitter
								// remove the screen_name
								engagers[x].meta.foursquare.twitter_handle = undefined;
								engagers[x].save(function(err, save) {
									if(err)
										return Log.error('Error saving to Engager table', {error: err, engager_id: engagers[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
									console.log('removed twitter handle given by foursquare from engagers at populateByScreenName');
								})
							}

							// stop here if we found engagers to not exceed api limits
							// once all id'ed engagers are taken care of we will then process screen name only
							next(itr, cb, true)
						})
					})
				})
			},

			// use personal account ('speaksocial') to call every 10 seconds as user based api call to twitter
			// duplicates can happen if we update a user who has changed their 
			// twitter screen name to that of another engagers old screen name, but the old screen name hasn't been updated yet
			duplicates: function(itr, cb) {
				Model.Engagers.aggregate(
					{ $group : {_id : "$Twitter.screen_name_lower", total : { $sum : 1 } } },
					{ $match : { total : { $gte : 2 } } },
					//{ $sort : {total : -1} },
					{ $limit : 5 }, 
					function(err, groups) {
						console.log('data me! ', err, dats)
						if(!groups || !groups.length)
							return next(itr, cb)

						var group = {
									handle: null,
									total: 0
								}

						for(var i=0, l=groups.length; i<l; i++) {
							if(!groups[i]._id) // any null, undefined, false, or 0 duplicates will be skipped
								continue;

							// if we have more than 2 duplicates something is very wrong
							// log the error and continue so we can look into this further via the log files
							if(groups[i].total > 2)	{
								Log.error('Error saving to Engager table', {error: err, duplicate_screenname: groups[i]._id, total_duplicates: groups[i].total, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								continue;
							}

							screen_name = groups[i]._id;
							break;
						}

						if(!screen_name)
							return next(itr, cb)
console.log('duplicate twitter screen name detected');
						// call the update function below with the duplicate screen_name param 
						Harvest.engagers.update(itr, cb, screen_name)

					}
				)
			},

			// call every 15 minutes
			update: function(itr, cb, duplicate, retry) {
				var timestamp = Utils.timestamp(),
						twitterUsersCsv = '',
						query;

				if(duplicate)
					query = {'Twitter.screen_name_lower' : duplicate}
				else
					query = {twitter_id: {$exists: true}, Twitter: {$exists: true}, 'Twitter.timestamp': {$exists: true}, 'Twitter.timestamp': {$lt: timestamp - 1296000 /* 1296000 seconds = 15 days */}}

				Model.Engagers.find(query, null, {limit: 99}, function(err, engagers) {
					if (err)
						return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
					
					if(!engagers.length)
						return next(itr, cb)

					// TODO: use a vocada dev user account to get higher api rate limit, not the app acount 
					twitter = Auth.load('twitter').setBearerToken()

					// create the query string for twitter api
					for(var i=0, l=engagers.length; i<l; i++) 
						twitterUsersCsv += engagers[i].twitter_id + ',';

					// why are we adding a static id at the end? because if all ids in id engagers list
					// are for removed accounts then this endpoint returns a 404 error
					// previously we added a special case error handling to skip if it returned 404 but 
					// if twitter is down and returns a 404 then all those ids get marked as deleted!
					// here we add the id for twitter's own account "twitter"
					twitterUsersCsv += '783214'

					twitter.get('/users/lookup.json', {user_id: twitterUsersCsv, include_entities: false}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('twitter', 'Twitter update method failed to connect in 3 attempts!', err, response, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
								return next(itr, cb);
							}

							return Harvest.engagers.update(itr, cb, duplicate, retry ? ++retry : 1)
						}
						
						// error handling
						if (err || !response || response.errors) {
							Error.handler('twitter', err || response, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						localEngagingUsers:
						for(var x=0, l=engagers.length; x<l; x++) {
							for(var y=0, len=response.length; y<len; y++)
								if(response[y].id_str == engagers[x].twitter_id && response[y].id_str !== '783214') {
									response[y].status = null;
									engagers[x].Twitter = {
										id: engagers[x].twitter_id,
										screen_name: response[y].screen_name,
										screen_name_lower: response[y].screen_name.toLowerCase(),
										timestamp: timestamp, // this is the update timestamp as well
										data: response[y]
									}

									engagers[x].save(function(err, save) {
										if(err)
											return Log.error('Error saving to Engager table', {error: err, engager_id: engagers[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})							
									})
									continue localEngagingUsers;
								}

							// if we reached here it means the twitter_id returned no data from twitter (user removed or account deleted)
							// remove the twitter_id
							engagers[x].twitter_id = undefined;
							engagers[x].save(function(err, save) {
								if(err)
									return Log.error('Error saving to Engager table', {error: err, engager_id: engagers[x]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
								console.log('removed user from engagers ');
							})
						}

						next(itr, cb)
					})
				})
			},
		}

	} // End Harvest

	return {
		getMetrics: function(params, callback) {
			twitter = Auth.load('twitter', params.auth_token, params.token_secret),
			data = params,
			update = false,
			Harvest.type = 'metrics';

			Model.Analytics.findById(data.analytics_id, function(err, analytics) {
				
				Analytics = analytics;
				analytics = null;

				Harvest.metrics[data.methods[0]](0, function() {
					if(Engagers.length)
						Model.Engagers.collection.insert(Engagers, {safe: true, continueOnError: true}, function(err, save) {
							if(err && err.code !== 11000)
								Log.error('Error saving to Engager table', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						})
					
					if(update) {
						Analytics.save(function(err, save) {
							if(err && err.name !== 'VersionError')
								return Log.error('Error saving Twitter analytics to database', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

							// if we have a versioning overwrite error than load up the analytics document again
							if(err && err.name === 'VersionError')
								Model.Analytics.findById(data.analytics_id, function(err, analytics) {
									if(err)
										return Log.error('Error querying Analytic table', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

									analytics.twitter = Analytics.twitter;
									analytics.markModified('twitter')

									analytics.save(function(err, save) {
										if(err)
											return Log.error('Error saving Twitter analytics to database', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
										callback(null);
									})
								})
							else
								callback(null);
						})
					} else {
						callback(null);
					}
				});
			})
		},
		engagers: function(methods, callback) {
			Harvest.type = 'engagers';
			Harvest.engagers[methods[0]](0, function() {
				callback(null)
			})
		}
	}
}

module.exports = TwitterHarvester;