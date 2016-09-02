
////*****************************Customizing View Model Information***************************
//// <summary>
////   Important note:  (Root View Model <parent-child> binding with Knockout.js)
////            <1> this module is to support KO binding Root View Model with
////                    <a> Grid-Style (multi-rows) editing of entire DB table
////                    <b> 1 child view model
////                    <c> 2 child view model
////            <2> this module also supports Knockout data-binding with 1 child view models.
////            <3> the following global varialbles should be set for 1-child data-binding
////            <4> for 1-child data-binding, _Child_VM2 and _Child_Key2 should be set as well.
////   how this works?
////            <1> pass Root ViewModel to your cshtml page as usual.
////            <2> if no child record present in the root view model, addd a blank one
////                    and mark it as deleted (ObjectState=ObjectState.Deleted) with
////                    a negative int value assigned to its primary key. (this should be done
////                    on the server side. [this temp record will be discarded automatically
////                    self.filterItems(). ]
////   parameters setting: (MetaData)
////                  Parent ViewModel(Child_VMs,ViewModelName, PrimaryKey, ColumnNames)
////                                    /
////                                   /
////    Child ViewModel#1(Child_VMs,ViewModelName, PrimaryKey, ColumnNames), Child ViewModel#2,...
////    Where: (for each ViewModel, either Parent or Child ViewModel)
////             Child_VMs ==> ArrayList: contains list of child ViewModels of the current ViewModel
////         ViewModelName ==> String: ViewModel Name of the current ViewModel
////            PrimaryKey ==> String: PrimaryKey Name of the current ViewModel
////           ColumnNames ==> PrimaryKey Name of the current ViewModel

////             _Child_VM = "SalesOrderItems";          //Child ViewModel's name
////             _Child_Key = "SalesOrderItemId";        //Key Field Name of Child ViewModel
////             _PK_Name = "SalesOrderId";              //Primary Key name for Root View Model
////             _FK_Name = "SalesOrderId";              // Foreign Key name, usually same as _PK_Name
////             _Save_URL = "/Sales/Save/";             //URL for saving the data to
////             _Child_VM2 = "Students";                //sencond child ViewModel name   -- Optional
////             _Child_Key2 = "Stud_Id";                //sencond child ViewModel PK name-- Optional
////   in your cshtml page's script section, you should set: (ideally the folowing script can be server-side generated)
////            var edit.OrginalData = @Html.Raw(data);
////            var edit_vm = new Root_VM(edit.OrginalData);
////            ko.applyBindings(edit_vm);
////****************************************************************************************
////var _Child_VM = "SalesOrderItems";          //Child ViewModel's name
////var _Child_Key = "SalesOrderItemId";        //Key Field Name of Child ViewModel
////var _PK_Name = "SalesOrderId";              //Primary Key name for Root View Model
////var _FK_Name = "SalesOrderId";              // Foreign Key name, usually same as _PK_Name
////var _Save_URL = "/Sales/Save/";             //URL for saving the data to
////*****************************End of Customizing View Model Information********************
////
////    for non-generic bindings, such as computed fields, those bindings can be defined
////            as "function extraBindings(viewModel){}"
////            in cshtml or other js file, so leave current module unchanged.
////
////        Code example:
////    //*************************************************************
////    // for extra computed bindings, defined as the following
////    //*************************************************************
////    function extraBindings(viewmodel) {
////        viewmodel.totalAmt = ko.computed(function () {
////            var total = 0;
////            //viewModel[_ChildVM[0]]()  //edit.RootMeta.Child_VMs[0]["ViewModelName"]
////            ko.utils.arrayForEach(viewmodel[edit.RootMeta.Child_VMs[0]["ViewModelName"]](), function (item) {
////                if (item._destroy == undefined) total += item.Quantity() * item.UnitPrice();
////            });
////            return total.toFixed(2);
////        }, viewmodel);
////	};
////
//// </summary>
//*****************************End of Customizing View Model Information********************
////******************************************************
///* define some variables for Search
///*    if Grid_Edit set to TRUE, search tab will be disabled
////******************************************************
var search = {};
search.RootMeta = search.RootMeta || {};
search.GridInfo = search.GridInfo || {};
search.GridInfo.Grid_URL = search.GridInfo.Grid_URL || {};
search.GridInfo.Grid_Columns = search.GridInfo.Grid_Columns || {};
search.GridInfo.Grid_Titles = search.GridInfo.Grid_Titles || {};
search.GridInfo.Grid_Name = search.GridInfo.Grid_Name || {};
search.GridInfo.Grid_Key = search.GridInfo.Grid_Key || {};
search.GridInfo.URL_Save = search.GridInfo.URL_Save || {};
search.GridInfo.URL_JsonEdit = search.GridInfo.URL_JsonEdit || {};
search.Ops = search.Ops || {};  // for search columns' corresponding operators
search.URL_GetMetaData = "/Admin/getMetaInfo/";
search.result_grid = search.result_grid || {};
var search_vm, search_data, Grid_Edit, module_name = {};
////******************************************************
///* define  variables for Edit
////******************************************************
var edit = {};
edit.RootMeta = edit.RootMeta || {};
edit.OrginalData = edit.OrginalData || {};
//edit.URL_Save = "/Sales/Save/";
//edit.URL_MetaInfo = "/Sales/GetMeta/";
edit.tempID = -99999999;        // temp ID for newly added record
edit.changed_VM = edit.changed_VM || {};
edit.RootMeta.PrimaryKey = edit.RootMeta.PrimaryKey || {};          // root viewmodel's primary key 
edit.RootMeta.Child_VMs = edit.RootMeta.Child_VMs || {};            // root viewmodel's Children (array)
edit.RootMeta.ViewModelName = edit.RootMeta.ViewModelName || {};    // root viewmodel's name
edit.RootMeta.ColumnNames = edit.RootMeta.ColumnNames || {};        // root viewmodel's column names,e.g."column1,column2.."
edit.RootMeta.ViewModelName = edit.RootMeta.ViewModelName || {};    // root viewmodel's name
edit.start = edit.start || {};
edit.bindingApplied = false;
var edit_vm = {};

