/*
 * Cron-based Analytics Processing
 */
var Auth = require('./auth').getInstance(),
		Helper = require('./helpers'),
		Cron = require('cron').CronJob,
		Model = Model || Object,
		Harvester = {
			facebook: require('./harvesters/facebook'),
			twitter: require('./harvesters/twitter'),
			foursquare: require('./harvesters/foursquare')
		};

var CronJobs = {
	facebook: {
		feed: new Cron({
			cronTime: '0 */30 * * * *',
			onTick: function() {
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

								Harvester.facebook.getData({
									network: 'facebook',
									methods: ['page', 'posts'],
									user: user._id,
									analytics_id: user.Business[indx].Analytics.id,
									index: indx,
									network_id: f.account.id,
									auth_token: f.account.oauthAccessToken
								}, function(err) {
									console.log('callbacks complete');							
									//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
								});

							}
						}); // End of business forEach
					}); // End of users forEach
				}); // End of Model users array
			}, // End of onTick Cron function

			start: false
		}),

		insights: new Cron({
			cronTime: '0 30 3 * * *',
			onTick: function() {
				Model.User.find(function(err, users) {
					users.forEach(function(user) {
						user.Business.forEach(function(business, index) {

						var f = business.Social.facebook;
						if (
								f.auth.oauthAccessToken
								&& f.auth.expires
								&& f.auth.created
								&& f.account.id
								&& f.account.oauthAccessToken
								&& f.auth.oauthAccessToken != ''
								&& f.auth.expires != 0
								&& f.auth.created != 0
								&& f.account.id != ''
								&& f.account.oauthAccessToken != ''
								&& ((f.auth.created + f.auth.expires) * 1000 > Date.now())
							) {

								Harvester.facebook.getData({
									network: 'facebook',
									methods: ['page_insights', 'posts_insights'],
									user: user._id,
									analytics_id: user.Business[index].Analytics.id,
									index: index,
									network_id: f.account.id,
									auth_token: f.account.oauthAccessToken
								}, function(err) {
									console.log('callbacks complete');							
									//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
								});

							}
						}); // End of business forEach
					}); // End of users forEach
				}); // End of Model users array
			}, // End of onTick Cron function

			start: false
		}),
	},


	twitter: new Cron({
		cronTime: '45 * * * * *',
		onTick: function() {
			Model.User.find(function(err, users) {
				users.forEach(function(user) {
					user.Business.forEach(function(business, index) {

					var t = business.Social.twitter;
					if (
							t.auth.oauthAccessToken
							&& t.auth.oauthAccessTokenSecret
							&& t.id
							&& t.auth.oauthAccessToken != ''
							&& t.auth.oauthAccessTokenSecret != ''
							&& t.id != ''
						) {

							Harvester.twitter.getData({
								methods: ['credentials', 'timeline', 'mentions', 'retweets', 'dm', 'favorited'],
								user: user._id,
								analytics_id: user.Business[index].Analytics.id,
								index: index,
								network_id: t.id,
								auth_token: t.auth.oauthAccessToken,
								token_secret: t.auth.oauthAccessTokenSecret
							}, function(err) {
								console.log('Twitter callbacks complete');							
								//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
							});
	
						} else {
							console.log('no credenttials or credentials problem');
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

			Model.User.find(function(err, users) {
				users.forEach(function(user) {
					user.Business.forEach(function(business, index) {
						var f = business.Social.foursquare;
						if (
								f.auth.oauthAccessToken
								&& f.venue.id
								&& f.auth.oauthAccessToken != ''
								&& f.venue.id != ''
							) {

								Harvester.foursquare.getData({
									methods: ['test'],
									user: user._id,
									analytics_id: user.Business[index].Analytics.id,
									index: index,
									network_id: f.venue.id,
									auth_token: f.auth.oauthAccessToken
								}, function(err) {
									console.log('Foursquare callbacks complete');							
									//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
								});


								Model.Analytics.findOne({id: business.Analytics.id}, function(err, Analytics) {
/*
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
											if(response.response.responses[0].response.venue) { // really foursquare? you couldn't add a few more 'reponses' in there?
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
*/
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