define(['jquery'], function($) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		function test(data) {
			return data + ' more...';
		} 

		return {
			init: function(id, type) {
				var self = this;

				this.id = id;
				this.type = type;

				// modes
				this.isLoaded = false;
				this.visible = true;
			},

			getTest: function(text) {
				return test(text);
			},

			setVisible: function(value) {
				this.visible = value;
			},

			isVisible: function() {
				return this.visible;
			},

			toggleVisibility: function() {
				if(this.visible) {
					this.setVisible(false);
				} else {
					this.setVisible(true);
				}
			},
		}
	}


	if(!classInstance)
		classInstance = Class.extend(constructor());
	return classInstance;

});