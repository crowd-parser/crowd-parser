'use strict';

angular.module('parserApp')
  .controller('NavbarCtrl', function ($scope, Auth, Social) {
    
    Social.sbg();

    setInterval(function() {
      $scope.$apply(function() {
        $scope.loggedIn = Auth.loggedIn;
      });
    }, 500);
    
    $scope.toggleNavbar = function() {
      $('.navbar-menu').fadeToggle();
    };

    $scope.fbLogout = function() {
      FB.logout(function(response) {
        Auth.loggedIn = false;
      });
    };

    $('.navbar-menu').on('mouseleave', function() {
      $('.navbar-menu').fadeToggle();
    });
  });