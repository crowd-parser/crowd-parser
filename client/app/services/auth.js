angular.module('parserApp.authService', [])

.factory('Auth', function ($http, $state) {

  var adminlogin = function(username, password) {

    $http.post('/auth/adminlogin', {username: username, password: password})
      .success(function(data) {
        if (data.token) {
          localStorage.setItem('com.crowdparser', data.token);
        }

        $state.transitionTo('dbPanel');
      });
  };

  var checkAuth = function() {
    var token = localStorage.getItem('com.crowdparser');
    
    $http.post('/auth/checkAuth', {token: token})
      .success(function(data) {
        if (data !== 'OK') {
          $state.transitionTo('main');
        }
      })
      .error(function(err) {
        console.log(err);
      });
  };

  return {
    login: login,
    adminlogin: adminlogin,
    checkAuth: checkAuth
  };
});