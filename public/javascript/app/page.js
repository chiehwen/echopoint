define(['jquery', 'entity'], function($, Entity) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		function sortableSelector(selector) {
			return selector || '.sortables';
		}

		// Public variables and methods
		return {
			init: function(id, type) {
				var self = this;

				this._super(id, type);
			},

			hasSortables: function(selector) {
				return $(sortableSelector(selector)).length !== 0 ? true : false;
			},

			getSortables: function(selector) {
				return this._super(text) + ' and even more';//.getTest(text);
			},

		}
	}

	if(!classInstance)
		classInstance = Entity.extend(constructor());
	return classInstance;

});