/**
 * Business Controller
 */

var Log = require('../server/logger').getInstance().getLogger(),
		Utils = require('../server/utilities'),
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
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					req.session.messages.push('Error finding user for business')
					return res.redirect(err ? '/logout' : '/login')
				}

				//var generated = Utils.timestamp(true) + Utils.randomInt(10000, 99999);

				Utils.getBusinessByName(user._id, req.body.name, true, function(err, named) {
					if (err) {
						Log.error('Error querying business by name', {error: err, user_id: user._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
						req.session.messages.push('Error finding business')
						return res.redirect('/logout')
					}

					// check that user isn't creating a business with the same name
					if(named[0].Business) {
						req.session.messages.push('You already have a Business with that name')
						return res.redirect('/business/create')
					}

					var analytics = new Model.Analytics();

					var business = {
						name: req.body.name,
						Analytics: { 
							id: analytics._id
						}
					};

					user.Business.push(business);

					user.save(function(err, response) {
						if(err) {
							Log.error('Error saving new Business to User model with Mongoose', {error: err, user_id: user._id, business_id: named[0]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
							req.session.messages.push('Error creating new Business!')
							return res.redirect('/business/create')
						}

						analytics.save(function(err) {
							if (err) {
								Log.error('Error saving new Analytic model with Mongoose', {error: err, user_id: user._id, business_id: named[0]._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
								req.session.messages.push('Error creating new Business!')
								return res.redirect('/business/create')				
							}
							
							res.redirect('/business/select');
						})
					})
				})
			})
		}
	},

	select: {
		get: function(req, res, next) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					req.session.messages.push('Error finding user for business')
					return res.redirect(err ? '/logout' : '/login')		
				}
				
				if(typeof user.Business === 'undefined' || !user.Business.length)
					res.redirect('business/create');

				if(typeof user.Business !== 'undefined' && user.Business.length == 1) {
					user.meta.Business.current = req.session.Business = {
						id: user.Business[0]._id,
						bid: user.Business[0].id,
						index: 0
					} 
					user.save(function(err,res){
						if(err) 
							Log.error('Error saving current business meta data', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					});
					res.redirect(Utils.redirectToPrevious(req.session));
				}

				if(typeof req.query.business !== 'undefined') {
					// TODO: change this to use $elemMatch Mongoose lookup 
					// instead of for loop
					for (var i = 0, l = user.Business.length; i < l; i++) {
						var businessId = user.Business[i]._id;
						if(businessId == req.query.business) {
							user.meta.Business.current = req.session.Business = {
								id: businessId,
								bid: user.Business[i].id,
								index: i
							}
							user.save(function(err,res){
								if(err) 
									Log.error('Error saving current business meta data', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
							});
							res.redirect(Utils.redirectToPrevious(req.session));
						}
					}
				}

				res.render(
					Utils.bootstrapRoute, //'business/select', 
					{
						title: 'Vocada | Business List',
						businesses: user.Business
					}
				);
			});

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

	/*
	list: {
		get: function(req, res) {
			if(req.session.passport.user) {
				Utils.getUser(req.session.passport.user, function(err, user) {
					if (err) return next(err);		
					
					res.render(
						Utils.bootstrapRoute, //'business/list', 
						{
					  	title: 'Vocada | Business List',
					  	businesses: user.Business
						}
					);
				});
			}
		}
	},
	*/

	// this will probably be handled by sockets not a full url load
	delete: {
		get: function(req, res) {
			//res.send(req.session.passport.user);
		},
		delete: function(req, res, next) {
			if(!req.session.passport.user)
				res.redirect('/login')

			Utils.getUser(req.session.passport.user, function(err, user) {
				if (err || !user) {
					Log.error(err ? err : 'No user returned', {error: err, user_id: req.session.passport.user, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					req.session.messages.push('Error finding user for business')
					return res.redirect(err ? '/logout' : '/login')
				}

				Utils.getBusiness(user._id, req.body.id, function(err, business) {
					if (err || !business) {
						Log.error(err ? err : 'No business returned', {error: err, user_id: user._id, business_id: req.body.id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
						req.session.messages.push('Error finding user for business')
						return res.redirect(err ? '/logout' : '/login')
					}

					Model.Analytics.findById(business.Analytics.id, function(err, analytics) {
						if (err) {
							Log.error(err, {error: err, user_id: user._id, business_id: req.body.id, analytics_id: business.Analytics.id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
							req.session.messages.push('Error finding analytics for business')
							return res.redirect('/logout')
						}

						if(!analytics)
							Log.warn('No matching analytics found', {error: 'No matching analytics found during business remove', user_id: user._id, business_id: req.body.id, analytics_id: business.Analytics.id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
					
						if(analytics)
							analytics.remove(function(err, removed) {
								if(err)
									Log.error('Error deleting Analytic collection from database', {error: err, user_id: user._id, business_id: req.body.id, analytics_id: business.Analytics.id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
							})

						business.remove(function(err, removed) {
							if(err)
								Log.error('Error deleting Business collection from database', {error: err, user_id: user._id, business_id: req.body.id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})
						})

						req.session.destroy(function(){
							res.redirect('/business/select');
						});
					})
				})
			})	
		}
	}
}

module.exports = BusinessController;