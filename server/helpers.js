
var url = require('url'),
		Model = Model || Object;

// this is for Angular JS bootstraped pages
exports.bootstrapRoute = 'bootstrap';

exports.getUser = function(id, callback) {
	Model.User.findById(id, function(err, user) {
		callback(err, user);
	});
} 		

exports.getBusiness = function(session, lean, callback) {
	if(typeof lean === 'function') {
		callback = lean;
		lean = false;
	}

	Model.User.findOne({_id: session.passport.user, 'Business._id': session.Business.current}, {'Business.$': 1}, {lean: lean}, function(err, business) {
		callback(err, business);
	})
}

exports.getUserAndBusiness= function(id, callback) {
	Model.User.findById(id, function(err, user) {
		callback(err, user);
	});
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
	var seconds = seconds || false;
	if(seconds)
		return new Date().getTime();
	else
		return Math.round(new Date().getTime()/ 1000);
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