angular.module('parserApp.authService', [])

.factory('Auth', function ($http) {

  var login = function(username, password) {

    $http.post('/auth/login', {username: username, password: password})
      .success(function(data) {
        console.log('Success!');
      });

  };

  return {
    login: login
  };
});