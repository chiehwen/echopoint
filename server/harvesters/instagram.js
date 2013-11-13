/*
 * Instagram Harvester
 *
 * Rate limit: 5000 hr [application by access_token] / 5000 hr [user by client_id]
 *
 */

var Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Helper = require('../helpers'),
		Model = Model || Object;

var InstagramHarvester = (function() {

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
			Model.Connections.findOne({instagram_id: {$exists: true}, Instagram: {$exists: false}}, function(err, user) {
				if(err)
					return Log.error('Error querying Connections table', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})

				if(!user)
					return

				instagram.get('/users/' + instagram_id, {client_id: instagram.client.id}, function(err, response) {		
					if(err || response.meta.code !== 200)
						return console.log(err, response)

					user.Instagram = {
						id: response.data.id,
						timestamp: Helper.timestamp(),
						data: response.data
					}

					user.save(function(err, save) {
						if(err)
							return Log.error('Error saving to Connection table', {error: err, user_id: user[0]._id, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp()})
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
				callback(null);//callback({err: 'error occured'});
			});
		}
	}

})();

module.exports = InstagramHarvester;