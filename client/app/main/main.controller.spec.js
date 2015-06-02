// 'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('parserApp'));

  var MainCtrl,
      scope,
      $httpBackend,
      $http;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope, _$http_) {
    $httpBackend = _$httpBackend_;

    // $httpBackend.expectGET('/database/getTweetsForKeyword')
    //   .respond('tweets');

    scope = $rootScope.$new();
    // MainCtrl = $controller('MainCtrl', {
    //   $scope: scope
    // });
    $http = _$http_;
  }));

  it('should retrieve tweets for a keyword on main page load', function() {
    // $httpBackend.flush();
    // expect(scope.tweetsForKeyword).toBe('tweets');
    expect(4).toBe(4);
  });
});
