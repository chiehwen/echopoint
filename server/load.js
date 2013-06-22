// Module dependencies.
var Interface = require('./libraries/class'),
		Auth = require('./auth'),
		fs = require('fs');

module.exports = LoadServer = Interface.Class.extend({
	init: function(parent, options){
		this.parent = parent;
		//this.app = express();
		this.verbs = ['get', 'post', 'put', 'delete', 'del', 'json'];
	},
	load: function() {
		var app = this.parent,
				verbs = this.verbs,
				auth = new Auth;

		fs.readdirSync(__dirname + '/../controllers').forEach(function(name){

			// Remove .js from controller file names 
			name = name.slice(0, -3);

			Controller = require('../controllers/' + name);

			for(var method in Controller) {
				if(method !== '_meta') {
					var Route = new Controller[method];
					
					// Check if page is restricted
					if(typeof Route.restricted == 'undefined' || Route.restricted)
						Route.restricted = auth.restrict;

					for(var verb in Route) {
						// Check if we have an acceptable express HTTP verb
						if(verbs.indexOf(verb) === -1) continue;

						if(!Route.restricted)
							app[verb](Route.path, Route[verb]);
						else
							app[verb](Route.path, Route.restricted, Route[verb]);
					}
				}
			}
			
		});
	}
});