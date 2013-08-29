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


	// Social Pages Controller
	.controller('SocialCtrl', ['$scope', '$window', '$http', '$route', '$routeParams', '$cookies', 'uid', 'angularFireCollection', 'firebaseUrl', 'localStorage', 'socket', function ($scope, $window, $http, $route, $routeParams, $cookies, uid, angularFireCollection, firebaseUrl, localStorage, socket) {
		
		$scope.load = {complete: false};	

		// This must be done on first load business creation because 
		// not having a uid already created and connected to firebase
		// causes load errors
		if(uid === '') {
			$http.get('/user/settings').then(function(json) {
				var firebase = new Firebase(firebaseUrl + 'users');
				$scope.user.uid = firebase.push({settings: json['data']}).name();
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

		$scope.page = {location: $routeParams.controller}

		//$scope.location = typeof controller !== 'undefined' ? controller : model;


		$scope.firebase = {
			url: firebaseUrl + 'users/' + $scope.user.uid + '/settings/' + $scope.page.location + '/modules/'
		}

		$scope.firebase.modules = new Firebase($scope.firebase.url);

		// if the page has modules lets get them
		$scope.firebase.modules.on('value', function(snapshot) {
			//for(var data in snapshot.val()) {
			//	console.log(data);
			//};

			
		});

		socket.emit('getModules', {controller: $scope.page.location}, function (data) {			if(data.modules.length > 0) {
					$scope.modules = {
						partial: '/partials/module',
						data: data.modules,
						/*revive: function(num) {
							console.log(num)
							console.log($scope.modules.data[num]);
							$scope.modules.data[num].hidden = false;
						}*/
					}
				}
			});


	}])


	.controller('ModuleCtrl', ['$scope', 'angularFire', 'angularFireCollection', 'firebaseUrl', 'socket', function ($scope, angularFire, angularFireCollection, firebaseUrl, socket) {

		var module = $scope.module;
		$scope.module.hidden = true;
		//$scope.location = $scope.$parent.location;

		// build module header
		$scope.frame = {
			icon: module.icon ? '<i class="icon-'+module.icon+'"></i> ' : '',
			title: module.class || module.title
		}

		// add additional menu items
		$scope.menu = {
			on: module.menu === false ? false : true,
			custom: module.menu.custom,
			timeframe: module.menu.timeframe
		}

		$scope.closeable = module.closeable === true ? true : false; 

		$scope.viewport = {current: '/partials/modules/loading'};

		$scope.viewport.origin = '/partials/modules/' + module.id + '/' + (module.class || module.title) + '/index';

		$scope.isLarge = ''; 
		$scope.makeLarge = function() {
			$scope.isLarge = 'large';
			console.log('anything?');
		}

		//var firebaseModuleUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + $scope.page.location + '/modules/' + $scope.title;
		//var firebaseModule = new Firebase(firebaseModuleUrl);
		$scope.chartTest = {
			options: {
				chart: {
					type: 'column',
					width: 428,
					height: 400
				},
				credits: {
					enabled: false
				},
				colors: [
					'#546f8e'
				],
				
				plotOptions: {
					area: {
						fillColor: '#546f8e',
						marker: {
							enabled: false
						}
					},
					series: {
						groupPadding: 0,
						pointPadding: 0,
						shadow: false
					}
				},
				tooltip: {
					//valueSuffix: ' posts'
				},
				legend: {
					enabled: false
				},
			},
			title: {
				text: '',
			},

			series: [{
				name: 'wall posts',
				data: [1, 0, 0, 2, 1, 0, 3, 2, 2, 0, 1, 1, 2, 4, 3 ]
			}],

			loading: false
		} // chartTest

		$scope.firebase.modules.child($scope.frame.title).on('value', function (snapshot) {
			var data = snapshot.val();
			if(data) {
				$scope.frame.size = data.large === true ? 'large' : '';
				
				$scope.chartTest.options.chart.width = 908;
				if(!data.hidden) {
					$scope.viewport.current = $scope.viewport.origin
					$scope.module.hidden = false;
				}
				$scope.load.complete = true;
			}
		});
//$scope.modules.revive(num) {
//	console.log('is it happeneing', num)
//}
		angularFire($scope.firebase.url + $scope.frame.title, $scope, 'remoteModule', {}).
		then(function() {
			$scope.modules.revive = function(num) {
				//console.log($scope.modules.data[num]);
				//$scope.modules.data[num].hidden = false;
				$scope.remoteModule.hidden = $scope.module.hidden = !$scope.module.hidden;
			}
		});

		// get our users current module settings from firebase
		//var firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + $scope.page.location + '/modules/' + $scope.frame.title +'/settings/';
		$scope.management = {
			settings: angularFireCollection($scope.firebase.url + $scope.frame.title + '/settings/')
		}

		// setup viewport based on options (if any options)
		//var firebaseOptionsList = new Firebase(firebaseModuleUrl + '/settings/');
		$scope.options = {};
		$scope.firebase.modules.child($scope.frame.title).child('settings').on('value', function (snapshot) {
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
			$scope.manage.state = $scope.manage.state === 'exit management window' ? $scope.manage.state = 'manage ' + $scope.frame.title : $scope.manage.state = 'exit management window';
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
				firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + 'facebook' + '/modules/' + $scope.frame.title +'/settings/';
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

	.controller('GraphCtrl', ['$scope', 'socket', function ($scope, socket) {

		

	}]);




	//.controller('ViewportCtrl', ['$scope', 'socket', function ($scope, socket) {}])
	//.controller('MenuCtrl', ['$scope', 'socket', function ($scope, socket) {}]);