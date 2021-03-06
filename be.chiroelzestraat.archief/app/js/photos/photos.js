angular.module('photos', ['security.authorization', 'ngResource'])

    .config(['$routeProvider', 'securityAuthorizationProvider', function ($routeProvider, securityAuthorizationProvider) {
        $routeProvider.when('/photos', {
            templateUrl: 'js/photos/photo-upload.html',
            controller: 'PhotoUploadCtrl'
        })
    }])
    .controller('PhotoUploadCtrl', ['$scope', 'fileReader', 'Event', function ($scope,fileReader,Events) {
        $scope.events = Events.query({
            type: 0
        });

        $scope.progress = function (percentDone) {
            console.log("progress: " + percentDone + "%");
        };

        $scope.done = function (files, data) {
            console.log("upload complete");
            console.log("data: " + JSON.stringify(data));
            writeFiles(files);
        };

        $scope.getData = function (files) {
            //this data will be sent to the server with the files
            return {
                eventid: $scope.eventid
            };
        };

        $scope.error = function (files, type, msg) {
            console.log("Upload error: " + msg);
            console.log("Error type:" + type);
            writeFiles(files);
        }

        $scope.previewImage = function(file){
            fileReader.readAsDataUrl(file, $scope)
                .then(function (result) {
                    if(!$scope.images){
                        $scope.images = [];
                    }
                    $scope.images.push(result);
                });
        }

        function writeFiles(files) {
            console.log('Files')
            for (var i = 0; i < files.length; i++) {
                console.log('\t' + files[i].name);
            }
        }
    }])
    .factory('photoService', ['$resource', 'configuration', function ($resource, configuration) {
        return $resource(configuration.ARCHIVE_SERVER_CONFIG + 'photo/:photoId', {}, {
        });
    }])
    .factory('fileUploader', ['$rootScope', '$q', function ($rootScope, $q) {
        var svc = {
            post: function (files, data, progressCb) {

                return {
                    to: function (uploadUrl) {
                        var deferred = $q.defer()
                        if (!files || !files.length) {
                            deferred.reject("No files to upload");
                            return;
                        }

                        var xhr = new XMLHttpRequest();
                        xhr.upload.onprogress = function (e) {
                            $rootScope.$apply(function () {
                                var percentCompleted;
                                if (e.lengthComputable) {
                                    percentCompleted = Math.round(e.loaded / e.total * 100);
                                    if (progressCb) {
                                        progressCb(percentCompleted);
                                    } else if (deferred.notify) {
                                        deferred.notify(percentCompleted);
                                    }
                                }
                            });
                        };

                        xhr.onload = function (e) {
                            $rootScope.$apply(function () {
                                var ret = {
                                    files: files,
                                    data: angular.fromJson(xhr.responseText)
                                };
                                deferred.resolve(ret);
                            })
                        };

                        xhr.upload.onerror = function (e) {
                            var msg = xhr.responseText ? xhr.responseText : "An unknown error occurred posting to '" + uploadUrl + "'";
                            $rootScope.$apply(function () {
                                deferred.reject(msg);
                            });
                        }

                        var formData = new FormData();

                        if (data) {
                            Object.keys(data).forEach(function (key) {
                                formData.append(key, data[key]);
                            });
                        }

                        for (var idx = 0; idx < files.length; idx++) {
                            formData.append(files[idx].name, files[idx]);
                        }

                        xhr.open("POST", uploadUrl);
                        xhr.send(formData);

                        return deferred.promise;
                    }
                };
            }
        };

        return svc;
    }])
    .factory('uuid', function () {
        var svc = {
            new: function () {
                function _p8(s) {
                    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
                    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
                }

                return _p8() + _p8(true) + _p8(true) + _p8();
            },

            empty: function () {
                return '00000000-0000-0000-0000-000000000000';
            }
        };

        return svc;
    });

