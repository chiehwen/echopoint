// Module dependencies.
var Log = require('./logger').getInstance().getLogger(),
    Utils = require('../utilities'),	

var Graphing = (function() {

	// Private attribute that holds the single instance
  var graphingInstance;

  function constructor() {

	return {

    } // end return object
  } // end constructor

	return {
    getInstance: function() {
      if(!graphingInstance)
        graphingInstance = constructor();
      return graphingInstance;
    }
  }
})();

module.exports = Graphing;