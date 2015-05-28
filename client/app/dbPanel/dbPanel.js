'use strict';

angular.module('parserApp')
  .controller('DBPanelCtrl', function ($http, $scope, $state, Twitter, Auth) {

    Auth.checkAuth();

    var socket = Twitter.socket;

    $scope.currDB = null;

    $scope.getTables = function(){
      console.log("client says getTables");
        $http.get('/auth/adminlogin/getTables').success(function(data) {
          console.log("client tables", data);
        $scope.dbtables = data;
      });
      };

    $scope.selectTable = function(name){

       $http.post('/auth/adminlogin/selectTable', {name: name}).success(function(data) {
        console.log("FINAL TABLE DATA: ", data);
        $scope.selectedTableName = name;
        $scope.selectedTable = data;
        $scope.showTableSize(name);
      });
    };

    $scope.showTableSize = function(name) {
      $http.post('/auth/adminlogin/showTableSize', {name: name}).success(function(data) {

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

          $scope.keywordsList = data;
        });
    };
    $scope.showAllLayers = function() {
      $http.get('/auth/adminlogin/showAllLayers')
        .success(function(data) {

          $scope.layersList = data;
        });
    };


    $scope.startDownload = function(rate) {

      rate = rate || $scope.streamDownloadRate;
      socket.emit('start download', rate);

    };

    $scope.stopDownload = function() {
      socket.emit('stop download');
    };

    socket.on('tweet added', function(data) {
      console.log("client notified of tweet added");
      $scope.tweetAdded = 'Tweet added! --> ID: ' + data[0].id;
    });

    $scope.addNewLayer = function(name) {
      name = name || $scope.newLayerInput;
      $http.post('/auth/adminlogin/addNewLayer', {name: name}).success(function(data) {
        $scope.showAllKeywords();
        $scope.getTables();
      });
    };

    $scope.redoLayer = function(name) {
      name = name || $scope.redoLayerInput;
      $http.post('/auth/adminlogin/redoLayer', {name: name}).success(function(data) {
        console.log("DONE: ", data);
      });
    };

    $scope.deleteLayer = function(name) {
      name = name || $scope.deleteLayerInput;
      $http.post('/auth/adminlogin/deleteLayer', {name: name}).success(function(data) {
        console.log("DONE: ", data);
      });
    };

    $scope.addNewKeyword = function(name) {
       name = name || $scope.newKeywordInput;
       $http.post('/auth/adminlogin/addNewKeyword', {name: name}).success(function(data) {
        $scope.showAllKeywords();
        $scope.getTables();
      });
    };

    $scope.redoKeyword = function(name) {
      name = name || $scope.redoKeywordInput;
      $http.post('/auth/adminlogin/redoKeyword', {name: name}).success(function(data) {
        $scope.showAllKeywords();
        $scope.getTables();
      });
    };

    $scope.deleteKeyword = function(name) {
      name = name || $scope.deleteKeywordInput;
      $http.post('/auth/adminlogin/deleteKeyword', {name: name}).success(function(data) {
        console.log("DONE with delete: ", data);
        $scope.showAllKeywords();
        $scope.getTables();

      });
    };

    $scope.createDatabase = function(name) {

      name = name || $scope.createDatabaseInput;
      console.log("create database client req: ", name);
      $http.post('/auth/adminlogin/createDatabase', {name: name}).success(function(data) {
        console.log("DONE: ", data);

      });
    };

    $scope.deleteDatabase = function(name){
      //this is also prevented on the server
      //but might as well do it here
      name = name || $scope.deleteDatabaseInput;
      if(name === 'production'){
        return;
      }
      $http.post('/auth/adminlogin/deleteDatabase', {name: name}).success(function(data) {
        console.log("DONE: ", data);
      });
    }

    $scope.changeToDatabase = function(name) {
      name = name || $scope.changeToDatabaseInput;
       $http.post('/auth/adminlogin/changeToDatabase', {name: name}).success(function(data) {
        console.log("CHANGE TO: ", data);
        console.log("DATA: ", data);
        $scope.currDB = name;
      });
    };

    $scope.ADDALLTHETWEETS = function(){
       $http.post('/auth/adminlogin/ADDALLTHETWEETS', {}).success(function(data) {

      });
    };

     $scope.ADDTHEFIVETESTTWEETS = function(){
       $http.post('/auth/adminlogin/ADDTHEFIVETESTTWEETS', {}).success(function(data) {

      });
    }



    $scope.logout = function() {
      localStorage.removeItem('com.crowdparser');
      $state.transitionTo('main');
    };

  });
