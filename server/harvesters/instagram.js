/*
 * Instagram Harvester
 *
 * Rate limit: 5000 hr [application by access_token] / 5000 hr [user by client_id]
 * http://instagram.com/developer/endpoints/#limits
 *
 */

var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object;

var InstagramHarvester = function() {

	var instagram,
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

		user: function(itr, cb, id, retry) {
console.log('at instagram user information method...');

			if(id)
				var query = {_id: id}
			else
				var query = {
					instagram_id: {$exists: true},
					Instagram: {$exists: false},
					//'meta.instagram.discovery.isPrivate': {$exists: false},
					$or: [
						{'meta.instagram.discovery.timestamp': {$exists: false}},
						{'meta.instagram.discovery.timestamp': {$lt: Utils.timestamp() - 1296000 /* 1296000 = 15 days */}}
					]
				}

			Model.Engagers.findOne(query, function(err, engager) {
				if(err)
					return Log.error('Error querying Engagers table', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

				if(!engager)
					return next(itr, cb);

				engager.meta.instagram.discovery.timestamp = Utils.timestamp();
				engager.save(function(err) {
					if(err)
						return Log.error('Error saving to Engager table', {error: err, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})

					instagram.get('/users/' + engager.instagram_id, {client_id: instagram.client.id}, function(err, response) {
						// if a connection error occurs retry request (up to 3 attempts) 
						if(err && retries.indexOf(err.code) > -1) {
							if(retry && retry > 2) {
								Error.handler('instagram', 'Instagram user method failed to connect in 3 attempts!', err, credentials, {meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
								return next(itr, cb);
							}

							return Harvest.user(itr, cb, engager._id, retry ? ++retry : 1)
						}

						// if the user has set account to private then exit gracefully since we cannot retrieve the user data
						if(response && response.meta && response.meta.error_message === 'you cannot view this resource')
							return Harvest.user(itr, cb, null, null)

						// error handling
						if(err || (response && response.meta && response.meta.code !== 200)) {
							Error.handler('instagram', err || response.meta.code, err, response, {file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
							return next(itr, cb)
						}

						engager.Instagram = {
							id: response.data.id,
							timestamp: Utils.timestamp(),
							data: response.data
						}

						engager.save(function(err, save) {
							if(err)
								return Log.error('Error saving to Engager table', {error: err, engager_id: engager._id, file: __filename, line: Utils.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Utils.timestamp()})
							console.log('saving new instagram user data to engagers document...');
							next(itr, cb);
						})
					})
				})
			})
		}
	} // End Harvest

	return {
		getMetrics: function(params, callback) {
			instagram = Auth.load('instagram'),
			data = params;

			Harvest[data.methods[0]](0, function() {
				callback();
			});
		}
	}
};

module.exports = InstagramHarvester;