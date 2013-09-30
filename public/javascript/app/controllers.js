'use strict';

Vocada

	// Page Controller
	.controller('PageCtrl', ['$scope', 'uid', 'bid', function ($scope, uid, bid) {

		$scope.user = {uid:uid,bid:bid,business:{}};

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
	.controller('TemplateCtrl', ['$scope', '$window', '$http', '$cookies', '$route', '$routeParams', '$location', 'angularFireCollection', 'localStorage', 'socket', 'uid', 'bid', 'firebaseUrl', function ($scope, $window, $http, $cookies, $route, $routeParams, $location, angularFireCollection, localStorage, socket, uid, bid, firebaseUrl) {

		// page routing data
		$scope.page = {
			controller: $routeParams.controller,
			view: $routeParams.view || false,
			action: $routeParams.action || false,
			loading: true
		}
console.log($scope.page);
		// some secure routes are still run by the server, route these paths to the actual addresses
		if($scope.page.controller === 'logout')
			$window.location.href = '/logout';

		$scope.template = '/partials/loading'
		$scope.navigation.active = false;

		// This must be done on first load business creation because 
		// not having a uid already created and connected to firebase
		// causes load errors
		if(uid === '')
			$scope.user.uid = new Firebase(firebaseUrl + 'user').push({business: false}).name();

		// first thing we do is get the data for the loading page
		socket.emit('init', {sid: $cookies['connect.sid']}, function (user) {
			//if(!loggedIn)
				//$window.location.href = '/logout'
//console.log(user);
			if(user.loggedIn) {
				if(!$scope.user.data) {
					$scope.user.data = user;
					$scope.user.businesses = user.businesses.list;
					$scope.user.passport = user.passport;
					for(var i=0,l=user.businesses.list.length;i<l;i++)
						if(user.businesses.list[i].id == $scope.user.bid) {
							$scope.user.business = {
								name: user.businesses.list[i].name,
								id: user.businesses.list[i]._id,
								uid: user.businesses.list[i].id,
								index: i
							}
							break;
						}
					
				}

				if(user.uid === '') {
					socket.emit('setUid', {uid: $scope.user.uid}, function (err) {
						if(err) console.log(err)
						console.log('new uid has been saved to database');
					});
				}

				for(var i=0,l=user.businesses.list.length;i<l;i++) {
					if(user.businesses.list[i].id === '') {
						var index = i;
						$http.get('/user/settings').then(function(json) {
							var newBid = new Firebase(firebaseUrl + 'user/' + $scope.user.uid + '/business').push({settings: json['data']}).name();
							socket.emit('setBid', {index: index, bid: newBid}, function (err) {
								if(err) console.log(err)
								console.log('new business id has been saved to database');
							});
							if(bid === '')
								$scope.user.bid = newBid;
						});
					}
				}
			} else {
				$window.location.href = '/logout';
			}
		});
		
		if($scope.page.controller === 'account')
			$scope.template = '/partials/user/account';

		if($scope.page.controller === 'business')
			$scope.template = '/partials/business/'+$scope.page.view;

		if($scope.page.controller  === 'social') {

			$scope.network = {
				name: $scope.page.view,
				google: {
					save: function(ref) {
console.log(ref);
						socket.emit('saveGoogle', {index: $scope.user.business.index, ref: ref || null, name: $scope.network.google.name, city: $scope.network.google.city, state: $scope.network.google.state, zipcode: $scope.network.google.zipcode, url: $scope.network.google.url}, function (err, res) {
							if(err) 
								return console.log(err)
							if(res.success) {								
								$scope.template = '/partials/social/index';
							} else if(res.list) {
								$scope.network.businesses = res.list;
								$scope.template = '/partials/social/google/select';
							} else {
								$scope.template = '/partials/social/connect';
							}
						})
					}
				},
				yelp: {
					setup: function() {
						$scope.template = '/partials/social/yelp/setup';
					},
					save: function(id) {
						socket.emit('saveYelp', {index: $scope.user.business.index, id: id || null, name: $scope.network.yelp.name, city: $scope.network.yelp.city, state: $scope.network.yelp.state, url: $scope.network.yelp.url}, function (err, res) {
							if(err) 
								return console.log(err)
							if(res.success) {								
								$scope.template = '/partials/social/index';
							} else if(res.list.businesses) {
								$scope.network.businesses = res.list.businesses;
								$scope.template = '/partials/social/yelp/select';
							} else {
								$scope.template = '/partials/social/connect';
							}
						})
					}
				},
				selectBusiness: function(id) {
					$scope.template = '/partials/loading';
					$http.get('/social/'+$scope.network.name+'/connect?id='+id).success(function(res) {
						if(res.success)
							$scope.template = '/partials/social/index';
						else
							$scope.template = '/partials/social/connect';
					})
				}
			}

			//if($scope.page.action === 'plus') $scope.network.icon = 'google-plus-sign';
			//if($scope.page.action === 'places') $scope.network.icon = 'google-places';
			if($scope.network.name === 'google') 
				$scope.network.icon = 'google-places';

			$http.get('/social/'+$scope.network.name+'/connect').success(function(res) {
				console.log(res);
				
				if(res.success)
					if(res.url || (!res.connected && $scope.network.name === 'yelp')) {
						$scope.network.url = res.url
						$scope.template = '/partials/social/connect';		
					} else if(res.connected && res.data.businesses) {
						$scope.network.businesses = res.data.businesses;
						$scope.template = '/partials/social/select';
					} else if(res.setup){
						console.log('here');
						$scope.template = '/partials/social/' + $scope.network.name + '/setup';
					} else {
						$scope.template = '/partials/social/index';
					}
					
				//$scope.$apply();
			})
		}

	}]) 

	// User Controller
	.controller('UserCtrl', ['$scope', '$http', '$location', 'socket', 'uid', 'bid', 'firebaseUrl', function ($scope, $http, $location, socket, uid, bid, firebaseUrl) {
		$scope.page.loading = false;
		$scope.account = {
			user: {},
			business: {},
			update: function(type) {
				$scope.page.loading = true;
				if(type === 'user') {
					var userUpdate = {
								name: $scope.account.user.name !== $scope.user.data.name ? $scope.account.user.name : null,
								email: $scope.account.user.email !== $scope.user.data.email ? $scope.account.user.email : null
							}
					if(userUpdate.name || userUpdate.email)
						socket.emit('updateUser', userUpdate, function (err) {
							if(err) console.log(err)

							if(userUpdate.name)
								$scope.user.data.name = userUpdate.name;
							if(userUpdate.email)
								$scope.user.data.email = userUpdate.email;

							$scope.page.loading = false;
						});
					else
						$scope.page.loading = false;
				}

				if(type === 'business') {
					var businessUpdate = [];
					for(var i=0, l=$scope.user.businesses.length;i<l;i++) {
						var business = $scope.account.business[$scope.user.businesses[i]._id];
						if(typeof business !== 'undefined' && business !== '')
							businessUpdate.push({
								id: $scope.user.businesses[i]._id,
								index: i,
								name: business,
								current: $scope.user.businesses[i]._id === $scope.user.business.id ? true : false
							})
					}

					if(businessUpdate.length)
						socket.emit('updateBusiness', businessUpdate, function (err) {
							if(err) console.log(err)
							for(var i=0, l=businessUpdate.length;i<l;i++) {
								$scope.user.businesses[businessUpdate[i].index].name = businessUpdate[i].name;
								if(businessUpdate[i].current)
									$scope.user.business.name = businessUpdate[i].name;
							}
							$scope.page.loading = false;
						});
					else 
						$scope.page.loading = false;
				}
			}
		}
	}])

	// Business Controller
	.controller('BusinessCtrl', ['$scope', '$http', '$location', 'socket', 'uid', 'bid', 'firebaseUrl', 'returnTo', function ($scope, $http, $location, socket, uid, bid, firebaseUrl, returnTo) {
		$scope.businesses = {
			create: function() {
				console.log($scope.business.name);
				$http.get('/user/settings').then(function(json) {
					$scope.user.bid = new Firebase(firebaseUrl + 'user/' + $scope.user.uid + '/business').push({settings: json['data']}).name();
				
					socket.emit('createBusiness', {uid: $scope.user.uid, bid: $scope.user.bid, name: $scope.business.name}, function (err, res) {
						console.log(err, res);
					})

				});
			},
			select: function(id) {
				socket.emit('setBusiness', {id: id}, function (err, res) {
					if(err) console.log(err)
					bid = $scope.user.bid = res.data.bid
					if(returnTo && returnTo !== '')
						$location.path(returnTo);
				})
			}
		}
	}])

	// Social Pages Controller
	.controller('SocialCtrl', ['$scope', '$window', 'angularFire', 'uid', 'firebaseUrl', function ($scope, $window, angularFire, uid, firebaseUrl) {
		
		// check that we have a uid connected to firebase
		//if($scope.user.uid === '') 
			//$window.location.href = '/social/'+$scope.network.name;

		// intial settings and variables for our social pages
		$scope.load = {complete: false}
		$scope.modules = { 
			partial: '/partials/module',
			iteration: 0
		}

		// firebase connection data
		$scope.firebase = {url: firebaseUrl + 'user/' + $scope.user.uid + '/business/' + $scope.user.bid + '/settings/' + $scope.network.name + '/modules/'}
		$scope.firebase.connection = new Firebase($scope.firebase.url)
console.log($scope.firebase);
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

				$scope.module.changeTimeframe = function(time) {
					$scope.remoteModule.timeframe = $scope.menu.timeframe = time;
				}
			});

		// add additional menu items
		$scope.menu = {
			on: module.menu === false ? false : true,
			timeframe: module.timeframe
		}


		$scope.closeable = module.closeable === true ? true : false; 

		$scope.view = {current: '/partials/modules/loading', loading: true, atOrigin: true};

		$scope.view.origin = '/partials/modules/' + $scope.network.name + '/' + module.name + '/index';

		//var firebaseModuleUrl = firebaseUrl + 'user/' + $scope.$parent.user.uid + '/settings/' + $scope.network.name + '/modules/' + $scope.title;
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
					if($scope.view.loading) {
						$scope.view.current = $scope.view.origin
						$scope.view.loading = false;
					}

				$scope.module.hidden = data.hidden;
				$scope.module.sortable = data.sortable;
console.log(data.sortable);				
				//$scope.load.complete = true;
			}
		});
//$scope.modules.revive(num) {
//	console.log('is it happeneing', num)
//}

		// get our users current module settings from firebase
		//var firebaseSettingsUrl = firebaseUrl + 'user/' + $scope.$parent.user.uid + '/settings/' + $scope.network.name + '/modules/' + $scope.module.name+'/settings/';
		$scope.management = {
			settings: angularFireCollection($scope.firebase.url + $scope.module.id+ '/settings/')
		}

		// setup view based on options (if any options)
		//var firebaseOptionsList = new Firebase(firebaseModuleUrl + '/settings/');
		$scope.options = {};
		$scope.firebase.connection.child($scope.module.id).child('settings').on('value', function (snapshot) {
			var optionList = snapshot.val();
			if(optionList)
				for(var i=0, l = optionList.length; i<l; i++) {
					$scope.options[optionList[i].type] = optionList[i].val;
				}
		})


		// setup other module views
		$scope.help = { state: 'help', partial: '/partials/modules/' + $scope.network.name + '/' + module.name + '/help', active: false};
		$scope.manage = { state: 'manage ' + module.name, partial: '/partials/modules/' + $scope.network.name + '/' + module.name + '/management', active: false};
		
		// handle toggle actions
		$scope.view.toggle = function(toggle) {
			var active = {manage: $scope.manage.active, help: $scope.help.active}
			$scope.view.toOrigin();

			if(toggle === 'manage' && !active.manage) {
				$scope.manage.state = 'exit management window';
				$scope.view.current = $scope.manage.partial;
				$scope.manage.active = true;
			}

			if(toggle === 'help' && !active.help) {
				$scope.help.state = 'close help';
				$scope.view.current = $scope.help.partial;
				$scope.help.active = true;
			}
		};

		$scope.view.toOrigin = function() {
			$scope.manage.state = 'manage ' + $scope.module.name;
			$scope.help.state = 'help';
			$scope.view.current = $scope.view.origin;
			$scope.manage.active = $scope.help.active = false;
			$scope.view.atOrigin = true;
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
				firebaseSettingsUrl = $scope.firebase.url + $scope.module.id+'/settings/';
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