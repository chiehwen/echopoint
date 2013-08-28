'use strict';

Vocada
	
	// Page Controller
	.controller('PageCtrl', ['$scope', '$http', '$cookies', 'socket', 'uid', 'firebaseUrl', function ($scope, $http, $cookies, socket, uid, firebaseUrl) {

		$scope.user = { uid: uid };

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
	.controller('DataCtrl', ['$scope', '$window', '$http', '$route', '$routeParams', '$cookies', 'uid', 'angularFireCollection', 'firebaseUrl', 'localStorage', 'socket', function ($scope, $window, $http, $route, $routeParams, $cookies, uid, angularFireCollection, firebaseUrl, localStorage, socket) {
$scope.load = {complete: false};	
//console.log(menu.getMenu('test', ['manage']));
		
		// This must be done on first load business creation because 
		// not having a uid already created and connected to firebase
		// causes load errors
		if(uid === '') {
			$http.get('/user/settings').then(function(json) {
				$scope.firebase = new Firebase(firebaseUrl + 'users');
				$scope.user.uid = $scope.firebase.push({settings: json['data']}).name();
			});
		}

		// first thing we do is get the data for the loading page
		socket.emit('init', {sid: $cookies['connect.sid']}, function (loggedIn, passport, uidFromDatabase) {
			//if(!loggedIn)
				//$window.location.href = '/logout'
			if(loggedIn) {
				$scope.user.passport = passport;

				if(uidFromDatabase === '') {
					socket.emit('setUid', {passport: passport, uid: $scope.user.uid}, function (err) {
						if(err) console.log(err)
						console.log('new uid has been saved to database');
					});
				}
			}
		});

		var model = $scope.model = $routeParams.model,
				controller = $scope.controller = $routeParams.controller;

		$scope.location = typeof controller !== 'undefined' ? controller : model;
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
		/*socket.emit('getPageData', {model: model, controller: controller}, function (data) {
			console.log(data.modules);
			if(data.modules.length > 0) 
				$scope.mods = data.modules;
		});*/


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
		$scope.menu = {
			on: module.menu === false ? false : true,
			custom: module.menu.custom,
			timeframe: module.menu.timeframe
		}

		$scope.closeable = module.closeable === true ? true : false; 

		$scope.viewport = {};
		//$scope.viewport.current = '/partials/modules/loading';
		$scope.viewport.current = $scope.viewport.origin = '/partials/modules/' + module.id + '/' + (module.class || module.title) + '/index';


//$scope.$watch('management[7]', function() {
//	console.log($scope.management);
//});
		$scope.isLarge = ''; 
		$scope.makeLarge = function() {
			$scope.isLarge = 'large';
			console.log('anything?');
		}
		var firebaseModuleUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + $scope.location + '/modules/' + $scope.title;
		var firebaseModule = new Firebase(firebaseModuleUrl);
		firebaseModule.on('value', function (snapshot) {
			var data = snapshot.val();
			if(data) {
				$scope.size = data.large === true ? 'large' : '';
				$scope.load.complete = true;
			}
		});


		// get our users current module settings from firebase
		//var firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + $scope.location + '/modules/' + $scope.title +'/settings/';
		$scope.management = angularFireCollection(firebaseModuleUrl + '/settings/');

		// setup viewport based on options (if any options)
		var firebaseOptionsList = new Firebase(firebaseModuleUrl + '/settings/');
		$scope.options = {};
		firebaseOptionsList.on('value', function (snapshot) {
			var optionList = snapshot.val();
			if(optionList)
				for(var i=0, l = optionList.length; i<l; i++) {
					$scope.options[optionList[i].type] = optionList[i].val;
				}
		})


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
				firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + 'facebook' + '/modules/' + $scope.title +'/settings/';
		$scope.icon = {
			on: option.val ? '' : '-empty',
			color: option.val ? 'green' : 'gray'
		}
		$scope.text = {
			on: option.val ? 'active' : 'disabled'
		}
		angularFire(firebaseSettingsUrl + option.$id, $scope, 'remote', {}).
		then(function() {
				$scope.toggleOption = function() {
					$scope.remote.val = $scope.options[$scope.remote.type] = !option.val;
				}
		});
	}])

	//.controller('ViewportController', ['$scope', 'socket', function ($scope, socket) {

		

	//}])
	//.controller('MenuCtrl', ['$scope', 'socket', function ($scope, socket) {



	//}]);