/*
 * Klout Harvester
 *
 * Rate limit: 20,000 day [10 per second maximum]
 * Rate limit cited within Klout API signup email
 *
 */

var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object;

var KloutHarvester = function() {

	var klout,
			data,
			retries = Utils.retryErrorCodes,
			next = function(i, cb, stop) {
				var i = i+1
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null)
			};

	var Harvest = {

		// run this and score together every 10 seconds
		id: function(itr, cb, id, retry) {
console.log('at klout id method...');

			if(id)
				var query = {_id: id}
			else
				var query = {
					klout_id: {$exists: false}, 
					$and: [
						{
							$or: [
								{twitter_id: {$exists: true}}, 
								{google_id: {$exists: true}}
							]
						}, 
						{
							$or: [
								{'meta.klout.id.timestamp': {$exists: false}}, 
								{
									$and: [
										{'meta.klout.id.success': {$exists: false}}, 
										{'meta.klout.id.timestamp': {$lt: Utils.timestamp() - 1296000 /* 1296000 = 15 days */} }
									]
								}
							]
						}
					]
				}

			Model.Engagers.findOne(query, function(err, engager) {
				if(err)
					return Log.error('Error querying Engagers collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})

				if(!engager)
					return next(itr, cb);

				engager.meta.klout.id.timestamp = Utils.timestamp();
				engager.save(function(err) {
					if(err)
						return Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
				
					if(engager.twitter_id)
						var endpoint = 'identity.json/tw/' + engager.twitter_id;
					else if(engager.google_id)
						var endpoint = 'identity.json/gp/' + engager.google_id;

					klout.get(endpoint, {key: klout.client.key}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('klout', 'Klout id failed to connect in 3 attempts!', err, response, {klout_id: engager.klout_id, error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.id(itr, cb, engager._id, retry ? ++retry : 1)
						}

						// error handling
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {engager_id: engager.id, api_url_endpoint: endpoint, twitter_id: engager.twitter_id, google_id: engager.google_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
console.log('con_id: ', engager.id, ' | ', engager._id );							
							return next(itr, cb)
						}

						// Klout sends back an empty page when a user has an account but hasn't tweeted and/or has no score (very obnoxious)
						// so no response is not really an error, it just means the user has no score
						if(!response || !response.id) {
							Error.handler('klout', 'No response or response ID from Klout', null, response, {twitter_id: engager.twitter_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'warn'})
							return next(itr, cb)
						}

						//console.log(response);
						engager.klout_id = response.id;
						engager.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							console.log('saving engager Klout ID');
							next(itr, cb, true)
						})
					})
				})
			});
		},

		user: function(itr, cb, id, retry) {
console.log('at klout user method...');

			if(id)
				var query = {_id: id}
			else
				var query = {
					klout_id: {$exists: true}, 
					Klout: {$exists: false},
					$or: [
						{'meta.klout.score.timestamp': {$exists: false}}, 
						{
							$and: [
								{'meta.klout.score.success': {$exists: false}}, 
								{'meta.klout.score.timestamp': {$lt: Utils.timestamp() - 172800 /* 172800 = 48 hours */} },
								{'meta.klout.score.attempts': {$lt: 6}}
							]
						}
					] 
				}

			Model.Engagers.findOne(query, function(err, engager) {
				if(err)
					return Log.error('Error querying Engagers collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!engager)
					return next(itr, cb);

				engager.meta.klout.score.timestamp = Utils.timestamp();
				engager.meta.klout.score.attempts = engager.meta.klout.score.attempts++;
				engager.save(function(err) {
					if(err)
						Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
				
					klout.get('user.json/' + engager.klout_id, {key: klout.client.key}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('klout', 'Klout user method failed to connect in 3 attempts!', err, response, {klout_id: engager.klout_id, error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.user(itr, cb, engager._id, retry ? ++retry : 1)
						}

						// error handling
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'user.json/' + engager.klout_id, klout_id: engager.klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(!response)
							return Harvest.score(itr, cb, engager._id)

						if(!response.kloutId || !response.score || !response.scoreDeltas) {
							Error.handler('klout', 'No response or missing json parameter', null, response, {klout_id: engager.klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'warn'})
							return next(itr, cb)
						}

						var timestamp = Utils.timestamp();

						engager.Klout = {
							id: engager.klout_id,
							handle: response.nick,
							handle_lower: response.nick ? response.nick.toLowerCase() : '',
							score: {
								score: response.score.score,
								timestamp: timestamp,
								history: [{
									score: response.score.score,
									bucket: response.score.bucket,
									deltas: {
										day: response.scoreDeltas.dayChange,
										week: response.scoreDeltas.weekChange,
										month: response.scoreDeltas.monthChange
									},
									timestamp: timestamp
								}]
							}
						}

						engager.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							console.log('saving engager Klout score');
							next(itr, cb, true)
						})
					})
				})
			});
		},

		// score is ONLY called when the user/update calls fail, for some odd reason the klout user endpoint returns an empty data set when a user is 'unscored'
		// however score still works.
		score: function(itr, cb, id, update, retry) {
console.log('at klout score method...');
			var update = update || false;

			Model.Engagers.findOne({_id: id}, function(err, engager) {
				if(err)
					return Log.error('Error querying Engagers collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!engager)
					return next(itr, cb);

				klout.get('user.json/' + engager.klout_id + '/score', {key: klout.client.key}, function(err, response) {
					// if a connection error occurs retry request (up to 3 attempts) 
					if(err && retries.indexOf(err.code) > -1) {
						if(retry && retry > 2) {
							Error.handler('klout', 'Klout score method failed to connect in 3 attempts!', err, response, {klout_id: engager.klout_id, error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
							return next(itr, cb);
						}

						return Harvest.score(itr, cb, id, update, retry ? ++retry : 1)
					}

					// error handling
					if (err || (response && response.error)) {
						Error.handler('klout', err || response, err, response, {api_url_endpoint: 'user.json/' + engager.klout_id, klout_id: engager.klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}

					if(!response || !response.score || !response.scoreDelta) {
						Error.handler('klout', 'No response or missing json parameter', null, response, {klout_id: engager.klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'warn'})
						return next(itr, cb)
					}

					var timestamp = Utils.timestamp();

					if(update) {
						engager.Klout.score.history.push({
							score: response.score,
							bucket: response.bucket,
							deltas: {
								day: response.scoreDelta.dayChange,
								week: response.scoreDelta.weekChange,
								month: response.scoreDelta.monthChange
							},
							unscored: response.unscored || false,
							timestamp: timestamp
						});
						engager.Klout.score.score = response.score;
						engager.Klout.score.timestamp = timestamp;
					} else {
						engager.Klout = {
							id: engager.klout_id,
							score: {
								score: response.score,
								timestamp: timestamp,
								history: [{
									score: response.score,
									bucket: response.bucket,
									deltas: {
										day: response.scoreDelta.dayChange,
										week: response.scoreDelta.weekChange,
										month: response.scoreDelta.monthChange
									},
									unscored: response.unscored || false,
									timestamp: timestamp
								}]
							}
						}
					}

					engager.save(function(err, save) {
						if(err)
							return Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
						console.log('saving engager Klout score');
						next(itr, cb, true)
					})
				})
			});
		},

		/*
		 * Update is called only after checking that no
		 * Klout ids and Klout scores need to be populated.
		 * This is to prevent API rate limit problems.
		 * In time this, and all seperate engager api calls,
		 * should be moved to a different server in the future
		 */
		// run this function every 5 seconds
		update: function(itr, cb, id, retry) {
console.log('at klout score update method...');		
			var timestamp = Utils.timestamp();

			if(id)
				var query = {_id: id}
			else
				var query = {
					klout_id: {$exists: true}, 
					Klout: {$exists: true},
					'Klout.score.timestamp': {$exists: true},
					'Klout.score.timestamp': {$lt: timestamp - 864000 /* 864000 = 10 days */}
				}

			Model.Engagers.findOne(query, function(err, engager) {
				if(err)
					return Log.error('Error querying Engagers collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!engager)
					return next(itr, cb);

				engager.Klout.score.timestamp = timestamp;
				engager.save(function(err) {
					if(err)
						Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
				
					klout.get('user.json/' + engager.klout_id, {key: klout.client.key}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('klout', 'Klout update failed to connect in 3 attempts!', err, response, {klout_id: engager.klout_id, error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.update(itr, cb, engager._id, retry ? ++retry : 1)
						}

						// error handling
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'user.json/' + engager.klout_id, klout_id: engager.klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(!response)
							return Harvest.score(itr, cb, engager._id, true)

						if(!response.kloutId || !response.score || !response.scoreDeltas) {
							Error.handler('klout', 'No response or missing json parameter', null, response, {klout_id: engager.klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'warn'})
							return next(itr, cb)
						}

						engager.Klout.handle = response.nick;
						engager.Klout.handle_lower = response.nick ? response.nick.toLowerCase() : '',
						engager.Klout.score.history.push({
							score: response.score.score,
							bucket: response.score.bucket,
							deltas: {
								day: response.scoreDeltas.dayChange,
								week: response.scoreDeltas.weekChange,
								month: response.scoreDeltas.monthChange
							},
							timestamp: timestamp
						});
						engager.Klout.score.score = response.score.score;
						engager.Klout.score.timestamp = timestamp;
						

						engager.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							console.log('saving Klout engager update');
							next(itr, cb, true)
						})
					})
				})
			})
		},

		/*
		 * Discover is called only after checking that no
		 * Klout ids and Klout scores (incl updates) need to be populated.
		 * This is to prevent API rate limit problems.
		 * In time this, and all seperate engagers collection api calls,
		 * should be moved to a different server in the future
		 */
		// run this funtion every 10 seconds. This method uses a klout ID to attempt to gather a social ID of eitehr twitter, G+, or instagram
		discovery: function(itr, cb) {
console.log('at klout discovery method...');
			var timestamp = Utils.timestamp();

			function discover(type, network_id, success, klout_id, callback) {
				// if we already have the data in the database then callback
				if(network_id || success)
					return callback(false)

				var suffix = type === 'twitter' ? 'tw' : type === 'google' ? 'gp' : 'ig',
						endpoint = 'identity.json/klout/' + klout_id + '/' + suffix;

				klout.get(endpoint, {key: klout.client.key}, function(err, response) {
					if (err || (response && response.error)) {
						Error.handler('klout', err || response, err, response, {api_url_endpoint: endpoint, klout_id: klout_id, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
						return callback(false)
					}

					if(!response || !response.id)
						return callback(false)

					callback(response.id)
				})
			}

			Model.Engagers.findOne({
				klout_id: {$exists: true},
				$and: [
					{
						$or: [
							{twitter_id: {$exists: false}},
							{google_id: {$exists: false}},
							{instagram_id: {$exists: false}}
						]
					},
					{
						$or: [
							{'meta.klout.discovery.twitter.success': {$exists: false}},
							{'meta.klout.discovery.google.success': {$exists: false}},
							{'meta.klout.discovery.instagram.success': {$exists: false}},
						]
					},
					{
						$or: [
							{'meta.klout.discovery.timestamp': {$exists: false}}, 
							{'meta.klout.discovery.timestamp': {$lt: timestamp - 2592000 /* 2592000 = 30 days */}}
						]
					}
				]
			}, function(err, engager) {
				if(err)
					return Log.error('Error querying Engagers collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!engager)
					return next(itr, cb);

				var match = false;
				engager.meta.klout.discovery.timestamp = timestamp;

				// only two of these next three discover http request will ever be called
				// since we must have at least one id type to get here
				discover('twitter', engager.twitter_id, engager.meta.klout.discovery.twitter.success, engager.klout_id, function(twitter_id) {
					if(twitter_id) {
						match = true;
						engager.twitter_id = twitter_id;
						engager.meta.klout.discovery.twitter.success = true;
					}

					discover('google', engager.google_id, engager.meta.klout.discovery.google.success, engager.klout_id, function(google_id) {
						if(google_id) {
							match = true;
							engager.google_id = google_id;
							engager.meta.klout.discovery.google.success = true;
						}

						discover('instagram', engager.instagram_id, engager.meta.klout.discovery.instagram.success, engager.klout_id, function(instagram_id) {
							if(instagram_id) {
								match = true;
								engager.instagram_id = instagram_id;
								engager.meta.klout.discovery.instagram.success = true;
							}

							engager.save(function(err, save) {
								if(err)
									return Log.error('Error saving to Engager collection', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp(1)})

								next(itr, cb, true)
							})

						})
					})
				})
			})
		},

		test: function(itr, cb) {
			/*
				klout_id: 9288683845728660,
  			twitter_id: 432063350,
  		*/
			klout.get('identity.json/klout/317899/gp', {key: klout.client.key}, function(err, response) {
				console.log('twitter_id from kloutId: ', err, response);
			})		
		}
	
	} // End Harvest

	return {
		getMetrics: function(params, callback) {
			klout = Auth.load('klout'),
			data = params;

			Harvest[data.methods[0]](0, function() {
				callback()
			});
		}
	}
};

module.exports = KloutHarvester;