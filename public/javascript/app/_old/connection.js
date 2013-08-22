define(function() {
	var Connection = Class.extend({
		init: function(id, type) {
			var self = this;

			this.id = id;
			this.type = type;

			// modes
			this.isConnected = false;
			this.visible = true;
		},
		testing: function(text) {
			return text;
		}
	});

	return Connection;
});