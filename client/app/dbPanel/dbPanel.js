'use strict';

angular.module('parserApp')
  .controller('DBPanelCtrl', function ($scope) {
    $scope.varA = 'buttonA does taskA';
    $scope.varB = 'buttonB does taskB';
    $scope.varC = 'buttonC does taskC';
    $scope.textfieldA = "some default text";
    $scope.taskA = function () {
      console.log('doing task A, textfield contains ' + $scope.textfieldA);
    };
    $scope.taskB = function () {
      console.log('doing task B');
    };
    $scope.taskC = function () {
      console.log('doing task C');
    };
  });