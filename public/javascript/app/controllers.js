'use strict';

Vocada
	
	// Page Controller
	.controller('PageCtrl', ['$scope', function ($scope) {
		$scope.header = '/partials/header';
		$scope.navigation = {
			template: '/partials/menus/navigation',
			active: false
		}

		$scope.toggleNavigation = function() {
			$scope.navigation.active = !$scope.navigation.active ? true : false;
		};
	}])


	// Template Controller
	/*.controller('TemplateCtrl', ['$scope', '$window', '$http', '$route', '$routeParams', '$location', 'angularFireCollection', 'localStorage', 'socket', function ($scope, $window, $http, $route, $routeParams, $location, angularFireCollection, localStorage, socket) {

		var model = $scope.model = $routeParams.model;
		var controller = $scope.controller = $routeParams.controller;

	
		if(model == 'guide')
			$scope.template = '/partials/guide'
		else 
			$scope.template = '/partials/data'

		// some secure routes are still run by the server, route these paths to the actual addresses
		if(model == 'logout')
			$window.location.href = '/logout';	

	}]) */


	// Content Controller
	.controller('DataCtrl', ['$scope', '$window', '$http', '$route', '$routeParams', '$cookies', 'angularFireCollection', 'firebaseUrl', 'localStorage', 'socket', function ($scope, $window, $http, $route, $routeParams, $cookies, angularFireCollection, firebaseUrl, localStorage, socket) {

//console.log(menu.getMenu('test', ['manage']));

		var model = $scope.model = $routeParams.model,
				controller = $scope.controller = $routeParams.controller;

		$scope.location = typeof controller !== 'undefined' ? controller : model;

		// first thing we do is get the data for the loading page
		socket.emit('init', {sid: $cookies['connect.sid']}, function (loggedIn, passport, uid) {
			if(!loggedIn)
				$window.location.href = '/logout'

			$scope.user = {
				passport: passport,
				uid: uid
			}

			if(uid === '') {
				$http.get('/user/settings').then(function(json) {
					$scope.firebase = new Firebase(firebaseUrl + 'users');
					var userPushReference = $scope.firebase.push({settings: json['data']}).name();
					
					socket.emit('setUid', {passport: passport, uid: userPushReference}, function (err) {
						if(err) console.log(err)
						$scope.user.uid = userPushReference;
					});
				});
			}
		});
		 //angularFireCollection('https://vocada.firebaseio.com/users/');
		//var pushReference = $scope.firebase.push({test: 'testing'});
//console.log(pushReference.name());		
		//pushReference.set({test: 'testing'});
		//firebase.on('value', function(snapshot) {
		 // console.log(snapshot.val());
		//});
		//firebase.add({scott: settings: {}})

		/*var userSettings = localStorage.get('userSettings');
		if(!userSettings)
			$http.get('/user/settings').then(function(json) {
				userSettings = json.data;
				$scope.firebase.update({"scottcarlsonjr@gmail2": {settings: userSettings}});
				localStorage.set('userSettings', userSettings);
			});*/

		// first thing we do is get the data for the loading page
		socket.emit('getPageData', {model: model, controller: controller}, function (data) {
			console.log(data.modules);
			if(data.modules.length > 0) 
				$scope.mods = data.modules;
		});


		// if the page has modules lets get them
		socket.emit('getModules', {model: model, controller: controller}, function (data) {
			//console.log(data.modules);
			if(data.modules.length > 0) {
				$scope.module = '/partials/module';
				$scope.mods = data.modules;
				//socket.emit('my other event', { my: 'data' });
			}
		});

	}])


	.controller('ModuleCtrl', ['$scope', 'angularFire', 'angularFireCollection', 'firebaseUrl', 'socket', function ($scope, angularFire, angularFireCollection, firebaseUrl, socket) {

		var module = $scope.$parent.mod;
		$scope.location = $scope.$parent.location;

		// build module header
		$scope.icon = module.icon ? '<i class="icon-'+module.icon+'"></i> ' : '';
		$scope.title = module.class || module.title;

		// add additional menu items
		$scope.menu = module.menu.custom
		$scope.timeframe = module.menu.timeframe

		$scope.viewport = {};
		$scope.viewport.current = $scope.viewport.origin = '/partials/modules/' + module.id + '/' + (module.class || module.title) + '/index';
	
		// get our users current module settings from firebase
		var firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + $scope.location + '/modules/notifications/settings/';
		$scope.management = angularFireCollection(firebaseSettingsUrl);
console.log($scope.management);
// BEGIN HERE TOMORROW
$scope.options = {
	post: true
}

		// handle management action
		$scope.manage = { state: 'manage ' + (module.class || module.title), partial: '/partials/modules/' + module.id + '/' + (module.class || module.title) + '/management'};
		$scope.toggleManagement = function() {
			$scope.viewport.current = $scope.manage.state === 'exit management window' ? $scope.viewport.origin : $scope.manage.partial;
			$scope.manage.state = $scope.manage.state === 'exit management window' ? $scope.manage.state = 'manage ' + $scope.title : $scope.manage.state = 'exit management window';
		};

		// handle help action
		$scope.help = { state: 'help', partial: '/partials/modules/' + module.id + '/' + (module.class || module.title) + '/help'};
		$scope.toggleHelp = function() {
			$scope.viewport.current = $scope.help.state === 'help' ? $scope.help.partial : $scope.viewport.origin;
			$scope.help.state = $scope.help.state === 'help' ? $scope.help.state = 'close help' : $scope.help.state = 'help';
		};

	}])

	// the option controller will handle 
	// real-time implicit synchronization
	// with firebase for user settings   
	.controller('OptionCtrl', ['$scope', 'angularFire', 'firebaseUrl', function ($scope, angularFire, firebaseUrl) {
		var option = $scope.$parent.option, // option is defined in partial (it is singulars from $scope.management)
				firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + 'facebook' + '/modules/notifications/settings/';
		$scope.icon = {
			on: option.val ? '' : '-empty',
			color: option.val ? 'green' : 'gray'
		}
		$scope.text = {
			on: option.val ? 'active' : 'disabled'
		}
		angularFire(firebaseSettingsUrl + option.$id + '/val', $scope, 'remote', true).
		then(function() {
				$scope.toggleOption = function() {
					$scope.remote = $scope.options.post = !option.val;
				}
		});
	}])

	//.controller('ViewportController', ['$scope', 'socket', function ($scope, socket) {

		

	//}])
	//.controller('MenuCtrl', ['$scope', 'socket', function ($scope, socket) {



	//}]);