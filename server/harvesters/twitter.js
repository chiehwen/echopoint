var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var TwitterHarvester = (function() {

	var Analytics,
			twitter,
			data,
			update = false,
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
			twitter.get('account/verify_credentials', {include_entities: false, skip_status: true}, function(err, credentials) {

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

			})
		},

		// new tweets 
		timeline: function(itr, cb) {

			twitter.get('statuses/user_timeline', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 100, contributor_details: true, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
				if(!response.length)
					return next(itr, cb);

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
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

			twitter.get('statuses/mentions_timeline', {since_id: Analytics.twitter.tracking.mentions.since_id, count: 200, contributor_details: true, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
				if(!response.length)
					return next(itr, cb);

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
					response[i].timestamp = Helper.timestamp();
					Analytics.twitter.mentions.list.push(response[i]);
				}

				Analytics.twitter.mentions.since_id = response[0].id_str;
				Analytics.twitter.mentions.timestamp = Helper.timestamp();
				
				console.log('saved user @ mentions...');

				next(itr, cb);
			})
		},

		// retweets tracking
		retweets: function(itr, cb) {
			twitter.get('statuses/retweets_of_me', {count: 100, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
				if(err || response.errors)
					console.log(err); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
				if(!response.length)
					return next(itr, cb);

				var timestamp = Helper.timestamp();

				for(var x = 0, l = response.length; x < l; x++) {
					for(var y = 0, len = Analytics.twitter.timeline.tweets.length; y < len; y++) {

						if(Analytics.twitter.timeline.tweets[y].id == response[x].id_str) {

							var count = parseInt(response[x].retweet_count, 10);
							if(!Analytics.twitter.timeline.tweets[y].retweets) {
								update = true;
								Analytics.twitter.timeline.tweets[y].retweets = {
									history: [{
										timestamp: timestamp,
										total: count // parseInt(response[x].retweet_count, 10),
									}],
									timestamp: timestamp,
									total: count
								}
							} else {
								if(Analytics.twitter.timeline.tweets[y].retweets.total != count) {
									update = true;
									Analytics.twitter.timeline.tweets[y].retweets.history.push({
										timestamp: timestamp,
										total: count
									});
									Analytics.twitter.timeline.tweets[y].retweets.total = count;
								}
							}
							break;
						}
					}
				}

				if(localUpdate)
					console.log('saved retweets count update...');
				
				next(itr, cb);
			})
		},

		// direct message tracking
		dm: function(itr, cb) {
			twitter.get('direct_messages', {since_id: since.messages, count: 200}, function(err, response) {
				if(err || response.errors)
					console.log(err);
				
				if(!response.length)
					return next(itr, cb);

				update = true;
				for(var i = 0, l = response.length; i < l; i++) {
					response[i].timestamp = Helper.timestamp();
					response[i].recipient = null;
					Analytics.twitter.messages.list.push(response[i]);
				}

				Analytics.twitter.messages.since_id = response[0].id_str;
				Analytics.twitter.messages.timestamp = Helper.timestamp();
				
				console.log('saved new direct messages...');

				next(itr, cb);
			})
		},

		// find new favorited tweets
		favorited: function(itr, cb) {

			// check if this call is needed (aka favorited count has changed)
			if(!Analytics.twitter.tracking.favorited_count.change)
				return next(itr, cb);

			twitter.get('statuses/user_timeline', {user_id: data.network_id, since_id: Analytics.twitter.timeline.since_id, count: 200, contributor_details: false, trim_user: true, exclude_replies: false, include_rts: true}, function(err, response) {
				if(err || response.errors)
					console.log(err);
				
				if(!response.length)
					return next(itr, cb);

				var timestamp = Helper.timestamp(),
						localUpdate = false;

				for(var x = 0, l = response.length; x < l; x++) {
					for(var y = 0, len = Analytics.twitter.timeline.tweets.length; y < len; y++) {

						if(Analytics.twitter.timeline.tweets[y].id == response[x].id_str) {

							var count = parseInt(response[x].favorite_count, 10);
							if(!Analytics.twitter.timeline.tweets[y].favorited_count) {
								update = localUpdate = true;
								Analytics.twitter.timeline.tweets[y].favorited_count = {
									history: [{
										timestamp: timestamp,
										total: count // parseInt(response[x].retweet_count, 10),
									}],
									timestamp: timestamp,
									total: count
								}
							} else {
								if(Analytics.twitter.timeline.tweets[y].favorited_count.total != count) {
									update = localUpdate = true;
									Analytics.twitter.timeline.tweets[y].favorited_count.history.push({
										timestamp: timestamp,
										total: count
									});
									Analytics.twitter.timeline.tweets[y].favorited_count.total = count;
								}
							}
							break;
						}
					}
				}

				// no matter what set this back to false, we are iterating through 200 so if its past that update won't set to true and the favorited.change boolena flag will stay true!
				Analytics.twitter.tracking.favorited_count.change = false;

				if(localUpdate) {
					
					console.log('saved tweet favorited count update...');
				}

				next(itr, cb);
			})
		},

		// find new followers, only keep 20 newest
		newest_followers: function(itr, cb) {

			twitter.get('followers/list', {user_id: data.network_id, skip_status: true, include_user_entities: false}, function(err, response) {
				if(err || response.errors)
					console.log(err);
			})
		}

	} // End Harvest

	return {
		getData: function(params, callback) {
			twitter = Auth.load('twitter').setAccessTokens(params.oauthAccessToken, params.oauthAccessTokenSecret),
			data = params,
			update = false;

			Model.Analytics.findOne({id: data.analytics_id}, function(err, analytics) {
				Analytics = analytics;
				Harvest[data.methods[0]](0, function() {
					if(update)
						Analytics.save(function(err,response){
							// TODO: handle err 
							console.log('saved twitter analytic data');
							callback(null);
						})
				});
			})
		}
	}

})();

module.exports = TwitterHarvester;