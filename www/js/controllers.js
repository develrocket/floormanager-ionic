angular.module('app.controllers', [])

    .controller('floorManagerCtrl', ['$scope', '$stateParams', '$rootScope', '$state', '$cordovaBarcodeScanner', 'Auth', 'StoreService', 'UserService', '$ionicLoading',
        function ($scope, $stateParams, $rootScope, $state, $cordovaBarcodeScanner, Auth, StoreService, UserService, $ionicLoading) {

            // if (!Auth.isLoggedIn()) {
            //     $state.go('menu.login');
            //     return;
            // }

            var loadCount = 0;


            function updateUserStore() {
                var user = Auth.getUser();
                for (var i = 0; i < $scope.stores.length; i ++) {
                    if (user.mainStore == $scope.stores[i].$id) {
                        $scope.mainStore = $scope.stores[i];
                        break;
                    }
                }
            }

            function loadStore(storeKey, storeCount) {
                var store = StoreService.findStore(storeKey);
                store.$loaded().then(function(res) {
                    $scope.stores.push(store);
                    loadCount ++;
                    if (loadCount == storeCount) {
                        $ionicLoading.hide();
                        updateUserStore();
                    }
                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $scope.stores = [];
                $scope.mainStore = {};
                loadCount = 0;

                var user = Auth.getUser();

                if (user.type == 100) {
                    $ionicLoading.show();
                    $scope.stores = StoreService.stores;
                    $scope.stores.$loaded().then(function(res) {
                        $ionicLoading.hide();
                        if (user.mainStore) {
                            for (var i = 0; i < $scope.stores.length; i ++) {
                                if (user.mainStore == $scope.stores[i].$id) {
                                    $scope.mainStore = $scope.stores[i];
                                    Auth.setStore($scope.mainStore);
                                }
                            }
                        }else {
                            $scope.mainStore = $scope.stores[0];
                            Auth.setStore($scope.mainStore);
                        }
                    }, function(err) {
                        $ionicLoading.hide();
                        console.log(err);
                    })
                }else {
                    var storeKeys = Object.keys(user.stores);
                    if (storeKeys.length != 0) {
                        $ionicLoading.show();
                        loadCount = 0;
                    }
                    for (var i = 0; i < storeKeys.length; i ++) {
                        loadStore(storeKeys[i], storeKeys.length);
                    }
                }
            }

            init();

            $scope.scan = function () {
                $cordovaBarcodeScanner
                    .scan()
                    .then(function (barcodeData) {
                        // Success! Barcode data is here
                        $state.go('menu.productDetail', {key: barcodeData.text});
                    }, function (error) {
                        // An error occurred
                    });
            };

            $scope.updateMainStore = function(store) {
                if (!store) return;
                Auth.setStore(store);
                var localUser = Auth.getUser();
                var user = UserService.findUser(localUser.$id);
                user.$loaded().then(function(res) {
                    user.mainStore = store.$id;
                    user.$save();
                    Auth.setUser(user);
                }, function(err) {
                    console.log(err);
                });
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.floorManager') {
                        init();
                    }else {
                        $scope.stores = [];
                        $scope.mainStore = {};
                    }
                });
        }
    ])

    .controller('addClientCtrl', ['$scope', '$stateParams', 'ProjectService', 'UserService', 'StoreService', 'Auth', '$ionicSideMenuDelegate',
        function ($scope, $stateParams, ProjectService, UserService, StoreService, Auth, $ionicSideMenuDelegate) {

            $scope.projects = ProjectService.projects;

            function init() {
                var localStore = Auth.getStore();
                $scope.client = {
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    password: '',
                    is_same: false,
                    projects: [],
                    type: 7,
                    mainStore: localStore.$id
                };
            }

            init();

            $scope.updateProjectType = function (obj, index) {
                $scope.client.projects[index] = obj;
            };

            $scope.addProject = function () {
                $scope.client.projects.push($scope.projects[0]);
            };

            $scope.addClient = function () {
                var localStore = Auth.getStore();
                UserService.addUser($scope.client).then(function (res) {
                    alert('Client is added successfully!');
                    init();

                    var clientKey = res.user.$id;

                    var store = StoreService.findStore(localStore.$id);
                    store.$loaded().then(function(res) {
                        if (typeof store.clients == "undefined") {
                            store.clients = {};
                        }
                        store.clients[clientKey] = true;
                        store.$save();
                    }, function(err) {
                        console.log(err);
                    })
                }, function (err) {
                });
            };

            $scope.deleteProject = function(index) {
                $scope.client.projects.splice(index, 1);
            };

            $scope.$on('$ionicView.enter', function(){
                $ionicSideMenuDelegate.canDragContent(false);
            });
            $scope.$on('$ionicView.leave', function(){
                $ionicSideMenuDelegate.canDragContent(true);
            });

        }])

    .controller('addProductCtrl', ['$scope', '$stateParams', '$ionicActionSheet', '$cordovaCamera', '$rootScope', 'ProductService', 'Auth', 'ProjectService', 'MaterialService', 'DistributorService', 'UserService', '$ionicLoading', 'StoreService', '$filter',
        function ($scope, $stateParams, $ionicActionSheet, $cordovaCamera, $rootScope, ProductService, Auth, ProjectService, MaterialService, DistributorService, UserService, $ionicLoading, StoreService, $filter) {

            var clientKey = $stateParams.key;

            var loadCount = 0;

            function loadDistributor(distributorKey, distributorCount) {
                var distributor = UserService.findUser(distributorKey);

                distributor.$loaded().then(function(res) {
                    if (typeof distributor.photo == 'undefined') {
                        distributor.photo = "img/TRjIh5RTXOIXnGdRizDg_images.png";
                    }
                    $scope.distributors.push(distributor);
                    loadCount ++;
                    if (loadCount == distributorCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                })
            }

            function init() {
                $scope.perArray = [{
                    name: 'SQ.FT.',
                    value: 'SQ.FT.'
                }, {
                    name: 'SQ.INCH',
                    value: 'SQ.INCH'
                }, {
                    name: 'BUNDLE',
                    value: 'BUNDLE'
                }, {
                    name: 'YARD',
                    value: 'YARD'
                }];
                $scope.user = Auth.getUser();
                $scope.price = 0;
                $scope.product = {
                    saler_id: $scope.user.$id,
                    name: '',
                    distributor: '',
                    phone: '',
                    cost: 0,
                    per: 'SQ.FT.',
                    markup: 50,
                    photos: [],
                    material: {},
                    project: {},
                    length: '',
                    width: '',
                    coverage_area:''
                };
                $scope.projects = ProjectService.projects;
                $scope.materials = MaterialService.materials;

                var localStore = Auth.getStore();
                $scope.distributors = [];
                var store = StoreService.findStore(localStore.$id);

                $ionicLoading.show();
                store.$loaded().then(function(res) {
                    if (typeof store.distributors != "undefined") {
                        var distributorKeys = Object.keys(store.distributors);

                        loadCount = 0;

                        if (distributorKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < distributorKeys.length; i ++) {
                            loadDistributor(distributorKeys[i], distributorKeys.length);
                        }
                    }else {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });
            }

            init();

            $scope.$on('selected-autocomplete', function (event, args) {
                if (Object.keys(args.data).length > 0) {
                    $scope.product.distributorKey = args.data.$id;
                    $scope.product.phone = args.data['phone'];
                }
            });

            $scope.formatValue = function(value) {
                if (value.indexOf('$') < 0) {
                    value = value.substring(1, value.length - 1);
                    value = $filter('number')(value * 1, 2);
                    $scope.product.cost = '$' + value;
                }
            };

            $scope.addPhoto = function () {
                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    saveToPhotoAlbum: false
                };

                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Take Photo'},
                        {text: 'Choose Photo'}
                    ],
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code..
                        hideSheet();
                    },
                    buttonClicked: function (index) {
                        if (index === 0) {
                            options.sourceType = Camera.PictureSourceType.CAMERA;
                        } else if (index == 1) {
                            options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            console.log('get-image-success');
                            var imgURI = "data:image/jpeg;base64," + imageData;
                            $scope.product.photos.push(imgURI);
                        }, function (err) {
                            console.log('get-image-err:', err);
                        });

                        hideSheet();
                        return true;
                    }
                });
            };

            $scope.addProduct = function () {
                if (typeof $scope.product.distributorKey == "undefined") {
                    alert ("You have to choose one distributor");
                    return;
                }

                $ionicLoading.show();

                ProductService.addProduct($scope.product).then(function (res) {
                    $ionicLoading.hide();
                    alert('Product is added successfully!');
                    console.log(res.path.o[1]);
                    var productKey = res.path.o[1];
                    if (clientKey) {
                        var client = UserService.findUser(clientKey);
                        client.$loaded().then(function(res) {
                            var products = client.products;
                            if (typeof  products == 'undefined') {
                                products = {};
                            }
                            products[productKey] = 1;
                            client.products = products;
                            client.$save();
                        }).catch(function(err) {
                            console.log(err);
                        });
                    }

                    var localStore = Auth.getStore();

                    if (typeof localStore.products == "undefined") {
                        localStore.products = {};
                    }
                    localStore.products[productKey] = true;
                    Auth.setStore(localStore);

                    var store = StoreService.findStore(localStore.$id);
                    store.$loaded().then(function(res) {
                        if (typeof store.products == "undefined") {
                            store.products = {};
                        }
                        store.products[productKey] = true;
                        store.$save();
                    }, function(err) {
                        console.log(err);
                    });

                    var distributor = UserService.findUser($scope.product.distributorKey);
                    distributor.$loaded().then(function(res) {
                        if (typeof distributor.products == "undefined") {
                            distributor.products = {};
                        }
                        distributor.products[productKey] = true;
                        distributor.$save();
                    }, function(err) {
                        console.log(err);
                    });

                    init();

                }, function (err) {
                    $ionicLoading.hide();
                });
            };

            $scope.getPrice = function () {
                return ($scope.product.cost * 1) + ($scope.product.cost * 1) * ($scope.product.markup * 1 / 100);
            }
        }])

    .controller('menuCtrl', ['$scope', '$stateParams', 'Auth', '$state', '$ionicSideMenuDelegate', '$ionicHistory', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams, Auth, $state, $ionicSideMenuDelegate, $ionicHistory) {

            $scope.user = {
                type: 0
            };

            if (Auth.isLoggedIn()) {
                $scope.user = Auth.getUser();
            }

            $scope.$on('user-logged-in', function () {
                $scope.user = Auth.getUser();
            });

            $scope.signOut = function () {
                Auth.logout();
                $state.go('menu.login');
                $ionicSideMenuDelegate.toggleLeft();
            }
        }])

    .controller('loginCtrl', ['$scope', '$stateParams', 'AuthService', '$state', '$rootScope', 'Auth', '$ionicHistory', 'StoreService',
        function ($scope, $stateParams, AuthService, $state, $rootScope, Auth, $ionicHistory, StoreService) {

            $scope.authData = {
                email: '',
                password: ''
            };

            $scope.doLogin = function () {
                AuthService.doLogin($scope.authData).then(function (res) {

                    var user = res.user;
                    Auth.setUser(res.user);

                    if (user.type != 4) {
                        if (user.mainStore) {
                            var store = StoreService.findStore(res.user.mainStore);

                            store.$loaded().then(function(res) {
                                Auth.setStore(store);
                            }, function(err) {
                                console.log(err);
                            });
                        }
                    }

                    $rootScope.$broadcast('user-logged-in');

                    // var history = $ionicHistory.viewHistory();
                    // var backCount = 0;

                    // console.log(history);

                    // for (var i = history.views.length - 1; i >= 0; i --) {
                    //     backCount --;
                    //     var view = history.views[i];
                    //     if (view.stateName == 'menu.home') break;
                    // }

                    if (user.type == 7) {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('menu.clientOrderList');
                    }else if (user.type == 4) {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('menu.distributorControlPanel');
                    }else {
                        if ($ionicHistory.enabledBack()) {
                            $ionicHistory.goBack(-1);
                        }else {
                            $ionicHistory.nextViewOptions({
                                historyRoot: true
                            });
                            $state.go('menu.floorManager');
                        }
                    }

                }, function (err) {
                    alert(err.msg);
                })
            }
        }
    ])

    .controller('signupCtrl', ['$scope', '$stateParams', 'AuthService', 'Auth', '$state', 'StoreService', '$rootScope', '$ionicLoading', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams, AuthService, Auth, $state, StoreService, $rootScope, $ionicLoading) {

            $scope.userTypes = [
                {
                    name: "NEX-GEN Employees",
                    value: 5
                },
                {
                    name: "Client",
                    value: 7
                },
                {
                    name: "Store Owner",
                    value: 1
                },
                {
                    name: "Store Manager",
                    value: 2
                },
                {
                    name: "Store Sales",
                    value: 3
                },
                {
                    name: "Distributor",
                    value: 4
                },
                {
                    name: "Contractor",
                    value: 6
                }
            ];


            function init() {
                $scope.authData = {
                    name: '',
                    email: '',
                    type: 1,
                    password: '',
                    stores: {}
                };
                $scope.userType = $scope.userTypes[0];

                var stores = StoreService.stores;
                $scope.stores = [];
                $ionicLoading.show();
                $scope.mainStore = {};

                stores.$loaded().then(function(res) {
                    $ionicLoading.hide();
                    for (var i = 0; i < stores.length; i ++) {
                        $scope.stores.push(stores[i]);
                    }
                    $scope.mainStore = stores[0];
                    $scope.authData.mainStore = $scope.mainStore.$id;
                    $scope.authData.stores[$scope.mainStore.$id] = true;
                }, function(err) {
                    console.log(err);
                });
            }

            init();

            $scope.updateUserType = function (obj) {
                $scope.userType = obj;
                console.log(obj);
            };

            $scope.updateUserStore = function(store) {
                $scope.authData.mainStore = store.$id;
                $scope.authData.stores = {};
                $scope.authData.stores[store.$id] = true;
            };

            $scope.doSignUp = function () {

                $scope.authData.type = $scope.userType.value;

                AuthService.doSignUp($scope.authData).then(function (res) {
                    alert('Your account has been created successfully!');


                    var userKey = res.user.$id;
                    var store = StoreService.findStore($scope.authData.mainStore);

                    store.$loaded().then(function(res) {
                        if (typeof store.users == "undefined") {
                            store.users = {};
                        }
                        store.users[userKey] = true;
                        store.$save();
                    }, function(err) {
                        console.log(err);
                    });

                    $state.go('menu.login');
                }, function (err) {
                    alert(err.msg);
                })
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.signup') {
                        init();
                    }
                });
        }])

    .controller('productDetailCtrl', ['$scope', '$stateParams', 'ProductService', '$rootScope', '$state', 'UserService',
        function ($scope, $stateParams, ProductService, $rootScope, $state, UserService) {

            var key = $stateParams.key;

            function init() {
                $scope.product = ProductService.findProduct(key);
                $scope.quantity = 1;
                $scope.is_added = false;
                $scope.showShipping = false;

                if ($stateParams.clientKey) {
                    var clientKey = $stateParams.clientKey;
                    var client = UserService.findUser(clientKey);
                    client.$loaded().then(function(res) {
                        var products = client.products;
                        if (typeof products == "undefined") return;
                        if (typeof products[key] != 'undefined') {
                            $scope.is_added = true;
                            $scope.quantity = products[key];
                        }
                    }).catch(function(err) {
                        console.log(err);
                    });
                }
            }

            init();

            $scope.updateQuantity = function() {
                var clientKey = $stateParams.clientKey;
                var client = UserService.findUser(clientKey);
                client.$loaded().then(function(res) {
                    var products = client.products;
                    if (typeof  products == 'undefined') {
                        products = {};
                    }
                    products[key] = $scope.quantity;
                    client.products = products;
                    client.$save();
                    alert ('Quantity is updated!');
                }).catch(function(err) {
                    console.log(err);
                });
            };

            $scope.addToClient = function() {
                if ($stateParams.clientKey) {
                    var clientKey = $stateParams.clientKey;
                    var client = UserService.findUser(clientKey);
                    client.$loaded().then(function(res) {
                        var products = client.products;
                        if (typeof  products == 'undefined') {
                            products = {};
                        }
                        products[key] = $scope.quantity;
                        client.products = products;
                        client.$save();
                        alert ('Product is added to client');
                    }).catch(function(err) {
                        console.log(err);
                    });
                }else {
                    $rootScope.productQuantity = $scope.quantity;
                    $state.go('menu.addProductToClient', {key: key});
                }
            };

            $scope.increaseQuantity = function(value) {
                $scope.quantity  = value + 1;
            };

            $scope.decreaseQuantity = function(value) {
                $scope.quantity = value - 1;
            };

            $scope.addToStore = function () {
                $rootScope.addedProduct = $scope.product;
                $state.go('menu.stores');
            };

            $scope.editProduct = function() {
                $state.go('menu.productEdit', {key: key});
            };


            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.productDetail') {
                        init();
                    }
                });
        }])

    .controller('productEditCtrl', ['$scope', '$stateParams', 'ProductService', '$rootScope', '$state', 'UserService', '$ionicActionSheet', '$cordovaCamera', 'Auth', 'ProjectService', 'MaterialService', 'DistributorService', 'StoreService',
        function ($scope, $stateParams, ProductService, $rootScope, $state, UserService, $ionicLoading, $cordovaCamera, Auth, ProjectService, MaterialService, DistributorService, StoreService) {

            var key = $stateParams.key;
            $scope.product = ProductService.findProduct(key);

            function init() {
                $scope.perArray = [{
                    name: 'SQ.FT.',
                    value: 'SQ.FT.'
                }, {
                    name: 'SQ.INCH',
                    value: 'SQ.INCH'
                }, {
                    name: 'BUNDLE',
                    value: 'BUNDLE'
                }];
                $scope.user = Auth.getUser();
                $scope.distributors = DistributorService.distributors;
                $scope.price = 0;
                $scope.projects = ProjectService.projects;
                $scope.materials = MaterialService.materials;

                $scope.materials.$loaded().then(function(res) {
                    for (var i = 0; i < $scope.materials.length; i ++) {
                        if ($scope.materials[i].name == $scope.product.material.name) {
                            $scope.product.material = $scope.materials[i];
                            break;
                        }
                    }
                });

                $scope.projects.$loaded().then(function(res) {
                    for (var i = 0; i < $scope.projects.length; i ++) {
                        if ($scope.product.project.name == $scope.projects[i].name) {
                            $scope.product.project = $scope.projects[i];
                            break;
                        }
                    }
                });
            }

            init();

            $scope.$on('selected-autocomplete', function (event, args) {
                if (Object.keys(args.data).length > 0) {
                    $scope.product.phone = args.data['phone'];
                }
            });


            $scope.addPhoto = function () {
                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    saveToPhotoAlbum: false
                };

                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Take Photo'},
                        {text: 'Choose Photo'}
                    ],
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code..
                        hideSheet();
                    },
                    buttonClicked: function (index) {
                        if (index === 0) {
                            options.sourceType = Camera.PictureSourceType.CAMERA;
                        } else if (index == 1) {
                            options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            console.log('get-image-success');
                            var imgURI = "data:image/jpeg;base64," + imageData;
                            $scope.product.photos.push(imgURI);
                        }, function (err) {
                            console.log('get-image-err:', err);
                        });

                        hideSheet();
                        return true;
                    }
                });
            };

            $scope.updateProduct = function () {
                DistributorService.addDistributor($scope.product.distributor, $scope.product.phone);
                $scope.product.$save().then(function(res) {
                    alert('Product is updated successfully!');
                }, function(err) {
                });
            };

            $scope.getPrice = function () {
                return ($scope.product.cost * 1) + ($scope.product.cost * 1) * ($scope.product.markup * 1 / 100);
            };

        }])

    .controller('clientListCtrl', ['StoreService', '$scope', '$stateParams', 'UserService', '$ionicLoading', 'Auth', '$rootScope',
        function (StoreService, $scope, $stateParams, UserService, $ionicLoading, Auth, $rootScope) {


            var loadCount = 0;

            function loadClient(clientKey, clientCount) {
                var client = UserService.findUser(clientKey);

                client.$loaded().then(function(res) {
                    $scope.clients.push(client);
                    loadCount ++;
                    if (loadCount == clientCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                var localStore = Auth.getStore();
                $scope.clients = [];

                var store = StoreService.findStore(localStore.$id);

                $ionicLoading.show();

                store.$loaded().then(function(res) {
                    if (typeof store.clients != "undefined") {
                        var clientKeys = Object.keys(store.clients);

                        loadCount = 0;

                        if (clientKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < clientKeys.length; i ++) {
                            loadClient(clientKeys[i], clientKeys.length);
                        }
                    }else {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });

            }

            init();

            $scope.getProjectNames = function (projects) {
                var names = "";

                if (typeof projects == "undefined") return "";

                for (var i = 0; i < projects.length; i++) {
                    if (names.length > 0) names = names + ", ";
                    names += projects[i].name;
                }

                return names;
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.clientList') {
                        init();
                    }
                });

        }])

    .controller('distributorListCtrl', ['StoreService', '$scope', '$stateParams', 'UserService', '$ionicLoading', 'Auth', '$rootScope',
        function (StoreService, $scope, $stateParams, UserService, $ionicLoading, Auth, $rootScope) {


            var loadCount = 0;

            function loadDistributor(distributorKey, distributorCount) {
                var distributor = UserService.findUser(distributorKey);

                distributor.$loaded().then(function(res) {
                    if (typeof distributor.photo == 'undefined') {
                        distributor.photo = "img/TRjIh5RTXOIXnGdRizDg_images.png";
                    }
                    $scope.distributors.push(distributor);
                    loadCount ++;
                    if (loadCount == distributorCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                var localStore = Auth.getStore();
                $scope.distributors = [];

                var store = StoreService.findStore(localStore.$id);

                $ionicLoading.show();

                store.$loaded().then(function(res) {
                    if (typeof store.distributors != "undefined") {
                        var distributorKeys = Object.keys(store.distributors);

                        loadCount = 0;

                        if (distributorKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < distributorKeys.length; i ++) {
                            loadDistributor(distributorKeys[i], distributorKeys.length);
                        }
                    }else {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });

            }

            init();

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.distributorList') {
                        init();
                    }
                });

        }])

    .controller('orderListCtrl', ['StoreService', '$scope', '$stateParams', 'UserService', '$ionicLoading', 'Auth', '$rootScope', '$state', 'OrderService',
        function (StoreService, $scope, $stateParams, UserService, $ionicLoading, Auth, $rootScope, $state, OrderService) {

            var loadCount = 0;

            function loadOrder(orderKey) {
                var order = OrderService.findOrder(orderKey);

                order.$loaded().then(function(res) {
                    $scope.orders.push(order);
                }, function(err) {
                    console.log(err);
                })
            }

            function loadClient(clientKey, clientCount) {
                var client = UserService.findUser(clientKey);

                client.$loaded().then(function(res) {
                    $scope.clients.push(client);

                    loadCount ++;
                    if (loadCount == clientCount) {
                        $ionicLoading.hide();
                    }

                    var orders = client.orders;
                    if (typeof orders == "undefined") {
                        return;
                    }

                    var orderKeys = Object.keys(orders);

                    for (var i = 0; i < orderKeys.length; i ++) {
                        loadOrder(orderKeys[i]);
                    }


                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                var localStore = Auth.getStore();
                $scope.clients = [];
                $scope.orders = [];

                var store = StoreService.findStore(localStore.$id);

                $ionicLoading.show();

                store.$loaded().then(function(res) {
                    if (typeof store.clients != "undefined") {
                        var clientKeys = Object.keys(store.clients);

                        loadCount = 0;

                        if (clientKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < clientKeys.length; i ++) {
                            loadClient(clientKeys[i], clientKeys.length);
                        }
                    }else {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });

            }

            init();

            $scope.viewOrder = function(order) {
                $state.go('menu.orderDetail', {key: order.$id});
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.orderList') {
                        init();
                    }
                });

        }])

    .controller('clientOrderListCtrl', ['StoreService', '$scope', '$stateParams', 'UserService', '$ionicLoading', 'Auth', '$rootScope', '$state', 'OrderService',
        function (StoreService, $scope, $stateParams, UserService, $ionicLoading, Auth, $rootScope, $state, OrderService) {

            var loadCount = 0;

            function loadOrder(orderKey, orderCount) {
                var order = OrderService.findOrder(orderKey);

                order.$loaded().then(function(res) {
                    $scope.orders.push(order);

                    loadCount ++;
                    if (loadCount == orderCount) {
                        $ionicLoading.hide();
                    }

                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                var authUser = Auth.getUser();
                $scope.orders = [];

                $ionicLoading.show();

                var client = UserService.findUser(authUser.$id);
                loadCount = 0;

                client.$loaded().then(function(res) {

                    var orders = client.orders;
                    if (typeof orders == "undefined") {
                        $ionicLoading.hide();
                        return;
                    }

                    var orderKeys = Object.keys(orders);

                    for (var i = 0; i < orderKeys.length; i ++) {
                        loadOrder(orderKeys[i], orderKeys.length);
                    }


                }, function(err) {
                    console.log(err);
                })

            }

            init();

            $scope.viewOrder = function(order) {
                $state.go('menu.orderDetail', {key: order.$id});
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.clientOrderList') {
                        init();
                    }
                });

        }])

    .controller('addProductToClientCtrl', ['$scope', '$stateParams', 'UserService', '$ionicLoading', '$rootScope', 'StoreService', 'Auth',
        function ($scope, $stateParams, UserService, $ionicLoading, $rootScope, StoreService, Auth) {

            var loadCount = 0;

            function loadClient(clientKey, clientCount) {
                var client = UserService.findUser(clientKey);

                client.$loaded().then(function(res) {
                    client.is_selected = false;
                    $scope.clients.push(client);
                    loadCount ++;
                    if (loadCount == clientCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });


                var localStore = Auth.getStore();
                $scope.clients = [];

                var store = StoreService.findStore(localStore.$id);

                $ionicLoading.show();

                store.$loaded().then(function (res) {
                    if (typeof store.clients != "undefined") {
                        var clientKeys = Object.keys(store.clients);

                        loadCount = 0;

                        if (clientKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < clientKeys.length; i++) {
                            loadClient(clientKeys[i], clientKeys.length);
                        }
                    } else {
                        $ionicLoading.hide();
                    }
                }, function (err) {
                    $ionicLoading.hide();
                    console.log(err);
                });
            }

            init();

            $scope.selectClient = function(client) {
                client.is_selected = !client.is_selected;
            };

            $scope.addToClient = function() {
                var selectedCount = 0;
                for (var i = 0; i < $scope.clients.length; i ++) {
                    if ($scope.clients[i].is_selected) {
                        selectedCount ++;
                        var clientKey = $scope.clients[i].$id;
                        var productKey = $stateParams.key;

                        var client = UserService.findUser(clientKey);
                        client.$loaded().then(function(res) {
                            var products = client.products;
                            if (typeof  products == 'undefined') {
                                products = {};
                            }
                            if (products.hasOwnProperty(productKey)) {
                                products[productKey] += $rootScope.productQuantity;
                            }else {
                                products[productKey] = $rootScope.productQuantity;
                            }

                            client.products = products;
                            client.$save();
                            client.is_selected = true;
                        }).catch(function(err) {
                            console.log(err);
                        });
                    }
                }
                if (selectedCount) {
                    alert ('Product is added to client');
                }
            };

            $scope.getProjectNames = function (projects) {
                var names = "";

                if (typeof projects == "undefined") return "";

                for (var i = 0; i < projects.length; i++) {
                    if (names.length > 0) names = names + ", ";
                    names += projects[i].name;
                }

                return names;
            }

        }])

    .controller('productIstCtrl', ['StoreService', '$scope', '$stateParams', 'ProductService', '$ionicLoading', 'MaterialService', 'ProjectService', 'PdfService', 'QRCode', '$ionicModal', 'ionicToast', '$cordovaFile', '$state', 'Auth', '$rootScope',
        function (StoreService, $scope, $stateParams, ProductService, $ionicLoading, MaterialService, ProjectService, PdfService, QRCode, $ionicModal, ionicToast, $cordovaFile, $state, Auth, $rootScope) {

            var loadCount = 0;

            function createDocumentDefinition(products) {

                var tableBody = [];

                for (var i = 0; i < products.length; i ++) {
                    if (i % 3 == 0) {
                        tableBody.push([]);
                    }
                    tableBody[tableBody.length - 1].push({
                        table: {
                            body: [
                                [
                                    [
                                        {
                                            text: 'Product ' + (i + 1),
                                            alignment: 'center'
                                        },
                                        {
                                            image: QRCode.generate(products[i].$id),
                                            width: 120,
                                            height: 120,
                                            margin: [16, 5, 16, 0]
                                        },
                                        {
                                            text: products[i].name.length == 0 ? ' ' : products[i].name,
                                            alignment: 'center',
                                            marginTop: 10,
                                            fontSize: 14
                                        }
                                    ]
                                ]
                            ]
                        },
                        border: [false, false, false, false]
                    });
                }

                if (tableBody[tableBody.length - 1].length < 3) {
                    for (var i = tableBody[tableBody.length - 1].length; i < 3; i ++) {
                        tableBody[tableBody.length - 1].push({
                            text: '',
                            border: [false, false, false, false]
                        });
                    }
                }

                console.log(tableBody);

                var dd = {
                    content: [
                        {text: 'Product List', style: 'header'},

                        {
                            style: 'itemsTable',
                            table: {
                                dontBreakRows: true,
                                body: tableBody
                            },
                            layout: {
                                paddingTop: function(node, i) {return 5;}
                            }
                        }
                    ],
                    styles: {
                        header: {
                            fontSize: 20,
                            bold: true,
                            margin: [0, 0, 0, 10],
                            alignment: 'left'
                        },
                        itemsTable: {
                            margin: [0, 5, 0, 15]
                        },
                        itemsTableHeader: {
                            bold: true,
                            fontSize: 13,
                            color: 'black'
                        }
                    }
                }

                return dd;
            }

            function loadProduct(productKey, productCount) {
                var product = ProductService.findProduct(productKey);
                product.$loaded().then(function(res) {
                    $scope.products.push(product);
                    loadCount ++;
                    if (loadCount == productCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                    $ionicLoading.hide();
                })
            }

            function init() {
                $scope.showOptions = false;
                $scope.material = {};
                $scope.project = {};
                $scope.searchText = '';
                $scope.results = [];

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                var localStore = Auth.getStore();
                $scope.products = [];

                var store = StoreService.findStore(localStore.$id);

                $ionicLoading.show();
                store.$loaded().then(function(res) {
                    if (typeof store.products != "undefined") {
                        var productKeys = Object.keys(store.products);

                        loadCount = 0;

                        if (productKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < productKeys.length; i ++) {
                            loadProduct(productKeys[i], productKeys.length);
                        }
                    }else {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });

                $scope.materials = MaterialService.materials;
                $scope.projects = ProjectService.projects;
                $scope.results = $scope.products;

                $scope.projects.$loaded().then(function (res) {
                    $scope.projects.splice(0, 0, {
                        $id: 0,
                        name: 'All Projects'
                    });
                    $scope.project = $scope.projects[0];
                }).catch(function (err) {
                    console.log(err);
                })

                $scope.materials.$loaded().then(function (res) {
                    $scope.materials.splice(0, 0, {
                        $id: 0,
                        name: 'All Materials'
                    });
                    $scope.material = $scope.materials[0];
                }).catch(function (err) {
                    console.log(err);
                });
            }

            init();

            $scope.addNewProduct = function() {
                if ($stateParams.key) {
                    $state.go('menu.addProduct', {key: $stateParams.key});
                }else {
                    $state.go('menu.addProduct');
                }
            }

            $scope.updateSearchText = function (value) {
                $scope.searchText = value;
                $scope.reloadProducts();
            }

            $scope.updateProject = function (project) {
                $scope.project = project;
                $scope.reloadProducts();
            }

            $scope.updateMaterial = function (material) {
                $scope.material = material;
                $scope.reloadProducts();
            }

            $scope.showFilterOptions = function () {
                $scope.showOptions = !$scope.showOptions;
            }

            $scope.reloadProducts = function () {
                $scope.results = [];
                for (var i = 0; i < $scope.products.length; i++) {

                    var product = $scope.products[i];
                    is_available = true;

                    if ($scope.searchText !== '') {
                        if (product.name.indexOf($scope.searchText) < 0) {
                            continue;
                        }
                    }

                    if (typeof $scope.project.name !== "undefined" && $scope.project.$id !== 0) {
                        if (typeof product.project == "undefined") continue;
                        if (product.project.name !== $scope.project.name) continue;
                    }

                    if (typeof $scope.material.name !== "undefined" && $scope.material.$id !== 0) {
                        if (typeof product.material == "undefined") continue;
                        if (product.material.name !== $scope.material.name) continue;
                    }

                    $scope.results.push(product);
                }
            }

            $scope.viewProductDetail = function(product) {
                if ($stateParams.key) {
                    $state.go('menu.productDetail', {key: product.$id, clientKey: $stateParams.key});
                }else {
                    $state.go('menu.productDetail', {key: product.$id});
                }
            }

            $scope.downloadPDF = function() {
                $ionicLoading.show();

                PdfService.createPdf(createDocumentDefinition($scope.products), 'product_list').then(function(res) {
                    $ionicLoading.hide();
                    ionicToast.show(res + ' created successfully!', 'top', true, 2500);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $scope.sendEmail = function() {
                $ionicLoading.show();
                var pathFile;

                if (ionic.Platform.isIOS()) {
                    pathFile = cordova.file.documentsDirectory;
                }else {
                    pathFile = cordova.file.externalRootDirectory;
                }

                PdfService.createPdf(createDocumentDefinition($scope.products), 'product_list').then(function(res) {
                    $ionicLoading.hide();

                    console.log(pathFile);
                    console.log(res);

                    $cordovaFile.checkFile(pathFile, res.substring(1)).then(function(success) {
                        console.log('file-exist');
                    }, function(error) {
                        console.log('wrong path');
                    });

                    window.plugin.email.open({
                        attachments: [pathFile + res.substring(1)],
                        isHtml: true
                    }, function() {
                        console.log('email view dismissed');
                    }, this);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.productIst') {
                        init();
                    }
                });

        }])

    .controller('clientProductListCtrl', ['$scope', '$stateParams', 'ProductService', '$ionicLoading', 'MaterialService', 'ProjectService', 'PdfService', 'QRCode', '$ionicModal', 'ionicToast', '$cordovaFile', '$state', '$rootScope', 'UserService',
        function ($scope, $stateParams, ProductService, $ionicLoading, MaterialService, ProjectService, PdfService, QRCode, $ionicModal, ionicToast, $cordovaFile, $state, $rootScope, UserService) {

            var clientKey = $stateParams.key;

            function createDocumentDefinition(products) {

                var items = products.map(function(item) {
                    return [
                        item.name,
                        (item.cost * 1) * (item.markup * 1) / 100,
                        item.is_available ? 'Available' : 'Unavailable',
                        {
                            image: QRCode.generate(item.$id)
                        }
                    ]
                });

                var dd = {
                    content: [
                        {text: 'Product List', style: 'header'},

                        {
                            style: 'itemsTable',
                            table: {
                                width: ['*', '*', '*', 200],
                                body: [
                                    [
                                        {text: 'Name', style: 'itemsTableHeader'},
                                        {text: 'Price', style: 'itemsTableHeader'},
                                        {text: 'Status', style: 'itemsTableHeader'},
                                        {text: 'QRCode', style: 'itemsTableHeader'}
                                    ]
                                ].concat(items)
                            }
                        }
                    ],
                    styles: {
                        header: {
                            fontSize: 20,
                            bold: true,
                            margin: [0, 0, 0, 10],
                            alignment: 'left'
                        },
                        itemsTable: {
                            margin: [0, 5, 0, 15]
                        },
                        itemsTableHeader: {
                            bold: true,
                            fontSize: 13,
                            color: 'black'
                        }
                    }
                }

                return dd;
            }

            function loadProduct(product) {
                product.$loaded().then(function (res) {
                    $scope.products.push(product);
                    $scope.results.push(product);
                }).catch(function (error) {
                    console.log(error);
                });
            }

            function init() {
                $scope.showOptions = false;
                $scope.material = {};
                $scope.project = {};
                $scope.searchText = '';
                $scope.results = [];

                $scope.clientKey = clientKey;
                var productLoadCount = 0;

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });
                $scope.materials = MaterialService.materials;
                $scope.projects = ProjectService.projects;
                $scope.results = $scope.products;

                $scope.projects.$loaded().then(function (res) {
                    $scope.projects.splice(0, 0, {
                        $id: 0,
                        name: 'All Projects'
                    });
                    $scope.project = $scope.projects[0];
                }).catch(function (err) {
                    console.log(err);
                });

                $scope.materials.$loaded().then(function (res) {
                    $scope.materials.splice(0, 0, {
                        $id: 0,
                        name: 'All Materials'
                    });
                    $scope.material = $scope.materials[0];
                }).catch(function (err) {
                    console.log(err);
                });

                ProductService.clientProducts(clientKey).then(function(result) {
                    var clientProducts = result;

                    console.log(clientProducts);
                    $scope.products = [];
                    $scope.results = [];

                    // if (clientProducts.length == 0) {
                    //     $ionicLoading.hide();
                    // }

                    $ionicLoading.hide();

                    for (var i = 0; i < clientProducts.length; i ++) {
                        var product = clientProducts[i];
                        loadProduct(product);

                        // $scope.products.push(product);
                        //
                        // product.$loaded().then(function (res) {
                        //     productLoadCount ++;
                        //     if (productLoadCount == clientProducts.length) {
                        //         $ionicLoading.hide();
                        //     }
                        // }).catch(function (error) {
                        //     console.log(error);
                        // });
                    }
                });
            }

            init();

            $scope.removeProduct = function(product, index) {
                var client = UserService.findUser(clientKey);
                client.$loaded().then(function(res) {
                    var products = client.products;
                    delete products[product.$id];
                    client.products = products;
                    client.$save();
                    $scope.results.splice(index, 1);
                    for (var i = 0; i < $scope.products.length; i ++) {
                        if ($scope.products[i].$id == product.$id) {
                            $scope.products.splice(i, 1);
                            break;
                        }
                    }
                    alert ('Product is removed!');
                }).catch(function(err) {
                    console.log(err);
                });
            };

            $scope.addProduct = function() {
                $state.go('menu.productIst', {key: clientKey});
            };

            $scope.updateSearchText = function (value) {
                $scope.searchText = value;
                $scope.reloadProducts();
            };

            $scope.updateProject = function (project) {
                $scope.project = project;
                $scope.reloadProducts();
            };

            $scope.updateMaterial = function (material) {
                $scope.material = material;
                $scope.reloadProducts();
            };

            $scope.showFilterOptions = function () {
                $scope.showOptions = !$scope.showOptions;
            };

            $scope.reloadProducts = function () {
                $scope.results = [];
                for (var i = 0; i < $scope.products.length; i++) {

                    var product = $scope.products[i];
                    is_available = true;

                    if ($scope.searchText !== '') {
                        if (product.name.indexOf($scope.searchText) < 0) {
                            continue;
                        }
                    }

                    if (typeof $scope.project.name !== "undefined" && $scope.project.$id !== 0) {
                        if (typeof product.project == "undefined") continue;
                        if (product.project.name !== $scope.project.name) continue;
                    }

                    if (typeof $scope.material.name !== "undefined" && $scope.material.$id !== 0) {
                        if (typeof product.material == "undefined") continue;
                        if (product.material.name !== $scope.material.name) continue;
                    }

                    $scope.results.push(product);
                }
            }

            $scope.downloadPDF = function() {
                $ionicLoading.show();

                PdfService.createPdf(createDocumentDefinition($scope.products), 'product_list').then(function(res) {
                    $ionicLoading.hide();
                    ionicToast.show(res + ' created successfully!', 'top', true, 2500);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $scope.sendEmail = function() {
                $ionicLoading.show();
                var pathFile;

                if (ionic.Platform.isIOS()) {
                    pathFile = cordova.file.documentsDirectory;
                }else {
                    pathFile = cordova.file.externalRootDirectory;
                }

                PdfService.createPdf(createDocumentDefinition($scope.products), 'product_list').then(function(res) {
                    $ionicLoading.hide();

                    console.log(pathFile);
                    console.log(res);

                    $cordovaFile.checkFile(pathFile, res.substring(1)).then(function(success) {
                        console.log('file-exist');
                    }, function(error) {
                        console.log('wrong path');
                    });

                    window.plugin.email.open({
                        attachments: [pathFile + res.substring(1)],
                        isHtml: true
                    }, function() {
                        console.log('email view dismissed');
                    }, this);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.clientProductList') {
                        init();
                    }
                });

        }])

    .controller('localStoreInventoryCtrl', ['$scope', '$stateParams', 'ProductService', '$ionicLoading', 'MaterialService', 'ProjectService', 'StoreService',
        function ($scope, $stateParams, ProductService, $ionicLoading, MaterialService, ProjectService, StoreService) {


            var storeKey = $stateParams.key;
            var loadCount = 0;

            function loadProduct(productKey, productCount) {
                var product = ProductService.findProduct(productKey);
                product.$loaded().then(function(res) {
                    $scope.products.push(product);
                    loadCount ++;
                    if (loadCount == productCount) {
                        $ionicLoading.hide();
                        $scope.results = $scope.products;
                    }
                }, function(err) {
                    console.log(err);
                });
            }

            function init() {
                $scope.showOptions = false;
                $scope.material = {};
                $scope.project = {};
                $scope.searchText = '';
                $scope.results = [];
                $scope.products = [];

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });

                $scope.store = StoreService.findStore(storeKey);
                $scope.store.$loaded().then(function(res) {

                    if (typeof $scope.store.photo == "undefined") {
                        $scope.store.photo = "img/thumbnail-img.png";
                    }

                    var products = $scope.store.products;

                    if (typeof products == "undefined") {
                        $ionicLoading.hide();
                        return;
                    }

                    var productKeys = Object.keys(products);
                    loadCount = 0;

                    for (var i = 0; i < productKeys.length; i ++) {
                        loadProduct(productKeys[i], productKeys.length);
                    }

                }, function(err) {
                    console.log(err);
                });

                $scope.materials = MaterialService.materials;
                $scope.projects = ProjectService.projects;

                $scope.projects.$loaded().then(function (res) {
                    $scope.projects.splice(0, 0, {
                        $id: 0,
                        name: 'All Projects'
                    });
                    $scope.project = $scope.projects[0];
                }).catch(function (err) {
                    console.log(err);
                })

                $scope.materials.$loaded().then(function (res) {
                    $scope.materials.splice(0, 0, {
                        $id: 0,
                        name: 'All Materials'
                    });
                    $scope.material = $scope.materials[0];
                }).catch(function (err) {
                    console.log(err);
                });
            }

            init();

            $scope.updateSearchText = function (value) {
                $scope.searchText = value;
                $scope.reloadProducts();
            }

            $scope.updateProject = function (project) {
                $scope.project = project;
                $scope.reloadProducts();
            }

            $scope.updateMaterial = function (material) {
                $scope.material = material;
                $scope.reloadProducts();
            }

            $scope.showFilterOptions = function () {
                $scope.showOptions = !$scope.showOptions;
            }

            $scope.reloadProducts = function () {
                $scope.results = [];
                for (var i = 0; i < $scope.products.length; i++) {

                    var product = $scope.products[i];
                    is_available = true;

                    if ($scope.searchText !== '') {
                        if (product.name.indexOf($scope.searchText) < 0) {
                            continue;
                        }
                    }

                    if (typeof $scope.project.name !== "undefined" && $scope.project.$id !== 0) {
                        if (typeof product.project == "undefined") continue;
                        if (product.project.name !== $scope.project.name) continue;
                    }

                    if (typeof $scope.material.name !== "undefined" && $scope.material.$id !== 0) {
                        if (typeof product.material == "undefined") continue;
                        if (product.material.name !== $scope.material.name) continue;
                    }

                    $scope.results.push(product);
                }
            }
        }])

    .controller('topManufacturersCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])

    .controller('settingsCtrl', ['$scope', '$stateParams', 'UserService', 'Auth', '$rootScope', 'StoreService', '$state', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams, UserService, Auth, $rootScope, StoreService, $state) {

            $scope.userTypes = [
                {
                    name: "NEX-GEN Employees",
                    value: 5
                },
                {
                    name: "Client",
                    value: 7
                },
                {
                    name: "Store Owner",
                    value: 1
                },
                {
                    name: "Store Manager",
                    value: 2
                },
                {
                    name: "Store Sales",
                    value: 3
                },
                {
                    name: "Distributor",
                    value: 4
                },
                {
                    name: "Contractor",
                    value: 6
                }
            ];

            function init() {
                var user = Auth.getUser();
                console.log(user.$id);
                $scope.user = UserService.findUser(user.$id);
                console.log($scope.user);

                var stores = StoreService.stores;
                $scope.stores = [];

                stores.$loaded().then(function (res) {
                    for (var i = 0; i < stores.length; i++) {
                        var store = stores[i];
                        if (typeof store.photo == "undefined") {
                            store.photo = "img/thumbnail-img.png";
                        }
                        $scope.stores.push(store);
                    }
                }).catch(function (err) {
                    console.log(err);
                });


                for (var i = 0; i < $scope.userTypes.length; i++) {
                    var userType = $scope.userTypes[i];
                    if (userType.value == user.type) {
                        $scope.userType = userType;
                    }
                }
            }

            init();

            $scope.updateUserType = function (obj) {
                $scope.userType = obj;
                console.log(obj);
            };

            $scope.viewStore = function (item) {
                $state.go('menu.storeProfile', {storeId: item.$id});
            };

            $scope.save = function () {

                $scope.user.type = $scope.userType.value;

                $scope.user.$save();

                Auth.setUser($scope.user);
                $rootScope.$broadcast('user-logged-in');
            }

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.settings') {
                        if (!Auth.isLoggedIn()) {
                            console.log('not-loggedin');
                            $state.go('menu.floorManager');
                        } else {
                            init();
                        }
                    }
                });
        }])

    .controller('storeListCtrl', ['$scope', '$stateParams', 'UserService', 'Auth', '$rootScope', 'StoreService', '$state', '$ionicLoading',
        function ($scope, $stateParams, UserService, Auth, $rootScope, StoreService, $state, $ionicLoading) {

            function init() {

                var stores = StoreService.stores;
                $scope.stores = [];
                $ionicLoading.show();

                stores.$loaded().then(function (res) {
                    for (var i = 0; i < stores.length; i++) {
                        var store = stores[i];
                        if (typeof store.photo == "undefined") {
                            store.photo = "img/thumbnail-img.png";
                        }
                        $scope.stores.push(store);
                    }
                    $ionicLoading.hide();
                }).catch(function (err) {
                    console.log(err);
                });
            }

            init();

            $scope.viewStore = function (item) {
                $state.go('menu.storeProfile', {storeId: item.$id});
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.storeList') {
                        init();
                    }
                });
        }])

    .controller('clientDetailCtrl', ['$scope', '$stateParams', 'UserService', '$state', 'ProductService', '$ionicLoading', '$rootScope', 'OrderService',
        function ($scope, $stateParams, UserService, $state, ProductService, $ionicLoading, $rootScope, OrderService) {

            var key = $stateParams.key;
            var productLength = 0;
            var loadCount = 0;

            $scope.productTotalPrice = 0;
            $scope.orderTotalPrice = 0;

            function loadProduct(product) {
                product.$loaded().then(function (res) {
                    $scope.products.push(product);
                    $scope.results.push(product);
                    $scope.productTotalPrice += ((product.cost * 1) + (product.cost * 1) * (product.markup * 1) / 100) * ($scope.client.products[product.$id] * 1);
                    loadCount ++;
                    if (loadCount == productLength) {
                        $scope.productTotalPrice = '$' + $scope.productTotalPrice;
                        $ionicLoading.hide();
                    }
                }).catch(function (error) {
                    console.log(error);
                });
            }

            function loadOrder(orderKey) {
                var order = OrderService.findOrder(orderKey);
                order.$loaded().then(function(res) {
                    $scope.orderTotalPrice += order.price * 1;
                    $scope.orders.push(order);
                })
            }

            function init() {
                $ionicLoading.show();

                $scope.orders = [];

                $scope.client = UserService.findUser(key);

                $scope.client.$loaded().then(function(res) {
                    var orders = $scope.client.orders;

                    if (typeof orders == "undefined") {
                        $scope.orders = [];
                        return;
                    }

                    $scope.orderTotalPrice = 0;

                    var orderKeys = Object.keys(orders);
                    for (var i = 0; i < orderKeys.length; i ++) {
                        loadOrder(orderKeys[i]);
                    }
                });

                ProductService.clientProducts(key).then(function(result) {
                    var clientProducts = result;

                    $scope.products = [];
                    $scope.results = [];
                    $scope.productTotalPrice = 0;
                    loadCount = 0;

                    if (clientProducts.length == 0) {
                        $ionicLoading.hide();
                    }

                    productLength = clientProducts.length;

                    for (var i = 0; i < clientProducts.length; i ++) {
                        var product = clientProducts[i];
                        loadProduct(product);
                    }
                });
            }

            init();

            $scope.viewOrder = function(order) {
                $state.go('menu.orderDetail', {key: order.$id});
            };

            $scope.createOrder = function() {
                $state.go('menu.createOrder', {key: key});
            };

            $scope.editProduct = function() {
                $state.go('menu.clientProductList', {key: key});
            };

            $scope.editProject = function() {
                $state.go('menu.clientProjectList', {key: key});
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.clientDetail') {
                        init();
                    }
                });
        }])

    .controller('userListCtrl', ['$scope', '$stateParams', '$ionicLoading', 'StoreService', 'UserService',
        function($scope, $stateParams, $ionicLoading, StoreService, UserService) {
            var storeKey = $stateParams.key;

            function init() {
                $scope.users = [];
                $scope.results = [];
                $scope.searchText = '';

                $ionicLoading.show();

                var users = UserService.users;

                users.$loaded().then(function(res) {
                    $ionicLoading.hide();
                    for (var i = 0; i < users.length; i ++) {
                        var user = users[i];
                        if (user.type == 100) continue;
                        var userType = user.type;
                        switch (userType) {
                            case 1:
                                user.type = 'Owner';
                                break;
                            case 2:
                                user.type = 'Manager';
                                break;
                            case 3:
                                user.type = 'Sales';
                                break;
                            case 4:
                                user.type = 'Representative';
                                break;
                            default:
                                user.type = 'Employee';
                        }
                        user.selected = false;
                        $scope.users.push(user);
                    }
                    $scope.results = $scope.users;
                }).catch(function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });
            }

            init();


            function updateUser(userKey) {
                var user = UserService.findUser(userKey);
                user.$loaded().then(function(res) {
                    user.stores[storeKey] = true;
                    user.$save();
                }).catch(function(err) {
                    console.log(err);
                })
            }

            $scope.updateSearchText = function(value) {
                $scope.searchText = value;
                $scope.results = [];

                for (var i = 0; i < $scope.users.length; i ++) {
                    var user = $scope.users[i];
                    if (user.name.toLowerCase().indexOf(value.toLowerCase()) >= 0 || user.email.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                        $scope.results.push(user);
                    }
                }
            };


            $scope.associateUsers = function() {
                var store = StoreService.findStore(storeKey);
                store.$loaded().then(function(res) {
                    if (typeof store.users == "undefined") {
                        store.users = {};
                    }
                    var flag = false;
                    for (var i = 0; i < $scope.users.length; i ++) {
                        if (!$scope.users[i].selected) continue;
                        flag = true;
                        store.users[$scope.users[i].$id] = true;
                        updateUser($scope.users[i].$id);
                    }
                    store.$save();
                    if (flag) {
                        alert ('Users are associated to store');
                    }else {
                        alert ('You need to choose at least one user');
                    }
                }).catch(function(err) {
                    console.log(err);
                });
            };

            $scope.selectUser = function(user) {
                user.selected = !user.selected;
            }
        }])

    .controller('clientProjectListCtrl', ['$scope', '$stateParams', 'UserService', '$state', 'ProjectService', '$ionicLoading',
        function ($scope, $stateParams, UserService, $state, ProjectService, $ionicLoading) {

            var key = $stateParams.key;

            $scope.newProject = [];
            $scope.projects = ProjectService.projects;

            $scope.client = UserService.findUser(key);

            $scope.updateProjectType = function (obj, index) {
                $scope.newProject[index] = obj;
            };

            $scope.addProject = function () {
                $scope.newProject.push($scope.projects[0]);
            };

            $scope.deleteProject = function(index) {
                console.log(index);
                $scope.client.projects.splice(index, 1);
            };

            $scope.saveClient = function() {
                var projectNames = {};
                var projects = [];
                for (var i = 0; i < $scope.client.projects.length; i ++) {
                    projectNames[$scope.client.projects[i].name] = true;
                    projects.push($scope.client.projects[i]);
                }

                for (var i = 0; i < $scope.newProject.length; i ++) {
                    if (projectNames[$scope.newProject[i].name]) continue;
                    projects.push($scope.newProject[i]);
                }

                $scope.client.$loaded().then(function(res) {
                    $scope.client.projects = projects;
                    $scope.client.$save();
                });
            };

        }])

    .controller('orderDetailCtrl', ['$scope', '$stateParams', 'UserService', 'OrderService', '$ionicLoading', 'ProductService', 'PdfService', 'QRCode', 'ionicToast', '$cordovaFile', 'Auth', 'StoreService', 'OrderTrackersService', 'CommonService','$cordovaCamera', '$ionicActionSheet', '$rootScope', 'ionicDatePicker', 'ionicTimePicker',
        function ($scope, $stateParams, UserService, OrderService, $ionicLoading, ProductService, PdfService, QRCode, ionicToast, $cordovaFile, Auth, StoreService, OrderTrackersService, CommonService, $cordovaCamera, $ionicActionSheet, $rootScope, ionicDatePicker, ionicTimePicker) {

            var key = $stateParams.key;
            var loadCount = 0;

            function createDocumentDefinition(products) {

                var items = products.map(function(item) {
                    return [
                        {
                            image: item.photos[0],
                            width: 120,
                            height: 120,
                        },
                        item.name,
                        item.width + ' x ' + item.height,
                        $scope.order.products[item.$id],
                        item.coverage_area
                    ]
                });

                var dd = {
                    content: [

                        {text: 'Order: ' + $scope.order.$id , style: 'header'},

                        {text: 'Order Data', style: 'subheader'},

                        'Order Date: ' + $scope.order.created_at,
                        'Order Number: ' + $scope.order.$id,
                        'Sales Person Name: ' + $scope.user.name,
                        'Sales Person Email: ' + $scope.user.email,
                        'Store Number: ' + $scope.store.$id,
                        'Store Phone: ' + $scope.store.phone,
                        'Store Address:' + $scope.store.address,

                        {text: 'Client Info', style: 'subheader'},

                        'Name: ' + $scope.client.name,
                        'Phone: ' + $scope.client.phone,
                        'Address: ' + $scope.client.address,
                        'Email: ' + $scope.client.email,


                        {text: 'Product List', style: 'subheader'},

                        {
                            style: 'itemsTable',
                            table: {
                                width: ['*', '*', '*', '*', '*'],
                                body: [
                                    [
                                        {text: 'Photo', style: 'itemsTableHeader'},
                                        {text: 'Name', style: 'itemsTableHeader'},
                                        {text: 'Size', style: 'itemsTableHeader'},
                                        {text: 'Qty', style: 'itemsTableHeader'},
                                        {text: 'Coverage Area', style: 'itemsTableHeader'}
                                    ]
                                ].concat(items)
                            }
                        },

                        {text: 'Installer Info', style: 'subheader'},

                        'Company Name: ' + $scope.order.company_name,
                        'Technician Name: ' + $scope.order.technician_name,
                        'Technician Phone: ' + $scope.order.technician_phone,
                        'Installation Date: ' + $scope.order.installation_date,
                        'Installation Time: ' + $scope.order.installation_time,
                    ],
                    styles: {
                        header: {
                            fontSize: 20,
                            bold: true,
                            margin: [0, 0, 0, 10],
                            alignment: 'left'
                        },
                        subheader: {
                            fontSize: 13,
                            bold: true,
                            margin: [0, 20, 0, 10],
                            alignment: 'left'
                        },
                        itemsTable: {
                            margin: [0, 5, 0, 15]
                        },
                        itemsTableHeader: {
                            bold: true,
                            fontSize: 13,
                            color: 'black'
                        }
                    }
                }

                return dd;
            }

            function loadProduct(productKey, productCount) {
                var product = ProductService.findProduct(productKey);
                product.$loaded().then(function(res) {
                    $scope.products.push(product);
                    loadCount ++;
                    if (loadCount == productCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                });
            }

            function init() {
                $ionicLoading.show();
                var store = Auth.getStore();

                $scope.showInstaller = false;
                $scope.order = OrderService.findOrder(key);
                $scope.store = StoreService.findStore(store.$id);
                $scope.products = [];
                $scope.isSameInstallation = false;
                $scope.authUser = Auth.getUser();
                loadCount = 0;


                //step 1 - manufacturer
                $scope.showEnterTracking = false;
                $scope.trackingNumber = '';

                //step 2 - agent
                $scope.viewInvoice = false;
                $scope.overrideTracking = false;
                $scope.trackingNumbers = [];

                //step 3 - client
                $scope.viewTracking = false;
                $scope.viewInstall = false;

                //step3 - agent
                $scope.installation_company = {
                    company_name: '',
                    technician_name: '',
                    technician_phone: '',
                    date: '',
                    time: ''
                };

                $scope.order.$loaded().then(function(res) {
                    $scope.client = UserService.findUser($scope.order.clientKey);
                    $scope.user = UserService.findUser($scope.order.userKey);
                    var productKeys = Object.keys($scope.order.products);
                    if (productKeys.length == 0) {
                        $ionicLoading.hide();
                        return;
                    }
                    for (var i = 0; i < productKeys.length; i ++) {
                        loadProduct(productKeys[i], productKeys.length);
                    }
                    if ($scope.order.installation_address == $scope.order.delivery_address) {
                        $scope.isSameInstallation = true;
                    }

                    $ionicLoading.show();
                    $scope.tracker = OrderTrackersService.findTracker($scope.order.trackerKey);
                    $scope.tracker.$loaded().then(function(res) {
                        $ionicLoading.hide();
                        if (typeof $scope.tracker[1].trackingNumbers != "undefined") {
                            var trackingNumber = $scope.tracker[1].trackingNumbers[$scope.authUser.$id];
                            if (trackingNumber) {
                                $scope.trackingNumber = trackingNumber['number'];
                            }
                            $scope.trackingNumbers = [];
                            var keys = Object.keys($scope.tracker[1].trackingNumbers);
                            for (var i = 0; i < keys.length; i ++) {
                                $scope.trackingNumbers.push($scope.tracker[1].trackingNumbers[keys[i]]);
                            }
                        }
                    }).catch(function(err) {
                        $ionicLoading.hide();
                        console.log(err);
                    });

                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                })
            }

            init();

            var dateObj = {
                callback: function(val) {
                    console.log(val);
                    var date = new Date(val);
                    var dd = date.getDate();
                    var mm = date.getMonth() + 1;
                    var yyyy = date.getFullYear();
                    dd = dd < 10 ? '0' + dd : dd;
                    mm = mm < 10 ? '0' + mm : mm;

                    $scope.installation_company.date = yyyy + "-" + mm + "-" + dd;
                }
            };

            var timeObj = {
                callback: function(val) {
                    var time = new Date(val * 1000);
                    if (typeof val == "undefined") {
                        time = new Date();
                    }
                    var h = time.getHours();
                    var m = time.getMinutes();

                    h = h < 10 ? '0' + h : h;
                    m = m < 10 ? '0' + m : m;
                    $scope.installation_company.time = h + ":" + m;
                }
            };

            $scope.showDatePicker = function() {
                console.log('here');
                ionicDatePicker.openDatePicker(dateObj);
            };

            $scope.showTimePicker = function() {
                ionicTimePicker.openTimePicker(timeObj);
            };

            $scope.updateTracking = function(value) {
                var tracker = OrderTrackersService.findTracker($scope.order.trackerKey);
                tracker.$loaded().then(function(res) {
                    if (typeof tracker[1].trackingNumbers == 'undefined') {
                        tracker[1].trackingNumbers = {}
                    }
                    tracker[1].trackingNumbers[$scope.authUser.$id] = {
                        number: value,
                        created_at: CommonService.getCurrentDate(),
                        name: $scope.authUser.name
                    };
                    if ($scope.authUser.type <= 3 || $scope.authUser.type == 100) {
                        tracker[1].trackingNumbers[$scope.authUser.$id].storeNumber = $scope.authUser.mainStore;
                    }
                    tracker.$save();
                    alert ('Tracking number is updated!');
                }).catch(function(err) {
                    console.log(err);
                })
            };

            $scope.moveToStep3 = function(value) {
                var tracker = OrderTrackersService.findTracker($scope.order.trackerKey);
                tracker.$loaded().then(function(res) {
                    if (typeof tracker[1].trackingNumbers == 'undefined') {
                        tracker[1].trackingNumbers = {}
                    }
                    tracker[1].trackingNumbers[$scope.authUser.$id] = {
                        number: value,
                        created_at: CommonService.getCurrentDate(),
                        name: $scope.authUser.name
                    };
                    if ($scope.authUser.type <= 3 || $scope.authUser.type == 100) {
                        tracker[1].trackingNumbers[$scope.authUser.$id].storeNumber = $scope.authUser.mainStore;
                    }
                    tracker.$save();

                    var order = OrderService.findOrder(key);
                    order.$loaded().then(function(res) {
                        order.step = 3;
                        order.$save();
                    });

                }).catch(function(err) {
                    console.log(err);
                })
            };


            $scope.attachInvoice = function () {
                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    saveToPhotoAlbum: false
                };

                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Take Photo'},
                        {text: 'Choose Photo'}
                    ],
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code..
                        hideSheet();
                    },
                    buttonClicked: function (index) {
                        if (index === 0) {
                            options.sourceType = Camera.PictureSourceType.CAMERA;
                        } else if (index == 1) {
                            options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            console.log('get-image-success');
                            var imgURI = "data:image/jpeg;base64," + imageData;
                            var tracker = OrderTrackersService.findTracker($scope.order.trackerKey);
                            tracker.$loaded().then(function(res) {
                                tracker[1].invoice = imgURI;
                                console.log(tracker);
                                tracker.$save();
                            }).catch(function(err) {
                                console.log(err);
                            });
                            var order = OrderService.findOrder(key);
                            order.$loaded().then(function(res) {
                                order.step = 2;
                                order.$save();
                            });
                        }, function (err) {
                            console.log('get-image-err:', err);
                        });

                        hideSheet();
                        return true;
                    }
                });
            };

            $scope.downloadPDF = function() {
                $ionicLoading.show();

                PdfService.createPdf(createDocumentDefinition($scope.products), 'order_info').then(function(res) {
                    $ionicLoading.hide();
                    ionicToast.show(res + ' created successfully!', 'top', true, 2500);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $scope.sendEmail = function() {
                $ionicLoading.show();
                var pathFile;

                if (ionic.Platform.isIOS()) {
                    pathFile = cordova.file.documentsDirectory;
                }else {
                    pathFile = cordova.file.externalRootDirectory;
                }

                PdfService.createPdf(createDocumentDefinition($scope.products), 'order_info').then(function(res) {
                    $ionicLoading.hide();

                    console.log(pathFile);
                    console.log(res);

                    $cordovaFile.checkFile(pathFile, res.substring(1)).then(function(success) {
                        console.log('file-exist');
                    }, function(error) {
                        console.log('wrong path');
                    });

                    window.plugin.email.open({
                        attachments: [pathFile + res.substring(1)],
                        isHtml: true
                    }, function() {
                        console.log('email view dismissed');
                    }, this);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }


            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.orderDetail') {
                        init();
                    }
                });

        }])

    .controller('createOrderCtrl', ['$scope', '$stateParams', 'UserService', 'ProductService', '$ionicLoading', 'OrderService', '$ionicHistory', 'ionicDatePicker', 'ionicTimePicker', 'Auth', 'OrderTrackersService',
        function ($scope, $stateParams, UserService, ProductService, $ionicLoading, OrderService, $ionicHistory, ionicDatePicker, ionicTimePicker, Auth, OrderTrackersService) {

            var key = $stateParams.key;

            var loadCount = 0;

            function loadProduct(productKey, productCount) {
                var product = ProductService.findProduct(productKey);
                product.$loaded().then(function(res) {

                    var price = (product.cost * 1) + (product.cost * 1) * (product.markup * 1) / 100;
                    price = price * ($scope.client.products[product.$id] * 1);
                    $scope.order.price += price;

                    $scope.products.push(product);
                    loadCount ++;
                    if (loadCount == productCount) {
                        $ionicLoading.hide();
                    }
                })
            }

            function getCurrentDate() {
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                var h = today.getHours();
                var m = today.getMinutes();
                var s = today.getSeconds();

                dd = dd < 10 ? '0' + dd : dd;
                mm = mm < 10 ? '0' + mm : mm;
                h = h < 10 ? '0' + h : h;
                m = m < 10 ? '0' + m : m;
                s = s < 10 ? '0' + s : s;

                return yyyy + "-" + mm + "-" + dd + " " + h + ":" + m + ":" + s;
            }

            function init() {
                $scope.client = UserService.findUser(key);
                $scope.showInstaller = false;
                $scope.isSameInstallation = false;
                $scope.products = [];
                var user = Auth.getUser();

                $scope.order = {
                    clientKey: key,
                    userKey: user.$id,
                    step: 1,
                    delivery_address: '',
                    installation_address: '',
                    company_name: '',
                    technician_name: '',
                    technician_phone: '',
                    installation_date: '',
                    installation_time: '',
                    products: {},
                    price: 0,
                    created_at: getCurrentDate()
                };

                $ionicLoading.show();

                $scope.client.$loaded().then(function(res) {

                    var products = $scope.client.products;
                    if (typeof products == "undefined") {
                        $ionicLoading.hide();
                        $scope.products = [];
                        return;
                    }

                    $scope.order.products = products;

                    var productKeys = Object.keys(products);
                    if (productKeys.length == 0) {
                        $ionicLoading.hide();
                        $scope.products = [];
                        return;
                    }

                    loadCount = 0;
                    for (var i = 0; i < productKeys.length; i ++) {
                        loadProduct(productKeys[i], productKeys.length);
                    }

                }).catch(function(err) {
                    console.log(err);
                })
            }

            init();

            var dateObj = {
                callback: function(val) {
                    console.log(val);
                    var date = new Date(val);
                    var dd = date.getDate();
                    var mm = date.getMonth() + 1;
                    var yyyy = date.getFullYear();
                    dd = dd < 10 ? '0' + dd : dd;
                    mm = mm < 10 ? '0' + mm : mm;

                    $scope.order.installation_date = yyyy + "-" + mm + "-" + dd;
                }
            };

            var timeObj = {
                callback: function(val) {
                    var time = new Date(val * 1000);
                    if (typeof val == "undefined") {
                        time = new Date();
                    }
                    var h = time.getHours();
                    var m = time.getMinutes();

                    h = h < 10 ? '0' + h : h;
                    m = m < 10 ? '0' + m : m;
                    $scope.order.installation_time = h + ":" + m;
                }
            };

            $scope.showDatePicker = function() {
                console.log('here');
                ionicDatePicker.openDatePicker(dateObj);
            };

            $scope.showTimePicker = function() {
                ionicTimePicker.openTimePicker(timeObj);
            };

            $scope.updateInstallationValue = function(value) {
                $scope.isSameInstallation = value;
                console.log(value);
            };

            $scope.createOrder = function() {
                if ($scope.isSameInstallation) {
                    $scope.order.installation_address = $scope.order.delivery_address;
                }

                OrderTrackersService.addTracker({1: {created_at: getCurrentDate()}}).then(function(res) {
                    $scope.order.trackerKey = res;
                    OrderService.addOrder($scope.order).then(function(res) {
                        console.log('order-key:', res);
                        alert ('Order is created successfully!');
                        var orderKey = res;
                        var client = UserService.findUser(key);
                        client.$loaded().then(function(res) {
                            if (typeof client.orders == "undefined") {
                                client.orders = {};
                            }
                            client.orders[orderKey] = true;
                            client.$save();
                        }, function(err) {
                            console.log(err);
                        });

                        for (var i = 0; i < $scope.products.length; i ++) {
                            var productKey = $scope.products[i].$id;
                            var product = ProductService.findProduct(productKey);
                            product.$loaded().then(function(res) {
                                var distributor = UserService.findUser(product.distributorKey);

                                distributor.$loaded().then(function(res) {
                                    if (typeof distributor.orders == "undefined") {
                                        distributor.orders = {};
                                    }
                                    distributor.orders[orderKey] = true;
                                    distributor.$save();
                                }, function(err) {
                                    console.log(err);
                                });

                            }, function(err) {
                                console.log(err);
                            });
                        }

                    }, function(err) {
                        console.log(err);
                    })
                }).catch(function(err) {
                    console.log(err);
                });
            }
        }])

    .controller('storeProfileCtrl', ['$scope', '$stateParams', 'StoreService', 'EmployeeService', 'ProductService', 'PdfService', 'QRCode', 'ionicToast', '$cordovaFile', '$ionicLoading', 'UserService', '$rootScope', '$ionicSideMenuDelegate', '$ionicListDelegate', '$cordovaCamera', '$ionicActionSheet',
        function ($scope, $stateParams, StoreService, EmployeeService, ProductService, PdfService, QRCode, ionicToast, $cordovaFile, $ionicLoading, UserService, $rootScope, $ionicSideMenuDelegate, $ionicListDelegate, $cordovaCamera, $ionicActionSheet) {

            $scope.$on('$ionicView.enter', function(){
                $ionicSideMenuDelegate.canDragContent(false);
            });
            $scope.$on('$ionicView.leave', function(){
                $ionicSideMenuDelegate.canDragContent(true);
            });

            function createDocumentDefinition(products) {

                var items = products.map(function(item) {
                    return [
                        item.name,
                        (item.cost * 1) * (item.markup * 1) / 100,
                        item.is_available ? 'Available' : 'Unavailable',
                        {
                            image: QRCode.generate(item.$id)
                        }
                    ]
                });

                var userItems = $scope.users.map(function(item) {
                    return [
                        item.name,
                        item.type,
                        item.email
                    ]
                });

                var dd = {
                    content: [
                        {text: 'Store: ' + $scope.store.$id, style: 'header'},

                        {text: 'Contact Info', style: 'subheader'},

                        'Phone: ' + $scope.store.phone,
                        'Address: ' + $scope.store.address,
                        'City: ' + $scope.store.city,
                        'State: ' + $scope.store.state,
                        'Zip: ' + $scope.store.zip,

                        {text: 'Employees List', style: 'subheader'},

                        {
                            style: 'itemsTable',
                            table: {
                                width: ['*', '*', '*'],
                                body: [
                                    [
                                        {text: 'Name', style: 'itemsTableHeader'},
                                        {text: 'Type', style: 'itemsTableHeader'},
                                        {text: 'Email', style: 'itemsTableHeader'},
                                    ]
                                ].concat(userItems)
                            }
                        },

                        {text: 'Product List', style: 'subheader'},

                        {
                            style: 'itemsTable',
                            table: {
                                width: ['*', '*', '*', 200],
                                body: [
                                    [
                                        {text: 'Name', style: 'itemsTableHeader'},
                                        {text: 'Price', style: 'itemsTableHeader'},
                                        {text: 'Status', style: 'itemsTableHeader'},
                                        {text: 'QRCode', style: 'itemsTableHeader'}
                                    ]
                                ].concat(items)
                            }
                        }
                    ],
                    styles: {
                        header: {
                            fontSize: 20,
                            bold: true,
                            margin: [0, 0, 0, 10],
                            alignment: 'left'
                        },
                        subheader: {
                            fontSize: 13,
                            bold: true,
                            margin: [0, 10, 0, 10],
                            alignment: 'left'
                        },
                        itemsTable: {
                            margin: [0, 5, 0, 15]
                        },
                        itemsTableHeader: {
                            bold: true,
                            fontSize: 13,
                            color: 'black'
                        }
                    }
                }

                return dd;
            }

            function createProductDocumentDefinition(products) {

                var tableBody = [];

                for (var i = 0; i < products.length; i ++) {
                    if (i % 3 == 0) {
                        tableBody.push([]);
                    }
                    tableBody[tableBody.length - 1].push({
                        table: {
                            body: [
                                [
                                    [
                                        {
                                            text: 'Product ' + (i + 1),
                                            alignment: 'center'
                                        },
                                        {
                                            image: QRCode.generate(products[i].$id),
                                            width: 120,
                                            height: 120,
                                            margin: [16, 5, 16, 0]
                                        },
                                        {
                                            text: products[i].name.length == 0 ? ' ' : products[i].name,
                                            alignment: 'center',
                                            marginTop: 10,
                                            fontSize: 14
                                        }
                                    ]
                                ]
                            ]
                        },
                        border: [false, false, false, false]
                    });
                }

                if (tableBody[tableBody.length - 1].length < 3) {
                    for (var i = tableBody[tableBody.length - 1].length; i < 3; i ++) {
                        tableBody[tableBody.length - 1].push({
                            text: '',
                            border: [false, false, false, false]
                        });
                    }
                }

                console.log(tableBody);

                var dd = {
                    content: [
                        {text: 'Product List', style: 'header'},

                        {
                            style: 'itemsTable',
                            table: {
                                dontBreakRows: true,
                                body: tableBody
                            },
                            layout: {
                                paddingTop: function(node, i) {return 5;}
                            }
                        }
                    ],
                    styles: {
                        header: {
                            fontSize: 20,
                            bold: true,
                            margin: [0, 0, 0, 10],
                            alignment: 'left'
                        },
                        itemsTable: {
                            margin: [0, 5, 0, 15]
                        },
                        itemsTableHeader: {
                            bold: true,
                            fontSize: 13,
                            color: 'black'
                        }
                    }
                }

                return dd;
            }

            function createListDocumentDefinition() {

                var employee_items = $scope.employees.map(function(item) {
                    return [
                        item.name,
                        item.email,
                        item.address,
                        item.phone
                    ]
                });

                var product_items = $scope.products.map(function(item) {
                    return [
                        item.name,
                        (item.cost * 1) * (item.markup * 1) / 100,
                        item.is_available ? 'Available' : 'Unavailable',
                        {
                            image: QRCode.generate(item.$id)
                        }
                    ]
                });

                var dd = {
                    content: [
                        {text: 'Store Detail', style: 'header'},

                        {text: 'Contact Info', style: 'subheader'},
                        'Name: ' +  $scope.store.name,
                        'Phone: ' + $scope.store.phone,
                        'Address: ' + $scope.store.address,
                        'City: ' + $scope.store.city,
                        'State: ' + $scope.store.state,
                        'Zip: ' + $scope.store.zip,

                        {text: 'Employee List', style: 'subheader'},

                        {
                            style: 'itemsTable',
                            table: {
                                width: ['*', '*', '*', 200],
                                body: [
                                    [
                                        {text: 'Name', style: 'itemsTableHeader'},
                                        {text: 'Email', style: 'itemsTableHeader'},
                                        {text: 'Address', style: 'itemsTableHeader'},
                                        {text: 'Phone', style: 'itemsTableHeader'}
                                    ]
                                ].concat(employee_items)
                            }
                        },

                        {text: 'Product List', style: 'subheader'},

                        {
                            style: 'itemsTable',
                            table: {
                                width: ['*', '*', '*', 200],
                                body: [
                                    [
                                        {text: 'Name', style: 'itemsTableHeader'},
                                        {text: 'Price', style: 'itemsTableHeader'},
                                        {text: 'Status', style: 'itemsTableHeader'},
                                        {text: 'QRCode', style: 'itemsTableHeader'}
                                    ]
                                ].concat(product_items)
                            }
                        }
                    ],
                    styles: {
                        header: {
                            fontSize: 20,
                            bold: true,
                            margin: [0, 0, 0, 10],
                            alignment: 'left'
                        },
                        subheader: {
                            fontSize: 16,
                            bold: true,
                            margin: [0, 20, 0, 5]
                        },
                        itemsTable: {
                            margin: [0, 5, 0, 15]
                        },
                        itemsTableHeader: {
                            bold: true,
                            fontSize: 13,
                            color: 'black'
                        }
                    }
                }

                return dd;
            }

            console.log($stateParams.storeId);

            function addEmployee(employeeId) {
                console.log(employeeId);
                var employee = EmployeeService.findEmployee(employeeId);
                employee.$loaded().then(function (res) {
                    $scope.employees.push(employee);
                }).catch(function (err) {
                    console.log(err);
                })
            }

            function addProduct(productId) {
                var product = ProductService.findProduct(productId);
                product.$loaded().then(function (res) {
                    $scope.products.push(product);
                }).catch(function (err) {
                    console.log(err);
                })
            }

            function addUser(userId) {
                var user = UserService.findUser(userId);
                user.$loaded().then(function(res) {
                    var userType = user.type;
                    switch (userType) {
                        case 1:
                            user.type = 'Owner';
                            break;
                        case 2:
                            user.type = 'Manager';
                            break;
                        case 3:
                            user.type = 'Sales';
                            break;
                        case 4:
                            user.type = 'Representative';
                            break;
                        default:
                            user.type = 'Employee';
                    }
                    $scope.users.push(user);
                }).catch(function(err) {
                    console.log(err);
                })
            }

            $scope.updateStorePicture = function () {
                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    saveToPhotoAlbum: false
                };

                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Take Photo'},
                        {text: 'Choose Photo'}
                    ],
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code..
                        hideSheet();
                    },
                    buttonClicked: function (index) {
                        if (index === 0) {
                            options.sourceType = Camera.PictureSourceType.CAMERA;
                        } else if (index == 1) {
                            options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            console.log('get-image-success');
                            var imgURI = "data:image/jpeg;base64," + imageData;
                            $scope.store.photo = imgURI;

                            var store = StoreService.findStore($stateParams.storeId);
                            store.$loaded().then(function(res) {
                                store.photo = imgURI;
                                store.$save();
                            }).catch(function(err) {
                                console.log(err);
                            })
                        }, function (err) {
                            console.log('get-image-err:', err);
                        });

                        hideSheet();
                        return true;
                    }
                });
            };

            function init() {
                $scope.showContact = false;
                $scope.showEmployee = false;
                $scope.showUsers = false;
                $scope.store = StoreService.findStore($stateParams.storeId);
                $scope.employees = [];
                $scope.products = [];
                $scope.users = [];
                var employees = StoreService.storeEmployees($stateParams.storeId);

                employees.$loaded().then(function (res) {
                    for (var i = 0; i < employees.length; i++) {
                        addEmployee(employees[i].$id);
                    }
                }).catch(function (err) {
                    console.log(err);
                });

                $scope.store.$loaded().then(function(res) {
                    console.log($scope.store);
                    if (typeof $scope.store.photo == "undefined") {
                        $scope.store.photo = "img/thumbnail-img.png";
                    }
                    var products = $scope.store.products;
                    if (typeof products == "undefined") {
                        $scope.products = [];
                    }else {
                        var productKeys = Object.keys(products);
                        for (var i = 0; i < productKeys.length; i ++) {
                            addProduct(productKeys[i]);
                        }
                    }

                    var users = $scope.store.users;
                    if (typeof users == "undefined") {
                        $scope.users = [];
                    }else {
                        var userKeys = Object.keys(users);
                        for (var i = 0; i < userKeys.length; i ++) {
                            addUser(userKeys[i]);
                        }
                    }
                }, function(err) {
                    console.log(err);
                });

            }

            init();

            $scope.removeEmployee = function(index) {
                $ionicListDelegate.closeOptionButtons();
                var store = StoreService.findStore($stateParams.storeId);
                store.$loaded().then(function(res) {
                    delete store.users[$scope.users[index].$id];
                    console.log(store.users);
                    store.$save();
                    $scope.users.splice(index, 1);
                }).catch(function(err) {
                    console.log(err);
                })
            };

            $scope.printList = function() {
                $ionicLoading.show();

                PdfService.createPdf(createListDocumentDefinition(), 'list').then(function(res) {
                    $ionicLoading.hide();
                    ionicToast.show(res + ' created successfully!', 'top', true, 2500);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            };

            $scope.printQR = function() {
                $ionicLoading.show();

                PdfService.createPdf(createProductDocumentDefinition($scope.products), 'product_list').then(function(res) {
                    $ionicLoading.hide();
                    ionicToast.show(res + ' created successfully!', 'top', true, 2500);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $scope.downloadPDF = function() {
                $ionicLoading.show();

                PdfService.createPdf(createDocumentDefinition($scope.products), 'store_info').then(function(res) {
                    $ionicLoading.hide();
                    ionicToast.show(res + ' created successfully!', 'top', true, 2500);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $scope.sendEmail = function() {
                $ionicLoading.show();
                var pathFile;

                if (ionic.Platform.isIOS()) {
                    pathFile = cordova.file.documentsDirectory;
                }else {
                    pathFile = cordova.file.externalRootDirectory;
                }

                PdfService.createPdf(createDocumentDefinition($scope.products), 'store_info').then(function(res) {
                    $ionicLoading.hide();

                    console.log(pathFile);
                    console.log(res);

                    $cordovaFile.checkFile(pathFile, res.substring(1)).then(function(success) {
                        console.log('file-exist');
                    }, function(error) {
                        console.log('wrong path');
                    });

                    window.plugin.email.open({
                        attachments: [pathFile + res.substring(1)],
                        isHtml: true
                    }, function() {
                        console.log('email view dismissed');
                    }, this);
                }, function(err) {
                    $ionicLoading.hide();
                    ionicToast.show(err, 'top', true, 2500);
                })
            }

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.storeProfile') {
                        init();
                    }
                });

        }])

    .controller('createNewStoreCtrl', ['$scope', '$stateParams', '$cordovaCamera', '$ionicActionSheet', '$ionicLoading', 'EmployeeService', 'StoreService', '$rootScope', 'Auth', '$ionicSideMenuDelegate',
        function ($scope, $stateParams, $cordovaCamera, $ionicActionSheet, $ionicLoading, EmployeeService, StoreService, $rootScope, Auth, $ionicSideMenuDelegate) {

            function init() {
                $scope.showEmployees = false;
                console.log($rootScope.selectedEmployees)
                $scope.user = Auth.getUser();
                $scope.employees = $rootScope.selectedEmployees ? $rootScope.selectedEmployees : [];
                $scope.store = {
                    user_id: $scope.user.$id,
                    users: {}
                };
            }

            init();

            $scope.addPhoto = function () {
                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    saveToPhotoAlbum: false
                };

                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Take Photo'},
                        {text: 'Choose Photo'}
                    ],
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code..
                        hideSheet();
                    },
                    buttonClicked: function (index) {
                        if (index === 0) {
                            options.sourceType = Camera.PictureSourceType.CAMERA;
                        } else if (index == 1) {
                            options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            console.log('get-image-success');
                            var imgURI = "data:image/jpeg;base64," + imageData;
                            $scope.store.photo = imgURI;
                        }, function (err) {
                            console.log('get-image-err:', err);
                        });

                        hideSheet();
                        return true;
                    }
                });
            };

            $scope.removeItem = function (index) {
                $scope.employees.splice(index, 1);
                $rootScope.employees.splice(index, 1);
            }

            $scope.addNew = function () {
                $ionicLoading.show();
                for (var i = 0; i < $scope.employees.length; i++) {
                    $scope.store.users[$scope.employees[i].$id] = true;
                }
                StoreService.addStore($scope.store).then(function (res) {
                    $ionicLoading.hide();
                    alert('Store is added successfully!');
                    init();
                }, function (err) {
                    $ionicLoading.hide();
                    console.log(err);
                })
            };

            $scope.$on('$ionicView.enter', function(){
                $ionicSideMenuDelegate.canDragContent(false);
            });
            $scope.$on('$ionicView.leave', function(){
                $ionicSideMenuDelegate.canDragContent(true);
            });

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.createNewStore') {
                        if (!Auth.isLoggedIn()) {
                            console.log('not-loggedin');
                            $state.go('menu.floorManager');
                        } else {
                            if (fromState.name == 'menu.employees') {
                                $scope.employees = $rootScope.selectedEmployees ? $rootScope.selectedEmployees : [];
                            } else {
                                init();
                            }
                        }
                    }
                });

        }])

    .controller('createDistributorCtrl', ['$scope', '$stateParams', '$cordovaCamera', '$ionicActionSheet', '$ionicLoading', 'EmployeeService', 'StoreService', '$rootScope', 'Auth', 'UserService', '$ionicSideMenuDelegate',
        function ($scope, $stateParams, $cordovaCamera, $ionicActionSheet, $ionicLoading, EmployeeService, StoreService, $rootScope, Auth, UserService, $ionicSideMenuDelegate) {

            $scope.$on('$ionicView.enter', function(){
                $ionicSideMenuDelegate.canDragContent(false);
            });
            $scope.$on('$ionicView.leave', function(){
                $ionicSideMenuDelegate.canDragContent(true);
            });

            function init() {
                $scope.showEmployees = false;
                $scope.user = Auth.getUser();
                $scope.localStore = Auth.getStore();
                $scope.employees = $rootScope.selectedEmployees ? $rootScope.selectedEmployees : [];
                $scope.distributor = {
                    is_verified: false,
                    type: 4,
                    employees: {}
                };
            }

            init();

            $scope.addPhoto = function () {
                var options = {
                    quality: 75,
                    destinationType: Camera.DestinationType.DATA_URL,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    saveToPhotoAlbum: false
                };

                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                        {text: 'Take Photo'},
                        {text: 'Choose Photo'}
                    ],
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code..
                        hideSheet();
                    },
                    buttonClicked: function (index) {
                        if (index === 0) {
                            options.sourceType = Camera.PictureSourceType.CAMERA;
                        } else if (index == 1) {
                            options.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                        }

                        $cordovaCamera.getPicture(options).then(function (imageData) {
                            console.log('get-image-success');
                            var imgURI = "data:image/jpeg;base64," + imageData;
                            $scope.distributor.photo = imgURI;
                        }, function (err) {
                            console.log('get-image-err:', err);
                        });

                        hideSheet();
                        return true;
                    }
                });
            };

            $scope.removeItem = function (index) {
                $scope.employees.splice(index, 1);
                $rootScope.employees.splice(index, 1);
            };

            $scope.addNew = function () {
                $ionicLoading.show();
                for (var i = 0; i < $scope.employees.length; i++) {
                    $scope.distributor.employees[$scope.employees[i].$id] = true;
                }
                UserService.addUser($scope.distributor).then(function (res) {
                    $ionicLoading.hide();

                    var store = StoreService.findStore($scope.localStore.$id);
                    var userKey = res.user.$id;
                    store.$loaded().then(function(res) {
                        if (typeof store.distributors == "undefined") {
                            store.distributors = {};
                        }
                        store.distributors[userKey] = true;
                        store.$save();
                        alert('Distributor is added successfully!');
                        init();

                    }, function(err) {
                        console.log(err);
                    });

                }, function (err) {
                    $ionicLoading.hide();
                    console.log(err);
                })
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.createDistributor') {
                        if (fromState.name == 'menu.distributor_employees') {
                            $scope.employees = $rootScope.selectedEmployees ? $rootScope.selectedEmployees : [];
                        } else {
                            init();
                        }
                    }
                });

        }])

    .controller('ownerControlPanelCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])

    .controller('floorManagerControlPanelCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams) {


        }])

    .controller('distributorControlPanelCtrl', ['$scope', '$stateParams', 'UserService', 'ProductService', '$ionicLoading', '$rootScope', 'Auth',
        function ($scope, $stateParams, UserService, ProductService, $ionicLoading, $rootScope, Auth) {
            var key = $stateParams.key;
            var productLength = 0;
            var loadCount = 0;

            function loadProduct(product) {
                product.$loaded().then(function (res) {
                    $scope.products.push(product);
                    $scope.results.push(product);
                    if (product.is_available) {
                        $scope.availableProducts.push(product);
                    }else {
                        $scope.unAvailableProducts.push(product);
                    }

                    loadCount ++;
                    if (loadCount == productLength) {
                        $ionicLoading.hide();
                    }
                }).catch(function (error) {
                    console.log(error);
                });
            }

            function init() {
                $ionicLoading.show();

                $scope.showProduct = false;
                $scope.availableProducts = [];
                $scope.unAvailableProducts = [];
                if (!key) {
                    key = Auth.getUser().$id;
                }
                $scope.distributor = UserService.findUser(key);
                $scope.distributor.$loaded().then(function(res) {
                    if (typeof $scope.distributor.is_verified == "undefined") {
                        $scope.distributor.is_verified = true;
                    }
                });

                ProductService.clientProducts(key).then(function(result) {
                    var distributorProducts = result;

                    $scope.products = [];
                    $scope.results = [];
                    loadCount = 0;

                    if (distributorProducts.length == 0) {
                        $ionicLoading.hide();
                    }

                    productLength = distributorProducts.length;

                    for (var i = 0; i < distributorProducts.length; i ++) {
                        var product = distributorProducts[i];
                        loadProduct(product);
                    }
                });
            }

            init();

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.distributorControlPanel') {
                        init();
                    }
                });

        }])

    .controller('createEmployeeCtrl', ['$scope', '$stateParams', '$ionicLoading', 'UserService', 'Auth', 'StoreService', 'AuthService',
        function ($scope, $stateParams, $ionicLoading, UserService, Auth, StoreService, AuthService) {

            $scope.userTypes = [
                {
                    name: "Owner",
                    value: 1
                },
                {
                    name: "Manager",
                    value: 2
                },
                {
                    name: "Sales",
                    value: 3
                }
            ];

            function init() {
                $scope.user = Auth.getUser();
                $scope.userType = $scope.userTypes[0];
                $scope.employee = {
                    name: '',
                    email: '',
                    type: 1,
                    password: '',
                    stores: {}
                };

                var stores = StoreService.stores;
                $scope.stores = [];
                $ionicLoading.show();
                $scope.mainStore = {};

                $ionicLoading.show();
                stores.$loaded().then(function(res) {
                    $ionicLoading.hide();
                    for (var i = 0; i < stores.length; i ++) {
                        $scope.stores.push(stores[i]);
                    }
                    $scope.mainStore = stores[0];
                    $scope.employee.mainStore = $scope.mainStore.$id;
                    $scope.employee.stores[$scope.mainStore.$id] = true;
                }, function(err) {
                    console.log(err);
                });
            }

            init();

            $scope.updateUserType = function (obj) {
                $scope.userType = obj;
                console.log(obj);
            };

            $scope.updateUserStore = function(store) {
                $scope.employee.mainStore = store.$id;
                $scope.employee.stores = {};
                $scope.employee.stores[store.$id] = true;
            };

            $scope.saveEmployee = function () {
                $ionicLoading.show();

                $scope.employee.type = $scope.userType.value;

                AuthService.doSignUp($scope.employee).then(function (res) {
                    $ionicLoading.hide();
                    alert('Employee is added successfully!');

                    var userKey = res.user.$id;
                    var store = StoreService.findStore($scope.employee.mainStore);

                    store.$loaded().then(function(res) {
                        if (typeof store.users == "undefined") {
                            store.users = {};
                        }
                        store.users[userKey] = true;
                        store.$save();
                    }, function(err) {
                        console.log(err);
                    });

                    init();

                }, function (err) {
                    $ionicLoading.hide();
                    alert(err.msg);
                })
            }

        }])

    .controller('createDEmployeeCtrl', ['$scope', '$stateParams', '$ionicLoading', 'UserService', 'Auth', 'StoreService', 'AuthService',
        function ($scope, $stateParams, $ionicLoading, UserService, Auth, StoreService, AuthService) {

            function init() {
                $scope.user = Auth.getUser();
                var localStore = Auth.getStore();
                $scope.employee = {
                    name: '',
                    email: '',
                    type: 5,
                    password: '',
                    mainStore: localStore.$id,
                    stores: {}
                };
            }

            init();

            $scope.saveEmployee = function () {
                $ionicLoading.show();

                UserService.addUser($scope.employee).then(function (res) {
                    $ionicLoading.hide();
                    alert('Employee is added successfully!');

                    var userKey = res.user.$id;
                    var store = StoreService.findStore($scope.employee.mainStore);

                    store.$loaded().then(function(res) {
                        if (typeof store.users == "undefined") {
                            store.employees = {};
                        }
                        store.employees[userKey] = true;
                        store.$save();
                    }, function(err) {
                        console.log(err);
                    });

                    init();

                }, function (err) {
                    $ionicLoading.hide();
                    alert(err.msg);
                })
            }

        }])

    .controller('employeesCtrl', ['$scope', '$stateParams', 'UserService', 'Auth', '$ionicHistory', '$rootScope', '$ionicLoading', 'StoreService',
        function ($scope, $stateParams, UserService, Auth, $ionicHistory, $rootScope, $ionicLoading, StoreService) {

            function init() {

                $scope.user = Auth.getUser();

                if ($stateParams.storeId) {
                    $scope.storeId = $stateParams.storeId;

                    $ionicLoading.show();
                    var store = StoreService.findStore($scope.storeId);
                    store.$loaded().then(function(res) {
                        var storeUsers = {};
                        if (typeof store.users != "undefined") {
                            storeUsers = store.users;
                        }

                        $scope.employees = [];

                        var users = UserService.users;

                        users.$loaded().then(function(res) {
                            $ionicLoading.hide();
                            for (var i = 0; i < users.length; i ++) {
                                var user = users[i];
                                if (storeUsers[user.$id]) continue;
                                if (user.type == 100) continue;
                                var userType = user.type;
                                switch (userType) {
                                    case 1:
                                        user.type = 'Owner';
                                        break;
                                    case 2:
                                        user.type = 'Manager';
                                        break;
                                    case 3:
                                        user.type = 'Sales';
                                        break;
                                    case 4:
                                        user.type = 'Representative';
                                        break;
                                    default:
                                        user.type = 'Employee';
                                }
                                user.is_selected = false;
                                $scope.employees.push(user);
                            }
                        }).catch(function(err) {
                            $ionicLoading.hide();
                            console.log(err);
                        });
                    }).catch(function(err) {
                        $ionicLoading.hide();
                        console.log(err);
                    })
                }else {
                    $scope.employees = [];

                    var users = UserService.users;

                    $ionicLoading.show();

                    users.$loaded().then(function(res) {
                        $ionicLoading.hide();
                        for (var i = 0; i < users.length; i ++) {
                            var user = users[i];
                            if (user.type == 100) continue;
                            var userType = user.type;
                            switch (userType) {
                                case 1:
                                    user.type = 'Owner';
                                    break;
                                case 2:
                                    user.type = 'Manager';
                                    break;
                                case 3:
                                    user.type = 'Sales';
                                    break;
                                case 4:
                                    user.type = 'Representative';
                                    break;
                                default:
                                    user.type = 'Employee';
                            }
                            user.is_selected = false;
                            $scope.employees.push(user);
                        }
                    }).catch(function(err) {
                        $ionicLoading.hide();
                        console.log(err);
                    });
                }
            }

            init();

            $scope.addEmployees = function() {
                var store = StoreService.findStore($scope.storeId);
                store.$loaded().then(function(res) {
                    if (typeof store.users == "undefined") {
                        store.users = {};
                    }
                    var flag = false;
                    for (var i = 0; i < $scope.employees.length; i++) {
                        var employee = $scope.employees[i];
                        if (employee.is_selected) {
                            store.users[employee.$id] = true;
                            flag = true;
                        }
                    }
                    store.$save();
                    if (flag) {
                        alert('Employees added to store');
                    }else {
                        alert('Please select employees!');
                    }
                }).catch(function(err) {
                    console.log(err);
                })
            };

            $scope.chooseItem = function (item) {
                item.is_selected = !item.is_selected;
            };

            $scope.selectEmployees = function () {
                $rootScope.selectedEmployees = [];
                for (var i = 0; i < $scope.employees.length; i++) {
                    var employee = $scope.employees[i];
                    if (employee.is_selected) {
                        $rootScope.selectedEmployees.push(employee);
                    }
                }
                $ionicHistory.goBack();
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.employees') {
                        init();
                    }
                });
        }])

    .controller('distributorEmployeesCtrl', ['$scope', '$stateParams', 'UserService', 'Auth', '$ionicHistory', '$rootScope', '$ionicLoading', 'StoreService',
        function ($scope, $stateParams, UserService, Auth, $ionicHistory, $rootScope, $ionicLoading, StoreService) {

            var loadCount = 0;

            function loadEmployee(employeeKey, employeeCount) {
                var employee = UserService.findUser(employeeKey);

                employee.$loaded().then(function(res) {
                    $scope.employees.push(employee);
                    loadCount ++;
                    if (loadCount == employeeCount) {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    console.log(err);
                })
            }

            function init() {

                $scope.user = Auth.getUser();
                $scope.employees = [];

                var users = UserService.users;

                $ionicLoading.show();

                var localStore = Auth.getStore();
                var store = StoreService.findStore(localStore.$id);
                $ionicLoading.show();

                store.$loaded().then(function(res) {
                    if (typeof store.employees != "undefined") {
                        var employeeKeys = Object.keys(store.employees);

                        loadCount = 0;

                        if (employeeKeys.length == 0) {
                            $ionicLoading.hide();
                        }

                        for (var i = 0; i < employeeKeys.length; i ++) {
                            loadEmployee(employeeKeys[i], employeeKeys.length);
                        }
                    }else {
                        $ionicLoading.hide();
                    }
                }, function(err) {
                    $ionicLoading.hide();
                    console.log(err);
                });

            }

            init();

            $scope.chooseItem = function (item) {
                item.is_selected = !item.is_selected;
            };

            $scope.selectEmployees = function () {
                $rootScope.selectedEmployees = [];
                for (var i = 0; i < $scope.employees.length; i++) {
                    var employee = $scope.employees[i];
                    if (employee.is_selected) {
                        $rootScope.selectedEmployees.push(employee);
                    }
                }
                $ionicHistory.goBack();
            };

            $rootScope.$on('$stateChangeSuccess',
                function (event, toState, toParams, fromState, fromParams) {
                    // do something
                    if (toState.name == 'menu.distributor_employees') {
                        init();
                    }
                });
        }])

    .controller('storesCtrl', ['$scope', '$stateParams', 'StoreService', '$rootScope', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
        function ($scope, $stateParams, StoreService, $rootScope) {

            function init() {
                var stores = StoreService.stores;
                $scope.stores = [];

                stores.$loaded().then(function (res) {
                    for (var i = 0; i < stores.length; i++) {
                        var store = stores[i];
                        if (store.user_id == $scope.user.$id) {
                            store.is_selected = false;
                            $scope.stores.push(store);
                        }
                    }
                }).catch(function (err) {
                    console.log(err);
                })
            }

            function addProductToStore(storeProducts) {
                storeProducts.$loaded().then(function (res) {
                    for (var i = 0; i < storeProducts.length; i++) {
                        if (storeProducts[i].$value == $rootScope.addedProduct.$id) return;
                    }
                    storeProducts.$add($rootScope.addedProduct.$id);
                }).catch(function (err) {
                    console.log(err);
                })
            }

            init();

            $scope.chooseItem = function (item) {
                item.is_selected = !item.is_selected;
            };

            $scope.addProduct = function () {

                for (var i = 0; i < $scope.stores.length; i++) {
                    if (!$scope.stores[i].is_selected) continue;
                    var products = StoreService.storeProducts($scope.stores[i].$id);
                    addProductToStore(products);
                }

                alert('Product is added to selected stores');
            }
        }])
 