var ObjectState = { Unchanged: 0, Added: 1, Modified: 2, Deleted: 4 };
//var Op = { Equals: 0, GreaterThan: 1, LessThan: 2, GreaterThanOrEqual: 4, LessThanOrEqual: 8, Contains: 16, StartsWith: 32, EndsWith: 64 }
search.allOperators =
    [{ value: "0", text: "=", desc: "equals to", applied_to: "Int32,Decimal,DateTime,String,Boolean" },
    { value: "1", text: ">", desc: "is greater than", applied_to: "Int32,Decimal,DateTime" },
    { value: "2", text: "<", desc: "is less than", applied_to: "Int32,Decimal,DateTime" },
    { value: "3", text: "# (not equals to)", desc: "NOT equals to", applied_to: "Int32,Decimal,DateTime,String,Boolean" },
    { value: "4", text: ">=", desc: "is greater than or equals to", applied_to: "Int32,Decimal,DateTime" },
    { value: "8", text: "<=", desc: "is less than or equals to", applied_to: "Int32,Decimal,DateTime" },
    { value: "16", text: "$ Contains", desc: "contains", applied_to: "String" },
    { value: "32", text: "Starts With", desc: "begins with", applied_to: "String" },
    { value: "64", text: "Ends With", desc: "ends with", applied_to: "String" }];
