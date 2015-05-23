'use strict';

angular.module('parserApp')
  .controller('AdminLoginCtrl', function ($scope, Auth) {

    $scope.adminlogin = function() {

      var username = $scope.usernameInput;
      $scope.usernameInput = '';

      var password = $scope.passwordInput;
      $scope.passwordInput = '';

      Auth.adminlogin(username, password);

    };
  });