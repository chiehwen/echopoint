/**
 * Business Controller
 */

var Model = Model || Object;

var BusinessController = {

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
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	

 					if(user) {
 						var businesses = user.Business;

 						var newBusiness = new Model.Business({
 							name: req.body.name
 						});
 						
 						businesses.push(newBusiness.toObject());

 						Model.User.update(
 							{_id: id},
 							{$set: {Business: businesses}},
 							function(err){
 								if (err) return next(err);
 								req.session.messages.push("Hooray! New business has been created!");
 								res.redirect('/dashboard');										
 							}
 						);
 					}	else {
 						req.session.messages.push("Error finding user for business");
 						res.redirect('/business/create');
 					}
 				});
 			}	
 		}
 	},

 	list: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	
 					
 					res.render(
 						'business/list', 
 						{
 					  	title: 'Vocada | Business List',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		}
 	},

 	delete: {
 		get: function(req, res) {
 			res.send(req.session.passport.user);
 		},
 		delete: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;
 				Model.User.remove({ _id: id }, function (err) {
 				  if (err) throw err;
 				  req.session.destroy(function(){
 					  res.redirect('/dashboard');
 					});
 				});		
 			}
 		}
 	}
}

module.exports = BusinessController;