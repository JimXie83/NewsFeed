'use strict';
var App = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'smart-table','toastr']);

App.controller('myDatePickerCtrl', function ($scope) {

    $scope.clear = function () {
        $scope.dt = null;
    };

    // Disable weekend selection
    $scope.disabled = function (date, mode) {
        return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.toggleMin = function () {
        $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.opened = true;
    };

    $scope.dateOptions = {
        formatYear: 'yyyy',
        startingDay: 1
    };

    //$scope.formats = ['yyyy-MM-dd','MM-dd-yyyy','dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = MyDateFormat; //$scope.formats[0];
    $scope.$watch('dt', function (newVal, oldVal) {
        $scope.ngModel = newVal;
    });
});

App.directive('myDatePicker', function ($parse) {
    function link(scope, element, attr, ctrls) {}
    return {
        restrict: 'EA',
        templateUrl: window.location.origin + '/content/template/datepicker.html',
        link: link,
        controller: 'myDatePickerCtrl',
        require: ['ngModel'],
        scope: {
            dt: '=ngModel' // this make 2-way binding works
        }

    }
});

//var ENTITY_INSTANCE_URL = window.location + 'api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var ENTITY_INSTANCE_URL = window.location.origin + '/api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var Entity_REST_URL = "";   //window.location.origin + '/api/emp/';
var MyDateFormat = "yyyy-MM-dd";
var ObjectState = {Unchanged: "Unchanged", Added: "Added", Modified: "Modified", Deleted: "Deleted"};
//var ObjectState = { Unchanged: 0, Added: 1, Modified: 2, Deleted: 4 };

//App.controller('SearchEntityController', function($scope, toastr) {
//    toastr.success('I don\'t need a title to live');
//});

App.controller('SearchEntityController', ['SearchEntityService', '$scope', '$filter','toastr', function (SearchEntityService, scope, filter, MessageService) {

    //App.controller('SearchEntityController', ['$scope', '$filter', 'SearchEntityService', function (scope,filter, SearchEntityService) {
    var self = this;
    self.searchEntity = {};         // search object
    self.savedSearchEntity = {};    // saved copy of search object
    self.editEntity = {};           // entity for editing
    //self.editEntityChild = {};           // entity for editing
    self.savedEditEntity = {};      // entity for editing
    self.entities = [];//[{"objectState":"Unchanged","id":78,"firstname":"james15","lastname":"smith","telephone":"410-2324444","email":"js@email.comXXXX","birthdate":1454821200000,"created":1454302800000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":80,"firstname":"james2","lastname":"Peter2","telephone":"343-232232","email":"jp@yahoo.comXXX","birthdate":573109200000,"created":571122000000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":82,"firstname":"John","lastname":"Doe","telephone":"874834343","email":"jd@QQ.com","birthdate":1432958400000,"created":1401422400000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":83,"firstname":"John2","lastname":"Doe2","telephone":"324324343","email":"jd2@gmail.com","birthdate":1461729600000,"created":1464667200000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":87,"firstname":"Hanover","lastname":"john","telephone":null,"email":"HJ@emal.com","birthdate":1464580800000,"created":928123200000,"empAwards":[],"empAddress":[]}];
    self.tempID = -99999999;        // temp ID for newly added record (parent or Child)
    self.DateFormat = "date:'" + MyDateFormat + "'";
    self.emptyEditEntity = {};    //with child-entity
    scope.form={};

    self.displayEntities = [].concat(self.entities);    // smart-table's row source
    //scope.predicates = ['firstname', 'lastname', 'birthdate', 'email'];
    //scope.selectedPredicate = scope.predicates[0];
    self.rowsPerPage = 4; // display number of rows per page
    // initialize when page loaded for the first time
    angular.element(document).ready(function () {
        SearchEntityService.getEmptyEntityInstance()
            .then(
                function (serverData) {
                    Entity_REST_URL=window.location.origin+serverData['EntityRestUrl'];
                    var entity=serverData['EmptyInstance'];
                    //self.searchEntity = entity;
                    //self.savedSearchEntity = angular.copy(self.searchEntity);
                    self.editEntity = angular.copy(self.searchEntity);
                    //self.savedEditEntity = angular.copy(self.searchEntity);
                    self.emptyEditEntity = angular.copy(entity); //hodling structure of editEntity
                    self.fetchAllEntities();
                    MessageService.success("Meta data successfully loaded...");
                }
            );
    });
    self.activeTab = 1;

    self.setActiveTab = function (activeTab) {
        self.activeTab = activeTab;
    };
    //*****************Search Functions**********************
    self.fetchAllEntities = function () {
        SearchEntityService.fetchAllEntities()
            .then(
                function (resultset) {
                    self.entities = resultset;
                    self.savedEditEntity = angular.copy(self.entities);
                    //MessageService.success("This is a success message");
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    //alert(errResponse.data);
                    console.error('Error while fetching all.');
                }
            );
    };
    self.search = function () {
        //self.searchEntity.birthdate='1988-2-2';
        SearchEntityService.search(self.searchEntity, MODEL_CLASS_NAME)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (resultList) {
                    self.entities = resultList;
                    //self.fetchAllEntities();
                },
                function (errResponse) {
                    alert(errResponse.data);
                    console.error('Error while updating current record.');
                }
            );
    };
    self.clearSearch = function () {
        // preserve a copy for RE-DO
        self.savedSearchEntity = angular.copy(self.searchEntity);
        // retrieve each input field of search View Model, set all to empty
        // id set to null
        for (var fieldName in self.searchEntity) {
            self.searchEntity[fieldName] = null;
        }
    };
    self.reDoSearch = function () { /* copy old values back from saved copy*/
        self.searchEntity = angular.copy(self.savedSearchEntity);
    };
    //*****************edit Functions**********************
    self.save = function () {
        SearchEntityService.save(self.entities, MODEL_CLASS_NAME)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (entity) {
                    //self.editEntity = entity;
                    self.fetchAllEntities();
                    MessageService.success("Changes successfully saved...");
                },
                function (errResponse) {
                    alert(errResponse.data);
                    console.error('Error while saving....');
                }
            );
    };
    //********** Insert a new record*************
    self.newEdit = function () {
        var temp=angular.copy(self.emptyEditEntity);
        temp['id'] = self.tempID++;
        // set objectState to ObjectState.Added
        if (temp['objectState'] != "undefined") { temp['objectState'] = ObjectState.Added; }
        self.entities.push(temp);
        MessageService.success("Adding a new record...");
        //self.setActiveTab(2);
    };
    self.addChild = function () {
        var temp=angular.copy(self.emptyEditEntity);
        temp['id'] = self.tempID++; // set temp ID
        // set objectState to ObjectState.Added
        if (temp['objectState'] != "undefined") { temp['objectState'] = ObjectState.Added; }
        self.entities.push(temp);
        MessageService.success("Adding a new record...");
    };
    self.removeChild = function (id) {
        self = this;
        for (var i = 0; i < self.entities.length; i++) {
            if (self.entities[i]['id'] === id) {
                if (self.entities[i]['id'] <= 0) {
                    self.entities.splice(i, 1);
                    MessageService.success("New record discarded...");
                } else {
                    self.entities[i]['objectState'] = ObjectState.Deleted;
                    MessageService.success("Existing record will be deleted when you save changes...");
                }
                return;
            }
        }
        MessageService.error("Row ID:" + id + " not found...");
    };
    // on modificatoin, set objectState to "Modified" for existing record
    self.onChange = function (id) {
        self = this;
        for (var i = 0; i < self.entities.length; i++) {
            if (self.entities[i]['id'] === id) {    //found the record
                if (self.entities[i]['id'] >= 0) {  //existing record modified
                    if (self.entities[i]['objectState'] !== ObjectState.Modified) {
                        MessageService.info("Record modified...");
                    }
                    self.entities[i]['objectState'] = ObjectState.Modified;
                }
                return;
            }
        }
        MessageService.error("Row ID:" + id + " not found...");
    };
    self.showChild = function (objectState) {
        console.log("objectstate=" + objectState);
        if (objectState == null || objectState != ObjectState.Deleted) {
            return true;
        }
        return false;
    };
    self.unDoEdit = function () { /* copy old values back from saved copy*/
        self.editEntity=angular.copy(self.entities);    // save changes for re-do
        self.entities = angular.copy(self.savedEditEntity); //self.savedEditEntity is original entities
        scope.myForm.$setPristine(); //reset Form
        MessageService.success("Changes reverted...");
    };
    self.reDoEdit = function () { /* copy old values back from saved copy*/
        self.entities=angular.copy(self.editEntity);    // save changes for un-do
        self.editEntity = angular.copy(self.savedEditEntity);
        //$scope.myForm.$setPristine(); //reset Form
        MessageService.success("Changes re-applied...");
    };
    self.deleteById = function (id) {
        SearchEntityService.deleteById(id)
            .then(
                function (id) {
                    self.fetchAllEntities();
                    self.reset();
                },
                function (errResponse) {
                    console.error('Error while deleting the record.');
                }
            );
    };

    // when click on Edit button
    self.edit = function (id) {
        SearchEntityService.getEntityById(id)
            .then(
                function (entity) {
                    self.editEntity = angular.copy(entity);
                    self.savedEditEntity = angular.copy(entity);
                    self.setActiveTab(2);
                }
            );

        ////alert("editing...");
        //console.log('id to be edited', id);
        //for (var i = 0; i < self.entities.length; i++) {
        //    if (self.entities[i].id == id) {
        //        self.editEntity = angular.copy(self.entities[i]);
        //        //for (var fieldName in self.entities[i]) { self.editEntity[fieldName] = "xxxx"; }
        //        self.savedEditEntity = angular.copy(self.editEntity);
        //        self.setActiveTab(2);
        //        break;
        //    }
        //}
        //self.editEntity.birthdate = '1988-2-2';
    };

    self.fillField = function () {
        for (var fieldName in self.editEntity) {
            if (fieldName != 'id') self.editEntity[fieldName] = 'xx' + Math.floor(Math.random() * 1000);
        }
    };

    //self.cancel = function () { /* copy old values back from saved copy*/
    //    self.searchEntity = angular.copy(self.savedEntity);
    //};


    self.debug = function () {
        debugger;
    };
    self.reset = function () {
        self.clearSearch();
        scope.myForm.$setPristine(); //reset Form
    };
}]);

