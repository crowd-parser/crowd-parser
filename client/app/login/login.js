'use strict';

angular.module('parserApp')
  .controller('LoginCtrl', function ($scope, Auth) {

    $scope.login = function() {

      var username = $scope.usernameInput;
      $scope.usernameInput = '';

      var password = $scope.passwordInput;
      $scope.passwordInput = '';

      Auth.login(username, password);

    };
  });