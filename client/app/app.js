'use strict';

angular.module('parserApp', [
  'parserApp.headerService',
  'parserApp.twitterService',
  'parserApp.emojiService',
  'parserApp.display3dService',
  'parserApp.authService',
  'parserApp.socialService',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'angularPayments'
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
      })
      .state('statistics', {
        url: '/statistics',
        templateUrl: 'app/statistics/statistics.html'
      })
      .state('dashboard', {
        url: '/dashboard',
        templateUrl: 'app/dashboard/dashboard.html',
        controller: 'DashboardCtrl'
      })
      .state('keywords-list', {
        url: '/keywords-list',
        templateUrl: 'app/keywords-list/keywords-list.html',
        controller: 'KeywordsListCtrl'
      })
      .state('privacy-policy', {
        url: '/wp4fb/privacy-policy',
        templateUrl: 'app/privacy-policy/privacy-policy.html'
      })
      .state('terms-of-service', {
        url: '/terms-of-service',
        templateUrl: 'app/privacy-policy/terms-of-service.html'
      });

    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });