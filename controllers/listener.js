/**
 * Real-time Listener Controller
 */

var //Auth = require('../server/auth').getInstance(),
		Helper = require('../server/helpers'),
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