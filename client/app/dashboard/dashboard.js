'use strict';

angular.module('parserApp')
  .controller('DashboardCtrl', function ($scope, $http, Auth, Social) {

    setInterval(function() {
      $scope.$apply(function() {

        Social.checkLoginState();
        $scope.loggedIn = Auth.loggedIn;
      });
    }, 500);

    $scope.stripeCallback = function (code, result) {
      if (result.error) {
        console.log('it failed! error: ' + result.error.message);
      } else {
        console.log('success! token: ' + result.id);
        $http.post('/checkout/purchase', {stripeToken: result.id})
          .success(function(data) {
            console.log('SERVER SUCCESS', data);
          });
      }
    };

    $scope.selectOption = function(number) {

      $scope.selectedOption = number;
    };

    $scope.fbLogin = function() {
      // console.log('LOGINTEST')
      // FB.login(function(response) {
      //   console.log(response);

      //   // if (response.status === 'connected') {
      //     Auth.loggedIn = true;
      //   // }
      // });
    };

    $scope.fbLogout = function() {
      FB.logout(function(response) {
        console.log(response);
        Auth.loggedIn = false;
      });
    };

  });