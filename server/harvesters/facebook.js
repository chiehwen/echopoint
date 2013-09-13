var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var FacebookHarvester = (function() {

	var Analytics,
			facebook,
			data,
			update = false,
			since = 0,
			next = function(i, cb) {
				var i = i+1;
				if(data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {
		page: function(itr, cb) {
console.log('at page method...');

			facebook.get(data.network_id, {fields: 'name,category,category_list,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
				if(err || response.error)
					console.log(err,response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

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
							user.save(function(err) {console.log(err)});
						});
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

					if(localUpdate) console.log('saved updated business info and initial tracking info');
					next(itr, cb);
			})
		},

		posts: function(itr, cb) {
console.log('at posts [new] method...');

			var posts = Analytics.facebook.tracking.posts.sort(Helper.sortBy('timestamp', false, parseInt)),
					localUpdate = false;

			since = posts.length ? posts[0].timestamp : 0;

			facebook.get(data.network_id, {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
				if(err || response.error)
					console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
			
				if(response.feed && response.feed.data && response.feed.data.length) {
					var results = response.feed.data;
					update = localUpdate = true;

					for(var i = 0, l = results.length; i < l; i++) {

						var timestamp = Helper.timestamp(),
								post = {
									id: results[i].id,
									timestamp: timestamp,
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

					if(localUpdate) console.log('saved new feed item(s) and related tracking...');
				} 

				Harvest.posts_update(itr, cb);
			})
		},

		posts_update: function(itr, cb) {
console.log('at the posts [update] method...');

			if(since) {
				facebook.get(data.network_id, {fields: 'feed.until(' + since + ').limit(200).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
					if(response.feed && response.feed.data && response.feed.data.length) {
						
						var results = response.feed.data,
								localUpdate = false;

						for(var x = 0, l = results.length; x < l; x++) {
							for(var y = 0, len = Analytics.facebook.tracking.posts.length; y < len; y++) {
								var timestamp = Helper.timestamp();

								if(Analytics.facebook.tracking.posts[y].id == results[x].id) {
									
									if(results[x].likes && results[x].likes.data.length != Analytics.facebook.tracking.posts[y].likes.total) {
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

									if(results[x].comments && results[x].comments.data.length != Analytics.facebook.tracking.posts[y].comments.total) {
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

									if(results[x].shares && parseInt(results[x].shares.count, 10) != Analytics.facebook.tracking.posts[y].shares.total) {
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

						if(localUpdate) console.log('saved updated post data...');
					} 

					next(itr, cb);
				})

			} else {
				next(itr, cb);
			}
		},

		page_insights: function(itr, cb) {
console.log('at page_insights method...');

			facebook.get(data.network_id, {fields: 'insights', date_format: 'U'}, function(err, res) {

				var insights = res.insights.data,
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

				if(localUpdate) console.log('saved new page insights');
				next(itr, cb);

			})
		},

		posts_insights: function(itr, cb) {
console.log('at posts_insights method');

			var timeframe = new Date(),
					localUpdate = false;
			timeframe = Math.round(timeframe.setMonth(timeframe.getMonth()-2)/1000);

			facebook.get(data.network_id, {fields: 'posts.fields(insights).since('+timeframe+').limit(200)', date_format: 'U'}, function(err, res) {
				var timestamp = Helper.timestamp()
				
				for(var x=0,l=res.posts.data.length;x<l;x++) {
					
					var posts = Analytics.facebook.tracking.posts;

					for(var y=posts.length-1;y>0;y--) {							
						if(posts[y].id != res.posts.data[x].id)
							continue

						var insights = res.posts.data[x].insights.data,
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

				if(localUpdate) console.log('saved new post insights');
				next(itr, cb);
			})
		},

	} // End Harvest

	return {
		getData: function(params, callback) {
			facebook = Auth.load('facebook').setAccessToken(params.auth_token),
			data = params,
			update = false;

			Model.Analytics.findOne({id: data.analytics_id}, function(err, analytics) {
				Analytics = analytics;
				Harvest[data.methods[0]](0, function() {			
					if(update)
						Analytics.save(function(err,response){
							// TODO: handle err 
							console.log('saved facebook analytic data');
							callback(null);
						})
				});
			})
		}
	}

})();

module.exports = FacebookHarvester;