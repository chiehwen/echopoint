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
		Helper = require('../helpers'),
		Model = Model || Object;

var KloutHarvester = function() {

	var klout,
			data,
			retries = Helper.retryErrorCodes,
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
										{'meta.klout.id.timestamp': {$lt: Helper.timestamp() - 1296000 /* 1296000 = 15 days */} }
									]
								}
							]
						}
					]
				}

			Model.Connections.findOne(query, function(err, connection) {
				if(err)
					return Log.error('Error querying Connections table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})

				if(!connection)
					return next(itr, cb);

				connection.meta.klout.id.timestamp = Helper.timestamp();
				connection.save(function(err) {
					if(err)
						return Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				
					if(connection.twitter_id)
						var endpoint = 'identity.json/tw/' + connection.twitter_id;
					else if(connection.google_id)
						var endpoint = 'identity.json/gp/' + connection.google_id;

					klout.get(endpoint, {key: klout.client.key}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('klout', 'Klout id failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.id(itr, cb, connection._id, retry ? ++retry : 1)
						}

						// error handling
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {connection_id: connection.id, api_url_endpoint: endpoint, twitter_id: connection.twitter_id, google_id: connection.google_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
console.log('con_id: ', connection.id, ' | ', connection._id );							
							return next(itr, cb)
						}

						// Klout sends back an empty page when a user has an account but hasn't tweeted and/or has no score (very obnoxious)
						// so no response is not really an error, it just means the user has no score
						if(!response || !response.id) {
							Error.handler('klout', 'No response or response ID from Klout', null, response, {twitter_id: connection.twitter_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'warn'})
							return next(itr, cb)
						}

						//console.log(response);
						connection.klout_id = response.id;
						connection.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							console.log('saving connection Klout ID');
							next(itr, cb, true)
						})
					})
				})
			});
		},

		score: function(itr, cb, id, retry) {
console.log('at klout score method...');

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
								{'meta.klout.score.timestamp': {$lt: Helper.timestamp() - 172800 /* 172800 = 48 hours */} },
								{'meta.klout.score.attempts': {$lt: 6}}
							]
						}
					] 
				}

			Model.Connections.findOne(query, function(err, connection) {
				if(err)
					return Log.error('Error querying Connections table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!connection)
					return next(itr, cb);

				connection.meta.klout.score.timestamp = Helper.timestamp();
				connection.meta.klout.score.attempts = connection.meta.klout.score.attempts++;
				connection.save(function(err) {
					if(err)
						Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				
					klout.get('user.json/' + connection.klout_id, {key: klout.client.key}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('klout', 'Klout score failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.score(itr, cb, connection._id, retry ? ++retry : 1)
						}

						// error handling
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'user.json/' + connection.klout_id, klout_id: connection.klout_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(!response || !response.kloutId || !response.score || !response.scoreDeltas) {
							Error.handler('klout', 'No response or missing json parameter', null, response, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'warn'})
							return next(itr, cb)
						}

						var timestamp = Helper.timestamp();

						connection.Klout = {
							id: connection.klout_id,
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

						connection.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							console.log('saving connection Klout score');
							next(itr, cb, true)
						})
					})
				})
			});
		},

		/*
		 * Update is called only after checking that no
		 * Klout ids and Klout scores need to be populated.
		 * This is to prevent API rate limit problems.
		 * In time this, and all seperate connection api calls,
		 * should be moved to a different server in the future
		 */
		// run this function every 5 seconds
		update: function(itr, cb, id, retry) {
console.log('at klout score update method...');		
			var timestamp = Helper.timestamp();

			if(id)
				var query = {_id: id}
			else
				var query = {
					klout_id: {$exists: true}, 
					Klout: {$exists: true},
					'Klout.score.timestamp': {$exists: true},
					'Klout.score.timestamp': {$lt: timestamp - 864000 /* 864000 = 10 days */}
				}

			Model.Connections.findOne(query, function(err, connection) {
				if(err)
					return Log.error('Error querying Connections table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!connection)
					return next(itr, cb);

				connection.Klout.score.timestamp = timestamp;
				connection.save(function(err) {
					if(err)
						Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
				
					klout.get('user.json/' + connection.klout_id, {key: klout.client.key}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('klout', 'Klout update failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Helper.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.update(itr, cb, connection._id, retry ? ++retry : 1)
						}

						// error handling
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'user.json/' + connection.klout_id, klout_id: connection.klout_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(!response || !response.kloutId || !response.score || !response.scoreDeltas) {
							Error.handler('klout', 'No response or missing json parameter', null, response, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'warn'})
							return next(itr, cb)
						}

						connection.Klout.handle = response.nick;
						connection.Klout.handle_lower = response.nick ? response.nick.toLowerCase() : '',
						connection.Klout.score.history.push({
							score: response.score.score,
							bucket: response.score.bucket,
							deltas: {
								day: response.scoreDeltas.dayChange,
								week: response.scoreDeltas.weekChange,
								month: response.scoreDeltas.monthChange
							},
							timestamp: timestamp
						});
						connection.Klout.score.score = response.score.score;
						connection.Klout.score.timestamp = response.score.timestamp;
						

						connection.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
							console.log('saving Klout connection update');
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
		 * In time this, and all seperate connections table api calls,
		 * should be moved to a different server in the future
		 */
		// run this funtion every 10 seconds. This method uses a klout ID to attempt to gather a social ID of eitehr twitter, G+, or instagram
		discovery: function(itr, cb) {
console.log('at klout discovery method...');
			var timestamp = Helper.timestamp();

			Model.Connections.findOne({
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
							{'meta.klout.discovery.attempt_timestamp': {$exists: false}}, 
							{'meta.klout.discovery.attempt_timestamp': {$lt: timestamp - 2592000 /* 2592000 = 30 days */}}
						]
					}
				]
			}, function(err, connection) {
				if(err)
					return Log.error('Error querying Connections table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!connection)
					return next(itr, cb);

				connection.meta.klout.discovery.timestamp = timestamp;

				// only two of these next three "if" conditionals will ever be called
				// since we must have at least one id type to get here
				if(!connection.twitter_id && !connection.meta.klout.discovery.twitter.success)
					klout.get('identity.json/klout/' + connection.klout_id +'/tw', {key: klout.client.key}, function(err, response) {
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'identity.json/klout/' + connection.klout_id +'/tw', klout_id: connection.klout_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(response && response.id) {							
							connection.twitter_id = response.id;
							connection.meta.klout.discovery.twitter.success = true;
							//console.log('twitter_id from kloutId: ', response);
							connection.save(function(err, save) {
								if(err)
									Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								console.log('saving Klout twitter discovery id');
							})
						}
					})

				if(!connection.google_id && !connection.meta.klout.discovery.google.success)
					klout.get('identity.json/klout/' + connection.klout_id +'/gp', {key: klout.client.key}, function(err, response) {
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'identity.json/klout/' + connection.klout_id +'/gp', klout_id: connection.klout_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(response && response.id) {									
							connection.google_id = response.id;	
							connection.meta.klout.discovery.google.success = true;
							//console.log('google_id from kloutId: ', response);
							connection.save(function(err, save) {
								if(err)
									Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								console.log('saving Klout G+ discovery id');
							})
						}
					})

				if(!connection.instagram_id && !connection.meta.klout.discovery.instagram.success)
					klout.get('identity.json/klout/' + connection.klout_id +'/ig', {key: klout.client.key}, function(err, response) {
						if (err || (response && response.error)) {
							Error.handler('klout', err || response, err, response, {api_url_endpoint: 'identity.json/klout/' + connection.klout_id +'/ig', klout_id: connection.klout_id, file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						if(response && response.id) {
							connection.instagram_id = response.id;
							connection.meta.klout.discovery.instagram.success = true;
							//console.log('instagram_id from kloutId: ', response);
							connection.save(function(err, save) {
								if(err)
									Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
								console.log('saving Klout instagram discovery id');
							})
						}
					})

				connection.save(function(err, save) {
					if(err)
						return Log.error('Error saving to Connection table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})

					next(itr, cb, true)
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