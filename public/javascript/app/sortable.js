define(['jquery', 'modules'], function($, Module) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		

		// Public variables and methods
		return {
			init: function(id, element) {
				//var self = this;
				this._super(id);

				//this = element;

				this.element = element;

				//$(element).find('.dropdown-menu').addClass('testing');
			},


		}
	}

	if(!classInstance)
		classInstance = Module.extend(constructor());
	return classInstance;

});