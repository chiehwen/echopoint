/**
 * Business Controller
 */

var Helper = require('../server/helpers'),
		Model = Model || Object;

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
 				Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err) return next(err);	

 					if(user) {

 						var generated = Helper.timestamp(true) + Helper.randomInt(10000, 99999);

 						var business = {
 							name: req.body.name,
 							Analytics: { 
 								id: generated
 							}
 						};

 						var analytics = new Model.Analytics({
							id: generated
						});

 						user.Business.push(business);

 						user.save(function(err, response){
 							if (err) return next(err);
	 			
							analytics.save(function(err){
								if (err) 
									return next(err);
								
								res.redirect('/business/select');
							});
 						});

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
 				Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);	
 					
 					if(typeof user.Business === 'undefined' || !user.Business.length)
 						res.redirect('business/create');

 					if(typeof user.Business !== 'undefined' && user.Business.length == 1) {
 						user.meta.Business.current = req.session.Business = {
							id: user.Business[0]._id,
							bid: user.Business[0].id,
							index: 0
						} 
						user.save(function(err,res){});
						res.redirect(Helper.redirectToPrevious(req.session));
					}

					if(typeof req.query.business !== 'undefined') {
						//user.Business.forEach(function(business) {
						for (var i = 0, l = user.Business.length; i < l; i++) {
							var businessId = user.Business[i]._id;
							if(businessId == req.query.business) {
								user.meta.Business.current = req.session.Business = {
									id: businessId,
									bid: user.Business[i].id,
									index: i
								}
								user.save(function(err,res){});
								res.redirect(Helper.redirectToPrevious(req.session));
							}
						}
					}

 					res.render(
 						Helper.bootstrapRoute, //'business/select', 
 						{
 					  	title: 'Vocada | Business List',
 					  	businesses: user.Business
 						}
 					);
 				});
 			}
 		},
/*
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
 		} */
 	},
 	list: {
 		get: function(req, res) {
 			if(req.session.passport.user) {
 				var id = req.session.passport.user;

 				Model.User.findById(id, function(err, user) {
 					if (err) return next(err);	
 					
 					res.render(
 						Helper.bootstrapRoute, //'business/list', 
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
 			//res.send(req.session.passport.user);
 		},
 		delete: function(req, res) {
 			if(req.session.passport.user) {
 				Helper.getUser(req.session.passport.user, function(err, user) {
 					if (err || !user) return next(err);	
 				  req.session.destroy(function(){
 					  res.redirect('/dashboard');
 					});
 				});		
 			}
 		}
 	}
}

module.exports = BusinessController;