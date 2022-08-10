angular.module('app.services', ['firebase'])

    .run(function () {
        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyC0E5RZ9EtsvHEu_3Oz99Pu__qptt6OA0c",
            authDomain: "alphafloor-1953d.firebaseapp.com",
            databaseURL: "https://alphafloor-1953d.firebaseio.com",
            storageBucket: "alphafloor-1953d.appspot.com",
            messagingSenderId: "471318310829"
        };
        firebase.initializeApp(config);
    })

    .factory('Auth', function () {
        if (window.localStorage['session']) {
            var _user = JSON.parse(window.localStorage['session']);
        }
        if (window.localStorage['store']) {
            var _store = JSON.parse(window.localStorage['store']);
        }

        var setUser = function (session) {
            _user = {
                $id: session.$id,
                type: session.type,
                stores: session.stores,
                mainStore: session.mainStore
            };
            window.localStorage['session'] = JSON.stringify(_user);
        };

        var setStore = function(store) {
            console.log(store);
            _store = {
                $id: store.$id
            };
            window.localStorage['store'] = JSON.stringify(_store);
        };

        return {
            setUser: setUser,
            setStore: setStore,
            isLoggedIn: function () {
                return _user ? true : false;
            },
            getUser: function () {
                return _user;
            },
            getStore: function() {
                return _store;
            },
            logout: function () {
                window.localStorage.removeItem("session");
                window.localStorage.removeItem("list_dependents");
                _user = null;
            }
        };
    })

    .factory('PdfService', function ($q) {
        function base64ToUint8Array(base64) {
            var raw = atob(base64);
            var uint8Array = new Uint8Array(raw.length);
            for (var i = 0; i < raw.length; i++) {
                uint8Array[i] = raw.charCodeAt(i);
            }
            return uint8Array;
        }

        function createSubDir(dirname, callback, error) {

            try {
                if (ionic.Platform.platform() != 'android') {
                    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                        fileSystem.root.getDirectory(dirname, {create: true}, callback, error);
                    }, error);
                } else {
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function (fileSystem) {
                        fileSystem.getDirectory(dirname, {create: true, exclusive: false}, callback, error);
                    }, error);
                }
            } catch (err) {
                error();
            }
        }

        function formatDate() {
            var d = new Date(),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear(),
                hours = d.getHours(),
                minutes = d.getMinutes(),
                seconds = d.getSeconds();

            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;

            return [year, month, day, hours, minutes, seconds].join('-');
        }

        function createPdf(data, fileName) {

            var folder_name = {
                folder_name: formatDate(),
                file_name: fileName + '.pdf'
            };

            return $q(function (resolve, reject) {
                var pdf = pdfMake.createPdf(data);
                // pdf.getBase64(function(output) {
                //     resolve(base64ToUint8Array(output));
                // });
                pdf.getBuffer(function (buffer) {
                    var utf8 = new Uint8Array(buffer);
                    var binaryArray = utf8.buffer;

                    var dirname = folder_name.folder_name;
                    createSubDir(dirname, function (dirEntry) {
                        dirEntry.getFile(folder_name.file_name, {create: true, exclusive: true}, function (fileEntry) {
                            fileEntry.createWriter(function (writer) {
                                writer.write(binaryArray);
                                resolve(dirEntry.fullPath + folder_name.file_name);
                            }, function () {
                                reject('Failed to create ' + folder_name.file_name);
                            });
                        });
                    }, function () {
                        reject("Failed to create subdirectory");
                    })
                })
            });
        }

        return {
            createPdf: createPdf
        };
    })

    .factory('QRCode', ['$window', function ($window) {

        var canvas2D = !!$window.CanvasRenderingContext2D,
            levels = {
                'L': 'Low',
                'M': 'Medium',
                'Q': 'Quartile',
                'H': 'High'
            },
            draw = function (context, qr, modules, tile, color) {
                for (var row = 0; row < modules; row++) {
                    for (var col = 0; col < modules; col++) {
                        var w = (Math.ceil((col + 1) * tile) - Math.floor(col * tile)),
                            h = (Math.ceil((row + 1) * tile) - Math.floor(row * tile));

                        context.fillStyle = qr.isDark(row, col) ? color.foreground : color.background;
                        context.fillRect(Math.round(col * tile),
                            Math.round(row * tile), w, h);
                    }
                }
            }
        generate = function (qrData) {
            var canvas = document.createElement("canvas"),
                context = canvas2D ? canvas.getContext('2d') : null,
                trim = /^\s+|\s+$/g,
                error,
                version,
                errorCorrectionLevel,
                data,
                size,
                modules,
                tile,
                qr,
                $img,
                color = {
                    foreground: '#000',
                    background: '#fff'
                },
                setColor = function (value) {
                    color.foreground = value || color.foreground;
                },
                setBackground = function (value) {
                    color.background = value || color.background;
                },
                setVersion = function (value) {
                    version = Math.max(1, Math.min(parseInt(value, 10), 40)) || 5;
                },
                setErrorCorrectionLevel = function (value) {
                    errorCorrectionLevel = value in levels ? value : 'M';
                },
                setData = function (value) {
                    if (!value) {
                        return;
                    }

                    data = value.replace(trim, '');
                    qr = qrcode(version, errorCorrectionLevel);
                    qr.addData(data);

                    try {
                        qr.make();
                    } catch (e) {
                        var newVersion;
                        if (version >= 40) {
                            throw new Error('Data is too long', e);
                        }
                        newVersion = version + 1;
                        setVersion(newVersion);
                        console.warn('qrcode version is too low and has been incremented to', newVersion)
                        setData(value);
                        return;
                    }

                    error = false;
                    modules = qr.getModuleCount();
                },
                setSize = function (value) {
                    size = parseInt(value, 10) || modules * 2;
                    tile = size / modules;
                    canvas.width = canvas.height = size;
                };

            canvas.classList.add('qrcode');

            if (!qrData) {
                return;
            }

            setColor('');
            setBackground('');
            setVersion('');
            setErrorCorrectionLevel('');
            setData(qrData);
            setSize('');

            draw(context, qr, modules, tile, color);

            return canvas.toDataURL('image/png');
        };

        return {
            generate: generate
        };
    }])

    .service('ProductService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("products");
        var products = $firebaseArray(ref);

        var clientsRef = firebase.database().ref().child("users");
        var clients = $firebaseArray(clientsRef);

        return {
            products: products,

            clientProducts: function(key) {

                var q = $q.defer();

                var clientRef = clientsRef.child(key);
                var client = $firebaseObject(clientRef);
                client.$loaded().then(function(res) {
                    var products = [];
                    if (client.products) {
                        var productKeys = Object.keys(client.products);
                        for (var i = 0; i < productKeys.length; i ++) {
                            if (client.products[productKeys] == 0) continue;
                            var productRef = ref.child(productKeys[i]);
                            products.push($firebaseObject(productRef));
                        }
                    }
                    q.resolve(products);
                }).catch(function(err) {
                    console.log(err);
                });

                return q.promise;
            },

            findProduct: function (key) {
                var productRef = ref.child(key);
                return $firebaseObject(productRef);
            },

            addProduct: function (data) {
                var q = $q.defer();

                products.$add(data).then(function (res) {
                    q.resolve(res);
                });

                return q.promise;
            }
        };
    }])

    .service('CommonService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

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

        return {
            getCurrentDate: getCurrentDate
        };
    }])

    .service('EmployeeService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("employees");
        var employees = $firebaseArray(ref);

        return {
            employees: employees,

            findEmployee: function (key) {
                var employeeRef = ref.child(key);
                return $firebaseObject(employeeRef);
            },

            addEmployee: function (data) {
                var q = $q.defer();

                employees.$add(data).then(function (res) {
                    q.resolve(res);
                });

                return q.promise;
            }
        };
    }])

    .service('StoreService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("stores");
        var stores = $firebaseArray(ref);

        return {
            stores: stores,

            storeEmployees: function (key) {
                var employeeRef = ref.child(key).child('employees');
                return $firebaseArray(employeeRef);
            },

            storeProducts: function (key) {
                var productRef = ref.child(key).child('products');
                return $firebaseArray(productRef);
            },

            findStore: function (key) {
                var storeRef = ref.child(key);
                return $firebaseObject(storeRef);
            },

            addStore: function (data) {
                var q = $q.defer();

                stores.$add(data).then(function (res) {
                    q.resolve(res);
                });

                return q.promise;
            }
        };
    }])

    .service('UserService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("users");
        var users = $firebaseArray(ref);

        return {
            users: users,

            addUser: function (userData) {
                var q = $q.defer();
                var isExist = false;

                for (var i = 0; i < users.length; i++) {
                    var item = users[i];
                    if (item.email.toLowerCase() == userData.email.toLowerCase()) {

                        var data = {
                            result: 'failed',
                            msg: 'Email is already registered.'
                        };

                        q.reject(data);

                        isExist = true;

                        break;
                    }
                }

                if (!isExist) {
                    users.$add(userData).then(function (res) {
                        var data = {
                            result: 'success',
                            user: users.$getRecord(res.key)
                        };

                        q.resolve(data);
                    });
                }

                return q.promise;
            },

            findUser: function (key) {
                console.log('user-key:', key);
                var userRef = ref.child(key);
                return $firebaseObject(userRef);
            }
        };
    }])

    .service('OrderService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("orders");
        var orders = $firebaseArray(ref);

        return {
            orders: orders,

            findOrder: function (key) {
                var orderRef = ref.child(key);
                return $firebaseObject(orderRef);
            },

            addOrder: function(data) {
                var q = $q.defer();

                orders.$add(data).then(function (res) {
                    q.resolve(res.key);
                });

                return q.promise;
            }
        };
    }])

    .service('OrderTrackersService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("order_trackers");
        var orderTrackers = $firebaseArray(ref);

        return {
            orderTrackers: orderTrackers,

            findTracker: function (key) {
                var orderRef = ref.child(key);
                return $firebaseObject(orderRef);
            },

            addTracker: function(data) {
                var q = $q.defer();

                orderTrackers.$add(data).then(function (res) {
                    q.resolve(res.key);
                });

                return q.promise;
            }
        };
    }])

    .service('ClientService', ['$firebaseArray', '$q', '$ionicLoading', '$firebaseObject', function ($firebaseArray, $q, $ionicLoading, $firebaseObject) {

        var ref = firebase.database().ref().child("clients");
        var clients = $firebaseArray(ref);

        return {
            clients: clients,

            findClient: function (key) {
                var clientRef = ref.child(key);
                return $firebaseObject(clientRef);
            },

            addClient: function (data) {
                var q = $q.defer();

                clients.$add(data).then(function (res) {
                    q.resolve(res);
                });

                return q.promise;
            }
        };
    }])

    .service('DistributorService', ['$firebaseArray', '$q', '$ionicLoading', function ($firebaseArray, $q, $ionicLoading) {

        var ref = firebase.database().ref().child("users").orderByChild("type").equalTo(4);
        var distributors = $firebaseArray(ref);

        return {
            distributors: distributors,

            addDistributor: function (name, phone) {

                var distributor;

                for (var i = 0; i < distributors.length; i++) {
                    distributor = distributors[i];
                    if (distributor.name == name && distributor.phone == phone) return;
                }

                distributor = {
                    name: name,
                    phone: phone
                };

                distributors.$add(distributor);
            }
        };
    }])

    .service('MaterialService', ['$firebaseArray', '$q', '$ionicLoading', function ($firebaseArray, $q, $ionicLoading) {

        var ref = firebase.database().ref().child("materials");
        var materials = $firebaseArray(ref);

        return {
            materials: materials,

            addMaterial: function (name) {
                var material = {
                    name: name
                };

                materials.$add(material);
            }
        };
    }])

    .service('ProjectService', ['$firebaseArray', '$q', '$ionicLoading', function ($firebaseArray, $q, $ionicLoading) {

        var ref = firebase.database().ref().child("projects");
        var projects = $firebaseArray(ref);

        return {
            projects: projects,

            addProject: function (name) {
                var project = {
                    name: name
                };

                projects.$add(project);
            }
        };
    }])

    .service('AuthService', ['$firebaseArray', '$q', '$ionicLoading', function ($firebaseArray, $q, $ionicLoading) {

        var ref = firebase.database().ref().child("users");
        var users = $firebaseArray(ref);

        return {
            doSignUp: function (authData) {
                var q = $q.defer();
                var isExist = false;

                for (var i = 0; i < users.length; i++) {
                    var item = users[i];
                    if (item.email.toLowerCase() == authData.email.toLowerCase()) {

                        var data = {
                            result: 'failed',
                            msg: 'Email is already registered.'
                        };

                        q.reject(data);

                        isExist = true;

                        break;
                    }
                }

                if (!isExist) {
                    users.$add(authData).then(function (res) {
                        var data = {
                            result: 'success',
                            user: users.$getRecord(res.key)
                        };

                        q.resolve(data);
                    });
                }

                return q.promise;
            },
            doLogin: function (authData) {
                var q = $q.defer();

                var data = {
                    result: '',
                    user: {},
                    msg: ''
                };

                for (var i = 0; i < users.length; i++) {
                    var item = users[i];
                    if (item.email.toLowerCase() == authData.email.toLowerCase() && item.password == authData.password) {

                        data.result = 'success';
                        data.user = item;

                        q.resolve(data);
                    }
                }

                data.result = 'failed';
                data.msg = 'Email or password is incorrect.';

                q.reject(data);

                return q.promise;
            }
        }
    }]);