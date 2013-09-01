'use strict';

Vocada

	// Page Controller
	.controller('PageCtrl', ['$scope', 'uid', function ($scope, uid) {

		$scope.user = {uid:uid};

		$scope.header = '/partials/header';
		$scope.navigation = {
			template: '/partials/menus/navigation',
			active: false
		}

		$scope.navigation.toggle = function() {
			$scope.navigation.active = !$scope.navigation.active;
		};
	}])

	// Template Controller
	.controller('TemplateCtrl', ['$scope', '$window', '$http', '$cookies', '$route', '$routeParams', '$location', 'angularFireCollection', 'localStorage', 'socket', 'uid', 'firebaseUrl', function ($scope, $window, $http, $cookies, $route, $routeParams, $location, angularFireCollection, localStorage, socket, uid, firebaseUrl) {
		
		$scope.template = '/partials/loading'
		$scope.navigation.active = false;

		// This must be done on first load business creation because 
		// not having a uid already created and connected to firebase
		// causes load errors
		if(uid === '')
			$http.get('/user/settings').then(function(json) {
				$scope.user.uid = new Firebase(firebaseUrl + 'users').push({settings: json['data']}).name();
			});

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
		//var model = $scope.model = $routeParams.model;
		//var controller = $scope.controller = $routeParams.controller;

		$scope.page = {location: $routeParams.network}

		
//console.log($route.current.action);
		if($route.current.action === 'social') {
			$scope.network = {
				name: $scope.page.location,
				yelp: {
					setup: function() {
						$scope.template = '/partials/social/yelp/setup';
					}
				}
			}
			$scope.network.selectBusiness = function(id) {
				$scope.template = '/partials/loading';
				$http.get('/connect/social/'+$scope.network.name+'?id='+id).success(function(res) {
					if(res.success)
						$scope.template = '/partials/social/index';
					else
						$scope.template = '/partials/social/connect';
				})
			};

			$http.get('/social/'+$scope.network.name+'/connect').success(function(res) {
				console.log(res);
				
				if(res.success){

					if(res.url) {
						$scope.network.url = res.url
						$scope.template = '/partials/social/connect';		
					} else if(res.connected && res.data.businesses) {
						$scope.network.businesses = res.data.businesses;
						$scope.template = '/partials/social/select';
					} else if(res.connected && $scope.network.name === 'yelp') {
					
					} else {
						$scope.template = '/partials/social/index';
					}
					
				}
				//$scope.$apply();
			})
		}
		// some secure routes are still run by the server, route these paths to the actual addresses
		//if(model == 'logout')
			//$window.location.href = '/logout';	

	}]) 


	// Social Pages Controller
	.controller('SocialCtrl', ['$scope', '$window', 'angularFire', 'uid', 'firebaseUrl', function ($scope, $window, angularFire, uid, firebaseUrl) {
		
		// check that we have a uid connected to firebase
		if($scope.user.uid === '') 
			$window.location.href = '/social/'+$scope.page.location;

		// intial settings and variables for our social pages
		$scope.load = {complete: false}
		$scope.modules = { 
			partial: '/partials/module',
			iteration: 0
		}

		// firebase connection data
		$scope.firebase = {url: firebaseUrl + 'users/' + $scope.user.uid + '/settings/' + $scope.page.location + '/modules/'}
		$scope.firebase.connection = new Firebase($scope.firebase.url)

		// get individual module settings data from firebase
		angularFire($scope.firebase.url, $scope, 'remoteModules', []).
		then(function() {
			$scope.modules.data = $scope.remoteModules;
			for(var i=0,l=$scope.modules.data.length; i<l; i++)
				$scope.modules.data[i].id = i;
			$scope.modules.count = l;	
		});
	}])


	.controller('ModuleCtrl', ['$scope', 'angularFire', 'angularFireCollection', 'firebaseUrl', 'socket', function ($scope, angularFire, angularFireCollection, firebaseUrl, socket) {

		var module = $scope.module;
		console.log(module)
		//$scope.module.hidden = true;
		//$scope.module.dashboarded = false;

		// build module header
		$scope.module.header = {
			icon: module.icon ? '<i class="icon-'+module.icon+'"></i> ' : '',
			title: module.title || module.name
		}

		// connect module actions to firebase
		angularFire($scope.firebase.url + $scope.module.id, $scope, 'remoteModule', {}).
			then(function() {
				$scope.module.toggleDisplay = function() {
					$scope.remoteModule.hidden = !$scope.module.hidden;
				}

				$scope.module.toggleDashboardDisplay = function() {
					$scope.remoteModule.dashboarded = !$scope.module.dashboarded;
				}

				$scope.module.toggleSize = function() {
					if($scope.module.sizing)
						$scope.remoteModule.large = !$scope.module.large;
				}
			});

		// add additional menu items
		$scope.menu = {
			on: module.menu === false ? false : true,
			active: true
		}

		$scope.closeable = module.closeable === true ? true : false; 

		$scope.viewport = {current: '/partials/modules/loading', loading: true};

		$scope.viewport.origin = '/partials/modules/' + $scope.page.location + '/' + module.name + '/index';

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

		$scope.firebase.connection.child($scope.module.id).on('value', function (snapshot) {
			var data = snapshot.val();
			if(data) {
				if(data.sizing)
					$scope.module.large = data.large;

				$scope.module.dashboarded = data.dashboarded;

				if(data.large)
					$scope.chartTest.options.chart.width = 908;
				else
					$scope.chartTest.options.chart.width = 428;

				if(!data.hidden)
					if($scope.viewport.loading) {
						$scope.viewport.current = $scope.viewport.origin
						$scope.viewport.loading = false;
					}

				$scope.module.hidden = data.hidden;
				//$scope.load.complete = true;
			}
		});
//$scope.modules.revive(num) {
//	console.log('is it happeneing', num)
//}

		// get our users current module settings from firebase
		//var firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + $scope.page.location + '/modules/' + $scope.module.name+'/settings/';
		$scope.management = {
			settings: angularFireCollection($scope.firebase.url + $scope.module.id+ '/settings/')
		}

		// setup viewport based on options (if any options)
		//var firebaseOptionsList = new Firebase(firebaseModuleUrl + '/settings/');
		$scope.options = {};
		$scope.firebase.connection.child($scope.module.id).child('settings').on('value', function (snapshot) {
			var optionList = snapshot.val();
			if(optionList)
				for(var i=0, l = optionList.length; i<l; i++) {
					$scope.options[optionList[i].type] = optionList[i].val;
				}
		})


		// handle management action
		$scope.manage = { state: 'manage ' + module.name, partial: '/partials/modules/' + $scope.page.location + '/' + module.name + '/management'};
		$scope.toggleManagement = function() {
			$scope.menu.active = false;
			$scope.viewport.current = $scope.manage.partial;
			//$scope.viewport.current = $scope.manage.state === 'exit management window' ? $scope.viewport.origin : $scope.manage.partial;
			//$scope.manage.state = $scope.manage.state === 'exit management window' ? $scope.manage.state = 'manage ' + $scope.module.name: $scope.manage.state = 'exit management window';
		};

		// handle help action
		$scope.help = { state: 'help', partial: '/partials/modules/' + $scope.page.location + '/' + module.name + '/help'};
		$scope.toggleHelp = function() {
			$scope.menu.active = false;
			$scope.viewport.current = $scope.help.partial;
			//$scope.viewport.current = $scope.help.state === 'help' ? $scope.help.partial : $scope.viewport.origin;
			//$scope.help.state = $scope.help.state === 'help' ? $scope.help.state = 'close help' : $scope.help.state = 'help';
		};

		$scope.toOrigin = function() {
			$scope.viewport.current = $scope.viewport.origin;
			$scope.menu.active = true;
		}

		// this is the load.complete finsihing based off all
		// $includeContentLoaded firing. Its ugly but it works
		// TODO: watch this and find a better solution!
		$scope.$on('$includeContentLoaded', function(e) {
			$scope.modules.iteration++;
			// note the 2 multiplier in conditional
			// why is that needed??
			var totalModuleLoads = $scope.modules.count*2;
			if($scope.modules.iteration >= totalModuleLoads)
				$scope.load.complete = true;
		})

	}])

	// the option controller will handle 
	// real-time implicit synchronization
	// with firebase for user settings   
	.controller('OptionCtrl', ['$scope', 'angularFire', 'firebaseUrl', function ($scope, angularFire, firebaseUrl) {
		var option = $scope.$parent.option, // option is defined in partial (it is singulars from $scope.management)
				firebaseSettingsUrl = firebaseUrl + 'users/' + $scope.$parent.user.uid + '/settings/' + 'facebook' + '/modules/' + $scope.module.id+'/settings/';
		$scope.icon = {
			on: option.val ? '' : '-empty',
			color: option.val ? 'green' : 'gray'
		}
		$scope.text = {
			on: option.val ? 'active' : 'disabled'
		}
		angularFire(firebaseSettingsUrl + option.$id, $scope, 'remoteOption', {}).
			then(function() {
					$scope.toggleOption = function() {
						$scope.remoteOption.val = $scope.options[$scope.remoteOption.type] = !option.val;
					}
			});
	}])

	.controller('GraphCtrl', ['$scope', 'socket', function ($scope, socket) {

		

	}]);




	//.controller('ViewportCtrl', ['$scope', 'socket', function ($scope, socket) {}])
	//.controller('MenuCtrl', ['$scope', 'socket', function ($scope, socket) {}]);