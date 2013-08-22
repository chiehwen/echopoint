'use strict';

angular.module('vocada')
	.controller('MainController', ['$scope', 'socket', function ($scope, socket) {
		$scope.navigation = false;
		$scope.toggleNavigation = function() {
			$scope.navigation = $scope.navigation === false ? true : false;
		};
	}])
	// Sample controller where service is being used
	.controller('ContentController', ['$scope', '$route', '$routeParams', 'socket', function ($scope, $route, $routeParams, socket) {
		//$scope.scopedAppVersion = version;
		$scope.test = ' mine!';
		$scope.module = '/partials/module';

		console.log($routeParams.model);
		console.log($routeParams.controller);

		socket.emit('notifications', null, function (data) {
			console.log(data);
			//socket.emit('my other event', { my: 'data' });
		});
		socket.on('name', function(data) {
			console.log(data);
		});
	}]);