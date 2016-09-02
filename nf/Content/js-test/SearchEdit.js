'use strict';
//var ENTITY_INSTANCE_URL = window.location + 'api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var ENTITY_INSTANCE_URL = window.location.origin + '/api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var Entity_REST_URL = "";   //window.location.origin + '/api/emp/';
var MyDateFormat = "yyyy-MM-dd";
var ObjectState = {Unchanged: "Unchanged", Added: "Added", Modified: "Modified", Deleted: "Deleted"}; //var ObjectState = { Unchanged: 0, Added: 1, Modified: 2, Deleted: 4 };
var App = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'smart-table','toastr']);
// My-Date-Picker directive & controller
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
    function link(scope, element, attr, ctrls) { }

    //function link(scope, element, attr, ctrls) {}
    return {
        restrict: 'EA',
        templateUrl: window.location.origin + '/content/template/datepicker.html',
        link: link,
        controller: 'myDatePickerCtrl',
        require: ['ngModel'],
        scope: {
            //ngModel: '=ngModel',
            dt: '=ngModel' // this make 2-way binding works
        }

    }
});

//App.config(function(stConfig) {
//    stConfig.pagination.itemsByPage=5; //.template = 'my-custom-pagination-tmpl.html';
//});

App.controller('SearchEntityController', ['SearchEntityService', '$scope', '$filter', 'toastr',function (SearchEntityService, scope, filter, MessageService) {
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
    scope.form={};  //for setting form to pristine
    self.isLoading = true;     //true when smart-table is loading
    self.displayEntities = [].concat(self.entities);    // smart-table's row source
    //scope.predicates = ['firstname', 'lastname', 'birthdate', 'email'];
    //scope.selectedPredicate = scope.predicates[0];
    self.pageSize = 3; // display number of rows per page
    self.totalCount=0;
    self.metaDataLoaded=false;
    self.tableState={};

    self.columns= [ {column: 'id',        caption: 'ID',        isSort: true },
                    {column: 'firstname', caption: 'First Name',isSort: true},
                    {column: 'lastname',  caption: 'Last Name', isSort: true},
                    {column: 'telephone', caption: 'Phone',     isSort: true},
                    {column: 'email',     caption: 'Email',     isSort: true},
                    {column: 'birthdate', caption: 'Birthdate', isSort: true},
                    {column: 'created',   caption: 'created',   isSort: true}];

    self.st_captions=['ID','First Name','Last Name','Phone','Email','Birthdate','created'];
    self.st_fields=['id','firstname','lastname','telephone','email','birthdate','created'];

    self.fld_cap={captions:['ID','First Name','Last Name','Phone','Email','Birthdate','created'],
                    fields: ['id','firstname','lastname','telephone','email','birthdate','created']};


    //$scope.datePicker = (function () {
    //    var method = {};
    //    method.instances = [];
    //    method.open = function ($event, instance) {
    //        $event.preventDefault();
    //        $event.stopPropagation();
    //        method.instances[instance] = true;
    //    };
    //    //method.templateUrl="";
    //    method.options = {
    //        'show-weeks': false,
    //        startingDay: 0
    //    };
    //
    //    var formats = ['MM-dd-yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    //    method.format = formats[0];
    //
    //    return method;
    //}());

    // initialized when page loaded for the first time
    angular.element(document).ready(function () {
        SearchEntityService.getEmptyEntityInstance()
            .then(
                function (serverData) {
                    console.log("self="+self);
                    Entity_REST_URL=window.location.origin+serverData['EntityRestUrl'];
                    var entity=serverData['EmptyInstance'];
                    self.searchEntity = angular.copy(entity);
                    self.savedSearchEntity = angular.copy(self.searchEntity);
                    self.editEntity = angular.copy(self.searchEntity);
                    self.savedEditEntity = angular.copy(self.searchEntity);
                    self.emptyEditEntity = angular.copy(entity); //hodling structure of editEntity

                    self.metaDataLoaded=true;
                    //self.fetchAllEntities();
                    MessageService.success("Meta information successfully loaded.");
                }
            );
    });
    self.activeTab = 1;

    self.setActiveTab = function (tabToSet) {
        self.activeTab = tabToSet;
    };
    //*****************Search Functions**********************
    self.fetchAllEntities = function () {
        SearchEntityService.fetchAllEntities()
            .then(
                function (resultset) {
                    self.entities = resultset;
                    MessageService.success(self.entities.length+" records retrieved..");
                },
                function (errResponse) {
                    //alert(errResponse.data);
                    MessageService.error(errResponse.data);
                    console.error('Error while fetching Currencies');
                }
            );
    };
    self.getServerData = function (tableState) {
        console.log("getServerData: self="+self);
tableState.pagination.numberOfPages=Math.ceil(self.totalCount/self.pageSize) ;
        if (!self.metaDataLoaded) {//set self.tableState
            self.tableState=angular.copy(tableState);
            return;
        } // if MetaData not loaded yet, don't call server
        self.isLoading = true;
        var pageInfo={
            start: self.tableState.pagination.start || 0,
            pageSize: self.tableState.pagination.number || self.pageSize,
            orderBy: self.tableState.sort.predicate || " ",
            asc:  self.tableState.sort.reverse || " "
        };
        MessageService.info("Searching...");
        SearchEntityService.search(self.searchEntity, MODEL_CLASS_NAME, pageInfo, tableState)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (resultList) {
                    console.log("getServerData->SearchEntityService.search: self="+self);
                    self.entities = angular.copy(resultList.serverData);
                    self.displayEntities = angular.copy(resultList.serverData);
                    //set the pagination state with server-data
                    self.tableState.pagination = {
                        start:resultList.start, // start index
                        totalItemCount: resultList.totalCount,
                        number:resultList.pageSize, //number of item on a page
                        numberOfPages:Math.ceil(resultList.totalCount/resultList.pageSize) //total number of pages
                    }

                    self.isLoading = false;
                    //MessageService.clear();
                    MessageService.success(self.entities.length+" records retrieved..\n\n Total records found: "+resultList.totalCount);
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    console.error('Error while updating current record.');
                }
            );
    };
    self.search = function () {

        var pageInfo={ start: 0, pageSize: self.pageSize};
        MessageService.info("Searching...");
        SearchEntityService.search(self.searchEntity, MODEL_CLASS_NAME, pageInfo)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (resultList) {
                    self.entities = angular.copy(resultList.serverData);
                    self.displayEntities = angular.copy(resultList.serverData);

                    self.totalCount=Math.ceil(resultList.totalCount/resultList.pageSize);
                    //self.tableState.pagination.numberOfPages = Math.ceil(resultList.totalCount/resultList.pageSize);//set the number of pages so the pagination can update
                    self.isLoading = false;
                    MessageService.success(self.entities.length+" records retrieved..\n\n Total records found: "+resultList.totalCount);
                    //self.entities = resultList;
                    //MessageService.success(self.entities.length+" records retrieved..");;
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
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
        scope.searchForm.$setPristine(); //reset search Form
    };
    self.reDoSearch = function () { /* copy old values back from saved copy*/
        self.searchEntity = angular.copy(self.savedSearchEntity);
    };
    //*****************edit Functions**********************
    self.save = function () {
        SearchEntityService.save(self.editEntity, MODEL_CLASS_NAME)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (entity) {
                    self.editEntity = angular.copy(entity);
                    scope.editForm.$setPristine(); //reset Form
                    MessageService.success("Changes have been saved successfully.");
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    console.error('Error while updating current record.'+errResponse.data);
                }
            );
    };
    //********** Insert a new record*************
    self.newEdit = function () {
        MessageService.info("Editing selected record.");
        self.savedEditEntity = angular.copy(self.editEntity);
        self.editEntity = angular.copy(self.emptyEditEntity);
        self.editEntity['id'] = self.tempID++;
        self.setActiveTab(2);
        MessageService.info("Adding a new record..");
    };
    // add a child entity
    self.addChild = function (childTable) {
        self = this;
        var temp = angular.copy(self.emptyEditEntity[childTable][0]);
        temp['id'] = self.tempID++;   //make ID unique
        // set editEntity's ObjectState to ObjectState.Added
        if (temp['objectState'] != "undefined") {
            temp['objectState'] = ObjectState.Added;
        }else {
            MessageService.error("ObjectState is not present.");
        }
        self.editEntity[childTable].push(temp);
        MessageService.info("Adding a new item.");
    };
    // remove a child enitty
    self.removeChild = function (childTable, id) {
        self = this;
        var index=self.findChild(self.editEntity[childTable],id);
        if (index>=0){  //found the child entity
            //don't change ObjectState of newly inserted child
            if (self.editEntity[childTable][index]['objectState'] == ObjectState.Added) {
                self.editEntity[childTable].splice(index, 1);
                MessageService.success("Removing newly inserted item.");
            } else {
                self.editEntity[childTable][index]['objectState'] = ObjectState.Deleted;
                MessageService.warning("Item will be deleted when changes saved.");
            }
        }else {
            MessageService.error("Row ID:" + id + " not found...");
        }
    };
    // on modificatoin, set objectState to "Modified" for existing record
    self.onChange = function (id) {
        self = this;
        if (self.editEntity['objectState'] !== ObjectState.Modified) {
            MessageService.info("Record modified...");
        }
        self.editEntity['objectState'] = ObjectState.Modified;
    };
    // on child-entity modificatoin, set objectState to "Modified" for existing record
    self.onChildChange = function (childTable,id) {
        self = this;
        var index=self.findChild(self.editEntity[childTable],id);
        if (index>=0){  //found the child entity
            //don't change ObjectState of newly inserted child
            if (self.editEntity[childTable][index]['objectState']==ObjectState.Added){return;}
            if (self.editEntity[childTable][index]['objectState']!==ObjectState.Modified){
                MessageService.info("Item modified...");
            }
            self.editEntity[childTable][index]['objectState']=ObjectState.Modified;
        }else {
            MessageService.error("Row ID:" + id + " not found...");
        }
    };
    // locate a child enity in array, return the row if found, else return null
    self.findChild=function(childArray,id){
        var child=-1;
        if (!childArray instanceof Array) {MessageService.error(childArray+" is not type of Array.");return child;}
        for (var i = 0; i < childArray.length; i++) {
            if (childArray[i]['id'] === id) {
                child=i;
                break;
            }
        }
        return child;
    }
    self.showChild = function (objectState) {
        //console.log("objectstate=" + objectState);
        return !(objectState===ObjectState.Deleted);
        //if (objectState == null || objectState !== ObjectState.Deleted) {
        //    return true;
        //}
        //return false;
    };
    self.unDoEdit = function () { /* copy old values back from saved copy*/
        self.editEntity = angular.copy(self.savedEditEntity);
        MessageService.success("All the changes discarded.");
        scope.editForm.$setPristine();
    };
    self.deleteById = function (id) {
        SearchEntityService.deleteById(id)
            .then(
                function (id) {
                    self.fetchAllEntities();
                    self.reset();
                    MessageService.success("Deletion was successful.");
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    console.error('Error while deleting the record.');
                }
            );
    };

    // when click on Edit button
    self.edit = function (id) {
        SearchEntityService.getEntityById(id)
            .then(
                function (entity) {
                    MessageService.success("Editing selected record..");
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
    self.debug = function () {
        debugger;
    };
    self.reset = function () {
        self.clearSearch();
        //scope.myForm.$setPristine(); //reset Form
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
                        console.error('Error while fetching tableinfos');
                        return $q.reject(errResponse);
                    }
                );
        },
        // search with criteria
        search: function (searchEntity, searchModelClassName,pagingInfo) {
            var jsonStr = JSON.stringify({entity: searchEntity, modelClassName: searchModelClassName, pagingInfo:pagingInfo});
            console.log("searching...\n" + jsonStr+"\n"+pagingInfo);
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
        search_old: function (searchEntity, searchModelClassName) {
            var jsonStr = JSON.stringify({entity: searchEntity, modelClassName: searchModelClassName});
            console.log("searching...\n" + jsonStr);
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
            return $http.post(Entity_REST_URL, jsonStr)
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

//App.service('SmartTableInfo', function () {
//    return {};
//});