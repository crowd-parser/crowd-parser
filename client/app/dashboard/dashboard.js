'use strict';

angular.module('parserApp')
  .controller('DashboardCtrl', function ($scope, $http, Auth, Social) {

    Social.sbg();

    setInterval(function() {
      $scope.$apply(function() {

        $scope.loggedIn = Auth.loggedIn;
      });
    }, 500);

    setTimeout(function() {

      FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {

          var fb_id = response.authResponse.userID.toString();

          $http.post('/checkout/checkIfPurchased', {fb_id: fb_id})
            .success(function(response) {
              if (response) {
                $scope.purchasingUser = true;

                $scope.purchasingUserDetails = response;

                $http.get('/checkout/getUserKeywords/' + $scope.purchasingUserDetails.id)
                  .success(function(response) {

                    $scope.purchasingUserKeywords = response;
                  });
              }
            });
        }
      });
    }, 700);

    $scope.fbLogin = function() {
      FB.login(function(response) {
        if (response.status === 'connected') {
          Auth.loggedIn = true;
          $scope.loggedIn = Auth.loggedIn;
        }
      });
    };

    $scope.stripeCallback = function (code, result) {
      if (result.error) {
        console.log('it failed! error: ' + result.error.message);
      } else {
        console.log('success! token: ' + result.id);

        FB.getLoginStatus(function(response) {
          var fb_id = response.authResponse.userID.toString();
          
          var purchaseDetails = {
            fb_id: fb_id,
            name: $scope.purchasingUsername,
            email: $scope.purchasingEmail,
            number_of_keywords: $scope.selectedOption
          };

          $http.post('/checkout/purchase', {stripeToken: result.id, purchaseDetails: purchaseDetails})
            .success(function(data) {
              console.log('SERVER SUCCESS', data);

              $scope.purchasingUser = true;
            });
        });
      }
    };

    $scope.selectOption = function(number) {

      $scope.selectedOption = number;
    };

    $scope.userKeywordSubmit = function() {

      var userKeyword = $scope.userKeywordInput;

      var params = {
        id: $scope.purchasingUserDetails.id,
        keyword: userKeyword
      };

      $http.post('/checkout/userAddKeyword', params)
        .success(function(response) {
          console.log(response);
        });
    };
  });