//-----------------------------------------------------------------------
$(document).ready(function () {
    search.result_grid = $("#result_grid");//.jqGrid();
    search.tab_search = $("#tab_search");
    search.tab_edit = $("#tab_edit");
    //$(".datepicker").datepicker({ dateFormat: "yy-mm-dd" });
    if (!validate_html()) return;    // make sure search/edit tabs are defined in html
    // retreve <1> metadata for search/edit, <2> parameters for search-result grid information 
    jQuery.getJSON(search.URL_GetMetaData, { vm_name: module_name }, function (data, textStatus, jqXHR) {
        search.GridInfo = data.GridInfo;
        search.RootMeta = data.SearchMeta;
        edit.RootMeta = data.EditMeta;
        if (Grid_Edit != undefined && Grid_Edit == true) { grid_edit(); return; } // Grid Edit, ignore the search tab
        //JsonEdit is URL to retrieve record for editing when grid row double-clicked, default to "/./JsonEdit/"
        search.GridInfo.URL_JsonEdit = search.GridInfo.URL_JsonEdit || "/" + window.location.pathname.split("/")[1] + "/JsonEdit";
        ini_operators(search_data);  // ini search comparison operations.
        //ko.mapping.fromJS(search.Ops);  // apply Knockout mapping to search 

        //////for (var key in data) { search[key] = data[key]; }
        search_vm = new Search_VM(search_data); // create knockout view model

        //_root_VM = new grid_KO(search_data.SalesOrders);  //ko.applyBindings(new HeaderViewModel(), $("#abc-page-header"));
        ko.applyBindings(search_vm, search.tab_search.get(0));
        edit_vm = new Edit_VM();    ////ko.applyBindings(new HeaderViewModel(), $("#abc-page-header"));
        edit_vm.applyMapping(blank_edit_vm());  // blank new edit view model
        //edit_vm.applyMapping(edit.OrginalData);
        ko.applyBindings(edit_vm, search.tab_edit.get(0));      //apply knockout bindings to tab_edit, ONCE only  
        search_vm.ini_Result_Grid();

    });

    //script to autosize grid
    //don't forget autowidth:true for initial jqGrid size
    $(window).bind('resize', function () {
        //set to 0 so grid does not continually grow
        //search.result_grid.setGridWidth(0);
        //resize to our container's width
        var containerWidth = $('#result_div').parent().parent().parent().width();
        //if (pWidth <= gWidth) { gWidth = pWidth - 2;}
        //toastr.info("grid with=" + gWidth + "  Parent width=" + pWidth, "");
        //var iWidth = $('#result_div').parent().parent().width();  //$('#result_div').width();
        search.result_grid.setGridWidth(containerWidth - 2);
    }).trigger('resize');

    //jQuery(window).bind('resize', function () {
    //    // Get width of parent container
    //    var width = jQuery('#result_div').attr('clientWidth');
    //    if (width == null || width < 1) {
    //        // For IE, revert to offsetWidth if necessary
    //        width = jQuery('#result_div').attr('offsetWidth');
    //    }
    //    width = width - 2; // Fudge factor to prevent horizontal scrollbars
    //    if (width > 0 &&
    //        // Only resize if new width exceeds a minimal threshold
    //        // Fixes IE issue with in-place resizing when mousing-over frame bars
    //        Math.abs(width - jQuery("#result_grid").width()) > 5) {
    //        jQuery("#result_grid").setGridWidth(width);
    //    }
    //}).trigger('resize');
    //$(window).bind('resize', function () {
    //    $("#jqgrid").setGridWidth($(window).width());
    //}).trigger('resize');

    // recover saved theme
    var ddl_theme = document.getElementById("themeManager");
    ddl_theme.value = util.getCookie('theme');
    onChangeCSStheme(ddl_theme);
    //$('#themeManager').SelectedItem.value = 
    //$("#menu").menu();
    //jQuery(function ($) {
    //    //$(".datepicker").mask("9999-99-99", { placeholder: "    -  -  " });
    //    //$("#phone").mask("(999) 999-9999");
    //    //$("#tin").mask("99-9999999");
    //    //$("#ssn").mask("999-99-9999");
    //});

    //optioin for toastr
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-bottom-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }

    //$(function () {
    //    var availableTags = [
    //      "ActionScript",
    //      "AppleScript",
    //      "Asp",
    //      "BASIC",
    //      "C",
    //      "C++",
    //      "Clojure",
    //      "COBOL",
    //      "ColdFusion",
    //      "Erlang",
    //      "Fortran",
    //      "Groovy",
    //      "Haskell",
    //      "Java",
    //      "JavaScript",
    //      "Lisp",
    //      "Perl",
    //      "PHP",
    //      "Python",
    //      "Ruby",
    //      "Scala",
    //      "Scheme"
    //    ];
    //    $("#clientno").autocomplete({
    //        source: availableTags
    //    });
    //});
});
// initiallize search operators for all available columns
function ini_operators(data) {
    // data is from server side, set in html page
    var search_columns = data.SearchColumns.split(',');
    var search_ops = (data.SearchOps == null ? null : data.SearchOps.split(','));
    data.Ops = {};
    for (i = 0; i < search_columns.length; i++) {   // initialize with server data
        data.Ops[search_columns[i]] = (search_ops == null ? 0 : search_ops[i]);
    };
    //init search operators by class name search_op, retrieve corresponding column namee
    $('.search_op').each(function (i, dropdownlist) {
        dropdownlist.title = "comparison operator";
        var temp = $(dropdownlist).attr('data-bind').split('.');
        var colName = temp[temp.length - 1];    //fetch last item, which is corresponding column name
               
        $(search.allOperators).each(function (j, item) {
            var option = document.createElement("option");
            option.value = item.value;
            option.text = item.text;

            //option.title = item.desc;
            // if search column's data type is in search.allOperators' applied_to, 
            //      add this operator to available operators for the specified column
            if (item.applied_to.indexOf(search_col_type(colName)) >= 0) { dropdownlist.add(option); };
            //dropdownlist.add(option);
        });
        //col_no++;
    });


}
// tooltips
$(function () {

    $(document).tooltip();
});
// retrieve operator's description by value
function getOperatorDesc(op_val) {
    for (i = 0; i < search.allOperators.length; i++) {
        if (op_val == search.allOperators[i].value) return search.allOperators[i].desc;
    }
    return "";
}
//***************************************************************
//  Initialize for Grid Editing
//***************************************************************
function grid_edit() {
    edit.OrginalData = search_data;
    //// bind the view model for the first time
    if (!edit.bindingApplied) {
        edit_vm = new Edit_VM();    ////ko.applyBindings(new HeaderViewModel(), $("#abc-page-header"));
        edit_vm.applyMapping(edit.OrginalData);
        ko.applyBindings(edit_vm, search.tab_edit.get(0));      //apply knockout bindings to tab_edit, ONCE only  
    } else { edit_vm.applyMapping(edit.OrginalData); }
    // jquery: activate edit tab ---starting from 0, 1 is the 2nd tab.
    activate_tab(1);    //enable edit tab and disable search tab
    disable_tab(0);
}
//***************************************************************
//  tab-related functions: acitvate/disable tab
//***************************************************************
$(function () {
    $("#tabs").tabs();
});

// changing CSS Theme
function onChangeCSStheme(dropdownlist) {
    var cssNode = document.createElement('link');
    cssNode.type = 'text/css';
    cssNode.rel = 'stylesheet';
    cssNode.href = dropdownlist.value;       //cssNode.href = "/Content/themes/blitzer/jquery-ui.blitzer.min.css";    //
    cssNode.media = 'screen';
    cssNode.title = 'dynamicLoadedSheet';
    document.getElementsByTagName("head")[0].appendChild(cssNode);
    var styleSheets = document.styleSheets;
    util.setCookie('theme', dropdownlist.value, 180);   // save theme to cookies
}
function activate_tab(tab_num) {
    //$(function () { $("#tabs").tabs({ active: tab_num }); });
    $('#tabs').tabs('enable', tab_num);
    $("#tabs").tabs({ active: tab_num });
}
function disable_tab(tab_num) {
    $('#tabs').tabs('disable', tab_num);
}
////***************************************************************
////valid html should have an tab control (named 'tabs') 
////  including 2 tabs (named 'tab_search' and 'tab_edit' respectively)
////  tab 'tab_search' should have a html table with id='result_grid'
////***************************************************************
function validate_html() {
    var valid_html = ($("#tabs").length > 0 && search.tab_search.length > 0 && search.tab_edit.length > 0 && search.result_grid.length > 0);
    if ($("#tabs").length <= 0) alert("tabs for search/edit not specified...");
    if (search.tab_search.length <= 0) alert("tab_search tab not specified...");
    if (search.tab_edit.length <= 0) alert("tab_edit tab not specified...");
    if (search.result_grid.length <= 0) alert("result_grid (html table) not specified...");
    return valid_html;
}

