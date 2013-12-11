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
		Helper = require('../helpers'),
		Model = Model || Object;

var InstagramHarvester = function() {

	var instagram,
			data,
			next = function(i, cb, stop) {
				var i = i+1
				if(!stop && data.methods[i])
					Harvest[data.methods[i]](i, cb)
				else
					cb(null)
			};

	var Harvest = {

		user: function(itr, cb) {
console.log('at instagram user information method...');			
			Model.Connections.findOne({instagram_id: {$exists: true}, Instagram: {$exists: false}}, function(err, connection) {
				if(err)
					return Log.error('Error querying Connections table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!connection)
					return next(itr, cb);

				instagram.get('/users/' + connection.instagram_id, {client_id: instagram.client.id}, function(err, response) {		
					if(err || (response && response.meta && response.meta.code !== 200)) {
						Error.handler('instagram', err || response.meta.code, err, response, {file: __filename, line: Helper.stack()[0].getLineNumber(), level: 'error'})
						return next(itr, cb)
					}

					connection.Instagram = {
						id: response.data.id,
						timestamp: Helper.timestamp(),
						data: response.data
					}

					connection.save(function(err, save) {
						if(err)
							return Log.error('Error saving to Connection table', {error: err, connection_id: connection._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
						console.log('saving new instagram user data to connections document...');
						next(itr, cb);
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