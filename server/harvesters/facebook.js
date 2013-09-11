var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var FacebookHarvester = (function() {

	var facebook,
			data,
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
			Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {
			
				facebook.get(data.network_id, {fields: 'name,category,category_list,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
					if(err || typeof response.error !== 'undefined')
						console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

						var cached = Analytics.facebook.business.data;

						if( !cached || (cached && (response.name != cached.name || response.category != cached.category || response.description != cached.description || response.about != cached.about || response.location.street != cached.location.street || response.website != cached.website || response.username != cached.username)) ) {
							Analytics.facebook.business = {
								timestamp: Helper.timestamp(),
								data: {name: response.name,category: response.category, category_list: response.category_list,description: response.description,about: response.about,location: response.location,website: response.website,username: response.username}
							}

							Model.User.findById(data.user, function(err, user) {
								user.Business[data.index].Social.facebook.account.data = Analytics.facebook.business.data;
								user.save(function(err) {console.log(err)});
							});
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

						Analytics.save(function(err,response){
							next(itr, cb);
						});
						console.log('saved updated business info and initial tracking info');	
				});
			});
		},

		posts: function(itr, cb) {
console.log('at posts [new] method...');
			Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {

				var posts = Analytics.facebook.tracking.posts.sort(Helper.sortBy('timestamp', false, parseInt)),
						since = posts.length ? posts[0].timestamp : 0;
	
				facebook.get(data.network_id, {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
					if(err || typeof response.error !== 'undefined')
						console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)
				
					if(response.feed && response.feed.data && response.feed.data.length) {
						var results = response.feed.data;

						for(var i = 0, l = results.length; i < l; i++) {

							var post = {
								id: results[i].id,
								timestamp: Helper.timestamp(),
								data: results[i],
								likes: {},
								comments: {},
								shares: {}
							}

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

							Analytics.facebook.tracking.posts.push(post);
						}

						//Analytics.facebook.updates.push(data);
						Analytics.save(function(err,response){
							console.log('saved new feed item(s) and related tracking...');
							Harvest.posts_update(itr, cb);
						});
		
					}
				});

			});
		},

		posts_update: function(itr, cb) {
console.log('at the posts [update] method...');
			Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {

				var posts = Analytics.facebook.tracking.posts.sort(Helper.sortBy('timestamp', false, parseInt)),
						since = posts.length ? posts[0].timestamp : 0;

				facebook.get(data.network_id, {fields: 'feed.until(' + since + ').limit(200).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
					if(response.feed && response.feed.data && response.feed.data.length) {
						
						var update = false,
								results = response.feed.data;

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

						if(update)
							Analytics.save(function(err){
								console.log('saved updated tracking...');
								next(itr, cb);
							});
						else 
							next(itr, cb);
					}
				})
			});
		},

		page_insights: function(itr, cb) {
console.log('at page_insights method...');
			Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {

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
							if(insights[i].values[y].end_time > newestTimestamp)
								Analytics.facebook.tracking.page.insights[insights[i].name].data.push({
									// facebook puts "." in key values of JSON which Mongo will not except
									value: JSON.parse(JSON.stringify(insights[i].values[y].value).replace(/\./gm, '_')),
									timestamp: insights[i].values[y].end_time
								})

					}

					Analytics.save(function(err,response){
						console.log(err);
						console.log('saved page insights');
						next(itr, cb);
					});		
				})
			});
		},

		posts_insights: function(itr, cb) {
console.log('at posts_insights method');
			Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {

				var timeframe = new Date();
				timeframe = Math.round(timeframe.setMonth(timeframe.getMonth()-2)/1000);

				facebook.get(data.network_id, {fields: 'posts.fields(insights).since('+timeframe+').limit(200)', date_format: 'U'}, function(err, res) {

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
										timestamp: Helper.timestamp()
									})
									Analytics.facebook.tracking.posts[y].insights[insights[z].name].timestamp = Helper.timestamp();
								}
							}

							break;
						}
					}

					Analytics.save(function(err,response){
						console.log(err);
						console.log('saved posts insights... going home');
						next(itr, cb);
					});
					
				})
			});
		},
	} // End Harvest

	return {
		getData: function(params, callback) {
			facebook = Auth.load('facebook').setAccessToken(params.auth_token),
			data = params;

			Harvest[data.methods[0]](0, callback);
		}
	}

})();

module.exports = FacebookHarvester;