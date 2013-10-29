
var url = require('url'),
		Model = Model || Object;

// this is for Angular JS bootstraped pages
exports.bootstrapRoute = 'bootstrap';

exports.getUser = function(id, callback) {
	Model.User.findById(id, function(err, user) {
		// we use .info logging here instead of .error 
		// because actual error logging is done in the 
		// calling function to show file and line
		if(err)
			Log.info('Error on Mongoose User findById query (Model.User.findById)', {error: err, user_id: id, file: __filename, time: new Date().toUTCString()})
		
		if(!user)
			Log.info('No user returned with user_id: '+id+' (Model.User.findById)', {error: err, user_id: id, file: __filename, time: new Date().toUTCString()})

		callback(err, user);
	});
} 		

exports.getBusiness = function(user_id, business_id, lean, callback) {
	if(typeof lean === 'function') {
		callback = lean;
		lean = false;
	}

	Model.User.find({_id: user_id, Business: {$exists: true}}, {'Business': {$elemMatch: {'_id': business_id}}}, {lean: lean}, function(err, business) {
		callback(err, business);
	})
}

exports.getBusinessByName = function(user_id, business_name, lean, callback) {
	if(typeof lean === 'function') {
		callback = lean;
		lean = false;
	}

	Model.User.find({_id: user_id, Business: {$exists: true}}, {'Business': {$elemMatch: {'name': business_name}}}, {lean: lean}, function(err, business) {
		callback(err, business);
	})
}

// great object sorting function found at http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects#answer-979325
// working jsfiddle version: http://jsfiddle.net/dFNva/1/
exports.sortBy = function(field, reverse, primer) {
	var key = function (x) {
		return primer ? primer(x[field]) : x[field]
	};

	return function (a,b) {
		var A = key(a), B = key(b);
		return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1,1][+!!reverse];                  
	}
};

exports.timestamp = function(seconds) {
	var seconds = seconds || false
	if(seconds)
		return Date.now()
	else
		return Math.round(Date.now()/ 1000)
}

exports.redirectToPrevious = function(session) {
	return (typeof session.returnTo !== 'undefined' && session.returnTo) ? session.returnTo : '/dashboard';
}

exports.isPath = function(currentUrl, bypassPaths, bypassPathKeywords) {
	var urlsToBypass = bypassPaths || ['/login', '/logout', '/business/select', '/business/create'],
			pathKeywordsToBypass = bypassPathKeywords || ['/oauth/', '/partials/'],
			path = url.parse(currentUrl).pathname;

	for(var i = 0, l = urlsToBypass.length; i < l; i++) {
		if(path == urlsToBypass[i] || path == (urlsToBypass[i] + '/'))
			return true;
	}

	for(var i = 0, l = pathKeywordsToBypass.length; i < l; i++) {
		if(~currentUrl.indexOf(pathKeywordsToBypass[i]))
			return true;
	}

	return false;
}

exports.randomInt = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

exports.stack = function(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack }
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}


// currently connectionMatch is not being used, 
// consider deleting
exports.connectionMatch = function(data, callback) {
	Model.Connections.findOne({
		foursquare_id: {$exists: false},
		$or: [
			{
				facebook_id: {$exists: true},
				facebook_id: data.facebook_id
			},
			{
				twitter_handle: {$exists: true},
				twitter_handle: data.twitter_handle
			},
			{
				twitter_id: {$exists: true},
				$or: [
					{
						Twitter: {$exists: true},
						'Twitter.screen_name': data.twitter_handle
					},
					{
						Klout: {$exists: true},
						'Klout.handle': data.twitter_handle
					}
				]
			}
		]
	}, 
	function(err, match) {
		if(err)
			return callback(err);

		if(!match)
			return callback(null, false)

		callback(null, match)
	})
}