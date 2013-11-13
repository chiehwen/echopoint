/**
 * Tools Controller
 */

var crypto = require('crypto'),
	Auth = require('../server/auth').getInstance(),
	Log = require('../server/logger').getInstance().getLogger(),
	Helper = require('../server/helpers'),
	Model = Model || Object;

var ToolsController = {

	bitly: {
		get: function(req, res, next) {
			// if no user in session then redirect to login
			if(!req.session.passport.user)
				res.redirect('/login')

			Helper.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					// basic database error handling
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
					req.session.messages.push('Error connecting to Bitly')
					return res.redirect(err ? '/logout' : '/login')
				}

				// load foursquare business credentials
				var b = user.Business[req.session.Business.index].Tools.bitly;

				// if we have a bitly session loaded and no forced login GET param then lets load bitly
				if(req.session.bitly && req.session.bitly.oauthAccessToken && !req.query.login) {

					/*res.render(
						Helper.bootstrapRoute, //'tools/bitly', 
						{
							title: 'Vocada | Business Bitly Page',
							bitly: {
							connected: true,
							data: 'TESTING' // bitly data will go here
							}
						}
					)*/

					// TODO: check if first load and then call harvester for initial data (refer to facebook above for example)
					res.json({
						success: true,
						connected: true,
						account: null,
						data: response,
						url: null
					})

				} else if(
					// if we have the needed credentials in the database load them into the session (unless we have a forced login param in GET query)
					!req.query.login
					&& b.auth.oauthAccessToken
					&& b.auth.login
				) {

					// load bitly api and set access tokens from database
					var bitly = Auth.load('bitly');
					bitly.setAccessToken(b.auth.oauthAccessToken);

					// load bitly session
					req.session.bitly = {
						oauthAccessToken: b.auth.oauthAccessToken,
						login: b.auth.login
					}

					// reload page now that session is set
					res.redirect('/tools/bitly')

				} else {

					// we have nothing, create a state for auth and load the app authorization dialog url
					req.session.bitlyState = crypto.randomBytes(10).toString('hex');

					res.json({
						success: true,
						connected: false,
						account: null,
						data: null,
						url: Auth.getOauthDialogUrl('bitly', {state: req.session.bitlyState})
					});
					
					/*
					res.render(
						Helper.bootstrapRoute, //'tools/bitly', 
						{
							title: 'Vocada | Business Bitly Page',
							bitly: {
								connected: false,
								url: Auth.getOauthDialogUrl('bitly', {state: req.session.bitlyState})
							}
						}
					)
					*/

				} // end bitly processing
			})
		}
	}
}

module.exports = ToolsController;