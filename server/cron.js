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
			foursquare: require('./harvesters/foursquare'),
			google: require('./harvesters/google'),
			yelp: require('./harvesters/yelp'),
			klout: require('./harvesters/klout')
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
									analytics_id: business.Analytics.id,
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
									analytics_id: business.Analytics.id,
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

		users: new Cron({
			cronTime: '45 * * * * *',
			onTick: function() {

				var facebook = Auth.load('facebook'),
						timestamp = Helper.timestamp(),
						batchArray = [];

				/*facebook.post('/', {batch: '[{"method": "GET", "relative_url":"1432417383"}, {"method": "GET", "relative_url":"1634735498"}]', access_token: '1374604796095373|bf2a7c4e182e65a45e69b810c2984450'}, function(err, response) {
					console.log('error: ', err);
					console.log('ressy: ', response);
				})*/

				Model.Connections.find({facebook_id: {$exists: true}, Facebook: {$exists: false}}, null, {limit: 100}, function(err, users) {
console.log('query FB users: ',users);
					if(!users.length)
						return;

					for(var i=0, l=users.length; i<l; i++)
						batchArray.push({method: "GET", relative_url: users[i].facebook_id});
	
					facebook.get('/', {batch: batchArray, access_token: facebook.client.id+'|'+facebook.client.secret}, function(err, response) {
						
						if(err)
							return console.log(err)

						for(var x=0, l=response.length; x<l; x++) {

							if(response[x].code != 200 || !response[x].body || response[x].body == '') {
								// log error here
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
									/*users[y].save(function(err, save) {
										if(err)
											console.log(err)

										console.log('Facebook Save: ', err, save);
									})*/
									break;
								}
						}
					})
				}) 
			}, // End of onTick Cron function

			start: false
		}) 
	},


	twitter: {
		timeline: new Cron({
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
									analytics_id: business.Analytics.id,
									index: index,
									network_id: t.id,
									auth_token: t.auth.oauthAccessToken,
									token_secret: t.auth.oauthAccessTokenSecret
								}, function(err) {
									console.log('Twitter callbacks complete');							
									//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
								});
		
							} else {
								console.log('no credentials or credentials problem');
							} // End of twitter credentials if statement

						}); // End of business forEach
					}); // End of users forEach
				}); // End of Model users array
			}, // End of onTick Cron function

			start: false
		}),

		connections: new Cron({
			cronTime: '0 * * * * *', //'0 */15 * * * *',
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
									methods: ['retweeters', 'friends', 'followers'],
									user: user._id,
									analytics_id: business.Analytics.id,
									index: index,
									network_id: t.id,
									auth_token: t.auth.oauthAccessToken,
									token_secret: t.auth.oauthAccessTokenSecret
								}, function(err) {
									console.log('Twitter connections updates');							
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

		users: new Cron({
			cronTime: '45 * * * * *',
			onTick: function() {

				// TODO: move bearer token to a config file and not hard coded, terrible practice
				var twitter = Auth.load('twitter').setBearerToken('AAAAAAAAAAAAAAAAAAAAANbqSAAAAAAAVGJ9wYukomG62Mj6t42iXrhpaNs%3DbKsXPBLlB6RwMZZI8NTwmVHwW9w3N4XtRRHjn0VNTU'),
						timestamp = Helper.timestamp(),
						twitterUsersCsv = '',
						twitterUserHandlesCsv;

				Model.Connections.find({twitter_id: {$exists: true}, Twitter: {$exists: false}}, null, {limit: 100}, function(err, users) {
					if(!users.length)
						return;

					for(var i=0, l=users.length; i<l; i++)
						twitterUsersCsv += users[i].twitter_id + ',';
	
					twitter.get('/users/lookup.json', {user_id: twitterUsersCsv.slice(0,-1) /* slice: remove last character from string */, include_entities: false}, function(err, response) {
						
						if(err || response.errors)
							console.log(err)

						for(var x=0, l=users.length; x<l; x++)
							for(var y=0, len=response.length; y<len; y++)
								if(response[y].id_str == users[x].twitter_id) {
									response[y].status = null;
									users[x].Twitter = {
										id: users[x].twitter_id,
										screen_name: response[y].screen_name,
										timestamp: timestamp,
										data: response[y]
									}
									users[x].save(function(err, save) {
										if(err)
											console.log(err)

										console.log('Twitter Save: ', err, save);
									})
									break;
								}
						
					})
				})

				Model.Connections.find({twitter_handle: {$exists: true}, twitter_id: {$exists: false}, Twitter: {$exists: false}}, null, {limit: 100}, function(err, users) {
					if(!users.length)
						return;

					for(var i=0, l=users.length; i<l; i++)
						twitterUserHandlesCsv += users[i].twitter_handle + ',';
	
					twitter.get('/users/lookup.json', {screen_name: twitterUserHandlesCsv.slice(0,-1) /* slice: remove last character from string */, include_entities: false}, function(err, response) {
						
						if(err || response.errors)
							console.log(err)

						for(var x=0, l=users.length; x<l; x++)
							for(var y=0, len=response.length; y<len; y++)
								if(response[y].screen_name == users[x].twitter_handle) {
									users[x].twitter_id = response[y].id_str;

									response[y].status = null;
									users[x].Twitter = {
										id: response[y].id_str,
										screen_name: response[y].screen_name,
										timestamp: timestamp,
										data: response[y]
									}
									users[x].save(function(err, save) {
										if(err)
											console.log(err)

										console.log('Twitter Save: ', err, save);
									})
									break;
								}
					})
				})

			}, // End of onTick Cron function

			start: false
		}) 
	},



	foursquare: {
		business: new Cron({
			cronTime: '30 * * * * *', //'0 */15 * * * *',
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
										methods: ['stats'/*'venue', 'stats'*/],
										user: user._id,
										analytics_id: user.Business[index].Analytics.id,
										index: index,
										network_id: f.venue.id,
										auth_token: f.auth.oauthAccessToken
									}, function(err) {
										console.log('Foursquare callbacks complete');							
										//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
									});
							} // End of foursquare credentials if statement

						})
					})
				})
			},

			start: false
		}),

		tips: new Cron({
			cronTime: '40 * * * * *',
			onTick: function() {

				Model.Analytics.findOne({'foursquare.business.data.id': {$exists: true}, 'foursquare.tracking.tips.update': true}, function(err, business) {
				if(err)
					return console.log(err)

				if(!business)
					return console.log('No business')

					Harvester.foursquare.appData({
						methods: ['tips'],
						Model: business
						//analytics_id: f.id,
						//network_id: f.business.data.id
					}, function(err) {
						console.log('Foursquare tips callbacks complete');							
						//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
						business.save(function(err, save) {
							//console.log(err);
						})

					});

				})
			},

			start: false
		}),

		users: new Cron({
			cronTime: '40 * * * * *',
			onTick: function() {
				Harvester.foursquare.appData({
					methods: ['user'],
					Model: business
					//analytics_id: f.id,
					//network_id: f.business.data.id
				}, function(err) {
					console.log('Foursquare tips callbacks complete');							
					//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
					business.save(function(err, save) {
						//console.log(err);
					})
				});
			},

			start: false
		})
	},

	google: new Cron({
		cronTime: '0 * * * * *',
		onTick: function() {

			Model.User.find(function(err, users) {

				for(var i=0,l=users.length;i<l;i++) {
					if(!users[i].Business.length || users[i].Business[0].Social.yelp.update.scraped === true)
						continue;

					users[i].Business.forEach(function(business, index) {

						var g = business.Social.google.business;
						if (g.id && g.id != '' && g.data.reference && g.data.reference != '') {

							Harvester.google.getData({
								methods: ['reviews'],
								user: users[i]._id,
								analytics_id: business.Analytics.id,
								index: index,
								network_id: g.id,
								network_ref: g.data.reference
							}, function(err) {
								console.log('Google callbacks complete');							
								//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
							});
						} // End of Google credentials if statement

					})
					break;
				}
			})
		},

		start: false
	}),


	yelp: new Cron({
		cronTime: '35 * * * * *',
		onTick: function() {

			Model.User.find(function(err, users) {
				//users.forEach(function(user) {

				for(var i=0,l=users.length;i<l;i++) {
					if(!users[i].Business.length || users[i].Business[0].Social.yelp.update.scraped === true)
						continue;

					users[i].Business.forEach(function(business, index) {

						var y = business.Social.yelp;
						if (y.id && y.id != '') {

								Harvester.yelp.getData({
									methods: ['reviews'],
									user: users[i]._id,
									analytics_id: business.Analytics.id,
									index: index,
									network_id: y.id
								}, function(err) {
									console.log('Yelp callbacks complete');							
									//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
								});
						} // End of Yelp credentials if statement

					})
					break;
				}
			})
		},

		start: false
	}),

	instagram: {
		users: new Cron({
			cronTime: '40 * * * * *',
			onTick: function() {

				var instagram = Auth.load('instagram'),
						timestamp = Helper.timestamp();

				Model.Connections.findOne({instagram_id: {$exists: true}, Instagram: {$exists: false}}, function(err, user) {
					if(!user)
						return;

					instagram.get('/users/' + instagram_id, {client_id: instagram.client.id}, function(err, response) {		
						if(err || response.meta.code !== 200)
							return console.log(err)
//console.log(response);
						user.Instagram = {
							id: response.data.id,
							data: response.data
						}

						user.save(function(err, save) {})
					})
				})
			},

			start: false
		})
	},

	klout: new Cron({
		cronTime: '55 * * * * *',
		onTick: function() {

			Harvester.klout.getData({
				methods: [/*'id', 'score', 'update',*/ 'discovery'],
				//user: users[i]._id,
				//analytics_id: business.Analytics.id,
				//index: index,
				//network_id: y.id
			}, function(err) {
				console.log('Klout callbacks complete');							
				//res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
			});
		},

		start: false
	})

} // end cronjobs namespace

module.exports = CronJobs;