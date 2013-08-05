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

 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);

 					// process facebook
 					var f = user.Social.facebook;
 					if(req.session.facebookConnected && req.session.facebook.oauthAccessToken && !req.query.login) {

						var facebook = Auth.load('facebook');

						//currentBusiness = user.Business 

						facebook.get('me', {fields: 'id,accounts.fields(name,picture.type(square),access_token,about,id,website,likes)'}, function(err, response) {

							if(err || typeof response.error !== 'undefined') 
								res.redirect('/social/facebook?login=true');

							res.render(
								'social/facebook', 
								{
									title: 'Vocada | Business Facebook Page',
									facebook: {
										connected: true,
										account: (typeof f.account !== 'undefined' && typeof f.account.id !== 'undefined' && f.account.id != '' && f.account.id != '0' && f.account.id != 0) ? true : false,
										data: response
									}
								}
							);	
						});

 					} else if(
 						!req.query.login
						&& typeof f.oauthAccessToken !== 'undefined'
						&& typeof f.expires !== 'undefined'
						&& typeof f.created !== 'undefined'
						&& f.oauthAccessToken != ''
						&& f.expires != 0
						&& f.created != 0
						&& f.oauthAccessToken
						&& f.expires
						&& f.created
						&& ((f.created + f.expires) * 1000 > Date.now())
					) {
						var facebook = Auth.load('facebook');
						facebook.setAccessToken(f.oauthAccessToken);
						req.session.facebook = {
							oauthAccessToken: f.oauthAccessToken,
							expires: f.expires,
							created: f.created
						}
						req.session.facebookConnected = true;
						res.redirect('/social/facebook');
 					} else {

						req.session.facebookState = crypto.randomBytes(10).toString('hex');
req.session.messages.push(req.session.facebookState);
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
 			}
 		}
 	},

 	twitter: {
 		get: function(req, res, next) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);

 					// process twitter
 					var	twitter = Auth.load('twitter'),
 							t = user.Social.twitter;

 					if(req.session.twitterConnected && req.session.twitter.oauthAccessToken && req.session.twitter.oauthAccessTokenSecret && !req.query.login) {

						twitter.get('account/verify_credentials', {include_entities: false, skip_status: true}, function(err, response) {
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
						&& typeof t.oauthAccessToken !== 'undefined'
						&& typeof t.oauthAccessTokenSecret !== 'undefined'
						&& t.oauthAccessToken != ''
						&& t.oauthAccessTokenSecret != ''
						&& t.oauthAccessToken
						&& t.oauthAccessTokenSecret
					) {
						twitter.setAccessTokens(t.oauthAccessToken, t.oauthAccessTokenSecret);
						req.session.twitter = {
							oauthAccessToken: t.oauthAccessToken,
							oauthAccessTokenSecret: t.oauthAccessTokenSecret,
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
 		}
 	},

 	yelp: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	
 					
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
 		}
 	},

 	foursquare: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);

					// process foursquare
 					var f = user.Social.foursquare;
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
						&& typeof f.oauthAccessToken !== 'undefined'
						&& f.oauthAccessToken != ''
						&& f.oauthAccessToken
	 				) {
	 					var foursquare = Auth.load('foursquare');
						foursquare.setAccessToken(f.oauthAccessToken);
						req.session.foursquare = {
							oauthAccessToken: f.oauthAccessToken
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
 		}
 	},

 	google: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	
 					
 					res.render(
 						'social/pinterest', 
 						{
 					  	title: 'Vocada | Business Pinterest Page',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		}
 	},

 	instagram: {
		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	

 					// process instagram
 					var i = user.Social.instagram;
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
						&& typeof i.oauthAccessToken !== 'undefined'
						&& i.oauthAccessToken != ''
						&& i.oauthAccessToken
	 				) {
	 					var instagram = Auth.load('instagram');
						instagram.setAccessToken(i.oauthAccessToken);
						req.session.instagram = {
							oauthAccessToken: i.oauthAccessToken
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
 		}
 	},

 	youtube: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	
 					
 					res.render(
 						'social/pinterest', 
 						{
 					  	title: 'Vocada | Business Pinterest Page',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		}
 	},
}

module.exports = SocialController;