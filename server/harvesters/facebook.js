var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var FacebookHarvester = function() {

	var Analytics,
			facebook,
			data,
			update = false,
			since = 0,
			next = function(i, cb, stop) {
				var i = i+1;
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {
		page: function(itr, cb) {
console.log('at facebook business page update method...');

			// call facebook api
			facebook.get(data.network_id, {fields: 'name,category,category_list,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, err, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				var cached = Analytics.facebook.business.data,
						timestamp = Helper.timestamp(),
						localUpdate = false;

				if( !cached || (cached && (response.name != cached.name || response.category != cached.category || response.description != cached.description || response.about != cached.about || response.location.street != cached.location.street || response.website != cached.website || response.username != cached.username)) ) {
					update = localUpdate = true;
					Analytics.facebook.business = {
						timestamp: timestamp,
						data: {name: response.name,category: response.category, category_list: response.category_list,description: response.description,about: response.about,location: response.location,website: response.website,username: response.username}
					}

					Model.User.findById(data.user, function(err, user) {
						user.Business[data.index].Social.facebook.account.data = Analytics.facebook.business.data;
						user.save(function(err) {
							if(err)
								return Log.error('Error saving Facebook page data to user table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						})
					})
				}

				if(response.likes != Analytics.facebook.tracking.page.likes.total) {
					update = localUpdate = true;
					Analytics.facebook.tracking.page.likes.meta.push({
						timestamp: timestamp,
						total: response.likes
					});
					Analytics.facebook.tracking.page.likes.total = response.likes;
					Analytics.facebook.tracking.page.likes.timestamp = timestamp;
				}

				if(response.checkins != Analytics.facebook.tracking.page.checkins.total) {
					update = localUpdate = true;
					Analytics.facebook.tracking.page.checkins.meta.push({
						timestamp: timestamp,
						total: response.checkins
					});
					Analytics.facebook.tracking.page.checkins.total = response.checkins;
					Analytics.facebook.tracking.page.checkins.timestamp = timestamp;
				}

				if(response.talking_about_count != Analytics.facebook.tracking.page.talking.total) {
					update = localUpdate = true;
					Analytics.facebook.tracking.page.talking.meta.push({
						timestamp: timestamp,
						total: response.talking_about_count
					});
					Analytics.facebook.tracking.page.talking.total = response.talking_about_count;
					Analytics.facebook.tracking.page.talking.timestamp = timestamp;
				}

				if(response.were_here_count != Analytics.facebook.tracking.page.were_here.total) {
					update = localUpdate = true;
					Analytics.facebook.tracking.page.were_here.meta.push({
						timestamp: timestamp,
						total: response.were_here_count
					});
					Analytics.facebook.tracking.page.were_here.total = response.were_here_count;
					Analytics.facebook.tracking.page.were_here.timestamp = timestamp;
				}

				if(localUpdate) 
					console.log('saving updated Facebook business info and initial tracking info...');
				
				next(itr, cb);
			})
		},

		posts: function(itr, cb) {
console.log('at posts [new] method...');

			var posts = Analytics.facebook.tracking.posts.sort(Helper.sortBy('timestamp', false, parseInt)),
					localUpdate = false;

			since = posts.length ? posts[0].timestamp : 0;

			facebook.get(data.network_id, {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, err, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return Harvest.posts_update(itr, cb);
				}

				if(!response.feed || !response.feed.data || !response.feed.data.length)
					return Harvest.posts_update(itr, cb);

				var results = response.feed.data;
				update = localUpdate = true;

				for(var i = 0, l = results.length; i < l; i++) {

					var timestamp = Helper.timestamp(),
							post = {
								id: results[i].id,
								timestamp: Helper.timestamp(results.created_time),
								local_timestamp: timestamp,
								data: results[i],
								likes: {},
								comments: {},
								shares: {}
							}

					if(results[i].likes)
						post.likes = {
							meta: [{
								timestamp: timestamp,
								total: results[i].likes.data.length
							}],
							timestamp: timestamp,
							total: results[i].likes.data.length,
							data: results[i].likes.data
						}

					if(results[i].comments)
						post.comments = {
							meta: [{
								timestamp: timestamp,
								total: results[i].comments.data.length
							}],
							timestamp: timestamp,
							total: results[i].comments.data.length,
							data: results[i].comments.data
						}

					if(results[i].shares)
						post.shares = {
							meta: [{
								timestamp: timestamp,
								total: parseInt(results[i].shares.count, 10)
							}],
							timestamp: timestamp,
							total: parseInt(results[i].shares.count, 10)
						}

					Analytics.facebook.tracking.posts.push(post);
				}

				if(localUpdate) 
					console.log('saving new Facebook feed item(s) and related tracking...');

				Harvest.posts_update(itr, cb);
			})
		},

		posts_update: function(itr, cb) {
console.log('at the posts [update] method...');

			if(!since)
				return next(itr, cb);

			// NOTE: brought limit down from 200 to 50
			facebook.get(data.network_id, {fields: 'feed.until(' + since + ').limit(50).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, err, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				if(!response.feed || !response.feed.data || !response.feed.data.length)
					return next(itr, cb);
				
				var results = response.feed.data,
						localUpdate = false;

				for(var x = 0, l = results.length; x < l; x++) {
					for(var y = 0, len = Analytics.facebook.tracking.posts.length; y < len; y++) {
						var timestamp = Helper.timestamp();

						if(Analytics.facebook.tracking.posts[y].id == results[x].id) {
							
							if(results[x].likes && results[x].likes.data && results[x].likes.data.length != Analytics.facebook.tracking.posts[y].likes.total) {
								Analytics.facebook.tracking.posts[y].likes.meta.push({
									timestamp: timestamp,
									total: results[x].likes.data.length
									//new: (typeof Analytics.facebook.tracking.posts[y].likes.total !== 'undefined') ? (results[x].likes.data.length - Analytics.facebook.tracking.posts[y].likes.total) : results[x].likes.data.length
								});
								Analytics.facebook.tracking.posts[y].likes.timestamp = timestamp;
								Analytics.facebook.tracking.posts[y].likes.total = results[x].likes.data.length,
								Analytics.facebook.tracking.posts[y].likes.data = results[x].likes.data;
								update = localUpdate = true;
							}

							if(results[x].comments && results[x].comments.data && results[x].comments.data.length != Analytics.facebook.tracking.posts[y].comments.total) {
								Analytics.facebook.tracking.posts[y].comments.meta.push({
									timestamp: timestamp,
									total: results[x].comments.data.length
									//new: (typeof Analytics.facebook.tracking.posts[y].comments.total !== 'undefined') ? (results[x].comments.data.length - Analytics.facebook.tracking.posts[y].comments.total) : results[x].comments.data.length
								});
								Analytics.facebook.tracking.posts[y].comments.timestamp = timestamp;
								Analytics.facebook.tracking.posts[y].comments.total = results[x].comments.data.length,
								Analytics.facebook.tracking.posts[y].comments.data = results[x].comments.data;
								update = localUpdate = true;
							}

							if(results[x].shares && results[x].shares.count && parseInt(results[x].shares.count, 10) != Analytics.facebook.tracking.posts[y].shares.total) {
								Analytics.facebook.tracking.posts[y].shares.meta.push({
									timestamp: timestamp,
									total: parseInt(results[x].shares.count, 10)
									//new: (typeof Analytics.facebook.tracking.posts[y].shares.total !== 'undefined') ? (parseInt(results[x].shares.count, 10) - Analytics.facebook.tracking.posts[y].shares.total) : parseInt(results[x].shares.count, 10)
								});
								Analytics.facebook.tracking.posts[y].shares.timestamp = timestamp;
								Analytics.facebook.tracking.posts[y].shares.total = parseInt(results[x].shares.count, 10);
								update = localUpdate = true;
							}

							break;
						}
					}
				}

				if(localUpdate) 
					console.log('saving updated Facebook post data...');

				next(itr, cb);
			})
		},

		// call both insights methods together every 24 hours
		page_insights: function(itr, cb) {
console.log('at page_insights method...');

			facebook.get(data.network_id, {fields: 'insights', date_format: 'U'}, function(err, response) {
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, err, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				var insights = response.insights.data,
						initial = !Analytics.facebook.tracking.page.insights ? true : false;

				if(initial)
					Analytics.facebook.tracking.page.insights = {};
	
				for(var i=0,l=insights.length;i<l;i++) {
				
					if(insights[i].period != 'day')
						continue;

					if(initial)
						Analytics.facebook.tracking.page.insights[insights[i].name] = {
							timestamp: Helper.timestamp(),
							data: []
						}

					var insightsLength = Analytics.facebook.tracking.page.insights[insights[i].name].data.length,
							newestTimestamp = insightsLength ? Analytics.facebook.tracking.page.insights[insights[i].name].data[insightsLength-1].timestamp : 0;

					for(var y=0,len=insights[i].values.length;y<len;y++)				
						if(insights[i].values[y].end_time > newestTimestamp) {
							Analytics.facebook.tracking.page.insights[insights[i].name].data.push({
								// facebook puts "." in key values of JSON which Mongo will not except
								value: JSON.parse(JSON.stringify(insights[i].values[y].value).replace(/\./gm, '_')),
								timestamp: insights[i].values[y].end_time
							})
							update = localUpdate = true;
						}

				}

				if(localUpdate) 
					console.log('saving new page insights...');

				next(itr, cb);
			})
		},

		// call both insights methods together every 24 hours
		posts_insights: function(itr, cb) {
console.log('at posts_insights method');

			var timeframe = new Date(),
					localUpdate = false;
					
			timeframe = Math.round(timeframe.setMonth(timeframe.getMonth()-2)/1000);

			facebook.get(data.network_id, {fields: 'posts.fields(insights).since('+timeframe+').limit(200)', date_format: 'U'}, function(err, response) {
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, err, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				var timestamp = Helper.timestamp()

				for(var x=0,l=response.posts.data.length;x<l;x++) {
					
					var posts = Analytics.facebook.tracking.posts;

					for(var y=posts.length-1;y>0;y--) {							
						if(posts[y].id != response.posts.data[x].id)
							continue

						var insights = response.posts.data[x].insights.data,
								initial = !posts[y].insights ? true : false;

						if(initial)
							Analytics.facebook.tracking.posts[y].insights = {};

						for(var z=0,length=insights.length;z<length;z++) {

							if(initial)
								Analytics.facebook.tracking.posts[y].insights[insights[z].name] = {
									timestamp: 0,
									data: []
								}

							if(Analytics.facebook.tracking.posts[y].insights[insights[z].name].timestamp < Helper.timestamp()-86400) {
								Analytics.facebook.tracking.posts[y].insights[insights[z].name].data.push({
									// facebook puts "." in key values of JSON which Mongo will not except
									value: JSON.parse(JSON.stringify(insights[z].values[0].value).replace(/\./gm, '_')),
									timestamp: timestamp
								})
								Analytics.facebook.tracking.posts[y].insights[insights[z].name].timestamp = Helper.timestamp();
								update = localUpdate = true;
							}
						}

						break;
					}
				}

				if(localUpdate) 
					console.log('saving new post insights...');

				next(itr, cb);
			})
		},

		connections: function(itr, cb) {
			var timestamp = Helper.timestamp(),
					batchArray = [];

			Model.Connections.find({facebook_id: {$exists: true}, Facebook: {$exists: false}}, null, {limit: 100}, function(err, users) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!users.length)
					return;

				for(var i=0, l=users.length; i<l; i++)
					batchArray.push({method: "GET", relative_url: users[i].facebook_id});
	
				facebook.get('/', {batch: batchArray, access_token: facebook.client.id+'|'+facebook.client.secret}, function(err, response) {
					if(err || !response || response.error)
						return Error.handler('facebook', err || response.error, err, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})

					for(var x=0, l=response.length; x<l; x++) {

						if(response[x].code !== 200 || !response[x].body || response[x].body == '') {
							Error.handler('facebook', response[x].code, response[x].code, response, {meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							continue;
						}

						var responseBody = JSON.parse(response[x].body)

						for(var y=0, len=users.length; y<len; y++)
							if(responseBody.id == users[y].facebook_id) {
								users[y].Facebook = {
									id: users[y].facebook_id,
									timestamp: timestamp,
									data: responseBody
								}
								users[y].save(function(err, save) {
									if(err)
										return Log.error('Error saving to Connection table', {error: err, connections_id: users[y]._id, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

								})
								break
							}
					}
				})
			})
		}

	} // End Harvest

	return {
		getMetrics: function(params, callback) {
			// load facebook api and set access tokens from database
			facebook = Auth.load('facebook').setAccessToken(params.auth_token),
			data = params,
			update = false;

			Model.Analytics.findById(data.analytics_id, function(err, analytics) {
				if(err)
					return Log.error('Error querying Analytic table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				Analytics = analytics;
				analytics = null;

				Harvest[data.methods[0]](0, function() {			
					if(update)
						Analytics.save(function(err, save) {
							if(err && err.name !== 'VersionError')
								return Log.error('Error saving Facebook analytics to database', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

							// if we have a versioning overwrite error than load up the analytics document again
							if(err && err.name === 'VersionError')
								Model.Analytics.findById(data.analytics_id, function(err, analytics) {
									if(err)
										return Log.error('Error querying Analytic table', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

									analytics.facebook = Analytics.facebook;
									analytics.markModified('facebook')

									analytics.save(function(err, save) {
										if(err)
											return Log.error('Error saving Facebook analytics to database', {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
										callback();
									})
								})
							else
								callback();
						})
					else 
						callback();
				})
			})
		},
		appData: function(methods, callback) {
			facebook = Auth.load('facebook');
			//Harvest.type = 'connections';
			Harvest[methods[0]](0, function() {
				callback(null)
			})
		}
	}
}

module.exports = FacebookHarvester;