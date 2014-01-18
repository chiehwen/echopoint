var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object;

var FacebookHarvester = function() {

	// private vars and methods
	var Analytics,
			Engagers = [],
			facebook,
			data,
			update = false,
			retries = Utils.retryErrorCodes.concat([2]),
			since = 0,
			next = function(i, cb, stop) {
				var i = i+1;
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {
		page: function(itr, cb, retry) {
console.log('at facebook business page update method...');

			// call facebook api
			facebook.get(data.network_id, {fields: 'name,category,category_list,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && retries.indexOf(err.code) > -1) {
					if(retry && retry > 2) {
						Log.warn('Facebook page method failed to connect in 3 attempts!', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.page(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				var cached = Analytics.facebook.business.data,
						timestamp = Utils.timestamp(),
						localUpdate = false;

				if( !cached || (cached && (response.name != cached.name || response.category != cached.category || response.description != cached.description || response.about != cached.about || response.location.street != cached.location.street || response.website != cached.website || response.username != cached.username)) ) {
					update = localUpdate = true;
					Analytics.facebook.business = {
						timestamp: timestamp,
						data: {name: response.name,category: response.category, category_list: response.category_list,description: response.description,about: response.about,location: response.location,website: response.website,username: response.username}
					}

					/*Model.User.findById(data.user, function(err, user) {
						if(err || !user)
							return Log.error('Error querying user in User collection', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						
						//user.Business[data.index].Social.facebook.account.data = Analytics.facebook.business.data;
						user.Business[data.index].Social.facebook.account.populated = true;
						user.save(function(err) {
							if(err)
								return Log.error('Error saving Facebook page data to user table', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						})
					})*/
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

		posts: function(itr, cb, retry) {
console.log('at facebook posts [new] method...');

			var posts = Analytics.facebook.tracking.posts.sort(Utils.sortBy('timestamp', false, parseInt)),
					localUpdate = false;

			since = posts.length ? posts[0].timestamp : 0;

			facebook.get(data.network_id, {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && retries.indexOf(err.code) > -1) {
					if(retry && retry > 2) {
						Log.warn('Facebook page method failed to connect in 3 attempts!', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.posts(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
					return Harvest.posts_update(itr, cb);
				}

				if(!response.feed || !response.feed.data || !response.feed.data.length)
					return Harvest.posts_update(itr, cb);

				var results = response.feed.data;
				update = localUpdate = true;

				for(var i = 0, l = results.length; i < l; i++) {

					var timestamp = Utils.timestamp(),
							post = {
								id: results[i].id,
								timestamp: Utils.timestamp(results.created_time),
								local_timestamp: timestamp,
								data: results[i],
								likes: {},
								comments: {},
								shares: {}
							}

					if(results[i].likes) {
						post.likes = {
							meta: [{
								timestamp: timestamp,
								total: results[i].likes.data.length
							}],
							timestamp: timestamp,
							total: results[i].likes.data.length,
							data: results[i].likes.data
						}

						for(var x = 0, len = results[i].likes.data.length; x<len; x++)
							Engagers.push({facebook_id: results[i].likes.data[x].id})
					}

					if(results[i].comments) {
						post.comments = {
							meta: [{
								timestamp: timestamp,
								total: results[i].comments.data.length
							}],
							timestamp: timestamp,
							total: results[i].comments.data.length,
							data: results[i].comments.data
						}

						for(var y = 0, length = results[i].comments.data.length; y<length; y++)
							Engagers.push({facebook_id: results[i].comments.data[y].from.id})
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

		posts_update: function(itr, cb, retry) {
console.log('at the facebook posts [update] method...');

			if(!since)
				return next(itr, cb);

			// NOTE: brought limit down from 200 to 50
			facebook.get(data.network_id, {fields: 'feed.until(' + since + ').limit(50).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && retries.indexOf(err.code) > -1) {
					if(retry && retry > 2) {
						Log.warn('Facebook page method failed to connect in 3 attempts!', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.posts_update(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				if(!response.feed || !response.feed.data || !response.feed.data.length)
					return next(itr, cb);
				
				var results = response.feed.data,
						localUpdate = false;

				for(var x = 0, l = results.length; x < l; x++) {
					for(var y = 0, len = Analytics.facebook.tracking.posts.length; y < len; y++) {
						var timestamp = Utils.timestamp();

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

								// put user ids into engagers array for the engagers table
								for(var a = 0, a_length = results[x].likes.data.length; a < a_length; a++)
									Engagers.push({facebook_id: results[x].likes.data[a].id})

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

								// put user ids into engagers array for the engagers table
								for(var b = 0, b_length = results[x].comments.data.length; b < b_length; b++)
									Engagers.push({facebook_id: results[x].comments.data[b].from.id})

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
		page_insights: function(itr, cb, retry) {
console.log('at facebook page_insights method...');

			facebook.get(data.network_id, {fields: 'insights', date_format: 'U'}, function(err, response) {
				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && retries.indexOf(err.code) > -1) {
					if(retry && retry > 2) {
						Log.warn('Facebook page method failed to connect in 3 attempts!', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.page_insights(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
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
							timestamp: Utils.timestamp(),
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
		posts_insights: function(itr, cb, retry) {
console.log('at facebook posts_insights method');

			var timeframe = new Date(),
					localUpdate = false;
			
			// set timeframe limit to collect posts only within the last 2 months		
			timeframe = Math.round(timeframe.setMonth(timeframe.getMonth()-2)/1000);

			facebook.get(data.network_id, {fields: 'posts.fields(insights).since('+timeframe+').limit(200)', date_format: 'U'}, function(err, response) {
				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && retries.indexOf(err.code) > -1) {
					if(retry && retry > 2) {
						Log.warn('Facebook page method failed to connect in 3 attempts!', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.posts_insights(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || !response || response.error) {
					Error.handler('facebook', err || response, {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb);
				}

				if(!response.posts)
					return next(itr, cb)

				var timestamp = Utils.timestamp()

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

							if(Analytics.facebook.tracking.posts[y].insights[insights[z].name].timestamp < Utils.timestamp()-86400) {
								Analytics.facebook.tracking.posts[y].insights[insights[z].name].data.push({
									// facebook puts "." in key values of JSON which Mongo will not except
									value: JSON.parse(JSON.stringify(insights[z].values[0].value).replace(/\./gm, '_')),
									timestamp: timestamp
								})
								Analytics.facebook.tracking.posts[y].insights[insights[z].name].timestamp = Utils.timestamp();
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

		engagers: function(itr, cb, retry) {
console.log('at facebook engagers method');
			Model.Engagers.find({
				facebook_id: {$exists: true}, 
				Facebook: {$exists: false},
				$or: [
					{'meta.facebook.discovery.timestamp': {$exists: false}}, 
					{'meta.facebook.discovery.timestamp': {$lt: Utils.timestamp() - 864000 /* 864000 = 10 days */} },
				] 
			}, null, {limit: 50}, function(err, engagers) {
				if (err)
					return Log.error(err, {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!engagers.length)
					return next(itr, cb);

				var timestamp = Utils.timestamp(),
						batch = '[';

				// update all discovery attempt timestamps (but not save) and build our facebook batch call array
				for(var i=0, l=engagers.length; i<l; i++) {
					engagers[i].meta.facebook.discovery.timestamp = timestamp
					batch += '{method:"GET",relative_url:'+engagers[i].facebook_id+'},';
				}
		
				// call Facebook batch API endpoint
				facebook.post('/', {batch: batch+']', access_token: facebook.client.id+'|'+facebook.client.secret}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('facebook', 'Facebook update method failed to connect in 3 attempts!', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.engagers(itr, cb, retry ? ++retry : 1)
					}
					
					// once we make sure we don't have a connection error to Facebook we save the discovery timestamps set above
					for(var i=0, l=engagers.length; i<l; i++) {
						engagers[i].save(function(err, save) {
							if(err)
								Log.error('Error saving to Engagers table', {error: err, engagers_id: engagers[i]._id.toString(), meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						})
					}

					// error handling
					if(err || !response || response.error) {
						Error.handler('facebook', 'Facebook API error', {error: err, response: response, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}

					for(var x=0, l=response.length; x<l; x++) {

						if(response[x].code !== 200 || !response[x].body || response[x].body === '') {
							Error.handler('facebook',  'Facebook error within a batch call response' || response[x].code, {error: null, response: response[x], meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							continue;
						}

						if(!response[x].body.isJSON()) {
							Error.handler('facebook', 'Not valid JSON within Facebook batch call response', {error : null, response: response[x], meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							continue;
						}

						var facebookUserData = JSON.parse(response[x].body)

						for(var y=0, len=engagers.length; y<len; y++)
							if(facebookUserData.id == engagers[y].facebook_id) {
								engagers[y].Facebook = {
									id: engagers[y].facebook_id,
									timestamp: timestamp,
									data: facebookUserData
								}
								engagers[y].save(function(err, save) {
									if(err)
										return Log.error('Error saving to Engager table', {error: err, engagers_id: engagers[y]._id.toString(), meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
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
					return Log.error('Error querying Analytic collection', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				Analytics = analytics;
				analytics = null;

				Harvest[data.methods[0]](0, function() {
					if(Engagers.length)
						Model.Engagers.collection.insert(Engagers, {safe: true, continueOnError: true}, function(err, save) {
							if(err && err.code !== 11000)
								Log.error('Error saving to Engager table', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						})

					if(update)
						Analytics.save(function(err, save) {
							if(err && err.name !== 'VersionError')
								return Log.error('Error saving Facebook analytics to database', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

							// if we have a versioning overwrite error than load up the analytics document again
							if(err && err.name === 'VersionError')
								Model.Analytics.findById(data.analytics_id, function(err, analytics) {
									if(err)
										return Log.error('Error querying Analytic table', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

									analytics.facebook = Analytics.facebook;
									analytics.markModified('facebook')

									analytics.save(function(err, save) {
										if(err)
											return Log.error('Error saving Facebook analytics to database', {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
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
		directToMethods: function(methods, callback) {
			facebook = Auth.load('facebook');
			data = {methods: methods};

			Harvest[methods[0]](0, function() {
				callback(null)
			})
		}
	}
}

module.exports = FacebookHarvester;