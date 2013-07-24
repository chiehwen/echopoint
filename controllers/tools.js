/**
 * Tools Controller
 */

var crypto = require('crypto'),
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
 					var b = user.Tools.bitly;
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
						&& typeof b.oauthAccessToken !== 'undefined'
						&& typeof b.login !== 'undefined'
						&& b.oauthAccessToken != ''
						&& b.login != ''
						&& b.oauthAccessToken
						&& b.login
					) {
 						var bitly = Auth.load('bitly');
						bitly.setAccessToken(b.oauthAccessToken);
						req.session.bitly = {
							oauthAccessToken: b.oauthAccessToken,
							login: b.login
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
 		}
 	},
}

module.exports = ToolsController;