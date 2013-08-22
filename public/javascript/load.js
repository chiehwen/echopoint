// Place third party dependencies in the app folder
//
// Configure loading modules from the app directory,
require.config({
    baseUrl: '/javascript/app',
    paths: {
    	'angular': '//ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.min',
      'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
      'highcharts': 'http://code.highcharts.com/highcharts',
      'libraries': '../libraries',
      
      //'packery': '../libraries/packery.min',
      //'draggabilly': '../libraries/draggabilly.min'
    },
    shim: {
			'angular' : {
				exports : 'angular'
			},
			'angularMocks': {
				deps:['angular'], 
				exports:'angular.mock'
			},
			/*'packery' : {
				exports: 'Packery'
			},
			'draggabilly' : {
				deps: ['packery'],
				exports: 'Draggabilly'
			}*/
		},
		priority: [
			'angular'
		]
});

// Load the main app module to start the app
require(['angular', 'app', 'routes', 'libraries/class'], function(angular, app, routes, Class) {
	'use strict';
	angular.bootstrap(document, [app.name]);
});