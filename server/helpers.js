
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