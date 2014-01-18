/*
 * Yelp Harvester
 *
 * Rate limit: 10,000/day | 416.66/min | 6.944/min [no user specific calls, only application based]
 * http://www.yelp.com/developers/getting_started
 *
 */

var //zlib = require('zlib'),
		request = require('request'),
		Auth = require('../auth').getInstance(),
		Log = require('../logger').getInstance().getLogger(),
		Error = require('../error').getInstance(),
		Utils = require('../utilities'),
		Model = Model || Object;

var Sentiment140Harvester = function() {

	var sentiment140,
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

		sentiment: function(itr, cb, retry) {
console.log('at sentiment140 bulk method...');

			request.post({
					url: sentiment140.client.baseUrl + '/api/bulkClassifyJson',
					qs: {appid: sentiment140.client.id},
					json: true,
					body: JSON.stringify({data: data.tweets})
				},
				function(err, response) {

				// if a connection error occurs retry request (up to 3 attempts) 
				if(err && (response.statusCode === 503 || response.statusCode === 504 || retries.indexOf(err.code) > -1)) {
					if(retry && retry > 2) {
						Error.handler('sentiment140', 'Sentiment140 bulk method failed to connect in 3 attempts!', err, response, {error: err, meta: data, file: __filename, line: Utils.stack()[0].getLineNumber()})
						return next(itr, cb);
					}

					return Harvest.sentiment(itr, cb, retry ? ++retry : 1)
				}

				// error handling
				if(err || (response && response.statusCode !== 200)) {	
					Error.handler('sentiment140', err || response.statusCode, {error: err, response: response.body, statusCode: response.statusCode, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb)
				}

				if(response.body == '' || !response.body.data) {	
					Error.handler('sentiment140', 'empty response body or incorrect JSON data', {error: err, response: response.body, statusCode: response.statusCode, file: __filename, line: Utils.stack()[0].getLineNumber(), level: 'error'})
					return next(itr, cb)
				}

				// save return array to data variable to be returned at process end
				data.polorizedTweets = response.body.data

				next(itr, cb)
			})
		},

	} // End Harvest

	return {
		getMetrics: function(params, callback) {
			sentiment140 = Auth.load('sentiment140'),
			data = params;

			if(!data.tweets || !data.tweets.length)
				return callback();

			Harvest[data.methods[0]](0, function() {
				callback(data.polorizedTweets)
			});
		}
	}

};

module.exports = Sentiment140Harvester;