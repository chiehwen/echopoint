'use strict';

var Vocada = angular.module('vocada', [])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider.when('/:model/:controller', {
			templateUrl: '/partials/data',
			controller: 'DataCtrl'
		})
		.when('/:model', {
			templateUrl: '/partials/data',
			controller: 'DataCtrl'
		})
		.otherwise({redirectTo: '/partials/index'});

		$locationProvider.html5Mode(true).hashPrefix('!');;
	}]);


// https://github.com/grevory/angular-local-storage
Vocada.value('prefix', 'vocada');
Vocada.constant('cookie', { expiry:30, path: '/'});
Vocada.constant('notify', { setItem: true, removeItem: false} );
