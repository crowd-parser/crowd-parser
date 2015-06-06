'use strict';

angular.module('parserApp')
  .controller('NavbarCtrl', function ($scope, Auth, Social) {

    setInterval(function() {
      $scope.$apply(function() {
        $scope.loggedIn = Auth.loggedIn;
      });
    }, 1000);
    
    $scope.toggleNavbar = function() {
      $('.navbar-menu').fadeToggle();
    };

    Social.sbg();

    $scope.fbLogout = function() {
      FB.logout(function(response) {
        console.log(response);
        Auth.loggedIn = false;
      });
    };

    $('.navbar-menu').on('mouseleave', function() {
      $('.navbar-menu').fadeToggle();
    });
  });