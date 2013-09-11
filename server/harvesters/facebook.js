var crypto = require('crypto'),
		oauth = require('oauth'),
		url = require('url'),
		Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var FacebookHarvester = (function() {

	var facebook,
			data,
			next = function(i, cb) {
				var i = i+1;
				if(data.methods[i])
					Harvester[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvester = {
		page: function(itr, cb) {
console.log('at page method...');
Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {
			
				facebook.get(data.network_id, {fields: 'name,category,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
					if(err || typeof response.error !== 'undefined')
						console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

						var cached = Analytics.facebook.business.data;

						if( !cached || (cached && (response.name != cached.name || response.category != cached.category || response.description != cached.description || response.about != cached.about || response.location.street != cached.location.street || response.website != cached.website || response.username != cached.username)) ) {

							Analytics.facebook.business = {
								timestamp: Helper.timestamp(),
								data: {name: response.name,category: response.category,description: response.description,about: response.about,location: response.location,website: response.website,username: response.username}
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
								Harvester.posts_update(itr, cb);
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

				var insights = res.insights.data;
	
				for(var z=0,zlen=insights.length;z<zlen;z++) {
				
					if(insights[z].period != 'day')
						continue;

					if(!Analytics.facebook.tracking.page.insights.timestamp)
						Analytics.facebook.tracking.page.insights[insights[z].name] = {
							timestamp: Helper.timestamp(),
							data: []
						}

					var insightsLength = Analytics.facebook.tracking.page.insights[insights[z].name].data.length,
							newestTimestamp = insightsLength ? Analytics.facebook.tracking.page.insights[insights[z].name].data[insightsLength].timestamp : 0;

					for(var y=0,ylen=insights[z].values.length;y<ylen;y++)
						if(insights[z].values[y].end_time > newestTimestamp)
							Analytics.facebook.tracking.page.insights[insights[z].name].data.push({
								// facebook puts "." in key values of JSON which Mongo will not except
								value: JSON.parse(JSON.stringify(insights[z].values[y].value, function(key, value) {return key.toString().replace('.', '_', 'g')})),
								timestamp: insights[z].values[y].end_time
							})
				}

				Analytics.save(function(err,response){
					console.log(err);
					console.log('saved page insights');
					//console.log(initialFilteredResults);
					next(itr, cb);
				});
				
			})

});
		},

		posts_insights: function(itr, cb) {
console.log('at posts_insights method... going home');
Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {

				var timeframe = new Date();
				timeframe = Math.round(timeframe.setMonth(timeframe.getMonth()-2)/1000);

				facebook.get(data.network_id, {fields: 'posts.fields(insights).since('+timeframe+').limit(200)', date_format: 'U'}, function(err, res) {

					for(var p=0,plen=res.posts.data.length;p<plen;p++) {
						
						for(var q=Analytics.facebook.tracking.posts.length-1;q>0;q--) {							
							if(Analytics.facebook.tracking.posts[q].id != res.posts.data[p].id)
								continue

							var insights = res.posts.data[p].insights.data;

							for(var r=0,rlen=insights.length;r<rlen;r++) {

								if(!Analytics.facebook.tracking.posts[q].insights.timestamp)
									Analytics.facebook.tracking.posts[q].insights[insights[r].name] = {
										timestamp: 0,
										data: []
									}

								if(Analytics.facebook.tracking.posts[q].insights[insights[r].name].timestamp < Helper.timestamp()-86400) {
									Analytics.facebook.tracking.posts[q].insights[insights[r].name].data.push({
										// facebook puts "." in key values of JSON which Mongo will not except
										value: JSON.parse(JSON.stringify(insights[r].values[0].value, function(key, value) {return key.toString().replace('.', '_', 'g')})),
										timestamp: Helper.timestamp()
									})
									Analytics.facebook.tracking.posts[q].insights[insights[r].name].timestamp = Helper.timestamp();
								}
							}

							break;
						}
					}

					Analytics.save(function(err,response){
						console.log(err);
						console.log('saved posts insights');
						next(itr, cb);
					});
					
				})

});
		},

	} // End Harvest



	var Harvest = function(data, callback) {
		Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {
			for(var m=0,length=data.methods.length;m<length;m++) {

				if(data.methods[m] === 'page') {

// check for updates to general page and business information
							facebook.get(data.network_id, {fields: 'name,category,company_overview,description,likes,about,location,website,username,were_here_count,talking_about_count,checkins'}, function(err, response) {
								if(err || typeof response.error !== 'undefined')
									console.log(response.error);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

									var cached = Analytics.facebook.business.data;

									if( !cached || (cached && (response.name != cached.name || response.category != cached.category || response.description != cached.description || response.about != cached.about || response.location.street != cached.location.street || response.website != cached.website || response.username != cached.username)) ) {

										Analytics.facebook.business = {
											timestamp: Helper.timestamp(),
											data: {name: response.name,category: response.category,description: response.description,about: response.about,location: response.location,website: response.website,username: response.username}
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

									Analytics.save(function(err,response){});
console.log('saved updated business info and initial tracking info');	
							});

					continue;
				}

				if(data.methods[m] === 'posts') {
					var posts = Analytics.facebook.tracking.posts.sort(Helper.sortBy('timestamp', false, parseInt)),
							since = posts.length ? posts[0].timestamp : 0;
		
					facebook.get(data.network_id, {fields: 'feed.since(' + since + ').limit(100).fields(id,message,message_tags,actions,caption,created_time,description,expanded_height,expanded_width,feed_targeting,full_picture,icon,link,is_published,is_hidden,name,object_id,parent_id,picture,privacy,properties,shares,source,status_type,story,story_tags,subscribed,targeting,timeline_visibility,to,type,updated_time,via,with_tags,comments,likes)'}, function(err, response) {
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
							Analytics.save(function(err,response){});
console.log('saved new feed item(s) and related tracking...');			
						}
					});

					facebook.get(data.network_id, {fields: 'feed.until(' + since + ').limit(200).fields(likes,comments,shares,updated_time,created_time,status_type,type)'}, function(err, response) {
						if(typeof response.feed !== 'undefined' && typeof response.feed.data !== 'undefined' && response.feed.data.length) {
							
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

							if(update) {
								Analytics.save(function(err){});
console.log('saved updated tracking...');
							}

						}
					})

					continue;
				}


				if(data.methods[m] === 'page_insights') {
					
					facebook.get(data.network_id, {fields: 'insights', date_format: 'U'}, function(err, res) {

						var insights = res.insights.data;
			
						for(var z=0,zlen=insights.length;z<zlen;z++) {
						
							if(insights[z].period != 'day')
								continue;

							if(!Analytics.facebook.tracking.page.insights.timestamp)
								Analytics.facebook.tracking.page.insights[insights[z].name] = {
									timestamp: Helper.timestamp(),
									data: []
								}

							var insightsLength = Analytics.facebook.tracking.page.insights[insights[z].name].data.length,
									newestTimestamp = insightsLength ? Analytics.facebook.tracking.page.insights[insights[z].name].data[insightsLength].timestamp : 0;

							for(var y=0,ylen=insights[z].values.length;y<ylen;y++)
								if(insights[z].values[y].end_time > newestTimestamp)
									Analytics.facebook.tracking.page.insights[insights[z].name].data.push({
										// facebook puts "." in key values of JSON which Mongo will not except
										value: JSON.parse(JSON.stringify(insights[z].values[y].value, function(key, value) {return key.toString().replace('.', '_', 'g')})),
										timestamp: insights[z].values[y].end_time
									})
						}

						Analytics.save(function(err,response){
							console.log(err);
							console.log('saved page insights');
							//console.log(initialFilteredResults);
							callback(null);
						});
						
					})

					continue;
				}

				if(data.methods[m] === 'posts_insights') {
					var timeframe = new Date();
					timeframe = Math.round(timeframe.setMonth(timeframe.getMonth()-2)/1000);

					facebook.get(data.network_id, {fields: 'posts.fields(insights).since('+timeframe+').limit(200)', date_format: 'U'}, function(err, res) {
		
						for(var p=0,plen=res.posts.data.length;p<plen;p++) {
							
							for(var q=Analytics.facebook.tracking.posts.length-1;q>0;q--) {							
								if(Analytics.facebook.tracking.posts[q].id != res.posts.data[p].id)
									continue

								var insights = res.posts.data[p].insights.data;

								for(var r=0,rlen=insights.length;r<rlen;r++) {

									if(!Analytics.facebook.tracking.posts[q].insights.timestamp)
										Analytics.facebook.tracking.posts[q].insights[insights[r].name] = {
											timestamp: 0,
											data: []
										}

									if(Analytics.facebook.tracking.posts[q].insights[insights[r].name].timestamp < Helper.timestamp()-86400) {
										Analytics.facebook.tracking.posts[q].insights[insights[r].name].data.push({
											// facebook puts "." in key values of JSON which Mongo will not except
											value: JSON.parse(JSON.stringify(insights[r].values[0].value, function(key, value) {return key.toString().replace('.', '_', 'g')})),
											timestamp: Helper.timestamp()
										})
										Analytics.facebook.tracking.posts[q].insights[insights[r].name].timestamp = Helper.timestamp();
									}
								}

								break;
							}
						}

						Analytics.save(function(err,response){
							console.log(err);
							console.log('saved posts insights');
							callback(null);
						});
						
					})

					continue;
				}

			}
			callback(null);
		})
	}

	return {
		execute: function(method, data, next) {

		},
		getData: function(params, callback) {
			facebook = Auth.load('facebook').setAccessToken(params.auth_token),
			data = params;

			Harvester[data.methods[0]](0, callback);

			/*for(var i=0,l=data.methods.length;i<l;i++) {
				if(i+1 < l)
					var next = this.execute(data.methods[i+1], data, next);
				else
					var next = callback(null)  
				this.execute(data.methods[i], data, next);

				Harvest[data.methods[i], function() {
					if(i+1 <= l)
						callback(null)
					else  
						
				}]*
			}*/

			/*Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {
				for(var i=0,l=data.methods.length;i<l;i++) {
					method[data.methods[i]](Analytics, data, function() {

					})
				}
			})*/
		}
	}

})();

module.exports = FacebookHarvester;