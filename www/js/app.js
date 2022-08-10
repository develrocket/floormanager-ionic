// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('app', ['ionic', 'app.controllers', 'app.routes', 'app.directives', 'app.services', 'firebase', 'ngCordova', 'ion-select-autocomplete', 'monospaced.qrcode', 'pdf', 'ionic-toast', 'ionic-datepicker', 'ionic-timepicker', 'ui.mask', 'ui.utils.masks'])

    .config(function ($ionicConfigProvider, $sceDelegateProvider, ionicDatePickerProvider, ionicTimePickerProvider) {


        $sceDelegateProvider.resourceUrlWhitelist(['self', '*://www.youtube.com/**', '*://player.vimeo.com/video/**']);

        ionicTimePickerProvider.configTimePicker({
            inputTime: ((new Date()).getHours() * 60 * 60) +( (new Date()).getMinutes() * 60)
        })
    })

    .run(function ($ionicPlatform, Auth, $state, $rootScope, $ionicPopup, $ionicHistory) {

        //stateChange event
        $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
            console.log(toState.name);
            if (!Auth.isLoggedIn() && toState.name != 'menu.login' && toState.name != 'menu.signup'){ //Assuming the AuthService holds authentication logic
                // User isn’t authenticated
                $state.go("menu.login");
                event.preventDefault();
            }
        });
        // Initialize Firebase Here

        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });

        $rootScope.$ionicGoBack = function(backButton) {
            console.log($state.current.name);

            if ($state.current.name == "menu.addClient" || $state.current.name == "menu.addProduct" || $state.current.name == "menu.createNewStore") {
                $ionicPopup.show({
                    title: 'Are you sure want to go back? You will loose your work.',
                    buttons: [
                        { text: 'Cancel', onTap: function(e) { return true; } },
                        {
                            text: '<b>Ok</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                                $ionicHistory.goBack();
                            }
                        },
                    ]
                }).then(function(res) {
                    console.log('Tapped!', res);
                }, function(err) {
                    console.log('Err:', err);
                }, function(msg) {
                    console.log('message:', msg);
                });
            }else {
                $ionicHistory.goBack();
            }
        }
    })

    /*
     This directive is used to disable the "drag to open" functionality of the Side-Menu
     when you are dragging a Slider component.
     */
    .directive('disableSideMenuDrag', ['$ionicSideMenuDelegate', '$rootScope', function ($ionicSideMenuDelegate, $rootScope) {
        return {
            restrict: "A",
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {

                function stopDrag() {
                    $ionicSideMenuDelegate.canDragContent(false);
                }

                function allowDrag() {
                    $ionicSideMenuDelegate.canDragContent(true);
                }

                $rootScope.$on('$ionicSlides.slideChangeEnd', allowDrag);
                $element.on('touchstart', stopDrag);
                $element.on('touchend', allowDrag);
                $element.on('mousedown', stopDrag);
                $element.on('mouseup', allowDrag);

            }]
        };
    }])

    /*
     This directive is used to open regular and dynamic href links inside of inappbrowser.
     */
    .directive('hrefInappbrowser', function () {
        return {
            restrict: 'A',
            replace: false,
            transclude: false,
            link: function (scope, element, attrs) {
                var href = attrs['hrefInappbrowser'];

                attrs.$observe('hrefInappbrowser', function (val) {
                    href = val;
                });

                element.bind('click', function (event) {

                    window.open(href, '_system', 'location=yes');

                    event.preventDefault();
                    event.stopPropagation();

                });
            }
        };
    });