var APP = (function () {

	// Instance stores a reference to the Singleton
	var instance,
		self = this;

	/**
	 * Initialize our APP
	*/
	function init() {
		self.getItems();
		self.addEvents();
		self.initPlugins();
	}

	/**
	 * Collect DOM elements
	*/
	self.getItems = function() {
		console.log('getItems');
	};

	/**
	 * Initialize any 3rd party plugins here (delete if not needed)
	*/
	self.initPlugins = function() {
		console.log('initPlugins');
	};

	/**
	 * Add event bindings here
	*/
	self.addEvents = function() {
		console.log('addEvents');
	};

	return {

		// Get the Singleton instance if one exists
		// or create one if it doesn't
		getInstance: function () {

			if (!instance) {
				instance = init();
			}
			return instance;
		}

	};

})();

APP.getInstance();

