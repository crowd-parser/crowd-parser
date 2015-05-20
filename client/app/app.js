'use strict';

angular.module('parserApp', [
  'parserApp.twitterService',
  'parserApp.wordcloudService',
  'parserApp.directives.dirPagination',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
  });