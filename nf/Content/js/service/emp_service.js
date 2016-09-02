
EMP_REST_URL=window.location+'api/employee/';

App.factory('EmpService', ['$http', '$q', function($http, $q){

	return {
		
			fetchAllEmps: function() {
					return $http.get(EMP_REST_URL)
							.then(
									function(response){
										return response.data;
									}, 
									function(errResponse){
										console.error('Error while fetching employees');
										return $q.reject(errResponse);
									}
							);
			},
		    
		    createEmp: function(emp){
					return $http.post(EMP_REST_URL, emp)
							.then(
									function(response){
										return response.data;
									}, 
									function(errResponse){
										console.error('Error while creating employee');
										return $q.reject(errResponse);
									}
							);
		    },
		    
		    updateEmp: function(emp, id){
					return $http.put(EMP_REST_URL+id, emp)
							.then(
									function(response){
										return response.data;
									}, 
									function(errResponse){
										console.error('Error while updating employee');
										return $q.reject(errResponse);
									}
							);
			},
		    
			deleteEmp: function(id){
					return $http.delete(EMP_REST_URL+id)
							.then(
									function(response){
										return response.data;
									}, 
									function(errResponse){
										console.error('Error while deleting employee');
										return $q.reject(errResponse);
									}
							);
			}
		
	};

}]);
