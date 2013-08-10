/**
 * Tools Controller
 */

var crypto = require('crypto'),
	Auth = require('../server/auth').getInstance(),
	Helper = require('../server/helpers'),
	Model = Model || Object;

var ToolsController = {

 	bitly: {
 		get: function(req, res, next) {
			Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);

 					// process bitly
 					var b = user.Business[req.session.Business.index].Tools.bitly;
 					if(req.session.bitlyConnected && req.session.bitly.oauthAccessToken && !req.query.login) {

//Auth.checkFacebook(function(err, response) {

//if(err) 
	//var facebookData = err;
//else
	var bitlyData = 'testing it hot';

res.render(
'tools/bitly', 
{
title: 'Vocada | Business Bitly Page',
bitly: {
connected: true,
data: bitlyData
}
}
);	

//})

 					} else if(
 						!req.query.login
						&& typeof b.auth.oauthAccessToken !== 'undefined'
						&& typeof b.auth.login !== 'undefined'
						&& b.auth.oauthAccessToken != ''
						&& b.auth.login != ''
						&& b.auth.oauthAccessToken
						&& b.auth.login
					) {
 						var bitly = Auth.load('bitly');
						bitly.setAccessToken(b.auth.oauthAccessToken);
						req.session.bitly = {
							oauthAccessToken: b.auth.oauthAccessToken,
							login: b.auth.login
						}
						req.session.bitlyConnected = true;
						res.redirect('/tools/bitly');
 					} else {

						req.session.bitlyState = crypto.randomBytes(10).toString('hex');
				 		res.render(
				 			'tools/bitly', 
				 			{
					 			title: 'Vocada | Business Bitly Page',
					 			bitly: {
					 				connected: false,
					 				url: Auth.getOauthDialogUrl('bitly', {state: req.session.bitlyState})
					 			}
				 			}
				 		);

					} // end bitly processing
 			});
 			
 		}
 	},
}

module.exports = ToolsController;