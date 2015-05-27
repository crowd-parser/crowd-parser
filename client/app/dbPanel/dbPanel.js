'use strict';

angular.module('parserApp')
  .controller('DBPanelCtrl', function ($http, $scope, $state, Twitter, Auth) {

    Auth.checkAuth();

    var socket = Twitter.socket;

    $scope.currDB = null;

    // $http.get('/auth/adminlogin/getDatabaseName').success(function(data) {
    //   $scope.currentDatabase = data;
    // });



    $scope.getTables = function(){
        $http.get('/auth/adminlogin/getTables').success(function(data) {
        $scope.dbtables = data;
      });
      };

    $scope.selectTable = function(name){
      $scope.showTableSize(name);
      $scope.selectedTableName = name;
       $http.post('/auth/adminlogin/selectTable', {name: name}).success(function(data) {
        console.log("DATA: ", data);
        $scope.selectedTable = data;
      });
    };

    $scope.showTableSize = function(tableName) {
      $http.post('/auth/adminlogin/showTableSize', {tableName: tableName}).success(function(data) {
        $scope.tableBeingViewed = tableName;
        $scope.tableSize = data[0]["COUNT(*)"];
      });
    };

    $scope.getCurrentDatabaseName = function(){
        $http.get('/auth/adminlogin/getDatabaseName').success(function(data) {
        $scope.currDB = data;
      });
    };

    $scope.showAllKeywords = function() {
      $http.get('/auth/adminlogin/showAllKeywords')
        .success(function(data) {
          console.log(data);
          $scope.keywordsList = data;
        });
    };

    $scope.startDownload = function() {

      var rate = $scope.streamDownloadRate;
      $scope.streamDownloadRate = '';

      socket.emit('start download', rate);

    };

    $scope.stopDownload = function() {
      socket.emit('stop download');
    };

    socket.on('tweet added', function(data) {
      $scope.$apply(function() {
        $scope.tweetAdded = 'Tweet added! --> ID: ' + data;
      });
    });

    $scope.addNewLayer = function() {

    };

    $scope.redoLayer = function() {

    };

    $scope.deleteLayer = function() {

    };

    $scope.addNewKeyword = function() {
       var keyword = $scope.newKeywordInput;
       $http.post('/auth/adminlogin/addNewKeyword', {keyword: keyword}).success(function(data) {
        if(data){
          console.log("KEYWORD ADDED: ", data);
          //added
          //reenable keyword button
        }else{
          //error
          console.log("ADD KEYWORD FAIL");
        }
      });
    };

    $scope.redoKeyword = function() {

    };

    $scope.deleteKeyword = function() {

    };

    $scope.createDatabase = function() {

    };

    $scope.changeToDatabase = function() {
      var name = $scope.changeToDatabaseInput;
       $http.post('/auth/adminlogin/changeToDatabase', {name: name}).success(function(data) {
        console.log("CHANGE TO: ", data);
        $scope.currDB = data; //needs to become something
      });
    };

    $scope.logout = function() {
      localStorage.removeItem('com.crowdparser');
      $state.transitionTo('main');
    };

  });
