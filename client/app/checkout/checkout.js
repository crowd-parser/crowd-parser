'use strict';

angular.module('parserApp')
  .controller('CheckoutCtrl', function ($scope, $http) {

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
  });