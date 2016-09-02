'use strict';
//var ENTITY_INSTANCE_URL = window.location + 'api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var ENTITY_INSTANCE_URL = window.location.origin + '/api/meta?entityName=' + MODEL_CLASS_NAME; //MODEL_CLASS_NAME defined in JSP file
var Entity_REST_URL = "";   //window.location.origin + '/api/emp/';
var MyDateFormat = "yyyy-MM-dd";
var ObjectState = {Unchanged: "Unchanged", Added: "Added", Modified: "Modified", Deleted: "Deleted"}; //var ObjectState = { Unchanged: 0, Added: 1, Modified: 2, Deleted: 4 };
var App = angular.module('myApp', ['ngAnimate', 'ui.bootstrap', 'smart-table', 'toastr']);
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
    function link(scope, element, attr, ctrls) {}
    //function link(scope, element, attr, ctrls) {}
    return {
        restrict: 'EA',
        templateUrl: window.location.origin + '/content/template/datepicker.html',
        link: link,
        controller: 'myDatePickerCtrl',
        require: ['ngModel'],
        scope: {dt: '=ngModel'}

    }
});


App.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, param) {
    //$scope.msgBody is array for showing multiple lines
    $scope.msgBody = param.msgBody instanceof Array? param.msgBody:[param.msgBody];
    $scope.msgTitle = param.msgTitle;
    $scope.okButtonOnly = param.okButtonOnly == null ? false : param.okButtonOnly;
    $scope.ok = function () {
        $uibModalInstance.close("ok");
    };
    $scope.cancel = function () { $uibModalInstance.dismiss('cancel'); };
});
App.controller('SearchEntityController', ['SearchEntityService', '$scope', '$filter', 'toastr','$uibModal', function (SearchEntityService, scope, filter, MessageService, $modal) {
    //App.controller('SearchEntityController', ['$scope', '$filter', 'SearchEntityService', function (scope,filter, SearchEntityService) {
    var self = this;
    self.searchEntity = {}; /* search object*/ self.savedSearchEntity = {}; /* saved copy of search object*/ self.editEntity = {}; /* entity for editing self.editEntityChild = {};           // entity for editing*/ self.savedEditEntity = {}; /* entity for editing*/ self.entities = []; /*[{"objectState":"Unchanged","id":78,"firstname":"james15","lastname":"smith","telephone":"410-2324444","email":"js@email.comXXXX","birthdate":1454821200000,"created":1454302800000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":80,"firstname":"james2","lastname":"Peter2","telephone":"343-232232","email":"jp@yahoo.comXXX","birthdate":573109200000,"created":571122000000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":82,"firstname":"John","lastname":"Doe","telephone":"874834343","email":"jd@QQ.com","birthdate":1432958400000,"created":1401422400000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":83,"firstname":"John2","lastname":"Doe2","telephone":"324324343","email":"jd2@gmail.com","birthdate":1461729600000,"created":1464667200000,"empAwards":[],"empAddress":[]},{"objectState":"Unchanged","id":87,"firstname":"Hanover","lastname":"john","telephone":null,"email":"HJ@emal.com","birthdate":1464580800000,"created":928123200000,"empAwards":[],"empAddress":[]}];*/ self.tempID = -99999999; /* temp ID for newly added record (parent or Child)*/ self.DateFormat = "date:'" + MyDateFormat + "'"; self.emptyEditEntity = {}; /*with child-entity*/ scope.form = {}; /*for setting form to pristine issue*/
    self.isLoading = true;     //true when smart-table is loading
    self.displayEntities = [].concat(self.entities);    // smart-table's row source
    //scope.predicates = ['firstname', 'lastname', 'birthdate', 'email'];
    //scope.selectedPredicate = scope.predicates[0];
    self.pageSize = 3; // display number of rows per page
    self.totalCount = 0;
    self.metaDataLoaded = false;
    self.tableState = {};
    /***** metaInfo for each column
     public String ColName;      //Entity's Column/field Name, NOT DB's column name
     //superClass==Number.class?"Number":superClass==Date.class?"Date":"String";
     public String ColType;      // Column Type: Number/Date/String
     public Integer ColLength;   // Column Length
     public Integer MinLength;   // field minimum length
     public Integer MaxLength;   // field maximum length
     public Object MinValue;     // fidld Min Value
     public Object MaxValue;     // field Max Value
     public Boolean Nullable;    // true if field is nullable
     public Boolean isKey;       // true if this is Primary Key Field
     public String ColRegex;     // Regular Expression for validating column value
     *************************************/
    self.metaInfo = {};
    self.columns = []; //for Smart-Table, example {column: 'firstname', caption: 'First Name', isSort: true}
    //scope.editEntity=self.editEntity;

    /*<--- Modal-related functions & variables begin--->*/
    self.modalResponse="";
    self.showMessage=function(msgBody, msgTitle,size){
        self.dialog(msgBody, msgTitle,true,size);
    };

    self.confirm=function(msgBody, msgTitle, size){
        self.dialog(msgBody, msgTitle,false,size).then(
            function ok(response) { //"ok" if OK button clicked
                self.modalResponse = response;
                return response;
            },
            function cancel() { //"" if cancel button clicked
                console.log('Modal dismissed at: ' + new Date());
            }
        );
    };
    self.dialog = function (msgBody, msgTitle,okButtonOnly,size) {
        var modalInstance = $modal.open({
            backdrop: false,
            animation: true,
            templateUrl: window.location.origin + '/content/template/modal.html',
            controller: 'ModalInstanceCtrl',
            size: size,     //"sm","lg"
            resolve: {param: function(){return { msgBody:msgBody, msgTitle:msgTitle, okButtonOnly:okButtonOnly}}}
        });
        return modalInstance.result;
    };
    /*<--- Modal-related functions & variables end--->*/

    // initialize columns for smart-table
    function iniSmartTableCols(smartTableInfo) {
        if (isEmpty(smartTableInfo["Fields"])) MessageService.error("Smart table columns not specified in "+MODEL_CLASS_NAME);
        var aCaptions = smartTableInfo["Captions"].split(',');
        var aFields = smartTableInfo["Fields"].split(',');
        if (aCaptions.length!=aFields.length){alert("Count of fields and captions specified did not match...");return;}
        self.columns = [];
        for (var i = 0; i < aFields.length; i++) {
            var col1 = {column: aFields[i], caption: aCaptions[i], isSort: true};
            //if (getFieldType(aFields[i])=="Date")
            //    col1.column='formatDate('+aFields[i]+')';
            self.columns.push(col1);
        }
    }

    /******************************************************************
     * ignore (1)Empty column (2) Array (child entity Field) (3) objectState field
     * if (isEmpty(val) || val instanceof Array || colName=="objectState") continue;
     * @returns {string}
     *******************************************************************/
    self.validateAll= function () {
        var errMsg=[];
        // (1) validate Root record
        self.validateRec(self.editEntity,self.metaInfo.Columns,errMsg);

        for(var childVM in self.metaInfo.Child_VMs){    // loop thru each child table
            for(var row in self.editEntity[childVM]){   // loop thru each record of Child table
                self.validateRec(self.editEntity[childVM][row],self.metaInfo.Child_VMs[childVM].Columns,errMsg)
            }
        }
        return errMsg;
    }

    /******************************************************************
     * validate a record of specified table, default Root table if not specified
     *  ColumnInfo: ColName; ColType; ColLength; MinLength; MaxLength;
     *              MinValue; MaxValue; Nullable; isKey; ColRegex;
     *  metaInfo:  {Child_VMs, Columns, PrimaryKey, VmName)
     *******************************************************************/
    self.validateRec=function(rowData, metaInfo,msg) {
        //var msg=[];
        for (var col in metaInfo){
            if (rowData['objectState']==ObjectState.Deleted) {break;}  //no need to validate deleted record
            if (rowData[col] instanceof Array) break; //Root's child entity field, ignore it
            if (metaInfo[col].ColType == "Number" && isNaN(rowData[col])) {
                msg.push("'" + col + "'" + " is not a valid number." + " (id=" + rowData['id'] + ")");
            }
            if((!isEmpty(metaInfo[col].ColLength)) && (rowData[col]+"").length>metaInfo[col].ColLength){
                msg.push("'"+col+"'" +" length exceeds "+metaInfo[col].ColLength+" (id="+rowData['id']+")");
            }
            if((!isEmpty(metaInfo[col].MaxLength)) && (rowData[col]+"").length>metaInfo[col].MaxLength){
                msg.push("'"+col+"'" +" length exceeds "+metaInfo[col].MaxLength+" (id="+rowData['id']+")");
            }
            if((!isEmpty(metaInfo[col].MinLength)) && (rowData[col]+"").length<metaInfo[col].MinLength){
                msg.push("'"+col+"'" +" should be longer than "+metaInfo[col].MinLength+" (id="+rowData['id']+")");
            }
            if((!isEmpty(metaInfo[col].MinValue)) && rowData[col]<metaInfo[col].MinValue){
                msg.push("'"+col+"'" +" should be greater than "+metaInfo[col].MinValue+" (id="+rowData['id']+")");
            }
            if((!isEmpty(metaInfo[col].MaxValue)) && rowData[col]>metaInfo[col].MaxValue){
                msg.push("'"+col+"'" +" should be less than "+metaInfo[col].MaxValue+" (id="+rowData['id']+")");
            }
            if((!isEmpty(metaInfo[col].Nullable)) && !metaInfo[col].Nullable && isEmpty(rowData[col])){
                msg.push("'"+col+"'" +" should not be empty."+" (id="+rowData['id']+")");
            }
            if(!isEmpty(metaInfo[col].ColRegex)){
                var regEx = new RegExp(metaInfo[col].ColRegex);
                if (!rowData[col].match(regEx)) {
                    msg.push("Field "+col+"'s" +" value: "+rowData[col]+" is not in correct format."+" (id="+rowData['id']+")");
                }
            }
        }
        return msg;
    }

    /******************************************************************
     * initiallize search operators for all available columns, according to column type
     * @Note: dropdownlist must be of class "search_op",
     *      with attribute "search_op" set as search column name
     *******************************************************************/
    function ini_operators() {
        //init search operators by class name search_op, retrieve corresponding column namee
        angular.forEach(document.getElementsByClassName("search_op"), function (dropdownlist, i) {
            dropdownlist.title = "comparison operator";
            // remove all options from dropdown list
            for(var i = dropdownlist.options.length - 1 ; i >= 0 ; i--) { dropdownlist.remove(i); }
            var colName = angular.element(dropdownlist).attr('search_col').split('.').pop();  //fetch last item, which is corresponding column name
            //Sanity check, make sure Search Column specified is valid
            if( ! (colName in self.editEntity)) {
                MessageService.error("Column: "+colName+" specified in a Dropdown list is not defined in root model.", "error");
                return;
            };
            // add appropriate options to dropdownList according to Column type (String/Date/Number, etc)
            angular.forEach(search.allOperators, function (item, i) {
                var option = document.createElement("option");
                option.value = item.value;
                option.text = item.text; //+" "+item.desc;
                option.title = item.desc;
                // if search column's data type is in search.allOperators' applied_to,
                //      add this operator to available operators for the specified column
                if (item.applied_to.indexOf(getFieldType(colName)) >= 0) { dropdownlist.add(option); }
            });
            // for String column default dropdownList value to "Start with" ("like" operation)
            if (getFieldType(colName)=="String") dropdownlist.value="like";
        });
    }

    /******************************************************************
     * show search criteria
     *******************************************************************/
    self.showSearchFilters=function() {
        self=this;
        var filters=getSearchFilters();
        var criteria=[];
        if (!filters || filters.length==0) {
            criteria ="No criterion specified...";
        }else {
            angular.forEach(filters,function(filter,i){
                criteria.push(filter.name + " "+getOperatorDesc(filter.operator) + " '"+filter.value+"'");
            });
        }
        self.showMessage(criteria,"Search Criteria");
        return criteria;
    }

    /******************************************************************
     * get description of search operator options
     *******************************************************************/
    function getOperatorDesc(opText){
        var opDesc="<Operator NOT found>";
        angular.forEach(search.allOperators,function(item,i){
            if (item.value == opText) {
                opDesc=item.desc;
                return;
            }
        });
        return opDesc;
    }

    /******************************************************************
     * get search operators values for all specified columns, according to column type
     *  ignore (1)Empty column (2) Array (child entity Field) (3) objectState field
     * @Note: dropdownlist must be of class "search_op",
     *      with attribute "search_op" set as search column name
     * @Return: Object like {col1:0, col2:16, col3:32}
     *******************************************************************/
    function getSearchFilters() {
        var oReturn=[];
        var operators={};
        //get all search operators by class name search_op, retrieve corresponding column namee
        angular.forEach(document.getElementsByClassName("search_op"), function (dropdownlist, i) {
            var colName = angular.element(dropdownlist).attr('search_col').split('.').pop();  //fetch last item, which is corresponding column name
            // add appropriate options to dropdownList according to Column type (String/Date/Number, etc)
            operators[colName]=dropdownlist.value;
        });
        for (var colName in self.searchEntity){
            var val=self.searchEntity[colName];
            //ignore (1)Empty column (2) Array (child entity Field) (3) objectState field
            if (isEmpty(val) || val instanceof Array || colName=="objectState") continue;
            var searchFilter={name:colName,operator:"",value:val,type:getFieldType(colName)};
            if (!isEmpty(operators[colName])){  //this colName haa a corresponding operator
                searchFilter.operator=operators[colName];
            }
            oReturn.push(searchFilter);
        }
        return oReturn;
    }

    /******************************************************************
     * return column data type of specified table & field
     * @param fieldName,
     * @param tableName: if not specified, Root Entity
     * @returns {*}: Number / Date / String
     *******************************************************************/
    function getFieldType(fieldName, tableName) {
        if (tableName == null) {
            return self.metaInfo.Columns[fieldName].ColType;
        }
        return self.metaInfo.Child_VMs[tableName].Columns[fieldName].ColType;
    }

    /******************************************************************
     * get PrimaryKey, without tablename, return PK of Root Entity
     * @param tableName: table's PK, if null, return Root Entity's PK
     * @returns {*} PrimaryKey Name of specified table
     *******************************************************************/
    function getPK(tableName) {
        if (tableName == null) {
            return self.metaInfo.PrimaryKey;
        }
        return self.metaInfo.Child_VMs[tableName].PrimaryKey;
    }

    // initialized when page loaded for the first time
    angular.element(document).ready(function () {
        if (isEmpty(MODEL_CLASS_NAME)) {alert("MODEL_CLASS_NAME has not been defined in view page.");return;}
        SearchEntityService.getEmptyEntityInstance()
            .then(
                function (serverData) {
                    console.log("self=" + self);
                    Entity_REST_URL = window.location.origin + serverData['EntityRestUrl'];
                    var entity = serverData['EmptyInstance'];
                    self.metaInfo = serverData['MetaInfo'];
                    self.searchEntity = angular.copy(entity);
                    self.savedSearchEntity = angular.copy(self.searchEntity);
                    self.editEntity = angular.copy(self.searchEntity);
                    self.savedEditEntity = angular.copy(self.searchEntity);
                    self.emptyEditEntity = angular.copy(entity); //hodling structure of editEntity
                    iniSmartTableCols(serverData["SmartTableInfo"]);
                    ini_operators();
                    self.metaDataLoaded = true;
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
                    MessageService.success(self.entities.length + " records retrieved..");
                },
                function (errResponse) {
                    //alert(errResponse.data);
                    MessageService.error(errResponse.data);
                    console.error('Error while fetching Currencies');
                }
            );
    };
    self.getServerData = function (tableState) {
        console.log("getServerData: self=" + self);
        tableState.pagination.numberOfPages = Math.ceil(self.totalCount / self.pageSize);
        if (!self.metaDataLoaded) {//set self.tableState
            self.tableState = angular.copy(tableState);
            return;
        } // if MetaData not loaded yet, don't call server
        self.isLoading = true;
        var pageInfo = {
            start: self.tableState.pagination.start || 0,
            pageSize: self.tableState.pagination.number || self.pageSize,
            orderBy: self.tableState.sort.predicate || " ",
            asc: self.tableState.sort.reverse || " "
        };
        MessageService.info("Searching...");
        SearchEntityService.search(self.searchEntity, MODEL_CLASS_NAME, pageInfo, tableState)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (resultList) {
                    console.log("getServerData->SearchEntityService.search: self=" + self);
                    self.entities = angular.copy(resultList.serverData);
                    self.displayEntities = angular.copy(resultList.serverData);
                    //set the pagination state with server-data
                    self.tableState.pagination = {
                        start: resultList.start, // start index
                        totalItemCount: resultList.totalCount,
                        number: resultList.pageSize, //number of item on a page
                        numberOfPages: Math.ceil(resultList.totalCount / resultList.pageSize) //total number of pages
                    }
                    self.isLoading = false;
                    //MessageService.clear();
                    MessageService.success(self.entities.length + " records retrieved..\n\n Total records found: " + resultList.totalCount);
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    console.error('Error while updating current record.');
                }
            );
    };
    self.search = function () {
        var pageInfo = {start: 0, pageSize: self.pageSize};
        var jsonStr = JSON.stringify({
            modelClassName: MODEL_CLASS_NAME,
            pagingInfo: pageInfo,
            searchFilters: getSearchFilters()
        });
        MessageService.info("Searching...");
        SearchEntityService.search(jsonStr)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (resultList) {
                    self.entities = angular.copy(resultList.serverData);
                    self.displayEntities = angular.copy(resultList.serverData);

                    self.totalCount = Math.ceil(resultList.totalCount / resultList.pageSize);
                    //self.tableState.pagination.numberOfPages = Math.ceil(resultList.totalCount/resultList.pageSize);//set the number of pages so the pagination can update
                    self.isLoading = false;
                    MessageService.success("Total records found: " + resultList.totalCount);
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
        ini_operators();    //set search operators to original state
        scope.searchForm.$setPristine(); //reset search Form
    };
    self.reDoSearch = function () { /* copy old values back from saved copy*/
        self.searchEntity = angular.copy(self.savedSearchEntity);
    };
    //*****************edit Functions**********************
    self.save = function () {
        var validationMsg= self.validateAll();
        if (validationMsg.length>0) {self.showMessage(validationMsg,"Please make the following corrections");return;};
        SearchEntityService.save(self.editEntity, MODEL_CLASS_NAME)  //MODEL_CLASS_NAME is global var defined in jsp page
            .then(
                function (entity) {
                    //self=this;
                    self.editEntity = angular.copy(entity);
                    // update the search result after the save
                    for(var i=0;i<self.entities.length;i++){
                        if (self.entities[i]['id']==self.editEntity['id']) {
                            self.entities[i] = angular.copy(self.editEntity);
                            break;
                        }
                    }
                    scope.editForm.$setPristine(); //reset Form
                    MessageService.success("Changes have been saved successfully.");
                },
                function (errResponse) {
                    MessageService.error(errResponse.data);
                    console.error('Error while updating current record.' + errResponse.data);
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
        if ('objectState' in temp) {
            temp['objectState'] = ObjectState.Added;
        } else {
            MessageService.error("objectState should be implemented on entity: "+childTable+" for update operation.");
        }
        self.editEntity[childTable].push(temp);
        MessageService.info("Adding a new item.");
    };
    // remove a child enitty
    self.removeChild = function (childTable, id) {
        self = this;
        var index = self.findChild(self.editEntity[childTable], id);
        if (index >= 0) {  //found the child entity
            //don't change ObjectState of newly inserted child
            if (self.editEntity[childTable][index]['objectState'] == ObjectState.Added) {
                self.editEntity[childTable].splice(index, 1);
                MessageService.success("Removing newly inserted item.");
            } else {
                self.editEntity[childTable][index]['objectState'] = ObjectState.Deleted;
                MessageService.warning("Item will be deleted when changes saved.");
            }
        } else {
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
    self.onChildChange = function (childTable, id) {
        self = this;
        var index = self.findChild(self.editEntity[childTable], id);
        if (index >= 0) {  //found the child entity
            //don't change ObjectState of newly inserted child
            if (self.editEntity[childTable][index]['objectState'] == ObjectState.Added) {
                return;
            }
            if (self.editEntity[childTable][index]['objectState'] !== ObjectState.Modified) {
                MessageService.info("Item modified...");
            }
            self.editEntity[childTable][index]['objectState'] = ObjectState.Modified;
        } else {
            MessageService.error("Row ID:" + id + " not found...");
        }
    };
    // locate a child enity in array, return the row if found, else return null
    self.findChild = function (childArray, id) {
        var child = -1;
        if (!childArray instanceof Array) {
            MessageService.error(childArray + " is not type of Array.");
            return child;
        }
        for (var i = 0; i < childArray.length; i++) {
            if (childArray[i]['id'] === id) {
                child = i;
                break;
            }
        }
        return child;
    }
    self.showChild = function (objectState) {
        //console.log("objectstate=" + objectState);
        return !(objectState === ObjectState.Deleted);
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
        var deletedId=id;
        self.dialog("Are you sure to delete this record?", "Delete").then(
            function ok(response) { //"ok" if OK button clicked
                SearchEntityService.deleteById(id).then(
                    function (id) {
                        // remove deleted entity from self.entity List
                        for(var i in self.entities){if (self.entities[i]['id']==deletedId) {
                            self.entities.splice(i,1);
                            self.displayEntities=angular.copy(self.entities);
                            break;}}
                        self.reset();
                        MessageService.success("The record has been successfully deleted.");
                    },
                    function (errResponse) {
                        MessageService.error(errResponse.data);
                        console.error('Error while deleting the record.');
                    }
                );
            },
            function cancel() { //"" if cancel button clicked
                console.log('Deletion cancelled at: ' + new Date());
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
        self=this;
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
        search: function (jsonStr) {
            console.log("SearchEntityService.searching...\n" + jsonStr);
            return $http.post(Entity_REST_URL + "search", jsonStr)
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
            return $http.post(Entity_REST_URL + "search", jsonStr)
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
            //if (isEmpty(ENTITY_INSTANCE_URL)) alert("Please specify the Root Model Class name in view page.");
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
// return true if a variable/object is empty
function isEmpty(obj){
    // if obj is of Boolean type and false, considered NOT empty
    return (obj==undefined || obj==null || (obj+"").trim().length==0);
};
var search={};
search.allOperators =
    [{ value: "equal",   text: "= ",     desc: "equals to",                      applied_to: "Number,Date,String,Boolean" },
        { value: "gt",      text: "> ",     desc: "is greater than",                applied_to: "Number,Date,String" },
        { value: "lt",      text: "< ",     desc: "is less than",                   applied_to: "Number,Date,String" },
        { value: "notEqual",text: "<>",     desc: "NOT equals to",                  applied_to: "Number,Date,String,Boolean" },
        { value: "ge",      text: ">=",     desc: "is greater than or equals to",   applied_to: "Number,Date,String" },
        { value: "le",      text: "<=",     desc: "is less than or equals to",      applied_to: "Number,Date,String" },
        //{ value: "16", text: "$ Contains", desc: "contains", applied_to: "String" },
        { value: "like",    text: "like",   desc: "begins with",                    applied_to: "String" }];
//{ value: "64", text: "Ends With", desc: "ends with", applied_to: "String" }];
