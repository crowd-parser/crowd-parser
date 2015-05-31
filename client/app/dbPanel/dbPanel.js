'use strict';

angular.module('parserApp')
  .controller('DBPanelCtrl', function ($timeout, $http, $scope, $state, Twitter, Auth) {

    Auth.checkAuth();

    var socket = Twitter.socket;

    $scope.currDB = null;

    $scope.refresh = function(){
      if(!$scope.currDB) return;
      $scope.getTables();
      $scope.clearSelectedTable();
      $scope.showAllKeywords();
      $scope.showAllLayers();
    }

    $scope.setLeftStatus = function(fadeTime, str){

      if(str !== undefined){
        $scope.leftStatus = str;
      }

      if(fadeTime){
        $timeout(function(){
          $scope.leftStatus = "";
        }, fadeTime);
      }
    };
    $scope.setRightStatus = function(fadeTime, str){
      if(str !== undefined){
        $scope.rightStatus = str;
      }

      if(fadeTime){
        $timeout(function(){
          $scope.rightStatus = "";
        }, fadeTime);
      }
    };

    $scope.getTables = function(){
      $scope.dbTables = null;
      console.log("client says getTables");
        $http.get('/auth/adminlogin/getTables')
        .success(function(data) {
          console.log("client tables", data);
        $scope.dbtables = data;
      })
        .error(function(data){

        });
      };

    $scope.selectTable = function(name){
      $scope.clearSelectedTable();
       $http.post('/auth/adminlogin/selectTable', {name: name})
       .success(function(data) {
        if(!data){

        }
        console.log("FINAL TABLE DATA: ", data);
        $scope.selectedTableName = name;
        $scope.selectedTable = data;
        $scope.showTableSize(name);
      })
       .error(function(data){

        });
    };
    $scope.clearSelectedTable = function(){
      $scope.selectedTableName = "";
        $scope.selectedTable = "";
        $scope.tableSize = "";
    }

    $scope.showTableSize = function(name) {
      $scope.tableSize = "";
      $http.post('/auth/adminlogin/showTableSize', {name: name})
      .success(function(data) {

        $scope.tableSize = data[0]["COUNT(*)"];
      })
      .error(function(data){

      });
    };

    $scope.getCurrentDatabaseName = function(){
        $http.get('/auth/adminlogin/getDatabaseName')
        .success(function(data) {
        $scope.currDB = data;
      })
        .error(function(data){

        });
    };

    $scope.showAllKeywords = function() {
      $scope.keywordsList = null;
      $http.get('/auth/adminlogin/showAllKeywords')
      .success(function(data) {
          $scope.keywordsList = data;
        })
      .error(function(data){

        });
    };
    $scope.showAllLayers = function() {
      $scope.layersList = null;
      $http.get('/auth/adminlogin/showAllLayers')
        .success(function(data) {

          $scope.layersList = data;
        }).error(function(data){

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
      name = name || $scope.layerName;
      $http.post('/auth/adminlogin/addNewLayer', {name: name})
      .success(function(data) {
        console.log("LAYER ADD COMPLETE");
        $scope.showAllLayers();
        $scope.getTables();
      })
      .error(function(data){

      });
    };

    $scope.redoLayer = function(name) {
      name = name || $scope.layerName;
      $http.post('/auth/adminlogin/redoLayer', {name: name})
      .success(function(data) {
        console.log("DONE: ", data);
      })
      .error(function(data){

      });
    };

    $scope.deleteLayer = function(name) {
      name = name || $scope.layerName;
      $http.post('/auth/adminlogin/deleteLayer', {name: name})
      .success(function(data) {
        console.log("DONE: ", data);
        $scope.showAllLayers();
        $scope.getTables();
      })
      .error(function(data){

      });
    };

    $scope.addNewKeyword = function(name) {
       name = name || $scope.keywordName;
       $http.post('/auth/adminlogin/addNewKeyword', {name: name})
       .success(function(data) {
        $scope.showAllKeywords();
        $scope.getTables();
      })
       .error(function(data){

      });
    };

    $scope.redoKeyword = function(name) {
      name = name || $scope.keywordName;
      $http.post('/auth/adminlogin/redoKeyword', {name: name})
      .success(function(data) {
        $scope.showAllKeywords();
        $scope.getTables();
      })
      .error(function(data){

      });
    };

    $scope.deleteKeyword = function(name) {
      name = name || $scope.keywordName;
      $http.post('/auth/adminlogin/deleteKeyword', {name: name})
      .success(function(data) {
        console.log("DONE with delete: ", data);
        $scope.showAllKeywords();
        $scope.getTables();

      })
      .error(function(data){

      });
    };

    $scope.testKeywordSearch = function(name) {
      name = name || $scope.keywordName;
      $http.post('/auth/adminlogin/testKeywordSearch', {name: name})
      .success(function(data) {
        console.log("DONE with test: ", data);

      })
      .error(function(data){
        console.log("ERR test");
      });
    };

    $scope.createDatabase = function(name) {

      name = name || $scope.databaseName;
      $scope.setLeftStatus(null,"CLIENT: CREATE DB: " + name);
      if(!name || name === $scope.currDB){
        $scope.setRightStatus(3000,"ERROR: provide valid name.");
        $scope.setLeftStatus(3000);
        return;
      }
      $scope.setRightStatus(null, "WAITING FOR DATABASE");
      $http.post('/auth/adminlogin/createDatabase', {name: name})
       .success(function(data) {

         if(!data){
            $scope.setRightStatus(3000,"ERROR: provide valid name.");
            $scope.setLeftStatus(3000);
            return;
          }

        $scope.setRightStatus(3000,"DB CREATE SUCCESS");
        $scope.setLeftStatus(3000);
        $scope.currDB = data;
        $scope.refresh();
      })
       .error(function(data){
        $scope.setRightStatus(3000,"SERVER ERROR");
      });
    };

    $scope.deleteDatabase = function(name){
      //this is also prevented on the server
      //but might as well do it here
      name = name || $scope.databaseName;
      $scope.setLeftStatus(null,"CLIENT: DELETE DB: " + name);
      if(!name){
        $scope.setRightStatus(3000,"ERROR: provide valid name.");
        $scope.setLeftStatus(3000);
        return;
      }

      $http.post('/auth/adminlogin/deleteDatabase', {name: name})
        .success(function(data) {
          if(!data){
            $scope.setRightStatus(3000,"ERROR: provide valid name.");
            $scope.setLeftStatus(3000);
            return;
          }
        $scope.setRightStatus(3000,"DB DELETE SUCCESS");
        $scope.setLeftStatus(3000);
        if($scope.currDB === name){
          $scope.currDB = null;
        }

      })
       .error(function(data){

        $scope.setRightStatus(3000,"ERROR: provide valid name.");
        $scope.setLeftStatus(3000);
      });
    }

    $scope.changeToDatabase = function(name) {

      name = name || $scope.databaseName;
      if(name === $scope.currDB){
        $scope.setRightStatus(3000,"ERROR: provide valid name.");
        $scope.setLeftStatus(3000);
        return;
      }
      $scope.setLeftStatus(null,"CLIENT: CHANGE DB: " + name);
      if(!name){
        $scope.setRightStatus(3000,"ERROR: provide valid name.");
        $scope.setLeftStatus(3000);
        return;
      }
       $http.post('/auth/adminlogin/changeToDatabase', {name: name})
       .success(function(data) {

        if(!data){
          $scope.setRightStatus(3000,"ERROR: provide valid name.");
          $scope.setLeftStatus(3000);
          return;
        }

        $scope.setRightStatus(3000,"DB CHANGE SUCCESS");
        $scope.setLeftStatus(3000);
        $scope.currDB = data;
        $scope.refresh();
      })
       .error(function(data){

        $scope.setRightStatus(3000,"SERVER ERROR");
      });
    };

    $scope.ADDALLTHETWEETS = function(){
       $http.post('/auth/adminlogin/ADDALLTHETWEETS', {})
       .success(function(data) {

      })
       .error(function(data){

      });
    };

     $scope.ADDTHEFIVETESTTWEETS = function(){
       $http.post('/auth/adminlogin/ADDTHEFIVETESTTWEETS', {})
       .success(function(data) {

        if(data === false){
          $scope.setRightStatus(null, "ERROR");
        }else{
          $scope.setRightStatus(null, "YAY");
        }

      }).error(function(data){

      });
    }



    $scope.logout = function() {
      localStorage.removeItem('com.crowdparser');
      $state.transitionTo('main');
    };

  });
