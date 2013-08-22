define(['angular', 'services'], function (angular) {
	'use strict';

	return angular.module('vocada', ['vocada.services'])
		// Sample controller where service is being used
		.controller('MyCtrl1', ['$scope', /*'version',*/ function ($scope) {
			//$scope.scopedAppVersion = version;
			$scope.test = ' mine!';
		}]);
});