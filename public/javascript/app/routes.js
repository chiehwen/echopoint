define(['angular', 'app'], function(angular, app) {
	'use strict';

	return angular.module('vocada', [])
	.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider.when('/partials/index', {
			templateUrl: '/partials/template',
			controller: 'MyCtrl1'
		});
		$routeProvider.when('/view2', {
			templateUrl: 'app/partials/partial2.html',
			controller: 'MyCtrl2'
		});
		$routeProvider.otherwise({redirectTo: '/view1'});

		$locationProvider.html5Mode(true);
	}]);

});