angular.module('parserApp.authService', [])

.factory('Auth', function ($http, $state) {

  // Admin login form is at /adminlogin
  // Token authentication is used to allow only administrators access to the admin panel

  var adminlogin = function(username, password) {

    $http.post('/auth/adminlogin', {username: username, password: password})
      .success(function(data) {
        
        if (data.token) {
          localStorage.setItem('com.crowdparser', data.token);
        }
        $state.transitionTo('dbPanel');
      });
  };

  // Used to make sure user is authenticated before allowing access to the admin panel
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

  var loggedIn = false;

  var purchasingUser = false;

  return {
    adminlogin: adminlogin,
    checkAuth: checkAuth,
    loggedIn: loggedIn,
    purchasingUser: purchasingUser
  };
});