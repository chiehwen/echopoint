define(
	['angular', 'controllers', 'filters', 'services', 'directives'], 
	function (angular, filters, services, directives, controllers) {
		'use strict';
		return angular.module('vocada', ['vocada.controllers', /*'vocada.filters',*/ 'vocada.services' /*, 'vocada.directives'*/]);
});