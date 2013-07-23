/**
 * Social Controller
 */

var crypto = require('crypto'),
	oauth = require('oauth'),
	Auth = require('../server/auth').getInstance(),
	Model = Model || Object;

	/*Twit = require('twit'),
	Yelp = require('yelp').createClient({
					consumer_key:'ZlOg0OA8NlTYHDlmAkJ1Ig',
					consumer_secret: '1af1FEeJ_QW-ckUlOcxiWsiLWhQ',
					token: 'RB-wyoQ1qRiK7CXErLs3qpES--HjfqSg',
					token_secret: '1xf9J8WyMMCDoUIeeB7EAxNi7Qg'
				});*/

var SocialController = {

 	facebook: {
 		get: function(req, res, next) {

 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);

 					// process facebook
 					if(req.session.facebookConnected && req.session.facebook.oauthAccessToken) {


Auth.checkFacebook(function(err, response) {

if(err) 
	var facebookData = err;
else
	var facebookData = response;

res.render(
'social/facebook', 
{
title: 'Vocada | Business Facebook Page',
facebook: {
connected: true,
data: facebookData
}
}
);	

})

 						/*Auth.initTwit(req.session.facebook.oauthAccessToken, req.session.facebook.oauthAccessTokenSecret, function(err, Twitter) {
							Twitter.get('account/verify_credentials', {include_entities: false, skip_status: true}, function(err, response) {
								if(err) {
									req.session.messages.push("Error getting twitter screen name : ");
									res.redirect('/dashboard');
								} else {
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
								}
						    });
 						});*/

 					} else if(
						typeof user.Social.facebook.oauthAccessToken !== 'undefined'
						&& typeof user.Social.facebook.expires !== 'undefined'
						&& typeof user.Social.facebook.created !== 'undefined'
						&& user.Social.facebook.oauthAccessToken != ''
						&& user.Social.facebook.expires != '' && user.Social.facebook.expires != 0
						&& user.Social.facebook.created != '' && user.Social.facebook.created != 0
						&& user.Social.facebook.oauthAccessToken
						&& user.Social.facebook.expires
						&& user.Social.facebook.created
						&& ((user.Social.facebook.created + user.Social.facebook.expires) * 1000 > Date.now())
					) {
						req.session.facebookState = crypto.randomBytes(10).toString('hex');
						//req.session.facebookState = uniqueState;

 						res.redirect(Auth.getOauthDialogUrl('facebook', {state: req.session.facebookState, response_type: 'code'}));
 					} else {
						//var facebookEndpoint = false;

						req.session.facebookState = crypto.randomBytes(10).toString('hex');
						//req.session.facebookState = uniqueState;

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

 					if(req.session.twitterConnected && req.session.twitter.oauthAccessToken && req.session.twitter.oauthAccessTokenSecret) {

 						Auth.initTwit(req.session.twitter.oauthAccessToken, req.session.twitter.oauthAccessTokenSecret, function(err, Twitter) {
							Twitter.get('account/verify_credentials', {include_entities: false, skip_status: true}, function(err, response) {
								if(err) {
									req.session.messages.push("Error getting twitter screen name : ");
									res.redirect('/dashboard');
								} else {
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
								}
						    });
 						});	

 					} else {

						var twitter = Auth.load('twitter');
						
						twitter.getOAuthRequestToken(function(err, oauthRequestToken, oauthRequestTokenSecret, results) {
						/*twitter.authorize('post', 'https://api.twitter.com/oauth/request_token?', 
						{
							oauth: {
								consumer_key: twitter.client.key,
								consumer_secret: twitter.client.secret,
								callback:  twitter.client.redirect
							}
						}, 
						function(err, response) {*/
						    if (err) {
						      res.send("Error getting OAuth request token : " + JSON.stringify(err));
						    } else { 
    	
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
    						}
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

 					if(req.session.foursquareConnected && req.session.foursquare.oauthAccessToken) {
 						foursquare = Auth.load('foursquare');
 						foursquare.get('venues/4dacc8d40cb63c371ca540d6', function(err, response) {
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

 					if(req.session.instagramConnected && req.session.instagram.oauthAccessToken) {
 						instagram = Auth.load('instagram');
 						instagram.get('users/self/feed', function(err, response) {
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