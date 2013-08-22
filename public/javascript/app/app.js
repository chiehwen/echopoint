'use strict';

angular.module('vocada', [])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider.when('/:model/:controller', {
			templateUrl: '/partials/template',
			controller: 'ContentController'
		})
		.when('/:model', {
			templateUrl: '/partials/template',
			controller: 'ContentController'
		})
		.otherwise({redirectTo: '/partials/index'});

		$locationProvider.html5Mode(true).hashPrefix('!');;
	}]);
