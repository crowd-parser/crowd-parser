// .state('main.frontpage3d', {
//   templateUrl: 'app/main/main.frontpage3d.html',
//   controller: '3dStreamCtrl'
// })
.state('main.components', {
  views: {
    'frontpage3d': {
      templateUrl: 'app/main/main.frontpage3d.html',
      controller: '3dStreamCtrl'
    },
    'tweets-sentiment-display': {
      templateUrl: 'app/main/main.tweets-sentiment-display.html'
    }
  }
})
.state('login', {
  url: '/login',
  templateUrl: 'app/login/login.html',
  controller: 'LoginCtrl'
})