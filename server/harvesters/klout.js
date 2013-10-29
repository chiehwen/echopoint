/*
 * Klout Harvester
 *
 * Rate limit: 10,000 day / 10 second 
 *
 */

var Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var KloutHarvester = (function() {

	var klout,
			data,
			//update = false,
			next = function(i, cb, err) {
				var i = i+1
				if(err) console.log(err)
				if(data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null)
			};

	var Harvest = {

		// run this and score together every 10 seconds
		id: function(itr, cb) {

			Model.Connections.findOne({
				klout_id: {$exists: false}, 
				$or: [
					{twitter_id: {$exists: true}}, 
					{google_id: {$exists: true}}
				], 
				$or: [
					{'meta.klout.attempt_timestamp': {$exists: false}}, 
					{
						$and: [
							{'meta.klout.success': {$exists: false}}, 
							{'meta.klout.attempt_timestamp': {$lt: Helper.timestamp() - 1296000 /* 1296000 = 15 days */} }
						]
					}
				] 
			}, function(err, user) {
				if(err)
					return next(itr, cb, err);

				if(!user)
					return next(itr, cb);

				if(user.twitter_id)
					var endpoint = 'identity.json/tw/' + user.twitter_id;
				else if(user.google_id)
					var endpoint = 'identity.json/gp/' + user.google_id;

				klout.get(endpoint, {key: klout.client.key}, function(err, response) {
					if(err || !response || !response.id)
						return next(itr, cb, err);

					console.log(response);
					user.klout_id = response.id;
					user.save(function(err, save) {
						console.log(err, save);
					})
				})

			});
		},

		score: function(itr, cb) {

			Model.Connections.findOne({
				klout_id: {$exists: true}, 
				Klout: {$exists: false}
			}, function(err, user) {
				if(err)
					return next(itr, cb, err);

				if(!user)
					return next(itr, cb);

				var endpoint = 'user.json/' + user.klout_id;

				klout.get(endpoint, {key: klout.client.key}, function(err, response) {
					if(err || !response || !response.id)
						return next(itr, cb, err);

					console.log(response);
					var timestamp = Helper.timestamp();

					user.Klout = {
						id: user.klout_id,
						handle: response.nick,
						score: {
							score: response.score.score, // haha
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

					user.save(function(err, save) {
						console.log(err, save);
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
		update: function(itr, cb) {

			Model.Connections.findOne({$or : [
				{
					klout_id: {$exists: false}, 
					$or: [
						{twitter_id: {$exists: true}}, 
						{google_id: {$exists: true}}
					], 
					$or: [
						{'meta.klout.attempt_timestamp': {$exists: false}}, 
						{
							$and: [
								{'meta.klout.success': {$exists: false}}, 
								{'meta.klout.attempt_timestamp': {$lt: Helper.timestamp() - 1296000 /* 1296000 = 15 days */} }
							]
						}
					] 
				},
				{
					klout_id: {$exists: true}, 
					Klout: {$exists: false}
				}
			]}, function(err, user) {
				if(err)
					return next(itr, cb, err);

				if(user) // if user exists (needs an id or score populated) then exit update
					return next(itr, cb);

				var timestamp = Helper.timestamp();

				Model.Connections.findOne({
					klout_id: {$exists: true}, 
					Klout: {$exists: true},
					'Klout.score.timestamp': {$exists: true},
					'Klout.score.timestamp': {$lt: timestamp - 864000 /* 864000 = 10 days */}
				}, function(err, user) {
					if(err)
						return next(itr, cb, err);

					if(!user)
						return next(itr, cb);

					var endpoint = 'user.json/' + user.klout_id;

					klout.get(endpoint, {key: klout.client.key}, function(err, response) {
						if(err || !response || !response.id)
							return next(itr, cb, err);

						console.log(response);

						user.Klout.handle = response.nick;
						user.Klout.score.history.push({
							score: response.score.score,
							bucket: response.score.bucket,
							deltas: {
								day: response.scoreDeltas.dayChange,
								week: response.scoreDeltas.weekChange,
								month: response.scoreDeltas.monthChange
							},
							timestamp: timestamp
						});
						user.Klout.score.score = response.score.score;
						user.Klout.score.timestamp = timestamp;

						user.save(function(err, save) {
							//console.log(err, save);
						})
					})

				})
			})
		},

		/*
		 * Discover is called only after checking that no
		 * Klout ids and Klout scores (incl updates) need to be populated.
		 * This is to prevent API rate limit problems.
		 * In time this, and all seperate connection api calls,
		 * should be moved to a different server in the future
		 */
		// run this funtion every 10 seconds 
		discovery: function(itr, cb) {

			var timestamp = Helper.timestamp();

			Model.Connections.findOne({$or : [
				{
					klout_id: {$exists: false}, 
					$or: [
						{twitter_id: {$exists: true}}, 
						{google_id: {$exists: true}}
					], 
					$or: [
						{'meta.klout.attempt_timestamp': {$exists: false}}, 
						{
							$and: [
								{'meta.klout.success': {$exists: false}}, 
								{'meta.klout.attempt_timestamp': {$lt: Helper.timestamp() - 1296000 /* 1296000 = 15 days */} }
							]
						}
					] 
				},
				{
					klout_id: {$exists: true}, 
					Klout: {$exists: false}
				},
				{
					klout_id: {$exists: true}, 
					Klout: {$exists: true},
					'Klout.score.timestamp': {$exists: true},
					'Klout.score.timestamp': {$lt: timestamp - 864000 /* 864000 = 10 days */}
				}
			]}, function(err, user) {
				if(err)
					return next(itr, cb, err);

				if(user) // if user exists (needs an id, score, or score update populated) then exit discovery
					return next(itr, cb);

				
				Model.Connections.findOne({
					klout_id: {$exists: true}, 
					$or: [
						{twitter_id: {$exists: false}},
						{google_id: {$exists: false}},
						{instagram_id: {$exists: false}}
					],
					$or: [
						{'meta.klout.discovery.twitter.success': {$exists: false}},
						{'meta.klout.discovery.google.success': {$exists: false}},
						{'meta.klout.discovery.instagram.success': {$exists: false}},
					],
					$or: [
						{'meta.klout.discovery.attempt_timestamp': {$exists: false}}, 
						{'meta.klout.discovery.attempt_timestamp': {$lt: timestamp - 2592000 /* 2592000 = 30 days */}}
					]
				}, function(err, user) {
					if(err)
						return next(itr, cb, err);

					if(!user)
						return next(itr, cb);

					user.meta.klout.discovery.attempt_timestamp = timestamp;

					if(!user.twitter_id && !user.meta.klout.discovery.twitter.success)
						klout.get('identity.json/klout/' + user.klout_id +'/tw', {key: klout.client.key}, function(err, response) {
							if(err)
								console.log(err);

							if(response && response.id) {							
								user.twitter_id = response.id;
								user.meta.klout.discovery.twitter.success = true;
								console.log('twitter_id from kloutId: ', response);
								user.save(function(err, save) {
									console.log(err, save);
								})
							}
						})

					if(!user.google_id && !user.meta.klout.discovery.google.success)
						klout.get('identity.json/klout/' + user.klout_id +'/gp', {key: klout.client.key}, function(err, response) {
							if(err)
								console.log(err);

							if(response && response.id) {									
								user.google_id = response.id;	
								user.meta.klout.discovery.google.success = true;
								console.log('google_id from kloutId: ', response);
								user.save(function(err, save) {
									console.log(err, save);
								})
							}
						})

					if(!user.instagram_id && !user.meta.klout.discovery.instagram.success)
						klout.get('identity.json/klout/' + user.klout_id +'/ig', {key: klout.client.key}, function(err, response) {
							if(err)
								console.log(err);

							if(response && response.id) {
								user.instagram_id = response.id;
								user.meta.klout.discovery.instagram.success = true;
								console.log('instagram_id from kloutId: ', response);
								user.save(function(err, save) {
									console.log(err, save);
								})
							}
						})

					user.save(function(err, save) {
						//console.log(err, save);
						next(itr, cb);
					})
				})
			});

		},

		test: function(itr, cb) {
			klout.get('identity.json/klout/317899/gp', {key: klout.client.key}, function(err, response) {
				console.log('twitter_id from kloutId: ', err, response);
			})

/*
klout_id: 9288683845728660,
  twitter_id: 432063350,
  */

		}


	} // End Harvest


	return {
		getData: function(params, callback) {
			klout = Auth.load('klout'),
			data = params;

			//Model.Analytics.findById(data.analytics_id, function(err, analytics) {
				//Analytics = analytics;

				Harvest[data.methods[0]](0, function() {
					//if(update)
						//Analytics.save(function(err,r){
							// TODO: handle err 
							//console.log('saved all twitter analytic data from multiple methods');
							//callback(null);
						//})
					//else
						callback(null);//callback({err: 'error occured'});
				});
			//})
		}
	}

})();

module.exports = KloutHarvester;