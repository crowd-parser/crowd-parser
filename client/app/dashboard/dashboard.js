'use strict';

angular.module('parserApp')
  .controller('DashboardCtrl', function ($scope, $http, Auth, Social) {

    // Initializes social sharing buttons in user dashboard
    Social.sbg();

    // Continually checks if user is logged in and if user has purchased keywords
    // Used to show different views depending on user status
    setInterval(function() {
      $scope.$apply(function() {

        $scope.loggedIn = Auth.loggedIn;
        $scope.purchasingUser = Auth.purchasingUser;
      });
    }, 500);

    // Checks if user is a purchasing user. If so, display user dashboard instead of the checkout view.
    var checkIfPurchased = function(fb_id) {

      $http.post('/checkout/checkIfPurchased', {fb_id: fb_id})
        .success(function(response) {
          if (response) {
            Auth.purchasingUser = true;
            $scope.purchasingUser = Auth.purchasingUser;

            $scope.purchasingUserDetails = response;

            $http.get('/checkout/getUserKeywords/' + $scope.purchasingUserDetails.id)
              .success(function(response) {

                $scope.purchasingUserKeywords = response;
              });
          }
        });
    };

    // Check if user is a purchasing user at page load. If so, display the user dashboard instead of the checkout view.
    setTimeout(function() {

      FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {

          var fb_id = response.authResponse.userID.toString();

          checkIfPurchased(fb_id);
        }
      });
    }, 700);

    // User logs in with Facebook. 
    $scope.fbLogin = function() {
      FB.login(function(response) {
        if (response.status === 'connected') {
          Auth.loggedIn = true;
          $scope.loggedIn = Auth.loggedIn;

          if (response.status === 'connected') {

            var fb_id = response.authResponse.userID.toString();

            checkIfPurchased(fb_id);
          }
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
      $scope.userKeywordInput = '';

      var params = {
        id: $scope.purchasingUserDetails.id,
        keyword: userKeyword
      };

      $http.post('/checkout/userAddKeyword', params)
        .success(function(response) {
          console.log(response);

          $http.get('/checkout/getUserKeywords/' + $scope.purchasingUserDetails.id)
            .success(function(response) {

              $scope.purchasingUserKeywords = response;
            });
        });
    };
  });