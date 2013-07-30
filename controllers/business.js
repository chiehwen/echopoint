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
 								//req.session.messages.push("Hooray! New business has been created!");
 								res.redirect('/business/select');								
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

 	select: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	
 					
 					if(typeof user.Business === 'undefined' || !user.Business.length)
 						res.redirect('business/create');

 					if(typeof user.Business !== 'undefined' && user.Business.length == 1) {
 						user.meta.currentBusiness = req.session.currentBusiness = user.Business[0]._id;
						user.save(function(err,res){});
 						if(typeof req.session.returnTo !== 'undefined' && req.session.returnTo)
							res.redirect(req.session.returnTo);
						else
							res.redirect('/dashboard');
					}

 					res.render(
 						'business/select', 
 						{
 					  	title: 'Vocada | Business List',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		},

 		post: function(req, res, next) {
 			if(req.session.passport.user && typeof req.body.id !== 'undefined') {
 				var id = req.session.passport.user;
 				Model.User.findById(id, function(err, user) {
					if (err) return next(err);
					user.Business.forEach(function(business) {
						if(business._id == req.body.id) {
							user.meta.currentBusiness = req.session.currentBusiness = business._id;
							user.save(function(err,res){});
							if(typeof req.session.returnTo !== 'undefined' && req.session.returnTo)
								res.redirect(req.session.returnTo);
							else
								res.redirect('/dashboard');
						}
					})
 				})
 			} else {
 				res.redirect('/business/create');
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