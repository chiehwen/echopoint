// Place third party dependencies in the app folder
//
// Configure loading modules from the app directory,
require.config({
    'baseUrl': '/javascript/app',
    'paths': {
    	'libraries': '../libraries',
      'jquery': '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
      'highcharts': 'http://code.highcharts.com/highcharts',
      //'packery': '../libraries/packery.min',
      //'draggabilly': '../libraries/draggabilly.min'
    }
});

// Load the main app module to start the app
define(['libraries/class'], function() {
	require(['app']);
});