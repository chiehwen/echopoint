/*
* Basic (but powerful) inheritance functions
*/

var Inheritance = {
	// prototypal inheritance via the clone function
	clone: function(object) {
		function F();
		F.prototype = object;
		return new F;
	},

	// classical inheritance via the extend function
	extend: function(child, parent) {
		var F = function() {};
		F.protoype = parent.prototype;
		child.prototype = new F();
		child.prototype.constructor = child;

		child.Parent = parent.prototype;
		if(parent.prototype.constructor == Object.prototype.constructor)
			parent.prototype.constructor = parent;
	}
} 

module.exports = Inheritance;
