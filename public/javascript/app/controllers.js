'use strict';

angular.module('vocada')
	
	// Page Controller
	.controller('PageCtrl', ['$scope', '$window', '$http', '$route', '$routeParams', '$location', 'localStorage', 'socket', function ($scope, $window, $http, $route, $routeParams, $location, localStorage, socket) {

		var model = $scope.model = $routeParams.model;
		var controller = $scope.controller = $routeParams.controller;

		// some secure routes are still run by the server, route these paths to the actual addresses
		if(model == 'logout')
			$window.location.href = '/logout';

		// TODO: setup with firebase (firebase.com)
		// if user localStorage based settings aren't in place then load up the defaults
		var userSettings = localStorage.get('userSettings');
		if(!userSettings)
			$http.get('/user/settings').then(function(json) {
				userSettings = JSON.stringify(json.data);
				localStorage.set('userSettings', userSettings);
			});

		// first thing we do is get the data for the loading page
		socket.emit('getPageData', {model: model, controller: controller}, function (data) {
			console.log(data.modules);
			if(data.modules.length > 0) { 
			$scope.mods = data.modules;
			//socket.emit('my other event', { my: 'data' });
			}
		});

		$scope.navigation = false;
		$scope.toggleNavigation = function() {
			$scope.navigation = $scope.navigation === false ? true : false;
		};

		//$scope.menu = '/partials/menu';

	}])


	// Content Controller
	.controller('DataCtrl', ['$scope', '$window', '$route', '$routeParams', 'localStorage', 'socket', 'menu', function ($scope, $window, $route, $routeParams, localStorage, socket, menu) {

		$scope.module = '/partials/module';

console.log(menu.getMenu('test', ['manage']));
	
		var model = $scope.$parent.model,
				controller = $scope.$parent.controller;


		// if the page has modules lets get them
		socket.emit('getModules', {model: model, controller: controller}, function (data) {
			console.log(data.modules);
			if(data.modules.length > 0) { 
			$scope.mods = data.modules;
			//socket.emit('my other event', { my: 'data' });
			}
		});


	}])
	.controller('ModuleCtrl', ['$scope', 'socket', function ($scope, socket) {

		$scope.title = $scope.$parent.mod.title

		$scope.menu = $scope.$parent.mod.menu

		$scope.viewport = '/partials/viewport';
		$scope.help = false;
		$scope.toggleHelp = function() {
			if($scope.help === false) { 
				$scope.viewport = '/partials/help'
				$scope.help = true;
			} else {
				$scope.viewport = '/partials/viewport'
				$scope.help = false;
			}
		};

	}])
	//.controller('ViewportController', ['$scope', 'socket', function ($scope, socket) {

		

	//}])
	.controller('MenuCtrl', ['$scope', 'socket', function ($scope, socket) {

		//$scope.test = 'test';

	}]);