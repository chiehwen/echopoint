define(['jquery', 'entity'], function($, Entity) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		var selector = {
					sortable: '.sortables'
				},
				options = {
					sortable: {
						handle: '.header'
					}
				},
				packery = null;

		// Public variables and methods
		return {
			init: function(id, type) {
				var self = this;

				this._super(id, type);

			},

			getSelector: function(type) {
					return selector[type];
			},

			setSelector: function(type, selector) {
					selector[type] = selector;
			},

			getOptions: function(type, option) {
				return options[type][option];	
			},

			setOptions: function(type, option, variable) {
				options[type][option] = variable;
			},

			getPackery: function() {
				if(!packery){
					packery = new Packery(
						document.querySelector( this.getSelector('sortable') ), 
						{
							columnWidth: 480,
							rowHeight: 495
						}
					);
				}
				return packery;
			},

			// this will check if the current DOM has any sortable elements
			hasSortables: function() {
				return $( this.getSelector('sortable') ).length !== 0 ? true : false;
			},

			// this will return all current sortable DOM elements
			getSortables: function() {
				return this.getPackery().getItemElements();
			},

			setSortable: function(sortable) {
				return this.getPackery().bindDraggabillyEvents(sortable);
			}

		}
	}

	if(!classInstance)
		classInstance = Entity.extend(constructor());
	return classInstance;

});