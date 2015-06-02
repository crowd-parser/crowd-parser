'use strict';

angular.module('parserApp', [
  'parserApp.headerService',
  'parserApp.twitterService',
  'parserApp.emojiService',
  'parserApp.display3dService',
  'parserApp.authService',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      .state('3dstream', {
        url: '/3dstream',
        templateUrl: 'app/3dstream/3dstream.html',
        controller: '3dStreamCtrl'
      })
      .state('dbPanel', {
        url: '/dbPanel',
        templateUrl: 'app/dbPanel/dbPanel.html',
        controller: 'DBPanelCtrl'
      })
      .state('adminlogin', {
        url: '/adminlogin',
        templateUrl: 'app/adminlogin/adminlogin.html',
        controller: 'AdminLoginCtrl'
      })
      .state('about', {
        url: '/about',
        templateUrl: 'app/about/about.html'
      });

    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });