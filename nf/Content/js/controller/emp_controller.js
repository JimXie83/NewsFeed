

App.controller('EmpController', ['$scope', 'EmpService', function($scope, EmpService) {
          var self = this;
          self.emp={id:null,lastname:'',email:'',telephone:''};
          self.emps=[];
              
          self.fetchAllEmps = function(){
              EmpService.fetchAllEmps()
                  .then(
      					       function(d) {
      						        self.emps = d;
      					       },
            					function(errResponse){
            						console.error('Error while fetching Currencies');
            					}
      			       );
          };
           
          self.createEmp = function(emp){
              EmpService.createEmp(emp)
		              .then(
                      self.fetchAllEmps, 
				              function(errResponse){
					               console.error('Error while creating Emp.');
				              }	
                  );
          };

         self.updateEmp = function(emp, id){
              EmpService.updateEmp(emp, id)
		              .then(
				              self.fetchAllEmps, 
				              function(errResponse){
					               console.error('Error while updating Emp.');
				              }	
                  );
          };

         self.deleteEmp = function(id){
              EmpService.deleteEmp(id)
		              .then(
				              self.fetchAllEmps, 
				              function(errResponse){
					               console.error('Error while deleting Emp.');
				              }	
                  );
          };

          self.fetchAllEmps();

          self.submit = function() {
              if(self.emp.id==null){
                  console.log('Saving New Emp', self.emp);    
                  self.createEmp(self.emp);
              }else{
                  self.updateEmp(self.emp, self.emp.id);
                  console.log('Emp updated with id ', self.emp.id);
              }
              self.reset();
          };
              
          self.edit = function(id){
              console.log('id to be edited', id);
              for(var i = 0; i < self.emps.length; i++){
                  if(self.emps[i].id == id) {
                     self.emp = angular.copy(self.emps[i]);
                     break;
                  }
              }
          };
              
          self.remove = function(id){
              console.log('id to be deleted', id);
              if(self.emp.id === id) {//clean form if the emp to be deleted is shown there.
                 self.reset();
              }
              self.deleteEmp(id);
          };

          
          self.reset = function(){
              self.emp={id:null,lastname:'',email:'',telephone:''};
              $scope.myForm.$setPristine(); //reset Form
          };

      }]);
