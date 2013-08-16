define(['jquery'], function($) {
	var Entity = Class.extend({
		init: function(id, type) {
			var self = this;

			this.id = id;
			this.type = type;

			// modes
			this.isLoaded = false;
			this.visible = true;
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
	});

	return Entity;
});