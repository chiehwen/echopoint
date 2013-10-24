/**
 * Social Controller
 */

var crypto = require('crypto'),
		oauth = require('oauth'),
		url = require('url'),
		Auth = require('../server/auth').getInstance(),
		//Api = require('../server/harvest').getInstance(),
		Helper = require('../server/helpers'),
		Model = Model || Object,
		//googleapis = require('googleapis'),
		Facebook = require('../server/harvesters/facebook');

var SocialController = {

 	facebook: {
 		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},
 	twitter: {
		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},
 	foursquare: {
 		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},
 	google: {
 		path: '/social/google',
 		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},
 	/*google_places: {
 		path: '/social/google',
 		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},*/
 	yelp: {
 		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},
 	instagram: {
 		get: function(req, res) {
			res.render(Helper.bootstrapRoute);
		}
 	},

 	facebook_connect: {
 		path: '/social/facebook/connect',
 		json: function(req, res, next) {
			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return res.json({success: false, error: 'User is not logged in'});

 					// process facebook
 					var indx = req.session.Business.index,
 							f = user.Business[indx].Social.facebook;

 					if(req.session.facebookConnected && req.session.facebook.oauthAccessToken && !req.query.login) {

						var facebook = Auth.load('facebook');

						if(typeof req.query.id !== 'undefined' && typeof req.query.select === 'undefined') {

			 				facebook.get('me', {fields: 'id,accounts.fields(name,picture.type(square),access_token,about,id,website,likes,perms,category_list,category)'}, function(err, response) {
			 					if(err) res.redirect('/social/facebook?login=true');

			 					if(f.id === 'undefined' || f.id == 0)
			 						user.Business[indx].Social.facebook.id = response.id;

			 					var accounts = response.accounts.data,
			 							found = false;
			 					//response.accounts.data.forEach(function(account, index) {
			 					for(var i = 0, l = accounts.length; i < l; i++) {
			 						if(accounts[i].id == req.query.id) {
			 							user.Business[indx].Social.facebook.account.id = req.query.id;
										user.Business[indx].Social.facebook.account.oauthAccessToken = accounts[i].access_token;

										user.save(function(err) {
											req.session.messages.push(err);
										});
										found = true;
										break;
			 						}
			 					}

			 					//res.redirect('/social/facebook/connect' + (found ? '' : '?login=true'));
								//res.json({success: found});
								res.redirect('/social/facebook/connect');

			 				});
												
						} else if(typeof f.account.id !== 'undefined' && f.account.id != '' && typeof req.query.select === 'undefined') {

							// if this is the first time loading Facebook
							// initilize the data Facebook harvester
							if(!user.Business[indx].Social.facebook.account.data) {

									Facebook.getData({
										network: 'facebook',
										methods: ['page', 'posts', 'page_insights', 'posts_insights'],
										user: user._id,
										analytics_id: user.Business[indx].Analytics.id,
										index: indx,
										network_id: f.account.id,
										auth_token: f.account.oauthAccessToken
									}, function(err) {
console.log('callbacks complete');							
										res.json({success: true,connected: true,account: true,data: {businesses: null},url: null});
									});

							} else {
//								Graph.getGraphData('facebook', 'days', 30);
								res.json({
									success: true,
									connected: true,
									account: true,
									data: {businesses: null}, //response,
		 					  	url: null
								});
							}

						} else {
							facebook.get('me', {fields: 'accounts.fields(name,picture.type(square),id)'}, function(err, response) {

								if(err || response.error) {
									res.redirect('/social/facebook/connect?login=true');
									return;
								}

								res.json({
									success: true,
									connected: true,
									account: false,
									data: {businesses: response.accounts.data},
		 					  	url: null
								});	
							});
						}

 					} else if(
 						!req.query.login
						&& typeof f.auth.oauthAccessToken !== 'undefined'
						&& typeof f.auth.expires !== 'undefined'
						&& typeof f.auth.created !== 'undefined'
						&& f.auth.oauthAccessToken != ''
						&& f.auth.expires != 0
						&& f.auth.created != 0
						&& f.auth.oauthAccessToken
						&& f.auth.expires
						&& f.auth.created
						&& ((f.auth.created + f.auth.expires) * 1000 > Date.now())
					) {
						var facebook = Auth.load('facebook');
						facebook.setAccessToken(f.oauthAccessToken);
						req.session.facebook = {
							id: f.id,
							oauthAccessToken: f.auth.oauthAccessToken,
							expires: f.auth.expires,
							created: f.auth.created
						}
						req.session.facebookConnected = true;
						res.redirect('/social/facebook/connect');
 					} else {

						req.session.facebookState = crypto.randomBytes(10).toString('hex');
//req.session.messages.push(req.session.facebookState);
				 		
						res.json({
							success: true,
							connected: false,
							account: false,
							data: null,
							url: Auth.getOauthDialogUrl('facebook', {state: req.session.facebookState, response_type: 'code'})
						});

					} // end facebook processing
 			});
 		}
 	},

 	twitter_connect: {
 		path: '/social/twitter/connect',
 		get: function(req, res, next) {
			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) return next(err);

				// process twitter
				var	twitter = Auth.load('twitter'),
						t = user.Business[req.session.Business.index].Social.twitter;

				if(req.session.twitterConnected && req.session.twitter.oauthAccessToken && req.session.twitter.oauthAccessTokenSecret && req.session.twitter.id && !req.query.login) {

					//twitter.get('/statuses/user_timeline.json', {user_id: req.session.twitter.id, count: 2, contributor_details: false, trim_user: true, exclude_replies: false, include_rts: true}, function(err, response) {
					//twitter.get('/account/verify_credentials.json', {include_entities: false, skip_status: true}, function(err, response) {
					//twitter.get('/statuses/user_timeline.json', {user_id: req.session.twitter.id, contributor_details: true, include_rts: false}, function(err, response) {
					twitter.get('/statuses/retweets_of_me.json', {count: 20, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
						if(err) {
							req.session.messages.push("Error verifying twitter credentials");
							res.redirect('/social/twitter/connect?login=true');
						} 
console.log(response);
		 				res.json({
							success: true,
							connected: true,
							account: null,
							data: response,
		 					url: null
						});
					});

				} else if (
					!req.query.login
					&& typeof t.auth.oauthAccessToken !== 'undefined'
					&& typeof t.auth.oauthAccessTokenSecret !== 'undefined'
					&& typeof t.id !== 'undefined'
					&& t.auth.oauthAccessToken != ''
					&& t.auth.oauthAccessTokenSecret != ''
					&& t.auth.oauthAccessToken
					&& t.auth.oauthAccessTokenSecret
					&& t.id
				) {
					twitter.setAccessTokens(t.auth.oauthAccessToken, t.auth.oauthAccessTokenSecret);
					req.session.twitter = {
						id: t.id,
						oauthAccessToken: t.auth.oauthAccessToken,
						oauthAccessTokenSecret: t.auth.oauthAccessTokenSecret,
					}
					req.session.twitterConnected = true;
					res.redirect('/social/twitter/connect');
				} else {

					twitter.oauth.getOAuthRequestToken(function(err, oauthRequestToken, oauthRequestTokenSecret, results) {
						if (err)
							res.json({success: false, error: 'Error getting OAuth request token : ' + JSON.stringify(err)});

						req.session.twitter = {
							oauthRequestToken: oauthRequestToken,
							oauthRequestTokenSecret: oauthRequestTokenSecret
						}

						res.json({
							success: true,
							connected: false,
							account: null,
							data: null,
							url: Auth.getOauthDialogUrl('twitter', {oauth_token: oauthRequestToken})
						});

					});
				} // end twitter processing
 			});
 		}
 	},

 	foursquare_connect: {
 		path: '/social/foursquare/connect',
 		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);

					// process foursquare
 					var f = user.Business[req.session.Business.index].Social.foursquare;
 					if(req.session.foursquareConnected && req.session.foursquare.oauthAccessToken && !req.query.login) {
 						foursquare = Auth.load('foursquare');

						if(req.query.id && !req.query.select) {

							foursquare.get('venues/managed', {v: foursquare.client.verified}, function(err, response) {
			 					if(err || response.meta.code != 200) res.redirect('/social/foursquare?login=true');
			 					//if(f.id === 'undefined' || f.id == 0)
			 						//user.Business[indx].Social.foursquare.id = response.id;

			 					var venues = response.response.venues.items,
			 							found = false;

			 					for(var i = 0, l = venues.length; i < l; i++) {
			 						if(venues[i].id == req.query.id) {
			 							user.Business[req.session.Business.index].Social.foursquare.venue = {
											id: req.query.id,
											name: venues[i].name,
											data: venues[i]
										}

										user.save(function(err) {
											req.session.messages.push(err);
										});
										found = true;
										break;
			 						}
			 					}

			 					//res.redirect('/social/foursquare/connect' + (found ? '' : '?login=true'));
			 					res.json({success: found});
			 				});
												
						} else if(typeof f.venue.id !== 'undefined' && f.venue.id != '' && typeof req.query.select === 'undefined') {
							//foursquare.get(('venues/' + f.venue.id), {v: foursquare.client.verified}, function(err, response) {
	 						//foursquare.get(('multi?requests=' + encodeURIComponent('/venues/' + f.venue.id + '/herenow,/venues/' + f.venue.id + '/hours,/venues/' + f.venue.id + '/likes,/venues/' + f.venue.id + '/stats')), {v: foursquare.client.verified}, function(err, response) {
								var multi =		
									'/venues/' + f.venue.id +
									',/venues/' + f.venue.id + '/stats' +
									',/venues/' + f.venue.id + '/likes' +
									',/venues/' + f.venue.id + '/tips?limit=25' +
									',/venues/' + f.venue.id + '/photos?group=checkin&limit=20',
								
								params = {
									v: foursquare.client.verified,
									requests: multi
								}

							foursquare.post('multi', params, function(err, response) {
	 							if(err || response.meta.code != 200) {
									console.log(response.meta.code); //res.redirect('/social/foursquare?login=true');
									res.json({success: false, error: err || response.meta.code});
								}

								res.json({
									success: true,
									connected: true,
									venue: true,
									data: response,
		 					  	url: null
								});
		 					});

						} else {
							foursquare.get('venues/managed', {v: foursquare.client.verified}, function(err, response) {
								if(err || response.meta.code != 200) 
									res.redirect('/social/foursquare/connect?login=true');

									res.json({
										success: true,
										connected: true,
										venue: false,
										data: {businesses:response.response.venues.items},
		 					  		url: null
									});
							});
						}

	 				} else if(
	 					!req.query.login
						&& typeof f.auth.oauthAccessToken !== 'undefined'
						&& f.auth.oauthAccessToken != ''
						&& f.auth.oauthAccessToken
	 				) {
	 					var foursquare = Auth.load('foursquare').setAccessToken(f.auth.oauthAccessToken);
						req.session.foursquare = {
							oauthAccessToken: f.auth.oauthAccessToken
						}
						req.session.foursquareConnected = true;
						res.redirect('/social/foursquare/connect');
 					} else {
	 					
	 					res.json({
							success: true,
							connected: false,
							venue: false,
							data: null,
							url: Auth.getOauthDialogUrl('foursquare', {response_type: 'code'})
						});
	 				}
 			});
 		}
 	},

 	google_connect: {
 		path: '/social/google/connect',
 		json: function(req, res, next) {
			Helper.getUser(req.session.passport.user, function(err, user) {
 				if (err || !user) return res.json({success: false, error: 'User is not logged in'});
 				
 				 	// process google
 					var indx = req.session.Business.index,
 							g = user.Business[indx].Social.google;
 							
//console.log(req.session.googleConnected);
//console.log(req.session.google);
 					if(req.session.googleConnected && req.session.google.oauthAccessToken && req.session.google.oauthRefreshToken && !req.query.login) {
 						if((req.session.google.created + req.session.google.expires) * 1000 <= Date.now())
 							res.redirect('/social/google/login');

 						if(g.business.id && g.business.id != '' && g.business.id != 0) {
 							res.json({
								success: true,
								connected: true,
								data: {success: true} //data,
							});
 						} else {
 							res.json({
								success: true,
								connected: true,
								setup: true,
								data: {success: true} //data,
							});
 						}
/*google = Auth.load('google');
google.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {key: google.client.key, query: 'Roll On Sushi Diner, Austin, Texas', sensor: false}, function(err, response) {
console.log(err, response);
							    	res.json({
											success: true,
											connected: true,
											account: true,
											data: {success: true}, //data,
				 					  	url: null
										});
});*/


				} else if(
					!req.query.login
					&& g.auth.oauthAccessToken
					&& g.auth.oauthRefreshToken
					&& g.auth.expires
					&& g.auth.created
					&& g.auth.oauthAccessToken != ''
					&& g.auth.oauthRefreshToken != ''
					&& g.auth.expires != 0
					&& g.auth.created != 0
					&& ((g.auth.created + g.auth.expires) * 1000 > Date.now())
				) {
					google = Auth.load('google_discovery');
					google.oauth.setAccessTokens({
						access_token: g.auth.oauthAccessToken,
						refresh_token: g.auth.oauthRefreshToken
					});
					req.session.google = {
						oauthAccessToken: g.auth.oauthAccessToken,
						oauthRefreshToken: g.auth.oauthRefreshToken,
						expires: g.auth.expires,
						created: g.auth.created
					}
					req.session.googleConnected = true;
					res.redirect('/social/google/connect');
				
				} else {
	 				req.session.googleState = crypto.randomBytes(10).toString('hex');
					
					res.json({
						success: true,
						connected: false,
						venue: false,
						data: null,
						url: Auth.getOauthDialogUrl('google', {response_type: 'code', access_type: 'offline', state: req.session.googleState, approval_prompt: 'force'})
					});
				}
 			})
 		}
 	},

 	yelp_connect: {
 		path: '/social/yelp/connect',
 		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 				if (err || !user) return next(err);

				var y = user.Business[req.session.Business.index].Social.yelp;
				if (req.query.url) {

					var page = decodeURIComponent(req.query.url);

					if (page.indexOf('yelp.com/') != -1) {
						if (page.indexOf('http://') != -1 || page.indexOf('https://') != -1)
							page = 'http://' + page;

						var path = url.parse(page).pathname;

						user.Business[req.session.Business.index].Social.yelp = {
							id: path.substring(path.lastIndexOf('/') + 1)
						}

						user.save(function(err) {
							req.session.messages.push(err);
						});
						res.redirect('/social/yelp/connect');	
					} else {
						// not a proper yelp url
						req.session.messages.push('invalid url');
						res.redirect('/social/yelp/connect?setup=true');
					}

				} else if (y.id && y.id != '' && y.id && !req.query.setup)	{
				
					yelp = Auth.load('yelp');
					yelp.business(y.id, function(err, response) {
						if(err) {
							console.log(err);
							res.redirect('/social/yelp/connect?setup=true');
						}

						res.json({
							success: true,
							connected: true,
							data: response
						});
					});

				} else {

					yelp = Auth.load('yelp');
					yelp.search({term: 'Roll On Sushi Diner', location: 'Austin'}, function(err, response){
console.log(err, response);

						res.json({
							success: true,
							connected: false,
							setup: req.query.setup ? true : false,
							data: null
						});
					})
				}
 			});
 		}
 	},

 	instagram_connect: {
 		path: '/social/instagram/connect',
		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) return next(err);	

				// process instagram
				var i = user.Business[req.session.Business.index].Social.instagram;
				if(req.session.instagramConnected && req.session.instagram.oauthAccessToken && !req.query.login) {
					instagram = Auth.load('instagram');
					instagram.get('users/self/feed', function(err, response) {
						if(err || !response)
							res.redirect('/social/instagram/connect?login=true');

						res.json({
							success: true,
							connected: true,
							data: response,
		 					url: null
						});
					});

				} else if(
					!req.query.login
					&& typeof i.auth.oauthAccessToken !== 'undefined'
					&& i.auth.oauthAccessToken != ''
					&& i.auth.oauthAccessToken
				) {
					var instagram = Auth.load('instagram');
					instagram.setAccessToken(i.auth.oauthAccessToken);
					req.session.instagram = {
						oauthAccessToken: i.auth.oauthAccessToken
					}
					req.session.instagramConnected = true;
					res.redirect('/social/instagram/connect');
				} else {
					req.session.instagramState = crypto.randomBytes(10).toString('hex');
					
					res.json({
						success: true,
						connected: false,
						url: Auth.getOauthDialogUrl('instagram', {response_type: 'code', state: req.session.instagramState})
					});
				}
 			});
 		}
 	},
}

module.exports = SocialController;