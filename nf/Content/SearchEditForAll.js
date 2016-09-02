'use strict';
var MODEL_CLASS_NAME = "NewFeed";
//var ENTITY_INSTANCE_URL = window.location + 'api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var ENTITY_INSTANCE_URL = window.location.origin + '/api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var Entity_REST_URL = window.location.origin + '/NewsFeeds/';
var MyDateFormat = "yyyy-MM-dd";

var App = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'smart-table', 'toastr']);
// My-Date-Picker directive & controller
App.controller('myDatePickerCtrl', function ($scope) {      
    $scope.open = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.opened = true;
    };
    $scope.format = MyDateFormat; //$scope.formats[0];
});

App.directive('myDatePicker', function ($parse) {
    function link(scope, element, attr, ctrls) { }
    //function link(scope, element, attr, ctrls) {}
    return {
        restrict: 'EA',
        templateUrl: window.location.origin + '/content/template/datepicker.html',
        link: link,
        controller: 'myDatePickerCtrl',
        require: ['ngModel'],
        scope: {
            //ngChange:'@',
            dt: '=ngModel' // this make 2-way binding works
        }

    }
});

//config toastr
App.config(function (toastrConfig) {
    angular.extend(toastrConfig, {
        allowHtml: true,
        closeButton: true,
        positionClass: 'toast-bottom-right'
    })
});

App.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, param) {
    //$scope.msgBody is array for showing multiple lines
    $scope.msgBody = param.msgBody instanceof Array ? param.msgBody : [param.msgBody];
    $scope.msgTitle = param.msgTitle;
    $scope.okButtonOnly = param.okButtonOnly == null ? false : param.okButtonOnly;
    $scope.ok = function () {
        $uibModalInstance.close("ok");
    };
    $scope.cancel = function () { $uibModalInstance.dismiss('cancel'); };
});

