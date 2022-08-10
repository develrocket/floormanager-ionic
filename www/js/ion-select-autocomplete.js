angular.module('ion-select-autocomplete', [])

    .directive('ionSelectAutocomplete', [
        '$ionicModal', '$rootScope',
        function ($ionicModal, $rootScope) {
            return {
                restrict: 'AE',
                transclude: true,
                replace: true,
                scope: {
                    multiselect: '=',
                    options: '=',
                    output: '='
                },
                template: "<input type='text' ng-model='displayVal'/>",
                link: function ($scope, element, attrs, ctrl, transclude) {

                    $scope.header = attrs.label;
                    $scope.label = attrs.labelKey;
                    $scope.value = attrs.valueKey;
                    $scope.predicate = 'checked';
                    $scope.reverse = true;
                    $scope.selectedOpt = {};
                    var templateName = '';

                    if ($scope.multiselect) {
                        $scope.output = $scope.output || [];
                        templateName = 'checkbox_autocomplete.html';
                        var labelArray = [];

                        $scope.toggleSelection = function toggleSelection(label, value) {
                            var idx = $scope.output.indexOf(value);
                            // is currently selected
                            if (idx > -1) {
                                $scope.output.splice(idx, 1);
                                labelArray.splice(idx, 1);
                                $scope.displayVal = labelArray.join(' , ');
                            }
                            // is newly selected
                            else {
                                $scope.output.push(value);
                                labelArray.push(label);
                                $scope.displayVal = labelArray.join(' , ');
                            }
                        };

                        $scope.ifChecked = function (value) {
                            return $scope.output.indexOf(value) > -1;
                        }
                    } else {
                        $scope.output = $scope.output || '';
                        templateName = 'radio_autocomplete.html';
                        $scope.onRadioClick = function (opt) {
                            $scope.output = opt[$scope.value];
                            $scope.displayVal = opt[$scope.label];
                            $scope.selectedOpt = opt;
                        }
                    }

                    $ionicModal.fromTemplateUrl(templateName, {
                        scope: $scope
                    }).then(function (modal) {
                        $scope.modal = modal;
                    });

                    $scope.closeModal = function (value) {
                        if (!$scope.output) {
                            $scope.output = value;
                            $scope.displayVal = value;
                        }
                        $rootScope.$broadcast('selected-autocomplete', {data: $scope.selectedOpt});
                        $scope.modal.hide();
                    }

                    element.bind("click", function (e) {
                        $scope.selectedOpt = {};
                        $scope.modal.show();
                    });

                }
            };
        }
    ])

    .run([
        '$templateCache',
        function ($templateCache) {
            var begin = "<ion-modal-view>" +
                "<ion-header-bar class='bar-dark'>" +
                "<h1 class='title'>{{header}}</h1>" +
                "<button class='button button-clear button-icon ion-close-circled item-right' ng-click='closeModal(searchText[label])'></button>" +
                "</ion-header-bar>" +
                "<ion-header-bar class='bar-subheader item-input-inset'>" +
                "<label class='item-input-wrapper'>" +
                "<i class='icon ion-ios-search placeholder-icon'></i>" +
                "<input type='search' placeholder='Search Distributor' ng-model='searchText[label]'>" +
                "</label>" +
                "</ion-header-bar>" +
                "<ion-content>" +
                "<ion-list>";

            var checkbox = "<ion-checkbox ng-repeat='opt in options | orderBy:predicate:reverse | filter:searchText' value='{{opt[value]}}' ng-checked='opt.checked = ifChecked(opt[value])' ng-click='toggleSelection(opt[label], opt[value])'>{{opt[label]}}</ion-checkbox>";

            var radio = "<ion-radio ng-repeat='opt in options | orderBy:predicate:reverse | filter:searchText' ng-model='output' ng-click='onRadioClick(opt)' ng-value='opt[value]'>{{opt[label]}} ({{opt['phone']}})</ion-radio>";

            var end = "</ion-list>" +
                "</ion-content>" +
                "</ion-modal-view>";

            $templateCache.put('checkbox_autocomplete.html', begin + checkbox + end);
            $templateCache.put('radio_autocomplete.html', begin + radio + end);
        }
    ]);
