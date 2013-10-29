var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		winston = require('winston');

var FoursquareHarvester = (function() {

	winston.add(winston.transports.File, 
		{ filename: 'foursquareUpdates.log' 
			, json: true
		})
	.remove(winston.transports.Console);

	var Analytics,
			foursquare,
			response,
			data,
			update = false,
			connections = [],
			next = function(i, cb) {
				var i = i+1;
				if(data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null);
			};

	var Harvest = {
		test: function() {

			multi =		'/venues/' + data.network_id +
								',/venues/' + data.network_id + '/stats',
								//',/venues/' + f.venue.id + '/likes' +
								//',/venues/' + f.venue.id + '/tips?limit=25' +
								//',/venues/' + f.venue.id + '/photos?group=venue&limit=20',
			params = {
				v: foursquare.client.verified,
				requests: multi
			},
			venue = null,
			stats = null;

			foursquare.post('multi', params, function(err, response) {
				if(err || response.meta.code != 200) 
					console.log(response.meta.code);// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

				// TODO: build into a for loop
				if(response.response.responses[0].response.venue) { // really foursquare? you couldn't add a few more 'reponses' in there?
					venue = response.response.responses[0].response.venue;
					stats = response.response.responses[1].response.stats

				} else {
					venue = response.response.responses[1].response.venue;
					stats = response.response.responses[0].response.stats;
				}

				if(venue)
					if(previousVenueUpdateData != JSON.stringify(venue)) {
						console.log('winston! (venue)');
						winston.info(venue);
					}

				if(stats)
					if(previousStatsUpdateData != JSON.stringify(stats)) {
						console.log('winston! (stats)');
						winston.warn(stats);
					}

				previousVenueUpdateData = JSON.stringify(venue);
				previousStatsUpdateData = JSON.stringify(stats);
				
			})
		},

		// up-to-date venue data 
		// call every 1 hour?
		venue: function(itr, cb) {

			foursquare.get('venues/' + data.network_id, {v: foursquare.client.verified}, function(err, response) {
				if(err || response.meta.code != 200)
					console.log(err, response.meta); //data = {timestamp: 1, posts: [{id: 'error'}]}// user token may have expired, send an email, text, and /or notification  Also check error message and log if it isn't an expired token (also send admin email)

				var venue = response.response.venue,
						cached = Analytics.foursquare.business.data,
						timestamp = Helper.timestamp(),
						localUpdate = false;

				if(!venue)
					return next(itr, cb);

				if(venue.name != cached.name || venue.contact.phone != cached.contact.phone || venue.contact.twitter != cached.contact.twitter || venue.location.address != cached.location.address || venue.categories.length != (cached.categories ? cached.categories.length : 0) || venue.tags.length != (cached.tags ? cached.tags.length : 0)) {
					update = localUpdate = true;
					Analytics.foursquare.business = {
						timestamp: timestamp,
						data: {name: venue.name,contact: venue.contact,location: venue.location,categories: venue.categories,tags: venue.tags}
					}
					Analytics.markModified('foursquare.business')

					Model.User.findById(data.user, function(err, user) {
						user.Business[data.index].Social.foursquare.venue.data = Analytics.foursquare.business.data;
						user.save(function(err) {console.log(err)});
					});
				}

				// if we have no new checkins we don't need to process the checkins and mayor 
				if(venue.stats.checkinsCount != Analytics.foursquare.tracking.checkins.total) {
					update = localUpdate = true;
				
					// Lets update basic checkin stats
					Analytics.foursquare.tracking.checkins.history.push({
						timestamp: timestamp,
						total: parseInt(venue.stats.checkinsCount, 10),
						//new: (typeof Analytics.foursquare.tracking.checkins.total !== 'undefined') ? parseInt(stats.totalCheckins, 10) - Analytics.foursquare.tracking.checkins.total : parseInt(stats.totalCheckins, 10),
						//foursquare_new: parseInt(venue.stats.checkinsCount, 10), // This is from last login to foursquare (I think)
						//unique_visitors: parseInt(stats.uniqueVisitors, 10)
					})
					Analytics.foursquare.tracking.checkins.total = parseInt(venue.stats.checkinsCount, 10);
					Analytics.foursquare.tracking.checkins.timestamp = timestamp;


					if(venue.mayor.user.id != Analytics.foursquare.tracking.mayor.user_id) {
						// Yay! new mayor
						Analytics.foursquare.tracking.mayor.history.push({
							timestamp: timestamp,
							total: venue.mayor.count,
							user: venue.mayor.user
						});
						Analytics.foursquare.tracking.mayor.total = venue.mayor.count;
						Analytics.foursquare.tracking.mayor.user_id = venue.mayor.user.id;
						Analytics.foursquare.tracking.mayor.timestamp = timestamp;
					}

				}

				// These can be unrelated to any actual checkin
				if(venue.likes.count != Analytics.foursquare.tracking.likes.total) {
					// Keep in mind users may remove likes and dislikes
					update = localUpdate = true;
					Analytics.foursquare.tracking.likes.history.push({
						timestamp: timestamp,
						total: venue.likes.count
					})
					Analytics.foursquare.tracking.likes.total = venue.likes.count;
					Analytics.foursquare.tracking.likes.timestamp = timestamp;
				}

				if(venue.rating != Analytics.foursquare.tracking.rating.score) {
					update = localUpdate = true;
					// I believe this rating is based on the ratio of 
					// likes to dislikes. We should be able to detect dislikes 
					// from this number as well.
					// According to this employee article that isn't true: http://www.quora.com/Foursquare/How-are-Foursquares-10-point-venue-scores-calculated
					Analytics.foursquare.tracking.rating.history.push({
						timestamp: timestamp,
						score: venue.rating
					})
					Analytics.foursquare.tracking.rating.score = venue.rating;
					Analytics.foursquare.tracking.rating.timestamp = timestamp;
				}


				if(venue.tips.count != Analytics.foursquare.tracking.tips.total) {
//TODO: need to keep track of new tips for sentiment
// or detect sentiment on this cron and only keep negative sentiment tips!
					
					// Lets update tips left for the venue
					update = localUpdate = true;
					Analytics.foursquare.tracking.tips.history.push({
						timestamp: timestamp,
						total: venue.tips.count
					})
					Analytics.foursquare.tracking.tips.total = venue.tips.count;
					Analytics.foursquare.tracking.tips.timestamp = timestamp;
					Analytics.foursquare.tracking.tips.update = true;
				}

				if(venue.photos.count != Analytics.foursquare.tracking.photos.total) {
					// Lets update the photo count for the venue
					update = localUpdate = true;
					Analytics.foursquare.tracking.photos.history.push({
						timestamp: timestamp,
						total: venue.photos.count
					})
					Analytics.foursquare.tracking.photos.total = venue.photos.count;
					Analytics.foursquare.tracking.photos.timestamp = timestamp;
				}

				if(localUpdate)
					console.log('saved Foursquare venue data...');

				next(itr, cb);
			})
		},

		// daily stats data
		// updated every 24 hours
		stats: function(itr, cb) {
			foursquare.get('venues/' + data.network_id + '/stats', {v: foursquare.client.verified}, function(err, response) {
				if(err || response.meta.code != 200)
					console.log(err, response.meta);

				var stats = response.response.stats,
						timestamp = Helper.timestamp();
	
				// If it seems odd that we are comparing two different stat fields it's because foursquare doesn't report the checkins in the venue call the same as the checkins count in the stats call.
				// Further more, the stats section gets updated far less often it seems while the venue call is nearly instant. I have no idea why this is
				if(stats.totalCheckins == Analytics.foursquare.tracking.checkins.stats.total)
					return next(itr, cb);

				update = true;

				// Update unique visitors
				if(stats.uniqueVisitors != Analytics.foursquare.tracking.unique.total) {
					Analytics.foursquare.tracking.unique.history.push({
						timestamp: timestamp,
						total: stats.uniqueVisitors
					});
					Analytics.foursquare.tracking.unique.total = stats.uniqueVisitors;
				}

				// Update social sharing stats
				if(stats.sharing.facebook != Analytics.foursquare.tracking.shares.facebook || stats.sharing.twitter != Analytics.foursquare.tracking.shares.twitter) {
					Analytics.foursquare.tracking.shares.history.push({
						timestamp: timestamp,
						total: {
							facebook: stats.sharing.facebook,
							twitter: stats.sharing.twitter
						},
					})
					Analytics.foursquare.tracking.shares.facebook = stats.sharing.facebook;
					Analytics.foursquare.tracking.shares.twitter = stats.sharing.twitter;
					Analytics.foursquare.tracking.shares.timestamp = timestamp;
				}

				// Conditional in case gender data isn't supplied 
				if(stats.genderBreakdown.male != Analytics.foursquare.tracking.gender.male || stats.genderBreakdown.female != Analytics.foursquare.tracking.gender.female) {
					// Update visitor gender stats
					Analytics.foursquare.tracking.gender.history.push({
						timestamp: timestamp,
						total: {
							male: stats.genderBreakdown.male,
							female: stats.genderBreakdown.female
						},
					})
					Analytics.foursquare.tracking.gender.male = stats.genderBreakdown.male;
					Analytics.foursquare.tracking.gender.female = stats.genderBreakdown.female;
					Analytics.foursquare.tracking.gender.timestamp = timestamp;			
				}

				// Update age statistics
				Analytics.foursquare.tracking.age.history.push({
					timestamp: timestamp,
					data: stats.ageBreakdown
				});
				Analytics.foursquare.tracking.age.timestamp = timestamp;

				// Update hour breakdown statistics
				Analytics.foursquare.tracking.hourBreakdown.history.push({
					timestamp: timestamp,
					data: stats.hourBreakdown
				});
				Analytics.foursquare.tracking.hourBreakdown.timestamp = timestamp;

				// Update visit counts histogram
				Analytics.foursquare.tracking.visitsHistogram.history.push({
					timestamp: timestamp,
					data: stats.visitCountHistogram
				});
				Analytics.foursquare.tracking.visitsHistogram.timestamp = timestamp;

				// Update top visitors list
//Analytics.foursquare.tracking.topVisitors = stats.topVisitors;
//console.log('topVisitors: ', stats.topVisitors);
				
				var newTopVisitors = [];
				topVisitorsLoop:
				for(var x=0,l=stats.topVisitors.length;x<l;x++) {			
					if(Analytics.foursquare.tracking.topVisitors.history[0])
						for(var y=0,len=Analytics.foursquare.tracking.topVisitors.history[0].list.length;y<len;y++) {
							if(stats.topVisitors[x].user.id == Analytics.foursquare.tracking.topVisitors.history[0].list[y].id && stats.topVisitors[x].checkins == Analytics.foursquare.tracking.topVisitors.history[0].list[y].checkins)
								continue topVisitorsLoop;

							if(stats.topVisitors[x].user.id == Analytics.foursquare.tracking.topVisitors.history[0].list[y].id && stats.topVisitors[x].checkins != Analytics.foursquare.tracking.topVisitors.history[0].list[y].checkins) {
								Analytics.foursquare.tracking.topVisitors.history[0].list[y].checkins = stats.topVisitors[x].checkins;
								continue topVisitorsLoop;
							}
						}
					
					connections.push({foursquare_id: stats.topVisitors[x].user.id, meta:{ foursquare: {business_id: Analytics.id}}})
					newTopVisitors.push({id: stats.topVisitors[x].user.id, checkins: stats.topVisitors[x].checkins})			
				}

				if(newTopVisitors.length) {
					Analytics.foursquare.tracking.topVisitors.history.unshift({
						timestamp: timestamp,
						list: newTopVisitors
					});
					Analytics.foursquare.tracking.topVisitors.timestamp = timestamp;
				}

				// Update recent visitors list
//Analytics.foursquare.tracking.recentVisitors = stats.recentVisitors;
//console.log('recentVisitors', stats.recentVisitors);
				
				var recentVisitorsChange = false,
						newRecentVisitors = [];

				for(var x=0,l=stats.recentVisitors.length;x<l;x++) {

					newRecentVisitors.push({id: stats.recentVisitors[x].user.id, checkins: stats.recentVisitors[x].checkins})

					if(Analytics.foursquare.tracking.recentVisitors.history[0])
						if(stats.recentVisitors[x].id != Analytics.foursquare.tracking.recentVisitors.history[0].list[x].id) {
							recentVisitorsChange = true;
							connections.push({foursquare_id: stats.recentVisitors[x].user.id, meta:{ foursquare: {business_id: Analytics.id}}})
							continue;
						}
					else
						recentVisitorsChange = true;
				}

				if(recentVisitorsChange) {
					Analytics.foursquare.tracking.recentVisitors.history.unshift({
						timestamp: timestamp,
						list: newRecentVisitors
					});
					Analytics.foursquare.tracking.recentVisitors.timestamp = timestamp;
				}

				console.log('saved foursquare stats...');

				next(itr, cb);
			})
		},

		// call every 1 hour, used to gather user data
		here_now: function(itr, cb) {

		},

		// call every 10 seconds
		tips: function(itr, cb, offset) {

				if(!data.Model)
					return next(itr, cb, 'No Model was specified!')

				var business = data.Model,
						offset = offset || 0,
						count = 500,
						timestamp = Helper.timestamp();

				foursquare.get('venues/' + business.foursquare.business.data.id + '/tips', {v: foursquare.client.verified, limit: count, offset: offset, client_id: foursquare.client.id, client_secret: foursquare.client.secret}, function(err, response) {
					if(err || response.meta.code != 200)
						return next(itr, cb, err)

					if(response.response.tips.count < 1 || !response.response.tips.items.length)
						return next(itr, cb)

					if(!offset && business.foursquare.tips.active.length) {
						business.foursquare.tips.previous = business.foursquare.tips.active;
						business.foursquare.tips.active = [];
					}

					for(var i=0,l=response.response.tips.items.length;i<l;i++) {
						business.foursquare.tips.active.push(response.response.tips.items[i])
						connections.push({foursquare_id: response.response.tips.items[i].id, meta:{ foursquare: {business_id: business.id}}})
					}

					if(response.response.tips.count > offset+count) {
						return Harvester.tips(itr, cb, offset+count)
					} else {

						for(var x=0, l=business.foursquare.tips.previous.length; x<l; x++) {
							for(var y=0, len=business.foursquare.tips.active.length; y<len; y++)
							 if(business.foursquare.tips.previous[x].id == business.foursquare.tips.active[y].id)
							 	break;
							
							business.foursquare.tips.previous[x].retractedTimestamp = timestamp;
							business.foursquare.tips.retracted.push(business.foursquare.tips.previous[x])
						}

						business.foursquare.tracking.tips.update = false
						business.foursquare.tips.previous = []
						next(itr, cb)
					}
				})

		},

		// call every 10 seconds
		user: function(itr, cb) {

			Model.Connections.findOne({
				foursquare_id: {$exists: true},
				Foursquare: {$exists: false},
				'meta.foursquare.business_id': {$exists: true}
			}, function(err, connection) {
				if(err)
					return next(itr, cb, err);

				if(!connection)
					return next(itr, cb);

				Model.User.find({Business: {$exists: true}}, {'Business': {$elemMatch: {'Analytics.id': 1379383358779} }}, function(err, user) {
					if(err)
						return next(itr, cb, err);

					if(!user || !user.Business.length)
						return next(itr, cb);

					var f = user.Business.Social.foursquare;
					if (!f.auth.oauthAccessToken || !f.venue.id || f.auth.oauthAccessToken === '' || f.venue.id === '') 
						return next(itr, cb, 'User foursquare credentials missing or removed');
					
					foursquare.setAccessToken(f.auth.oauthAccessToken)

					foursquare.get('users/' + connection.foursquare_id, {v: foursquare.client.verified}, function(err, response) {
						if(err || response.meta.code != 200)
							return next(itr, cb, err);

						if(response.response.user.contact.facebook || response.response.user.contact.twitter) {
							Model.Connections.findOne({ $or: 
								[
									{
										facebook_id: {$exists: true},
										facebook_id: response.response.user.contact.facebook
									},
									{
										twitter_handle: {$exists: true},
										twitter_handle: response.response.user.contact.twitter
									},
									{
										twitter_id: {$exists: true},
										$or: [
											{
												Twitter: {$exists: true},
												'Twitter.screen_name': response.response.user.contact.twitter
											},
											{
												Klout: {$exists: true},
												'Klout.handle': response.response.user.contact.twitter
											}
										]
									}
								]}, function(err, match) {
									if(err)
										return next(itr, cb, err);

									if(!match) {
										connection.Foursquare = response.response.user;
										connection.save(function(err, save) {

										})
										return next(itr, cb)
									}

									match.foursquare_id = connection.foursquare_id;
									match.meta.foursquare.business_id = connection.meta.foursquare.business_id;
									match.Foursquare = response.response.user;

									connection.remove(function(err, removal) {

									})

									if(response.response.user.contact.facebook && !match.facebook_id)
										match.facebook_id = response.response.user.contact.facebook
									if(response.response.user.contact.twitter && !match.Twitter && !match.twitter_handle)
										match.twitter_handle = response.response.user.contact.twitter

									match.save(function(err, save) {

									})
							})

						} else {
							connection.Foursquare = response.response.user;
							connection.save(function(err, save) {

							})
						}

						next(itr, cb)
						/*if(response.response.user.contact.twitter) 
							Model.Connections.findOne({
								twitter_id: {$exists: true},
								$or: [
									{
										Twitter: {$exists: true},
										'Twitter.screen_name': response.response.user.contact.twitter
									},
									{
										Klout: {$exists: true},
										'Klout.handle': response.response.user.contact.twitter
									}
								]
							}, function(err, match) {
								if(err)
									return next(itr, cb, err);

								if(match) {

								}
							})*/
//console.log(err, response.response.user.contact);
					})
				})
			})
		},

		userTest: function(itr, cb) {
						/*
{ id: '8617217',
       firstName: 'Andy',
       lastName: 'G.',
       gender: 'male',
       photo: [Object] } }
			*/
			foursquare.get('users/8617217', {v: foursquare.client.verified}, function(err, response) {
				console.log(err, response.response.user.contact);
			})
		}

	} // End Harvest

	var previousVenueUpdateData,
			previousStatsUpdateData;

	return {
		getData: function(params, callback) {
			foursquare = Auth.load('foursquare').setAccessToken(params.auth_token),
			data = params,
			update = false;

			Model.Analytics.findById(data.analytics_id, function(err, analytics) {
				Analytics = analytics;

				Harvest[data.methods[0]](0, function() {
					if(connections.length) 
						Model.Connections.collection.insert(connections, {safe: true, continueOnError: true}, function(err, save) {
							// TODO: put any errors in logs
							console.log('error!: ', err);
							console.log('save: ', save);
						})

					if(update) 
						Analytics.save(function(err,r){
							// TODO: handle err 
							//console.log('saved all twitter analytic data from multiple methods');
							callback(null);
						})
					else 
						callback(null);//callback({err: 'error occured'});
				});
			})
		},
		appData: function(params, callback) {
			foursquare = Auth.load('foursquare'),
			data = params,
			update = false;

			Harvest[data.methods[0]](0, function() {
				if(connections.length) 
					Model.Connections.collection.insert(connections, {safe: true, continueOnError: true}, function(err, save) {
						// TODO: put any errors in logs
						console.log('error!: ', err);
						console.log('save: ', save);
					})

				callback(null);
			})
		}
	}

})();

module.exports = FoursquareHarvester;