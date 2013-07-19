/**
 * Social Controller
 */

var crypto = require('crypto'),
	oauth = require('oauth'),
	Auth = require('../server/auth').getInstance(),
	Model = Model || Object,
	Twit = require('twit');

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
						var uniqueState = crypto.randomBytes(10).toString('hex');
						req.session.facebookState = uniqueState;

 						res.redirect(Auth.getRedirectEndpoint('facebook', {state: uniqueState, response_type: 'code'}));
 					} else {
						var facebookEndpoint = false;

						var uniqueState = crypto.randomBytes(10).toString('hex');
						req.session.facebookState = uniqueState;

						facebookEndpoint = Auth.getRedirectEndpoint('facebook', {state: uniqueState, response_type: 'code'});
				 		res.render(
				 			'social/facebook', 
				 			{
					 			title: 'Vocada | Business Facebook Page',
					 			facebook: {
					 			connected: false,
					 				url: facebookEndpoint
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

						var twitter = Auth.load('twitter'),
							twitterEndpoint = false;
							
						twitter.getOAuthRequestToken(function(err, oauthRequestToken, oauthRequestTokenSecret, results) {
						    if (err) {
						      console.log("Error getting OAuth request token : " + err);
						    } else { 
    	
								req.session.twitter = {
									oauthRequestToken: oauthRequestToken,
									oauthRequestTokenSecret: oauthRequestTokenSecret
								}

								//twitter.url = 'https://api.twitter.com/oauth/authenticate?oauth_token=' + oauthRequestToken;
				 				twitterEndpoint = Auth.getRedirectEndpoint('twitter', {oauth_token: oauthRequestToken});
				 				res.render(
				 					'social/twitter', 
				 					{
					 					title: 'Vocada | Business Twitter Page',
					 					twitter: {
					 					connected: false,
					 						url: twitterEndpoint
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
 					
 					res.render(
 						'social/yelp', 
 						{
 					  	title: 'Vocada | Business Yelp Page',
 					  	businesses: user.Business
 						}
 					);
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
 					
 					res.render(
 						'social/foursquare', 
 						{
 					  	title: 'Vocada | Business Foursquare Page',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		}
 	},

 	pinterest: {
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
 					
 					res.render(
 						'social/instagram', 
 						{
 					  	title: 'Vocada | Business Instagram Page',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		}
 	},

}

module.exports = SocialController;