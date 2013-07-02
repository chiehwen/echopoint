// Module dependencies.
var fs = require('fs'),
		//mongo = require('mongodb'),
		mongoose = require('mongoose');		

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
						if (err) throw err;
						console.log('Successfully connected to MongoDB via the node mongoose module');
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