Search_VM = function (data) {
    var self = this;

    ko.mapping.fromJS(data, {}, self);
    disable_tab(1); //disable edit tab

    self.search = function (data) {
        //#1> collect all the operators for search-fields, e.g. SearchOps="0,0,1"
        var search_columns = search_data.SearchColumns.split(',');
        var SearchOps = "";
        for (i = 0; i < search_columns.length; i++) {
            SearchOps += (SearchOps == "" ? "" : ",") + self.Ops[search_columns[i]]();
        }
        self["SearchOps"](SearchOps);   //set to SearchOps to return to server
        //#2> set the URL for retrieving search-result as set in "search.GridInfo.Grid_URL"
        var resultGrid = search.result_grid.jqGrid();// $('#result_grid').jqGrid(); //;
        resultGrid.setGridParam({ url: search.GridInfo.Grid_URL });
        //#3> gather search_vm and set into postData (key-value) parameter, JqGrid will send to URL to retrieve data on "reloadGrid"
        var postDataValues = resultGrid.getGridParam('postData');
        postDataValues["search_vm"] = ko.toJSON(self);  //.stringify(search_data);
        resultGrid.setGridParam({ postData: postDataValues }).trigger('reloadGrid');
    },
    self.show_msg = function show_msg(msg, title) {
        toastr.info(msg, title);   //  show message for a short duration
    },
    self.result_grid_loadComplete = function () {
        var resultGrid = search.result_grid.jqGrid();// $('#result_grid').jqGrid();
        // if search result is not empty, make the grid visible, else not.
        document.getElementById("result_div").style.display = resultGrid.getGridParam("reccount") > 0 ? 'block' : 'none';
        //document.getElementById("result_grid").parentNode.style.display = resultGrid.getGridParam("reccount") > 0 ? 'block' : 'none';
        self.show_msg("Total of " + resultGrid.getGridParam("records") + " record(s) found...</br>" + resultGrid.getGridParam('reccount') + " displayed.");

        search.result_grid.resize();
    },
    self.ini_Result_Grid = function () {
        //var gridDataUrl = ""; //'/Sales/JsonSalesCollection'; // + '?search_vm=' + ko.toJSON(self);    //.stringify(search_data); //JSON.stringify(data);
        // use date.js to calculate the values for this month
        var col_Titles = search.GridInfo.Grid_Titles.split(",");
        var col_names = search.GridInfo.Grid_Columns.split(",");
        var columnModel = [];

        // if columns list does not include Grid's ID column, add (search.GridInfo.Grid_Key) to Grid columns  
        if (col_names.indexOf(search.GridInfo.Grid_Key) < 0) { col_names.push(search.GridInfo.Grid_Key); col_Titles.push(search.GridInfo.Grid_Key); }
        for (i = 0; i < col_names.length; i++) // colname in col_Names) 
        {
            var col = { name: col_names[i], index: col_names[i], align: 'left', width: '100%' }
            if (grid_col_type(col.name) == "DateTime") { col.formatter = 'date'; }; //col.formatoptions={newformat : 'y-m-d'};
            if (grid_col_type(col.name) == "Boolean") { col.formatter = 'checkbox'; col.align = 'center' }; //col.formatoptions={newformat : 'y-m-d'};
            // set the priamary key field to invisible
            if (col_names[i].trim() == search.GridInfo.Grid_Key.trim()) {
                col.key = true; col.hidden = true;
            }
            columnModel.push(col);
        }

        // add a column, click to execute CRUD operation
        col_Titles.push("");
        columnModel.push({
            name: 'Action',
            width: '30%',
            align: 'center',
            fixed: false,
            search: false,
            sortable: false,
            resize: false,
            formatter: function (cellvalue, options, rowObject) {
                return '<span class="ui-icon ui-icon-pencil center" title="click to edit/add/delete or to view details." onclick="DoubleClicGridkRow(' + options.rowId + ');"></span>';
            }      //class="ui-icon ui-icon-folder-open"

        });

        //$grid.jqGrid({
        search.result_grid.jqGrid({
            //data: search_data,
            //autowidth: true,
            url: {},
            datatype: "json",
            mtype: 'post',
            colNames: col_Titles,
            colModel: columnModel,
            loadonce: false,      // load once only
            rowNum: 5,
            rowList: [5, 10, 20],
            //onSelectRow: function (id){ alert('Selected row ID ' + id); },
            loadComplete: function () { self.result_grid_loadComplete(); },     // if no data returned, hide the grid
            ondblClickRow: function (rowid, iRow, iCol, e) { DoubleClicGridkRow(rowid); },
            rownumbers: true,
            height: 'auto',
            //width: '100%',
            pager: jQuery('#result_pager'),
            id: search.GridInfo.Grid_Key,
            sortname: search.GridInfo.Grid_Key,
            gridview: true,
            autoencode: true,
            viewrecords: true,
            sortorder: "desc",
            caption: "Search Results"
        }).jqGrid("gridResize");    //.navGrid('#pager', { refresh: true, search: true, add: true, del: true, edit: true, edit: true }); //
    },
    self.show_criteria = function () {
        // retrieve each input field of search View Model, set all to empty
        var col_Names = search_data.SearchColumns.split(',');;  //search.RootMeta["ColumnNames"].split(",");
        var msg = "";
        var j = 0;
        for (var i = 0; i < col_Names.length; i++) {
            var val = self[col_Names[i]]();
            if (val == null) continue;
            if (typeof (val) == "number") {
                if (val != 0) msg += ++j + "> " + col_Names[i] + " " + util.bold(getOperatorDesc(self.Ops[col_Names[i]]())) + " " + val + "</br>";
            } else {
                if (val != "") msg += ++j + "> " + col_Names[i] + " " + util.bold(getOperatorDesc(self.Ops[col_Names[i]]())) + " " + val + "</br>";
            }
        }
        if (msg == "") msg = "No criteria has been specified...";
        //else msg = "The current search criteria are:</br>" + msg;
        //toastr.info(msg,"The current search criteria are:</br>");
        self.show_msg(msg, "The current search criteria are:", "red");
    },
    self.clear = function () {
        // retrieve each input field of search View Model, set all to empty
        var col_Names = search_data.SearchColumns.split(',');;  //search.RootMeta["ColumnNames"].split(",");

        for (i = 0; i < col_Names.length; i++) {
            //var val = self[col_Names[i]]();
            var colDataType = search_col_type(col_Names[i]);
            if (colDataType.indexOf("Int") >= 0 || colDataType.indexOf("Decimal") >= 0 || colDataType.indexOf("Boolean") >= 0)     //numeric type
                self[col_Names[i]](0);     //set numeric field to 0, else id='' will cause error
            else self[col_Names[i]]('');
        }
        self.show_msg("", "All search criteria cleared...");
    },
    self.debug = function () {

        debugger;
    };

}
////*******************************************************
////    double click on grid row to edit
////*******************************************************
function DoubleClicGridkRow(rowid) {
    search_vm.show_msg("Editing the selected reord...");
    $.ajax({
        url: search.GridInfo.URL_JsonEdit,
        type: "get",
        async: false,
        data: { id: rowid },
        //contentType: "json",
        contentType: 'application/json;charset=utf-8',
        success: function (data) {
            //if JSON string is returned from server, parse it to Javascript object
            if (typeof (data) == "string") data = JSON.parse(data);
            // make a copy of view Model Data
            edit.OrginalData = data;
            //// bind the view model for the first time
            //if (!edit.bindingApplied) {
            //    edit_vm = new Edit_VM();    ////ko.applyBindings(new HeaderViewModel(), $("#abc-page-header"));
            //    edit_vm.applyMapping(edit.OrginalData);
            //    ko.applyBindings(edit_vm, search.tab_edit.get(0));      //apply knockout bindings to tab_edit, ONCE only  
            //} else { edit_vm.applyMapping(edit.OrginalData); }
            // jquery: activate edit tab ---starting from 0, 1 is the 2nd tab.
            edit_vm.applyMapping(edit.OrginalData);
            activate_tab(1);
        },
        error: function (jqXHR, exception, errorThrown) {
            if (jqXHR.status === 0) {
                alert('Not connect.\n Verify Network.');
            } else if (jqXHR.status == 404) {
                alert('Requested page not found. [404]');
            } else if (jqXHR.status == 500) {
                alert('Internal Server Error [500].' + exception.toString());
            } else if (exception === 'parsererror') {
                alert('Requested JSON parse failed.');
            } else if (exception === 'timeout') {
                alert('Time out error.');
            } else if (exception === 'abort') {
                alert('Ajax request aborted.');
            } else {
                alert('Uncaught Error.\n' + jqXHR.responseText);
            }
        }
    });

    //jQuery.getJSON(search.GridInfo.URL_JsonEdit, { id: rowid }, function (data, textStatus, jqXHR) {
    //    // make a copy of view Model Data
    //    edit.OrginalData = data;
    //    //// bind the view model for the first time
    //    if (!edit.bindingApplied) {
    //        edit_vm = new Edit_VM();    ////ko.applyBindings(new HeaderViewModel(), $("#abc-page-header"));
    //        edit_vm.applyMapping(edit.OrginalData);
    //        ko.applyBindings(edit_vm, search.tab_edit.get(0));      //apply knockout bindings to tab_edit, ONCE only  
    //    } else { edit_vm.applyMapping(edit.OrginalData); }
    //    // jquery: activate edit tab ---starting from 0, 1 is the 2nd tab.
    //    $(function () { $("#tabs").tabs({ active: 1 }); });
    //});
}
//return datatype of a specified search column
function search_col_type(colName) {
    var colNames = search.RootMeta.ColumnNames.split(',');
    var colTypes = search.RootMeta.ColumnTypes.split(',');
    return colTypes[colNames.indexOf(colName)];
}
//return datatype of a specified grid column
function grid_col_type(colName) {
    var colNames = edit.RootMeta.ColumnNames.split(',');
    var colTypes = edit.RootMeta.ColumnTypes.split(',');
    return colTypes[colNames.indexOf(colName)];
}
// row view model for the first child view model
RowViewModel = function (data, child_no) {
    var self = this;
    ko.mapping.fromJS(data, rowDataMapping(child_no), self);
}
var rowDataMapping = function (child_no) {
    return {
        'child1_mapping': {
            key: function (row) {
                return ko.utils.unwrapObservable(row[edit.RootMeta.Child_VMs[child_no]["PrimaryKey"]]);
            },
            create: function (options) {
                return new RowViewModel(options.data);
            }
        }
    }
};
// error handler for json call
function error_handler(jqXHR, exception, errorThrown) {
    if (jqXHR.status === 0) {
        alert('Not connect.\n Verify Network.');
    } else if (jqXHR.status == 404) {
        alert('Requested page not found. [404]');
    } else if (jqXHR.status == 500) {
        alert('Internal Server Error [500].' + exception.toString());
    } else if (exception === 'parsererror') {
        alert('Requested JSON parse failed.');
    } else if (exception === 'timeout') {
        alert('Time out error.');
    } else if (exception === 'abort') {
        alert('Ajax request aborted.');
    } else {
        alert('Uncaught Error.\n' + jqXHR.responseText);
    }
}
Edit_VM = function (data) {

    var self = this;
    //ko.mapping.fromJS(data);

    self.save = function () {
        if (self.ObjectState() == ObjectState.Unchanged) {
            self.show_msg("No change has been made.");
            return;
        }
        $.ajax({
            url: search.GridInfo.URL_Save,
            type: "post",
            data: ko.toJSON(self),
            //contentType: "application/json",
            contentType: 'application/json;charset=utf-8',
            success: function (data) {
                //if JSON string is returned from server, parse it to Javascript object
                if (typeof (data) == "string") data = JSON.parse(data);
                // after deletion, switch to a new URL passed from server side
                if (data.action != null && data.action == "deleted") {
                    activate_tab(0);    // jquery: activate edit tab ---starting from 0, 1 is the 2nd tab.
                    disable_tab(1);
                    if (search_vm) search_vm.search();  //refresh the search result
                    self.show_msg("The record has been successfully deleted.");
                    return;
                }
                if (data.User_Message) self.show_msg(data.User_Message);
                //after successful save, commit the save for Cancel
                self.commit_changes(data);
                self.applyMapping(data);
            },
            error: error_handler
        })
    },
    self.show_msg = function show_msg(msg, title) {
        toastr.info(msg, title);   //  show message for a short duration
    },
    self.viewmodel_edited = function (data) {
        if (self.ObjectState() != ObjectState.Added) { self.ObjectState(ObjectState.Modified); }
        return true;
    },
    self.applyMapping = function (new_VM) {
        ko.mapping.fromJS(new_VM, {}, self);    //{ click: viewModel.showQaItemDetails },       
        // bindings for the children
        for (i = 0; i < edit.RootMeta["Child_VMs"].length; i++) {
            ko.mapping.fromJS(new_VM, rowDataMapping(i), self);
        }
        //*************************************************************
        // for extra computed bindings, defined as the following
        //*************************************************************
        if (typeof (extraBindings) != "undefined") extraBindings(self);

        //unobtrusive event binding for onChange event of root, make sure only bind once //event:{change: edit_vm.viewmodel_edited}
        if (!edit.bindingApplied) {
            search.tab_edit.on("change", {}, self.viewmodel_edited);
            edit.bindingApplied = true;
        }
        return true;
    },
    self.row_edited = function (item, child_no) {
        //if (self.ObjectState() != ObjectState.Added) { self.ObjectState(ObjectState.Modified); }
        if (item.ObjectState() != ObjectState.Added) { item.ObjectState(ObjectState.Modified); }
        return true;
    },
    self.add_new_viewmodel = function (child_no, data) {
        //reset root view model's filed values
        var colNames = edit.RootMeta["ColumnNames"].split(",");
        for (i = 0; i < colNames.length; i++) { self[colNames[i]](''); }
        //set the Primary Key to -1 and ObjectState as Added
        self[edit.RootMeta["PrimaryKey"]](-1);
        self["ObjectState"](ObjectState.Added);
        // clear all data in child view models
        for (i = 0; i < edit.RootMeta.Child_VMs.length; i++) { self[edit.RootMeta.Child_VMs[i]["ViewModelName"]].removeAll(); }
        activate_tab(1);
    },
    self.delete_viewmodel = function () {
        if (confirm("Are you sure to delete current record?") == true) {
            if (self.ObjectState() == ObjectState.Added) { self.cancel_change(); return; }
            // proceed to delete the current record
            self.ObjectState(ObjectState.Deleted);
            self.save();
        }
    },
    //********************************************************
    //* create a new row data for child view model
    //********************************************************
    self.create_row_data = function (child_no) {
        var newRow = {};    //don't use new Array() which will be an array of object
        var colNames = edit.RootMeta["Child_VMs"][child_no]["ColumnNames"].split(",");
        // initialize the new row data as empty
        for (i = 0; i < colNames.length; i++) { newRow[colNames[i]] = ''; }
        //assign a temparory negative key value for newly added child record
        newRow[edit.RootMeta.Child_VMs[child_no]["PrimaryKey"]] = edit.tempID++;
        newRow["ObjectState"] = ObjectState.Added;  // set ObjectState
        //if root view model's primary key is present, set it in row view model 
        if (edit.RootMeta["PrimaryKey"].trim().length > 0) newRow[edit.RootMeta["PrimaryKey"]] = self[edit.RootMeta["PrimaryKey"]]();

        return newRow;
    },
    self.add_row = function (child_no, data) {
        // create a new row
        var row = new RowViewModel(self.create_row_data(child_no), child_no);
        self[edit.RootMeta.Child_VMs[child_no]["ViewModelName"]].push(row);
        self.viewmodel_edited();
    },
    self.delete_row = function (child_no, item) {
        // if Id >0, it is existing row, mark it as deleted, else it's newly added, delete it
        if (item[edit.RootMeta.Child_VMs[child_no]["PrimaryKey"]]() > 0) {
            item.ObjectState(ObjectState.Deleted);  //this.ObjectState(ObjectState.Deleted);
            self[edit.RootMeta.Child_VMs[child_no]["ViewModelName"]].destroy(item);    // observableArray's detroy will hide the row from showing
            self.viewmodel_edited();
        } else {
            self[edit.RootMeta.Child_VMs[child_no]["ViewModelName"]].remove(item);           // self[_Child_VM].remove(this);
        }
    },
    //ko.utils.arrayFilter - filter the items using the filter text
    self.child_vm = function (child_no) {
        return self[edit.RootMeta.Child_VMs[child_no]["ViewModelName"]]();
    },
    self.commit_changes = function (data) {
        edit.OrginalData = {}; // clear original copy, $.extend() to deep copy from json object newly saved.
        //edit.OrginalData
        $.extend(true, edit.OrginalData, data);
        edit.changed_VM = {};
        $.extend(true, edit.changed_VM, data);
    },
    self.cancel_change = function (data) {
        if (self.ObjectState() == ObjectState.Unchanged) {
            self.show_msg("No change has been made.");
            return;
        }
        //save current changes to edit.changed_VM for redo
        edit.changed_VM = ko.toJS(self);
        //recover binding with original data
        self.applyMapping(edit.OrginalData);
        self.show_msg("All the changes have been cancelled, to re-apply changes, please click on Re-Do button.");
        return;
        ////// revert all the changes for the root view model (parent record) 
        ////var colNames = edit.RootMeta["ColumnNames"].split(",");
        ////for (i = 0; i < colNames.length; i++) { self[colNames[i]](edit.OrginalData[colNames[i]]); }

        ////// <1>remove each row of each child View Model <2> recover each row of each child VM with origial data
        ////for (i = 0; i < edit.RootMeta.Child_VMs.length; i++) {  // for each Child view model
        ////    self[edit.RootMeta.Child_VMs[i]["ViewModelName"]].removeAll();
        ////    // each row of each child view model 
        ////    for (j = 0; j < edit.OrginalData[edit.RootMeta["Child_VMs"][i]["ViewModelName"]].length; j++) {
        ////        var row = new RowViewModel(edit.OrginalData[edit.RootMeta["Child_VMs"][i]["ViewModelName"]][j]);
        ////        self[edit.RootMeta.Child_VMs[i]["ViewModelName"]].push(row);
        ////    }
        ////}
    },
    self.redo_change = function (data) {
        self.applyMapping(edit.changed_VM);
        self.show_msg("The changes have been re-applied, </br>to cancel changes, please click on Cancel button.");
        return;
        //////after Cancel, we re-apply previous changes to View Model 
        ////var colNames = edit.RootMeta["ColumnNames"].split(",");
        ////for (i = 0; i < colNames.length; i++) { self[colNames[i]](edit.changed_VM[colNames[i]]); }
        //////for (var prop in edit.OrginalData) { if (prop != _Child_VM && prop != _Child_VM2) self[prop](edit.OrginalData[prop]); }
        ////// revert changes in child view models
        ////for (i = 0; i < edit.RootMeta.Child_VMs.length; i++) {
        ////    self[edit.RootMeta.Child_VMs[i]["ViewModelName"]].removeAll();
        ////    for (j = 0; j < edit.changed_VM[edit.RootMeta["Child_VMs"][i]["ViewModelName"]].length; j++) {
        ////        var row = new RowViewModel(edit.changed_VM[edit.RootMeta["Child_VMs"][i]["ViewModelName"]][j]);
        ////        self[edit.RootMeta.Child_VMs[i]["ViewModelName"]].push(row);
        ////    }
        ////}
    },
    self.debug = function () {
        debugger;
    };
}