angular.module("lvl.directives.fileupload", ['photos'])
    .directive('lvlFileUpload', ['uuid', 'fileUploader','configuration', function (uuid, fileUploader,configuration) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                chooseFileButtonText: '@',
                uploadFileButtonText: '@',
                maxFiles: '@',
                maxFileSizeMb: '@',
                autoUpload: '@',
                getAdditionalData: '&',
                onProgress: '&',
                onDone: '&',
                onError: '&',
                onPreview: '&'
            },
            template: '<div class=""><label class="btn btn-large btn-block" for="uploadPhoto">{{chooseFileButtonText}}</label>'+
                '<input type="file" style="display: none" id="uploadPhoto" multiple/>'+
                '<button class="btn btn-large btn-block btn-primary" type="button" ng-show="showUploadButton" ng-click="upload()" style="margin: 0.5em 0;">{{uploadFileButtonText}}</button></div>',
            compile: function compile(tElement, tAttrs, transclude) {
                var fileInput = angular.element(tElement.children()[0]);
                var fileLabel = angular.element(tElement.children()[1]);

                if (!tAttrs.maxFiles) {
                    tAttrs.maxFiles = 1;
                    fileInput.removeAttr("multiple")
                } else {
                    fileInput.attr("multiple", "multiple");
                }

                if (!tAttrs.maxFileSizeMb) {
                    tAttrs.maxFileSizeMb = 50;
                }

                var fileId = uuid.new();
                fileInput.attr("id", fileId);
                fileLabel.attr("for", fileId);

                return function postLink(scope, el, attrs, ctl) {
                    var uploadUrl = configuration.ARCHIVE_SERVER_CONFIG + 'photo';
                    scope.files = [];
                    scope.showUploadButton = false;

                    el.bind('change', function (e) {
                        if (!e.target.files.length) return;

                        scope.files = [];
                        var tooBig = [];
                        if (e.target.files.length > scope.maxFiles) {
                            raiseError(e.target.files, 'TOO_MANY_FILES', "Cannot upload " + e.target.files.length + " files, maxium allowed is " + scope.maxFiles);
                            return;
                        }

                        var reader = new FileReader();
                        for (var i = 0; i < scope.maxFiles; i++) {
                            if (i >= e.target.files.length) break;

                            var file = e.target.files[i];
                            scope.files.push(file);

                            if (file.size > scope.maxFileSizeMb * 1048576) {
                                tooBig.push(file);
                            }else{
                                scope.onPreview({file: file});
                            }
                        }

                        if (tooBig.length > 0) {
                            raiseError(tooBig, 'MAX_SIZE_EXCEEDED', "Files are larger than the specified max (" + scope.maxFileSizeMb + "MB)");
                            return;
                        }

                        if (scope.autoUpload && scope.autoUpload.toLowerCase() == 'true') {
                            scope.upload();
                        } else {
                            scope.$apply(function () {
                                scope.showUploadButton = true;
                            })
                        }
                    });

                    scope.upload = function () {
                        var data = null;
                        if (scope.getAdditionalData) {
                            data = scope.getAdditionalData();
                        }

                        if (angular.version.major <= 1 && angular.version.minor < 2) {
                            //older versions of angular's q-service don't have a notify callback
                            //pass the onProgress callback into the service
                            fileUploader
                                .post(scope.files, data, function (complete) {
                                    scope.onProgress({percentDone: complete});
                                })
                                .to(uploadUrl)
                                .then(function (ret) {
                                    scope.onDone({files: ret.files, data: ret.data});
                                }, function (error) {
                                    scope.onError({files: scope.files, type: 'UPLOAD_ERROR', msg: error});
                                })
                        } else {
                            fileUploader
                                .post(scope.files, data)
                                .to(uploadUrl)
                                .then(function (ret) {
                                    scope.onDone({files: ret.files, data: ret.data});
                                }, function (error) {
                                    scope.onError({files: scope.files, type: 'UPLOAD_ERROR', msg: error});
                                }, function (progress) {
                                    scope.onProgress({percentDone: progress});
                                });
                        }

                        resetFileInput();
                    };

                    function raiseError(files, type, msg) {
                        scope.onError({files: files, type: type, msg: msg});
                        resetFileInput();
                    }

                    function resetFileInput() {
                        var parent = fileInput.parent();

                        fileInput.remove();
                        var input = document.createElement("input");
                        var attr = document.createAttribute("type");
                        attr.nodeValue = "file";
                        input.setAttributeNode(attr);

                        var inputId = uuid.new();
                        attr = document.createAttribute("id");
                        attr.nodeValue = inputId;
                        input.setAttributeNode(attr);

                        attr = document.createAttribute("style");
                        attr.nodeValue = "opacity: 0;display:inline;width:0";
                        input.setAttributeNode(attr);

                        if (scope.maxFiles > 1) {
                            attr = document.createAttribute("multiple");
                            attr.nodeValue = "multiple";
                            input.setAttributeNode(attr);
                        }

                        fileLabel.after(input);
                        fileLabel.attr("for", inputId);

                        fileInput = angular.element(input);
                    }
                }
            }
        }
    }]);