/**
 * Real-time Listener Controller
 */

// This is for real-time API listening (such as twitter search stream or facebook stream) if we ever decide to utilize this feature
var //Auth = require('../server/auth').getInstance(),
		Log = require('../server/logger').getInstance().getLogger(),
		Utils = require('../server/utilities'),
		Model = Model || Object;


var ListenerController = {
	facebook: {

		restricted: false,
		get: function(req, res){
			if(typeof req.query['hub.mode'] !== 'undefined' && typeof req.query['hub.challenge'] !== 'undefined' && typeof req.query['hub.verify_token'] !== 'undefined' && req.query['hub.verify_token'] == 'TiMbxNMBQq7AmkuN3F') {
				res.send(req.query['hub.challenge']);
			}
		},
		post: function(req, res) {

		}
	}
}

module.exports = ListenerController;