define(['jquery', 'entity', 'menu'], function($, Entity) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		function getActions(element) {
			var classList = element.className.split(/\s+/),
					actions = {};

			for(var i=0, l = classList.length; i < l; i++)
				actions[classList[i]] = true;

			return actions;
		}

		// Public variables and methods
		return {
			init: function(id, element) {
				//this.parent = this._super;
				//var self = this;

				this.self = element;
				this.actions = {};

				this.getActions();

				this._super(id);
			},

			getActions: function() {
				if(typeof this.self !== 'undefined') {
					var classList = this.self.className.split(/\s+/);

					for(var i=0, l = classList.length; i < l; i++)
						this.actions[classList[i]] = true;
				}
			},

		}
	}

	if(!classInstance)
		classInstance = Entity.extend(constructor());
	return classInstance;

});