// Module dependencies.
var Class = require('./libraries/class'),
		fs = require('fs'),
		mongo = require('mongodb'),
		mongoose = require('mongoose');
		
// Export Database as a class
var Database = Class.extend({
	init: function() {
		this.databases = JSON.parse(fs.readFileSync('./server/config/databases.config.json'));
		this.db = Object;
		this.mongooseUri = 'mongodb://localhost:27017/vocada_dev';
	},
	connect: function(method) {
		if(method == 'mongoose') {
			this.mongoose();
		} else {
			this.open(function(err, success){
				if (err) throw err;
				console.log('Successfully connected to MongoDB');
			});
		}
	},
	mongoose: function() {
		mongoose.connect(this.mongooseUri, function(err) {
			if (err) throw err;
			console.log('Successfully connected to MongoDB via the node mongoose module');
		});
	},
	open: function(callback) {
		this.db = new mongo.Db(
			this.databases.primary.name, 
			new mongo.Server(this.databases.primary.host, mongo.Connection.DEFAULT_PORT, {})
		);

		this.db.open(function(err) {
			if(err) {
				return callback(err);
			} else {
				return callback(null, 'Current MongoDB database has been opened successfully.');
			}
		});
	},
	getCurrentDatabase: function() {
		return this.db;
	}
});

module.exports = Database;