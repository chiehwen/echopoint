
var url = require('url');

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

exports.timestamp = function() {
	return Math.round(new Date().getTime()/ 1000);
}

exports.redirectToPrevious = function(session) {
	return (typeof session.returnTo !== 'undefined' && session.returnTo) ? session.returnTo : '/dashboard';
}

exports.isPath = function(currentUrl, bypassPaths, bypassPathKeywords) {
	var urlsToBypass = bypassPaths || ['/login', '/logout', '/business/select', '/business/create'],
			pathKeywordsToBypass = bypassPathKeywords || ['/oauth/'],
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