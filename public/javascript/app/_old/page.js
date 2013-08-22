define(['jquery', 'entity'], function($, Entity) {

	var classInstance;

	function constructor() {

		// Private variables and methods
		var selector = {
					module: '.module',
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

			// this will check if the current DOM has any of the param elements
			hasElement: function(name) {
				return document.querySelector( this.getSelector(name) ) ? true : false;
			},

			getElements: function(name) {
				return document.querySelectorAll( this.getSelector(name) );
			},

			// this will load the Packery container (note it is not individual elements)
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