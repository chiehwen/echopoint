/**
 * Social Controller
 */

var crypto = require('crypto'),
		oauth = require('oauth'),
		Auth = require('../server/auth').getInstance(),
		Model = Model || Object;

var SocialController = {

 	facebook: {
 		get: function(req, res, next) {
			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);

 					// process facebook
 					var indx = req.session.Business.index,
 							f = user.Business[indx].Social.facebook;

 					if(req.session.facebookConnected && req.session.facebook.oauthAccessToken && !req.query.login) {

						var facebook = Auth.load('facebook');

						if(typeof req.query.id !== 'undefined' && typeof req.query.select === 'undefined') {
							facebook.get(req.query.id, function(err, response) {
								if(err || typeof response.error !== 'undefined') 
									res.redirect('/social/facebook?login=true');

			 					facebook.get('me', {fields: 'id,accounts.fields(name,picture.type(square),access_token,about,id,website,likes,perms,category_list,category)'}, function(err, response) {
			 						if(err) res.redirect('/social/facebook?login=true');
			 						if(f.id === 'undefined' || f.id == 0)
			 							user.Business[indx].Social.facebook.id = response.id;

			 						response.accounts.data.forEach(function(account, index) {
			 							if(account.id == req.query.id) {
			 								user.Business[indx].Social.facebook.account = {
												id: req.query.id,
												oauthAccessToken: account.access_token,
												data: account
											}

											user.save(function(err) {
												req.session.messages.push(err);
											});
											res.redirect('/social/facebook');
			 							}
			 						});
			 						res.redirect('/social/facebook?login=true');
			 					});
								
							});						
						} else if(typeof f.account.id !== 'undefined' && f.account.id != '' && typeof req.query.select === 'undefined') {
							facebook.get(f.account.id, function(err, response) {

								if(err || typeof response.error !== 'undefined') 
									res.redirect('/social/facebook?login=true');

								res.render(
									'social/facebook', 
									{
										title: 'Vocada | Business Facebook Page',
										facebook: {
											connected: true,
											account: true,
											data: response
										}
									}
								);	
							});
						} else {
							facebook.get('me', {fields: 'accounts.fields(name,picture.type(square),id)'}, function(err, response) {

								if(err || typeof response.error !== 'undefined') 
									res.redirect('/social/facebook?login=true');

								res.render(
									'social/facebook', 
									{
										title: 'Vocada | Business Facebook Page',
										facebook: {
											connected: true,
											account: false,
											data: response
										}
									}
								);	
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
						res.redirect('/social/facebook');
 					} else {

						req.session.facebookState = crypto.randomBytes(10).toString('hex');
//req.session.messages.push(req.session.facebookState);
				 		res.render(
				 			'social/facebook', 
				 			{
					 			title: 'Vocada | Business Facebook Page',
					 			facebook: {
					 				connected: false,
					 				url: Auth.getOauthDialogUrl('facebook', {state: req.session.facebookState, response_type: 'code'})
					 			}
				 			}
				 		);

					} // end facebook processing
 			});

 		},
 	},

 	twitter: {
 		get: function(req, res, next) {
			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);

 					// process twitter
 					var	twitter = Auth.load('twitter'),
 							t = user.Business[req.session.Business.index].Social.twitter;

 					if(req.session.twitterConnected && req.session.twitter.oauthAccessToken && req.session.twitter.oauthAccessTokenSecret && req.session.twitter.id && !req.query.login) {

						//twitter.get('account/verify_credentials', {include_entities: false, skip_status: true}, function(err, response) {
						//twitter.get('statuses/user_timeline', {user_id: req.session.twitter.id, contributor_details: true, include_rts: false}, function(err, response) {
						twitter.get('statuses/retweets_of_me', {count: 20, trim_user: true, include_entities: false, include_user_entities: false}, function(err, response) {
							if(err) {
								req.session.messages.push("Error verifying twitter credentials");
								res.redirect('/social/twitter?login=true');
							} 
			 						
			 				res.render(
				 				'social/twitter', 
				 				{
					 				title: 'Vocada | Business Twitter Page',
					 				twitter: {
					 					connected: true,
					 					data: response
					 				 }
				 				}
				 			);
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
						res.redirect('/social/twitter');
 					} else {

						twitter.oauth.getOAuthRequestToken(function(err, oauthRequestToken, oauthRequestTokenSecret, results) {
							if (err) {
								res.send("Error getting OAuth request token : " + JSON.stringify(err));
							}

							req.session.twitter = {
								oauthRequestToken: oauthRequestToken,
								oauthRequestTokenSecret: oauthRequestTokenSecret
							}

				 			res.render(
				 				'social/twitter', 
				 				{
					 				title: 'Vocada | Business Twitter Page',
					 				twitter: {				
					 					connected: false,
					 					url: Auth.getOauthDialogUrl('twitter', {oauth_token: oauthRequestToken})
					 				}
				 				}
				 			);
    				});
					} // end twitter processing
 			});
 		}
 	},

 	yelp: {
 		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);	
 					
 					yelp = Auth.load('yelp');

 					yelp.business('roll-on-sushi-diner-austin', function(err, response) {
 						if(err)
 							var data = err;
 						else 
 							var data = response;

						res.render(
	 						'social/yelp', 
	 						{
		 					  	title: 'Vocada | Business Yelp Page',
		 					  	yelp: {
		 					  		connected: err ? false : true,
		 					  		data: data
		 					  	}
	 						}
	 					);
 					});
 			});
 		}
 	},

 	foursquare: {
 		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);

					// process foursquare
 					var f = user.Business[req.session.Business.index].Social.foursquare;
 					if(req.session.foursquareConnected && req.session.foursquare.oauthAccessToken && !req.query.login) {
 						foursquare = Auth.load('foursquare');
 						foursquare.get('venues/4dacc8d40cb63c371ca540d6', {v: foursquare.client.verified}, function(err, response) {
 							if(err || response.meta.code != 200) 
								res.redirect('/social/foursquare?login=true');

							res.render(
		 						'social/foursquare', 
		 						{
			 					  	title: 'Vocada | Business Foursquare Page',
			 					  	foursquare: {
			 					  		connected: true,
			 					  		data: response
			 						}
			 					}
		 					);
	 					});

	 				} else if(
	 					!req.query.login
						&& typeof f.auth.oauthAccessToken !== 'undefined'
						&& f.auth.oauthAccessToken != ''
						&& f.auth.oauthAccessToken
	 				) {
	 					var foursquare = Auth.load('foursquare');
						foursquare.setAccessToken(f.auth.oauthAccessToken);
						req.session.foursquare = {
							oauthAccessToken: f.auth.oauthAccessToken
						}
						req.session.foursquareConnected = true;
						res.redirect('/social/foursquare');
 					} else {
	 					
	 					res.render(
	 						'social/foursquare', 
	 						{
		 					  	title: 'Vocada | Business Foursquare Page',
		 					  	foursquare: {
		 					  		connected: false,
		 					  		url: Auth.getOauthDialogUrl('foursquare', {response_type: 'code'})
		 						}
		 					}
	 					);
	 				}
 			});
 		}
 	},

 	google: {
 		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);;	
 					
 					res.render(
 						'social/pinterest', 
 						{
 					  	title: 'Vocada | Business Pinterest Page',
 					  	businesses: user.Business
 						}
 					);
 			});
 		}
 	},

 	instagram: {
		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);	

 					// process instagram
 					var i = user.Business[req.session.Business.index].Social.instagram;
 					if(req.session.instagramConnected && req.session.instagram.oauthAccessToken && !req.query.login) {
 						instagram = Auth.load('instagram');
 						instagram.get('users/self/feed', function(err, response) {
 							if(err || !response)
 								res.redirect('/social/instagram?login=true');

 							res.render(
		 						'social/instagram', 
		 						{
			 					  	title: 'Vocada | Business Instagram Page',
			 					  	instagram: {
			 					  		connected: true,
			 					  		data: response
			 						}
			 					}
		 					);
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
						res.redirect('/social/instagram');
 					} else {

 						req.session.instagramState = crypto.randomBytes(10).toString('hex');
	 					res.render(
	 						'social/instagram', 
	 						{
		 					  	title: 'Vocada | Business Instagram Page',
		 					  	instagram: {
		 					  		connected: false,
		 					  		url: Auth.getOauthDialogUrl('instagram', {response_type: 'code', state: req.session.instagramState})
		 						}
		 					}
	 					);
	 				}
 			});
 		}
 	},

 	youtube: {
 		get: function(req, res) {
 			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);		
 					
 					res.render(
 						'social/pinterest', 
 						{
 					  	title: 'Vocada | Business Pinterest Page',
 					  	businesses: user.Business
 						}
 					);
 			});
 		}
 	},
}

module.exports = SocialController;