App.controller('SearchEntityController', ['SearchEntityService', '$scope', '$filter', 'toastr', '$uibModal', function (SearchEntityService, scope, filter, MessageService, $modal) {
    //App.controller('SearchEntityController', ['$scope', '$filter', 'SearchEntityService', function (scope,filter, SearchEntityService) {
    var self = this;

    self.editEntity = { id: 0, content: "", date_published: "" };    /* entity for editing self.editEntityChild = {};           // entity for editing*/
    self.entities = [];
    self.DateFormat = "date:'" + MyDateFormat + "'";
    self.displayEntities = [].concat(self.entities);    // smart-table's row source
    self.pageSize = 5; // display number of rows per page
    self.serverSidePaging = false;


    /*<--- Modal-related functions & variables begin--->*/
    self.modalResponse = "";
    self.showMessage = function (msgBody, msgTitle, size) {
        self.dialog(msgBody, msgTitle, true, size);
    };
    // initialized when page loaded for the first time
    angular.element(document).ready(function () {

        self.fetchAllEntities();
    });
    self.confirm = function (msgBody, msgTitle, size) {
        self.dialog(msgBody, msgTitle, false, size).then(
            function ok(response) { //"ok" if OK button clicked
                self.modalResponse = response;
                return response;
            },
            function cancel() { //"" if cancel button clicked
                console.log('Modal dismissed at: ' + new Date());
            }
        );
    };
    self.dialog = function (msgBody, msgTitle, okButtonOnly, size) {
        var modalInstance = $modal.open({
            backdrop: false,
            animation: true,
            templateUrl: window.location.origin + '/content/template/modal.html',
            controller: 'ModalInstanceCtrl',
            size: size,     //"sm","lg"
            resolve: { param: function () { return { msgBody: msgBody, msgTitle: msgTitle, okButtonOnly: okButtonOnly } } }
        });
        return modalInstance.result;
    };

    self.fetchAllEntities = function () {
        SearchEntityService.fetchAllEntities()
            .then(
                function (resultset) {
                    self.entities = angular.copy(resultset.rows);
                    self.displayEntities = angular.copy(resultset.rows);
                },
                function (errResponse) {
                    //alert(errResponse.data);
                    MessageService.error(errResponse.data);
                    console.error('Error while fetching Currencies');
                }
            );
    };
    /******************************************************************
     * ignore (1)Empty column (2) Array (child entity Field) (3) objectState field
     * if (isEmpty(val) || val instanceof Array || colName=="objectState") continue;
     * @returns {string}
     *******************************************************************/
    self.validateAll = function () {
        var errMsg = [];
        // (1) validate Root record

        if ((isEmpty(self.editEntity.content))) {
            errMsg.push("News Content should not be Empty.");
        }
        if ((isEmpty(self.editEntity.date_published))) {
            errMsg.push("Published Date should be a valid date.");
        }

        return errMsg;
    }
    //summary={Modified:0, Added:0, Deleted:0, Unchanged:0};
    self.readEditSummary = function (summary) {
        var msg = "";
        msg += summary.Modified > 0 ? "Number of modified records: " + summary.Modified + "<br/>" : "";
        msg += summary.Added > 0 ? "Number of inserted records: " + summary.Added + "<br/>" : "";
        msg += summary.Deleted > 0 ? "Number of deleted records: " + summary.Deleted + "<br/>" : "";
        return msg;
    };
    // recursively tally # of records for Modified/Added/Deleted/Unchanged
    self.editSummary = function (entity, tally) {
        if (tally == null) tally = { Modified: 0, Added: 0, Deleted: 0, Unchanged: 0 };
        if (entity instanceof Array) {
            for (var i = 0; i < entity.length; i++) { self.editSummary(entity[i], tally); }
        } else {
            if ('objectState' in entity) {
                // make sure ObjectState is valid
                if (!entity['objectState'] in ObjectState) MessageService.error(entity['objectState'] + " is not a valid ObjectState.(editSummary)");
                tally[entity['objectState']]++;  //if (entity['objectState']==ObjectState.Added) tally.Added++; if (entity['objectState']==ObjectState.Deleted) tally.Deleted++; if (entity['objectState']==ObjectState.Modified) tally.Modified++; if (entity['objectState']==ObjectState.Unchanged) tally.Unchanged++;
            }
            for (var field in entity) { if (entity[field] instanceof Array) self.editSummary(entity[field], tally); }
        }

        return tally;
    };
    // initialized when page loaded for the first time
    self.save = function () {
        self = this;
        //alert(Entity_REST_URL);
        var validationMsg = self.validateAll();
        if (validationMsg.length > 0) { self.showMessage(validationMsg, "Please make the following corrections"); return; };
        // show the summary of updates/deletes/inserts
        var summary = self.readEditSummary(self.editSummary(self.editEntity));
        MessageService.info(summary, "Saving...");
        SearchEntityService.save(self.editEntity, MODEL_CLASS_NAME)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (entity) {
                    self.fetchAllEntities();
                    self.editEntity.content = "";
                    self.editEntity.date_published = "";
                    MessageService.success(summary, "Saved...");
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    console.error('Error while updating current record.' + errResponse.data);
                }
            );
    };
    self.deleteById = function (id) {
        var deletedId = id;
        self.dialog("Are you sure to delete this record?", "Delete").then(
            function ok(response) { //"ok" if OK button clicked
                SearchEntityService.deleteById(id).then(
                    function (id) {
                        // remove deleted entity from self.entity List
                        for (var i in self.entities) {
                            if (self.entities[i]['id'] == deletedId) {
                                self.entities.splice(i, 1);
                                self.displayEntities = angular.copy(self.entities);
                                break;
                            }
                        }
                        
                        MessageService.success("The record has been successfully deleted.");
                    },
                    function (errResponse) {
                        MessageService.error(errResponse.data);
                        console.error('Error while deleting the record.');
                    }
                );
            },
            function cancel() { //"" if cancel button clicked
                console.log('Deletion cancelled... ' + new Date());
            }
        );

    };

}]);

App.factory('SearchEntityService', ['$http', '$q', function ($http, $q) {
    return {
        fetchAllEntities: function () {
            return $http.get(Entity_REST_URL + "getAll")
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        console.error('Error while fetching tableinfos');
                        return $q.reject(errResponse);
                    }
                );
        },
        // pass entity and entity class name (e.g. "com.james.domain.Employee") to server
        // when "id" is present, save will update the record, otherwise, it would insert a new record
        save: function (entity, modelClassName) {
            //alert("save");
            //var jsonStr = JSON.stringify({ entity: entity, modelClassName: modelClassName });
            var jsonStr = JSON.stringify(entity);
            console.log("saving...\n" + jsonStr);
            return $http.post(Entity_REST_URL + "Save", entity)
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        console.error('Error while updating the record:\n' + errResponse.data);
                        return $q.reject(errResponse);
                    }
                );
        },

        // delete a record
        deleteById: function (id) {
            return $http.post(Entity_REST_URL + "Delete", JSON.stringify({ id: id }))
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        //alert(errResponse.data);
                        console.error('Error while deleting the record');
                        return $q.reject(errResponse);
                    }
                );
        }
    };

}]);
// return true if a variable/object is empty
function isEmpty(obj) {
    // if obj is of Boolean type and false, considered NOT empty
    return (obj == undefined || obj == null || (obj + "").trim().length == 0);
};

//{ value: "64", text: "Ends With", desc: "ends with", applied_to: "String" }];
