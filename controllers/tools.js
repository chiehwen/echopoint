/**
 * Tools Controller
 */

var crypto = require('crypto'),
	oauth = require('oauth'),
	Auth = require('../server/auth').getInstance(),
	Model = Model || Object;

var ToolsController = {

 	bitly: {
 		get: function(req, res, next) {

 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);

 					// process bitly
 					if(req.session.bitlyConnected && req.session.bitly.oauthAccessToken) {

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
						typeof user.Tools.bitly.oauthAccessToken !== 'undefined'
						&& user.Tools.bitly.oauthAccessToken != ''
						&& user.Tools.bitly.oauthAccessToken
					) {
						var uniqueState = crypto.randomBytes(10).toString('hex');
						req.session.bitlyState = uniqueState;

 						res.redirect(Auth.getOauthDialogUrl('bitly', {state: uniqueState}));
 					} else {
						var bitlyEndpoint = false;

						var uniqueState = crypto.randomBytes(10).toString('hex');
						req.session.bitlyState = uniqueState;

						bitlyEndpoint = Auth.getOauthDialogUrl('bitly', {state: uniqueState});
				 		res.render(
				 			'tools/bitly', 
				 			{
					 			title: 'Vocada | Business Bitly Page',
					 			bitly: {
					 				connected: false,
					 				url: bitlyEndpoint
					 			}
				 			}
				 		);

					} // end bitly processing
 				});
 			}
 		}
 	},
}

module.exports = ToolsController;