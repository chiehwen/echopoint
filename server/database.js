// Module dependencies.
var fs = require('fs'),
		//mongo = require('mongodb'),
		mongoose = require('mongoose'),
    Log = require('./logger').getInstance().getLogger(),
    Helper = require('./helpers');		

var Database = (function() {

	// Private attribute that holds the single instance
  var databaseInstance;

  function constructor() {

  	var databases = JSON.parse(fs.readFileSync('./server/config/databases.json')),
  			mongooseUri = buildMongooseUri('dev');

  	function load(type) {

  		switch(type) {
  			case 'mongoose':
					mongoose.connect(mongooseUri, function(err) {
						if (err) {
              Log.error('Error connecting to MongoDB database via Mongoose @ mongoose.connect in database.js file', {error: err, file: __filename, line: Helper.stack()[0].getLineNumber(), time: new Date().toUTCString(), timestamp: Helper.timestamp(1)})
              throw err
            }
						Log.info('Successfully connected to MongoDB via the node Mongoose module');
					});
  				break;
  			case 'redis':
  				// TODO: add redis database functionality
  				break;
  		}
  	}

  	function buildMongooseUri(type) {
  		database = databases[type || databaseType];
  		return 'mongodb://' 
  				+ database.host 
  				+ ':' 
  				+ database.port 
  				+ '/'
  				+ database.name; 
  	}

  	return {
			connect: function(method) {
				load(method);
			}

    } // end return object
  } // end constructor

	return {
    getInstance: function() {
      if(!databaseInstance)
        databaseInstance = constructor();
      return databaseInstance;
    }
  }

})();

module.exports = Database;