App.factory('SearchEntityService', ['$http', '$q', function ($http, $q) {

    return {
        fetchAllEntities: function () {
            return $http.get(Entity_REST_URL)
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        console.error('Error while fetching records');
                        return $q.reject(errResponse);
                    }
                );
        },
        search: function (searchEntity, searchModelClassName) {
            var jsonStr = JSON.stringify({entity: searchEntity, modelClassName: searchModelClassName});
            console.log("searching...\n" + jsonStr);
            console.log(jsonStr);
            return $http.post(Entity_REST_URL+"search", jsonStr)
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        console.error('Error while fetching records of ' + searchModelClassName);
                        return $q.reject(errResponse);
                    }
                );
        },

        // pass entity and entity class name (e.g. "com.james.domain.Employee") to server
        // when "id" is present, save will update the record, otherwise, it would insert a new record
        save: function (entity, modelClassName) {

            var jsonStr = JSON.stringify({entity: entity, modelClassName: modelClassName});
            console.log("saving...\n" + jsonStr);
            return $http.post(Entity_REST_URL+"batch", jsonStr)
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
        // edit a record by retrieving it from server
        getEntityById: function (id) {
            return $http.get(Entity_REST_URL + id)
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        console.error('Error retrieving record with id=' + id);
                        return $q.reject(errResponse);
                    }
                );
        },
        // use entity type to get an empty instance
        getEmptyEntityInstance: function () {
            return $http.get(ENTITY_INSTANCE_URL)
                .then(
                    function (response) {
                        return response.data;
                    },
                    function (errResponse) {
                        console.error('Error while getEmptyEntityInstance');
                        return $q.reject(errResponse);
                    }
                );
        },
        // delete a record
        deleteById: function (id) {
            return $http.delete(Entity_REST_URL + id)
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

