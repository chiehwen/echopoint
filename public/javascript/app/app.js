'use strict';

var Vocada = angular.module('vocada', ['ngCookies', 'firebase'])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider
		.when('/social/:controller', {
			templateUrl: '/partials/social',
			controller: 'SocialCtrl'
		})
		.when('/dashboard', {
			templateUrl: '/partials/social',
			controller: 'SocialCtrl'
		})
		.otherwise({redirectTo: '/dashboard'});

		$locationProvider.html5Mode(true).hashPrefix('!');;
	}]);

Vocada.value('firebaseUrl', 'https://vocada.firebaseio.com/');

// https://github.com/grevory/angular-local-storage
Vocada.value('prefix', 'vocada');
Vocada.constant('cookie', { expiry:30, path: '/'});
Vocada.constant('notify', { setItem: true, removeItem: false} );