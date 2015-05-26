// 'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('parserApp'));

  beforeEach( inject( function ( _$state_ ) {
          state = _$state_;
          spyOn( state, 'go' );
          spyOn( state, 'transitionTo' );
      } ) );

  var MainCtrl,
      scope,
      $httpBackend,
      $http;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope, _$http_) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/things')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
    $http = _$http_;
  }));

  it('should attach a list of things to the scope', function () {
    $http.get('/api/things');
    $httpBackend.flush();
    expect(scope.awesomeThings.length).toBe(4);
    // expect(4).toBe(4);
  });
});
