define(['jquery', 'entity'], function($, Entity) {

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
				return this._super.getTest(text);
			},
		}
	}

	if(!classInstance)
		classInstance = Entity.extend(constructor());
	return classInstance;

});