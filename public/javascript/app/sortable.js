define(['jquery', 'modules'], function($, Module) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		

		// Public variables and methods
		return {
			init: function(id, type) {
				//var self = this;

				this._super(id, type);
			},

			getTest: function(text) {
				return this._super(text);
			},
		}
	}

	if(!classInstance)
		classInstance = Module.extend(constructor());
	return classInstance;

});