define(['jquery', 'entity'], function($, Entity) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		

		// Public variables and methods
		return {
			init: function(id, type) {
				this.parent = this._super;
				//var self = this;

				this._super(id, type);
			},

			getTest: function(text) {
				return this._super(text) + ' and even more';//.getTest(text);
			},

		}
	}

	if(!classInstance)
		classInstance = Entity.extend(constructor());
	return classInstance;

});