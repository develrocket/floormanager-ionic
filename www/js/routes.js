angular.module('app.routes', [])

    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider


            .state('menu.floorManager', {
                url: '/home',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/floorManager.html',
                        controller: 'floorManagerCtrl'
                    }
                }
            })

            .state('menu.addClient', {
                url: '/add_client',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/addClient.html',
                        controller: 'addClientCtrl'
                    }
                }
            })

            .state('menu.addProduct', {
                url: '/add_product/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/addProduct.html',
                        controller: 'addProductCtrl'
                    }
                }
            })

            .state('menu.addProductToClient', {
                url: '/add_product_client/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/addProductToClient.html',
                        controller: 'addProductToClientCtrl'
                    }
                }
            })

            .state('menu', {
                url: '/side-menu21',
                templateUrl: 'templates/menu.html',
                controller: 'menuCtrl'
            })

            .state('menu.login', {
                url: '/login',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/login.html',
                        controller: 'loginCtrl'
                    }
                }
            })

            .state('menu.signup', {
                url: '/page5',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/signup.html',
                        controller: 'signupCtrl'
                    }
                }
            })

            .state('menu.productDetail', {
                url: '/product_detail/:key/:clientKey',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/productDetail.html',
                        controller: 'productDetailCtrl'
                    }
                }
            })

            .state('menu.productEdit', {
                url: '/product_edit/:key/',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/productEdit.html',
                        controller: 'productEditCtrl'
                    }
                }
            })

            .state('menu.clientList', {
                url: '/client-list',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/clientList.html',
                        controller: 'clientListCtrl'
                    }
                }
            })

            .state('menu.distributorList', {
                url: '/distributor-list',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/distributorList.html',
                        controller: 'distributorListCtrl'
                    }
                }
            })

            .state('menu.createDistributor', {
                url: '/create-distributor',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/createDistributor.html',
                        controller: 'createDistributorCtrl'
                    }
                }
            })

            .state('menu.orderList', {
                url: '/order-list',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/orderList.html',
                        controller: 'orderListCtrl'
                    }
                }
            })

            .state('menu.clientOrderList', {
                url: '/client-order-list',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/clientOrderList.html',
                        controller: 'clientOrderListCtrl'
                    }
                }
            })

            .state('menu.productIst', {
                url: '/product_list/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/productIst.html',
                        controller: 'productIstCtrl'
                    }
                }
            })

            .state('menu.storeList', {
                url: '/store_list/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/storeList.html',
                        controller: 'storeListCtrl'
                    }
                }
            })

            .state('menu.userList', {
                url: '/user_list/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/userList.html',
                        controller: 'userListCtrl'
                    }
                }
            })

            .state('menu.clientProductList', {
                url: '/client_product_list/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/clientProductList.html',
                        controller: 'clientProductListCtrl'
                    }
                }
            })

            .state('menu.localStoreInventory', {
                url: '/storeinventory/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/localStoreInventory.html',
                        controller: 'localStoreInventoryCtrl'
                    }
                }
            })

            .state('menu.topManufacturers', {
                url: '/topManufacturer',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/topManufacturers.html',
                        controller: 'topManufacturersCtrl'
                    }
                }
            })

            .state('menu.settings', {
                url: '/settings',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/settings.html',
                        controller: 'settingsCtrl'
                    }
                }
            })

            .state('menu.clientDetail', {
                url: '/client_detail/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/clientDetail.html',
                        controller: 'clientDetailCtrl'
                    }
                }
            })

            .state('menu.clientProjectList', {
                url: '/client_project_list/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/clientProjectList.html',
                        controller: 'clientProjectListCtrl'
                    }
                }
            })

            .state('menu.orderDetail', {
                url: '/order_detail/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/orderDetail.html',
                        controller: 'orderDetailCtrl'
                    }
                }
            })

            .state('menu.createOrder', {
                url: '/create_order/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/createOrder.html',
                        controller: 'createOrderCtrl'
                    }
                }
            })

            .state('menu.storeProfile', {
                url: '/storeprofile/:storeId',
                params: {
                    storeId: ""
                },
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/storeProfile.html',
                        controller: 'storeProfileCtrl'
                    }
                }
            })

            .state('menu.createNewStore', {
                url: '/create_store',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/createNewStore.html',
                        controller: 'createNewStoreCtrl'
                    }
                }
            })

            .state('menu.ownerControlPanel', {
                url: '/control-member',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/ownerControlPanel.html',
                        controller: 'ownerControlPanelCtrl'
                    }
                }
            })

            .state('menu.floorManagerControlPanel', {
                url: '/floor-manager-control',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/floorManagerControlPanel.html',
                        controller: 'floorManagerControlPanelCtrl'
                    }
                }
            })

            .state('menu.distributorControlPanel', {
                url: '/distributor-control/:key',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/distributorControlPanel.html',
                        controller: 'distributorControlPanelCtrl'
                    }
                }
            })

            .state('menu.createEmployee', {
                url: '/page19',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/createEmployee.html',
                        controller: 'createEmployeeCtrl'
                    }
                }
            })

            .state('menu.createDEmployee', {
                url: '/create_d_employee',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/createDEmployee.html',
                        controller: 'createDEmployeeCtrl'
                    }
                }
            })

            .state('menu.employees', {
                url: '/employees_list/:storeId',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/employees.html',
                        controller: 'employeesCtrl'
                    }
                }
            })

            .state('menu.distributor_employees', {
                url: '/distributor_employees_list',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/distributorEmployees.html',
                        controller: 'distributorEmployeesCtrl'
                    }
                }
            })

            .state('menu.stores', {
                url: '/page21',
                views: {
                    'side-menu21': {
                        templateUrl: 'templates/stores.html',
                        controller: 'storesCtrl'
                    }
                }
            })

        // $urlRouterProvider.otherwise('/side-menu21/home')

        $urlRouterProvider.otherwise(function($injector, $location) {
            var state = $injector.get('$state');
            if (window.localStorage['session']) {
                state.go('menu.floorManager');
            }else {
                state.go('menu.login');
            }

            return $location.path();
        })

    });