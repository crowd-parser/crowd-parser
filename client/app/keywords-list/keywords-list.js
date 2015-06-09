'use strict';

angular.module('parserApp')
  .controller('KeywordsListCtrl', function ($scope, $http) {

    $http.get('/auth/adminlogin/showAllKeywords')
      .success(function(response) {

        var ourKeywords = response;
        
        ourKeywords.forEach(function(item) {

          $http.get('/statistics/getKeywordCount/' + item.keyword)
            .success(function(data) {

              if (data.length > 0) {

                item.count = data[0].id;
                $scope.ourKeywords = ourKeywords;
              }
              
            });
        });

      });

    $http.get('/checkout/getAllUserKeywordsWithNames')
      .success(function(response) {

        var userKeywords = response;
                
        userKeywords.forEach(function(item) {

          $http.get('/statistics/getKeywordCount/' + item.purchased_keyword)
            .success(function(data) {
              
              if (data.length > 0) {

                item.count = data[0].id;
              }
              
              $scope.userKeywords = userKeywords;
            });
        });
      });
  });