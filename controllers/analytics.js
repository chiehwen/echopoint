/**
 * Analytics Controller
 */

var Log = require('../server/logger').getInstance().getLogger(),
		Helper = require('../server/helpers'),
		Model = Model || Object;

var AnalyticsController = {

 	create: {
 		get: function(req, res) {
 			res.render(
 				'business/create', 
 				{
 			  	title: 'Vocada | Create New Business'
 			 	}
 			);
 		},

 		post: function(req, res, next) {
 			if(req.session.passport.user) {
 				Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) {
						Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						req.session.messages.push('Error finding user for business')
						res.redirect(err ? '/logout' : '/login')
						return
					}

					var businesses = user.Business;

					var newBusiness = new Model.Business({
						name: req.body.name
					});
					
					businesses.push(newBusiness.toObject());

					Model.User.update(
						{_id: id},
						{$set: {Business: businesses}},
						function(err){
							if (err) {
								Log.error('Error on Mongoose Model.User.update query', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								return next(err)
							}
							req.session.messages.push("Hooray! New business has been created!")
							res.redirect('/dashboard')							
						}
					);

 				});
 			}	
 		}
 	},


 	delete: {
 		get: function(req, res) {
 			//res.send(req.session.passport.user);
 		},
 		delete: function(req, res, next) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;
 				Model.User.remove({ _id: id }, function (err) {
 				  if (err) {
						Log.error('Error on Mongoose Model.User.remove query', {error: err, user_id: id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
						return next(err)
					}
 				  req.session.destroy(function(){
 					  res.redirect('/dashboard');
 					});
 				});		
 			}
 		}
 	}
}

module.exports = AnalyticsController;