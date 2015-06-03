// 'use strict';

describe('Controller: DBPanelCtrl', function () {

  // load the controller's module
  beforeEach(module('parserApp'));

  var DBPanelCtrl,
      scope,
      $httpBackend,
      $http;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope, _$http_) {
    $httpBackend = _$httpBackend_;


    scope = $rootScope.$new();
    DBPanelCtrl = $controller('DBPanelCtrl', {
      $scope: scope
    });
    $http = _$http_;
  }));

  it('should get tables', function() {
    $httpBackend.expectGET('/auth/adminlogin/getTables')
      .respond('tables');

    $http.get('/auth/adminlogin/getTables')
    $httpBackend.flush();
    expect(scope.dbtables).toBe('tables');
  });
});