var util = {};
util.bold = function (str) { return "<strong>" + str + "</strong>"; }
util.color = function (str, color) { return "<font color=" + color + ">" + str + "</font>"; };
util.setCookie = function (c_name, value, expiredays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + expiredays);
    document.cookie = c_name + "=" + escape(value) +
    ((expiredays == null) ? "" : ";expires=" + exdate.toUTCString());
}
util.getCookie = function (c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) c_end = document.cookie.length;
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}
//<font color='red'> this is jaems testing</font>

// create a blank edit view model
function blank_edit_vm() {
    var oReturn = {};
    var colNames = edit.RootMeta["ColumnNames"].split(",");
    for (i = 0; i < colNames.length; i++) { oReturn[colNames[i]] = ''; }
    //set the Primary Key to -1 and ObjectState as Added
    oReturn[edit.RootMeta["PrimaryKey"]] = -1;
    oReturn["ObjectState"] = ObjectState.Added;
    // create blank data in child view models
    for (i = 0; i < edit.RootMeta.Child_VMs.length; i++) {
        var child_vm_name = edit.RootMeta.Child_VMs[i]["ViewModelName"];
        var child_obj = {};
        oReturn[child_vm_name] = new Array();       //add one blank record to child view model, set PK & FK
        //oReturn[child_vm_name].push();
        var cols = edit.RootMeta.Child_VMs[i]["ColumnNames"].split(",");
        for (j = 0; j < cols.length; j++) {
            child_obj[cols[j]] = '';
        }
        child_obj[edit.RootMeta["PrimaryKey"]] = oReturn[edit.RootMeta["PrimaryKey"]];
        child_obj["ObjectState"] = ObjectState.Added;
        child_obj[edit.RootMeta.Child_VMs[i]["PrimaryKey"]] = edit.tempID++;
        oReturn[child_vm_name].push(child_obj);
    }
    return oReturn;
}