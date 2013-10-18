var //request = require('request'),
		Auth = require('../auth').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object,
		//Requester = require('requester'),
		//cheerio = require('cheerio'),
		winston = require('winston');

//var googlePageData = require('./tmpPageData/googlePage'); // TEMP

var KloutHarvester = (function() {

	/*winston.add(winston.transports.File, 
		{ filename: 'googlePage.log' 
			, json: true
		})
	.remove(winston.transports.Console);*/

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
					if(err || !response.id)
						return next(itr, cb, err);

					console.log(response);
					user.klout_id = parseInt(response.id, 10);
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
					if(err || !response.id)
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

		update: function(itr, cb) {

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
					if(err || !response.id)
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
						console.log(err, save);
					})
				})

			});
		},

		test: function(itr, cb) {
			klout.get('identity.json/klout/317899/fb', {key: klout.client.key}, function(err, response) {
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

			//Model.Analytics.findOne({id: data.analytics_id}, function(err, analytics) {
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