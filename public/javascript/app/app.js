'use strict';

var Vocada = angular.module('vocada', ['ngCookies', 'firebase'])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider
		.when('/:controller/:view/:action', {
			controller: 'TemplateCtrl',
			templateUrl: '/partials/template'
		})
		.when('/:controller/:view', {
			controller: 'TemplateCtrl',
			templateUrl: '/partials/template'
		})
		.when('/:controller', {
			controller: 'TemplateCtrl',
			templateUrl: '/partials/template'
		})
		/*.when('/:controller/:view/', {
			controller: 'TemplateCtrl',
			templateUrl: '/partials/template'
		})*/
		/*.when('/social/:network', {
			controller: 'TemplateCtrl',
			templateUrl: '/partials/template',
			base: 'social'
		})
		.when('/dashboard', {
			controller: 'TemplateCtrl',
			templateUrl: '/partials/template'
		})*/
		.otherwise({redirectTo: '/logout'});

		$locationProvider.html5Mode(true).hashPrefix('!');;
	}]);

Vocada.value('firebaseUrl', 'https://vocada.firebaseio.com/');

// https://github.com/grevory/angular-local-storage
Vocada.value('prefix', 'vocada');
Vocada.constant('cookie', { expiry:30, path: '/'});
Vocada.constant('notify', { setItem: true, removeItem: false} );