'use strict';

angular.module('parserApp')
  .controller('KeywordsListCtrl', function ($scope, $http) {

    $http.get('/auth/adminlogin/showAllKeywords')
      .success(function(response) {
        
        $scope.ourKeywords = response;
        console.log(JSON.stringify(response));
      });

    $http.get('/checkout/getAllUserKeywordsWithNames')
      .success(function(response) {

        $scope.userKeywords = response;

        console.log(JSON.stringify(response));
      });
  });