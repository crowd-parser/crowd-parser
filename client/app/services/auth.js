angular.module('parserApp.authService', [])

.factory('Auth', function ($http) {

  var login = function(username, password) {

    $http.post('/auth/login', {username: username, password: password})
      .success(function(data) {
        console.log('Success!');
      });

  };

  var adminlogin = function(username, password) {

    $http.post('/auth/adminlogin', {username: username, password: password})
      .success(function(data) {
        console.log('Administrator logged in!');
      });

  };

  return {
    login: login,
    adminlogin: adminlogin
  };
});