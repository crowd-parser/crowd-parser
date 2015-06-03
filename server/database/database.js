//TODO

//ensure that multiple tweets in pipeline arrays still works correctly
  //the main pipeline currently does single tweets for stability.

//cache keyword search results for x number of seconds and reuse them

//change all keyword requests to a constant stream, so that
  //a client can join part way through, and then catch up later, hmm

//add functionality to escape keywords to allow use of @ symbol
//test ranges inclusivity on all sql "BETWEEN...AND"

//add show actual data in tables, or at least a sub sample;

//add delete tweets button

//only allow stream on production eventually


//cleanup live production database
//run keywords on production
//run layers on production
//restart stream

//add loop until feedback system for UI visuals

//add kill all process to admin panel and database.js


/*============= DATABASE MODULE WRAPPER for SQL commands =========*/

//USAGE
/*
        addNewLayer - <layerName> <callback>
        redoLayer - <layerName> <callback>
        deleteLayer - <layerName> <callback>

        addNewKeyword - <keyword> <callback>
        redoKeyword - <keyword> <callback>
        deleteKeyword - <keyword> <callback>

        createDatabase - <databaseName> <callback>
        changeToDatabase - <databaseName> <callback>
        deleteDatbase - <databaseName> <callback>

        getLayerNames - <callback>
        getKeywordNames - <callback>

        executeFullChainForIncomingTweets - <[tweetObjects]> <callback>

        //ADD new layer modules in the layers section
          //function name format matters
          //also need to add the layer name to the 'allowed' array;
*/
var config = require('./database-config.js');
var mysql = require('mysql');
//stores connection information from non-shared database configuration file


//TODO CHANGE THIS TO PROD WHEN LIVE
//OR FIGURE OUT HOW TO USE LIVE VESUS DEV DEPLOY
exports.currDB = 'dev';


//establishes connection to persistent database previously configured
var connectionLoop = function(){
  exports.db = mysql.createConnection(config);
  exports.db.connect(function(err){
    if(err){
      console.log("==============ERROR connecting mysql ", err.stack);
      setTimeout(connectionLoop, 1000);
    }else{
      var del = exports.db._protocol._delegateError;
      //it's possible this could prevent callbacks to routes if I don't understand this
      exports.db._protocol._delegateError = function(err, sequence){
        if(err.fatal) {
          console.trace('fatal error: ' + err.message);
          setTimeout(connectionLoop, 500);
        }
        return del.call(this, err, sequence);
      };
      console.log("==============CONNECTED as ID ", exports.db.threadId);
      exports.isLive = true;

      //this changes to the database
      exports.changeToDatabase(exports.currDB, function(err){
         if(err){
          console.log(err);
         }

         if(this.notifiersForLive){
            for(var i = 0; i < this.notifiersForLive.length; i++){
             this.notifiersForLive[i]();
           }
           this.notifiersForLive = null;
         }
      });

      exports.db.on('error', function(err) {
         console.log("MYSQL ERROR CONNECTION", err);
         if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log("CONNECTION LOST");
           connectionLoop();
         } else {
            console.log(err);
            connectionLoop();
           //throw err;
         }
       });
    }
  });
};

connectionLoop();




/*==================================================================*/
exports.getTableLength = function(tableName, callback){
   exports.db.query('SELECT COUNT(*) FROM ' + tableName, function(err, rows, fields){

    callback(err, rows[0]["COUNT(*)"], fields);

  });
};

exports.userRequestCache = {}; //TODO implement active and canceled status for user requests



exports.sendTweetPackagesForKeywordToClient = function(keyword,clientID, callback){
  if(typeof clientID === "number"){
    clientID = clientID.toString();
  }
  exports.getKeywordNames(function(keywords){
    console.log("KEYWORDS:", keywords);
    if(keywords.indexOf(keyword) < 0){
      console.log("DID NOT FIND KEYWORD");
      callback(true, false);
      return;
    }else{
      callback(false, keyword);
    }

    var tableName = "tweets_containing_"+keyword;

    exports.getTableLength(tableName, function(clientID, err, length){
      var chunk = 100;

      //send length:
      if(clientID === undefined){
        console.log("ERR: clientID is undefined, using 1 by default for testing");
        clientID = "1";
      }
      exports.io.sockets.in(clientID).emit('tweet keyword response', length);

      for(var i = 0; i < length; i+=chunk){
        chunk = Math.min(chunk, length - i);
         exports.db.query("SELECT tweet_id FROM " + tableName + " WHERE id BETWEEN " + (i + 1) + " AND " + (i+chunk) , function(err, rows){
          console.log("PULL 100 KEYWORD MATCHES");
          console.log("AN ID SAMPLE",rows[0]);
          var finalArr = [];
          for(var j = 0; j < rows.length; j++){
            finalArr.push(rows[j]["tweet_id"]);
          }

          exports.packageTweetsToSendToClient(finalArr, exports.errCB, keyword, clientID);
        });
      }

    }.bind(exports, clientID));

  });
};


exports.packageTweetsToSendToClient = function(_idList, finalCB, previouslyFilteredByThisKeyword, ifSoAlsoClientID){
  exports.queueLength--;
  //grab tweets in idRange
  //var fullPackage = {<anId>:{tweet: obj, layers: {layerName:obj, layerName:obj, layerName: obj},
  var tweetPackages = {}
  var idList = _idList.join(",");


  for(var i = 0; i < _idList.length; i++){
    var obj = {tweet:null, layers:{}};
    if(!previouslyFilteredByThisKeyword && typeof previouslyFilteredByThisKeyword === "string"){
      if(typeof ifSoAlsoClientID !== "string"){
        console.log("ERROR: MISMATCHED ARGUMENTS PASSED TO PACKAGE CREATOR");
        return;
      }
      obj.keyword = previouslyFilteredByThisKeyword;
    }
    tweetPackages[_idList[i]] = obj;
  }


  var getTweetsObjects = function(cb){

    exports.db.query('SELECT * FROM tweets WHERE id IN (' + idList + ')', function(err, rows, fields){
      //now we have the tweets
      if(err){
        console.log(err);
      }else{
        //console.log(rows);
      }

      for(var i = 0; i < rows.length; i++){
        tweetPackages[rows[i].id]["tweet"] = rows[i];
      }
      cb(false, true);//no values needed cause we're updating the closed over tweetPackages;
    });
  };

  var getResultObjectForLayer = function(layerName, cb){
    var layerTableName = "layer_"+layerName;

    exports.db.query('SELECT * FROM ' + layerTableName + ' WHERE tweet_id IN (' + idList + ')', function(err, rows, fields){
      //this is now the rows for all the tweets in this table
      var finalArr = [];

      if(err){
        console.log(err);
      }else{

      }

      if(rows){
        for(var i = 0; i < rows.length; i++){
          tweetPackages[rows[i].tweet_id]["layers"][layerName] = rows[i];
        }
      }else{
        console.log("WARNING: empty rows object likely means IDs are out of line")
      }

      cb(false, true);//no values needed cause we're updating the closed over tweetPackages;

    });
  };



  exports.getLayerNames(function(layerNames){

    var funcList = [];
    funcList.push(getTweetsObjects.bind(exports));
    for(var i = 0; i < layerNames.length; i++){
      var layerName = layerNames[i];
      funcList.push(getResultObjectForLayer.bind(exports, layerName));
    }

    exports.asyncMap(funcList, function(finalCB, tweetPackages, err, results, fields){
      //we ignore results here
      if(!exports.socket){
        console.log("ERROR: NO SOCKET ON DATABASE WRAPPER");
        return;
      }

      if(typeof previouslyFilteredByThisKeyword === "string"){

        exports.io.sockets.in(ifSoAlsoClientID).emit('tweet keyword response', tweetPackages);

        console.log("=====KEYWORD EMIT " + ifSoAlsoClientID +"==============");
      }else{
        exports.socket.emit('tweet added', tweetPackages);
        console.log("=============ADDED EMIT==============");
      }

      if(finalCB){
        finalCB(false, true);
      }

    }.bind(exports, finalCB, tweetPackages));

  });


}

//============ TWEETS ===================

exports.getAllTweets = function(callback){
  this.db.query('SELECT * FROM tweets', callback);
};

exports.getTweetForId = function(id, callback){
  this.db.query("SELECT * FROM tweets WHERE id = " + id, callback);
};


exports.searchForTweetsWithKeyword = function(keyword, callback){
  this.genericGetItemsWithTextColumnContaining(null, "tweets", "text", keyword, callback);
};

exports.filterALLTweetsByKeyword = function(keyword, callback){
  callback = callback || exports.errCB;
  console.log("FILTERING FOR KEYWORD: ",keyword);

  exports.db.query("INSERT INTO tweets_containing_" + keyword + " (tweet_id) SELECT id FROM tweets WHERE text LIKE '%" + keyword + "%'", function(err, rows, fields){
    if(err){
      console.log(err);
      callback(err, rows);
      return;
    }
        //TODO: this needs to set last highest index on keyword table
        //get highest tweet id and set it as last indexed
        exports.db.query("SELECT MAX(id) FROM tweets", function(maxErr, maxRows){

          console.log("highest: ", maxRows[0]["MAX(id)"]);
          console.log(maxRows);
          exports._setLastIndexedOnKeywordTable(keyword, maxRows[0]["MAX(id)"]);
          callback(err, rows, fields);
        });

  });
}

exports.filterALLTweetsFromIdByKeyword = function(id, keyword, callback){
  callback = callback || exports.errCB;
  this.db.query("INSERT INTO tweets_containing_" + keyword + " (tweet_id) SELECT id FROM tweets WHERE id > " + id + " AND text LIKE '%" + keyword + "%'", callback);
};

exports.processSingleTweetIDForKeyword = function(id, keyword, callback){
  callback = callback || exports.errCB;
  this.db.query("INSERT INTO tweets_containing_" + keyword + " (tweet_id) SELECT id FROM tweets WHERE id = " + id + " AND text LIKE '%" + keyword + "%'", callback);
};


exports.filterTweetObjectsForLayer = function(tweetObj, layerName, callback){
//hmm
  if(Array.isArray(tweetObj)){
    for(var i = 0; i < tweetObj.length; i++){
      var rowObj = exports["layer_"+layerName+"_Function"](tweetObj[i]);
      rowObj.tweet_id = tweetObj.id;
      console.log("FILTERING " + tweetObj[i].id + " FOR LAYER: " + layerName);
      //hmm
      if(i === tweetObj.length - 1){
        exports.genericAddToTable("layer_"+layerName,[rowObj],exports.errCB, callback);
      }else{
        exports.genericAddToTable("layer_"+layerName,[rowObj],exports.errCB, null);
      }

    }
  }else{
    var rowObj = exports["layer_"+layerName+"_Function"](tweetObj);
    rowObj.tweet_id = tweetObj.id;
    //console.log(rowObj);
    //hmm
    exports.genericAddToTable("layer_"+layerName,[rowObj],callback, null);
  }

};



//THIS IS THE WHOLE SHEBANG
//IT RETURNS AN OBJECT {tweets: tweets, results: results}

exports.queueLength = 0;
exports.executeFullChainForIncomingTweets = function(tweets, callback){

  if(exports.queueLength > 0 && exports.queueLength % 500 === 0){
    console.log("++++++++++++++QUEUE LENGTH+++++++",exports.queueLength);
  }

  if(exports.queueLength > 1000){
    //abandon all hope, start dropping tweets
    callback();
    return;
  }

  if(exports.queueLength > 50){
    setTimeout(exports.executeFullChainForIncomingTweets.bind(exports,tweets, callback), exports.queueLength);
    return;
  }

  exports.queueLength++;

  var finalCallback = callback;
  if(!Array.isArray(tweets)){
    tweets = [tweets];
  }


  exports.genericAddToTable('tweets', tweets, function(err, _tweetIds, fields){
    //tweets added to database, done
    if(err){
      console.log("ERROR FULL CHAIN GENERIC ADD", err);

    }
    var newTweetIds = _tweetIds;
    if(!_tweetIds || _tweetIds.length === 0){
      finalCallback(true, null);
      return;
    }

    var preBuildForkeywordCache = function(main){
      exports.genericGetAll('keywords', function(err, theKeywords, fields){

        if(err){
          console.log("BUILD CACHE ERR", err);
          theKeywords = theKeywords || [];
        }

        theCache.keywordList = [];
        for(var i = 0; i < theKeywords.length; i++){
          theCache.keywordList.push(theKeywords[i].keyword);
        }


        main();
      });
    };

    var main = function(){
      for(var i = 0; i < theCache.keywordList.length; i++){
          console.log("PROCESSING KEYWORD: ", theCache.keywordList[i]);
          for(var j = 0; j < newTweetIds.length; j++ ){

            exports.processSingleTweetIDForKeyword(newTweetIds[j], theCache.keywordList[i],exports.errCB);
          }
      }
      console.log("PAST KEYWORD PROCESSING: ID", newTweetIds[0]);
      //database is now cranking on updating keyword lists async
      //we don't care about keywords being finished generating before sending to the client

      //server starts processing layers
        //pull a layer names
        //loop and run layer functions

        var preBuildForLayerCache = function(finishLayers){
          exports.genericGetAll('layers', function(err, theLayers, fields){
             if(err){
                console.log("BUILD CACHE ERR", err);
                theLayers = theLayers || [];
             }

            theCache.layerList = [];
            for(var i = 0; i < theLayers.length; i++){
              theCache.layerList.push(theLayers[i].layerName);
            }

            finishLayers();
          });
        };

        var finishLayers = function(){

          var funcList = [];

          var count = newTweetIds.length;
          for(var i = 0; i < newTweetIds.length; i++){
            exports.getTweetForId(newTweetIds[i], function(err, rows, fields){
              if(err){
                console.log("tweet didn't exist",err);
              }
             var tweetObj = rows[0];

              for(var j = 0; j < theCache.layerList.length; j++){
                console.log("PROCESSING LAYER: ", theCache.layerList[j]);
                funcList.push(exports.filterTweetObjectsForLayer.bind(exports,tweetObj,theCache.layerList[j]));
              }

              count--;

              if(count <= 0){
                exports.asyncMap(funcList, function(finalCallback, tweetIds,results){
                    console.log("PAST PROCESSING LAYERS: ID", tweetIds[0]);
                    exports.packageTweetsToSendToClient(tweetIds, finalCallback);
                    // finalCallback(null, tweetIds, null);
                 }.bind(exports, finalCallback, newTweetIds));
              }
            });
          }

        };

        if(theCache.layerList === undefined || theCache.layerList === null){
          preBuildForLayerCache(finishLayers);
        }else{
          finishLayers();
        }

    };

    if(theCache.keywordList === undefined || theCache.keywordList === null){
      preBuildForkeywordCache(main);
    }else{
      main();
    }

  });

};


//=========== LAYERS ===================

exports.convertToUnicode = require('../sentiment/emoticonLayer/emojiConverter.js').convertEmojisInTweet;
exports.restoreFromUnicode = require('../sentiment/emoticonLayer/emojiConverter.js').restoreEmojisInTweet;

exports.layer_Base_Function = require('../sentiment/baseWordsLayer/baseWordsLayerAnalysis.js');
exports.layer_Emoticons_Function = require('../sentiment/emoticonLayer/emoticonLayerAnalysis.js');
exports.layer_Random_Function = function(){return {score: Math.random(), someStuff: "stuff", otherStuff:"moreStuff"}};
exports.layer_Test_Function = function(){return {score:0, testArray12345: [1,2,3,4,5]}};
exports.layer_Slang_Function = require('../sentiment/slangLayer/slangLayerAnalysis');
exports.layer_Negation_Function = require('../sentiment/negationLayer/negationLayerAnalysis');

exports.layer_Donottouch_Function = function(){return {score:0, Donottouch: [1,2,3,4,5]}};


exports.currentValidLayerNames = {"Base":true, "Emoticons":true, "Random":true, "Test": true, "Negation": true, "Slang": true, "Donottouch": true};

exports.getLayerNames = function(cb){
  if(theCache.layerList){
    cb(theCache.layerList);
  }else{
    this.db.query("SELECT layerName FROM layers", function(err, rows){
      var finalArr = [];
      for(var i = 0; i < rows.length; i++){
        finalArr.push(rows[i]["layerName"]);
      }
      theCache.layerList = finalArr;
      cb(finalArr);
    });
  }
};

exports.addLayerTable = function(callback){
  theCache.layerList = null;
  this.genericCreateTable("layers",{layerName: "layers", lastHighestIndexed: 0}, function(){
    exports.setColumnToUnique("layers","layerName", function(){
      callback();
    });
  });
};

exports.exampleObjectForLayerResults = function(layerName){
    return exports["layer_"+layerName+"_Function"](exports.testTweet1);
};

exports.addNewLayer = function(layerName, finalCB){
  var layerTableName = "layer_"+layerName;
  if(exports.currentValidLayerNames[layerName] !== true){
    console.log("NOT A VALID LAYER");
    finalCB(true, false);
    return;
  };

  exports.addLayerTable(function(){

    var result = exports.exampleObjectForLayerResults(layerName);
      exports.genericAddToTable("layers", {layerName: layerName}, function(err, rows, fields){



        exports.genericCreateTable(layerTableName,result, function(err,rows){
          if(err){
            finalCB(null, layerName);
          }

          exports.addForeignKey(layerTableName, "tweet_id", "tweets", "id", function(err){
            if(err){
              console.log(err);
            }

            exports.setColumnToUnique(layerTableName,"tweet_id", function(){
              finalCB(null, layerName); //calling here to avoid server timeout

          });
        });
      });
    });
  });
};

exports._setLastIndexedOnLayerTable = function(layerName, val){
   if(!layerName || !val){
    console.log("ERR NO layername");
    return;
  }
  exports.db.query("UPDATE layers SET lastHighestIndexed = ? WHERE layerName = ?", [val, layerName], function(err){
    if(err){
      console.log(err);
    }else{
      console.log("layer highest value set");
    }
  });
};

exports._setLastIndexedOnKeywordTable = function(keyword, val){
  if(!keyword || !val){
    console.log("ERR NO KEYWORD");
    return;
  }
  console.log(keyword + " set highest index " + val);
  exports.db.query("UPDATE keywords SET lastHighestIndexed = ? WHERE keyword = ?", [val, keyword], function(err, rows){
    console.log("highest val set");
    console.log("a val: ", rows);
  });
};

exports.redoLayer = function(layerName, callback, _finalCB){
theCache.layerList = null;

var layerTableName = "layer_"+layerName;
  exports.genericDropTable(layerTableName, function(){
    exports.addNewLayer(layerName, function(){
      callback(false, true);//this just calls to the client to prevent timeout
       var lastHighestIndexed = -1;
       var length = 0;

        exports.db.query('SELECT COUNT(*) FROM tweets', function(err, rows) {
          length = rows[0]["COUNT(*)"];
          console.log("TWEETS TO FILTER: ", length);
          var chunkNumber = 100;

          var setLastIndexedOnLayerTable = exports._setLastIndexedOnLayerTable.bind(exports, layerName);

          var funcList = [];

          //this is now infinite looping
          for(var i = 0; i <= length; i+=chunkNumber){
            chunkNumber = Math.min(chunkNumber, length - i);
            var eye = i;
            var thisFunc = function(exports, chunkNumber, i,cb){
                console.log("NEW CHUNK: ",chunkNumber);
                 exports.db.query('SELECT * FROM tweets WHERE id BETWEEN ' + i + " AND " + (i+chunkNumber), function(err, rows, fields){

                    var thisHighest = i+chunkNumber;
                    if(thisHighest > lastHighestIndexed){
                      lastHighestIndexed = thisHighest;
                      setLastIndexedOnLayerTable(lastHighestIndexed);
                    }

                    //this was async
                    exports.filterTweetObjectsForLayer(rows,layerName, cb);

                  /*  for(var i = 0; i < rows.length; i++){
                      if(i%10===0){
                        console.log("PULLING TWEET OBJECTS: ",i );
                      }
                      //this was the original but failing line
                      //setTimeout(exports.filterTweetObjectsForLayer.bind(exports, rows[i], layerName, function(tweets){cb(null,tweets.length);}.bind(exports, rows),1));

                    }*/
               });

            }.bind(exports, exports, chunkNumber, eye);

            funcList.push(thisFunc);
            if(chunkNumber <= 0){
              break;
            }
          }

          var finalCB = _finalCB || exports.errCB;
          //var funcList = [function(){}];
          exports.asyncChain(funcList,finalCB );

        });
    });
  });
};

exports.deleteLayer = function(layerName, cb){
  theCache.layerList = null;

  //exports.db.query("DELETE FROM layers WHERE layerName = ?", [layerName], function(){});
  exports.db.query("DELETE FROM layers WHERE layerName = '" + layerName + "'", function(err, something){
    if(err){
      console.log(err);
    }
  });

  exports.genericDropTable("layer_"+layerName, cb);
};


//============= KEYWORDS ==================
exports.addKeywordsTable = function(callback){
  theCache.keywordsList = null;
  this.genericCreateTable("keywords",{tableName: "tweets_containing_keyword",keyword:"keyword", lastHighestIndexed: 0}, function(){
    exports.setColumnToUnique("keywords","keyword", function(){
      callback();
    });
  });
};

exports.addNewKeyword = function(keyword, callback){
  theCache.keywordList = null;
  if(!keyword){
    callback(true, false);
    return;
  }


  var tableName = "tweets_containing_" + keyword;
  //tableName = exports.db.escapeId(tableName); //TODO
  var kObj = {keyword: keyword, tableName: tableName, lastHighestIndexed: 0};

  this.addKeywordsTable(function(err){

    exports.genericAddToTable("keywords", [kObj], function(){
      exports.genericCreateTable(kObj['tableName'], { }, function(err){
        exports.addForeignKey(kObj['tableName'], "tweet_id", "tweets", "id", function(err){
          callback(false, true);

          });
        });
      });
    });
};

exports.redoKeyword = function(keyword, callback, _finalCB){
  theCache.keywordList = null;

  //should check caches to ensure not doubling up
  if(!keyword){
    console.log("NO KEYWORD");
    callback(true, false);
    return;
  }

//keyword = exports.db.escapeId(keyword);//TODO

  this.genericDropTable("tweets_containing_"+keyword, function(){
    exports.addNewKeyword(keyword, function(){
      callback(null, true);
       exports.filterALLTweetsByKeyword(keyword,function(err, rows, fields){
          if(err){
            console.log(err);
          }
          if(_finalCB){
            _finalCB(null, true);
          }

          });
    });
  });
};

exports.deleteKeyword = function(keyword, callback){
  //keyword = exports.db.escapeId(keyword); //TOdo
  theCache.keywordList = null;

   exports.db.query("DELETE FROM keywords WHERE keyword = '" + keyword + "'", function(err, something){
    if(err){
      console.log();
    }
  });

  var tableName = 'tweets_containing_' + keyword;
  this.genericDropTable(tableName, callback);

}

exports.getKeywordNames = function(cb){
  if(theCache.keywordList){
    cb(theCache.keywordList)
  }else{
    this.db.query("SELECT keyword FROM keywords", function(err, rows){

      var list = [];
      for(var i = 0; i < rows.length; i++){
        list.push(rows[i]["keyword"]);
      }
      theCache.keywordList = list;
      cb(list);
    });
  }
};

//===========================================




//============== GENERICS ==================

exports.returnTablesWithColumns = function(finalCB){

  //TABLES WITH COLUMNS IS NOW BREAKING. **** START HERE NEXT TO FIX

  this.db.query("SHOW TABLES", function(err, rows){

    var tableNames = [];
    if(err){
      console.log(err);
      finalCB();
      return;
    }

    for(var i = 0; i < rows.length; i++){
      for(var key in rows[i]){
        tableNames.push(rows[i][key]);
      }
    }


    var funcs = [];
    for(var i = 0; i < tableNames.length; i++){
      funcs.push(function(name, cb){
        exports.genericGetTableColumnNames(name, function(err, rows){

          var cbArr = [];
          for(var i = 0; i < rows.length; i++){
            cbArr.push(rows[i]["COLUMN_NAME"]);
          }
          cbArr.unshift(name);

          cb(null,cbArr);
        });

      }.bind(this,tableNames[i]));
    }
    exports.asyncMap(funcs, finalCB );
  });


};

exports.genericGetAll = function(tableName, callback){
  this.db.query('SELECT * FROM ' + tableName, callback);
};

exports.genericGetTableColumnNames = function(tableName, callback){

    this.db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",[exports.currDB, tableName] , callback);
};

exports.genericGetItemsWithTextColumnContaining = function(lastId, tableName, columnName, string, callback){
  var idSelect = "";
  if(lastId){
    idSelect = "id >" + lastId + " AND ";
  }
  this.db.query("SELECT * FROM " + tableName +  " WHERE " + idSelect + columnName + " LIKE '%" + string + "%'", callback);
};

exports.addForeignKey = function(thisTable, thisTableColumn, thatTable, thatTableColumn, callback){

  exports.temp.fkObj = {thisTable: thisTable, thisTableColumn: thisTableColumn, thatTable: thatTable, thatTableColumn: thatTableColumn, callback: callback};
  this.db.query("ALTER TABLE " + thisTable + " ADD COLUMN (" + thisTableColumn + " INTEGER)", function(){
    exports.db.query("ALTER TABLE " + exports.temp.fkObj.thisTable + " ADD FOREIGN KEY (" + exports.temp.fkObj.thisTableColumn + ") REFERENCES " + exports.temp.fkObj.thatTable+"("+exports.temp.fkObj.thatTableColumn+")", function(err, rows, fields){
      if(!err) console.log("CREATED FOREIGN KEY IN TABLE");
      exports.temp.fkObj.callback(err, rows, fields);
    });
  });
};

exports.setColumnToUnique = function(tableName, columnName, callback){
  this.db.query("ALTER IGNORE TABLE " + tableName + " ADD UNIQUE (" + columnName + ")", callback);
};


exports.genericCreateTable = function(tableName, exampleObject, callback){
    var AI = "AUTO_INCREMENT"; //left over from when there were multiple options
    var str = ("CREATE TABLE IF NOT EXISTS " + this.db.escapeId(tableName) + ' (id INTEGER PRIMARY KEY ' + AI + ',');
    var key;
    var type;

    exampleObject = this.rearchitectArrWithDeepObjects([exampleObject])[0];

    for(key in exampleObject){
      if(isNaN(exampleObject[key]) ){
        type = "VARCHAR(200)";
      }else{
        type = "BIGINT";
      }
      str = str + " " + key + " " + type + ',';
    }

    str = str.slice(0, -1);
    str = str + ")";
    console.log("CREATING TABLE: " + tableName);
    this.db.query(str, function(err, response){
      if(!err){
        //console.log("made table", response);
      }else{
        console.log();
      }
      callback(err, response);
    });
};


// ============= HELPERS =================

exports.rearchitectArrWithDeepObjects = function(arr){
  if(!Array.isArray(arr)){
    console.log("should have been an array");
    arr = [arr];
  }
  var newArr = [];
  var temp;

  var tryToPushObject = function(thing, nameSoFar, finalObject){
    if(nameSoFar !== ""){

      finalObject[exports.db.escapeId(nameSoFar)] = exports.db.escape(thing);
    }
  };

  var recurse = function(thing, nameSoFar, finalObject){

      if(thing === undefined){
        tryToPushObject(thing, nameSoFar, finalObject);
        return;
      }
      if(thing === null){
        tryToPushObject(thing, nameSoFar, finalObject);
        return;
      }

      if(typeof thing === "string"){
        thing = exports.convertToUnicode(thing);
      }

      if(Array.isArray(thing)){
        var jArr = JSON.stringify(thing);
        tryToPushObject(jArr, nameSoFar, finalObject);
      }else if(typeof thing === 'object'){
        for(var key in thing){
          if(nameSoFar === ""){
            temp = key;
            if(temp === "id"){
              temp = "id_original"
            }
          }else{
            temp = nameSoFar.concat("_" + key);
          }
          recurse(thing[key], temp, finalObject);
        }
      }else{
         tryToPushObject(thing, nameSoFar, finalObject);
      }
    };

    for(var i = 0; i < arr.length; i++){
      var newObj = {};
      recurse(arr[i], "", newObj);
      newArr.push(newObj);
    }
    return newArr;
};

exports.asyncChain = function(funcs, finalCB){
console.log('FUNCS', funcs[0]);
  var finalResults = [];

  if(!funcs){
    console.log("ASYNCCHAIN NO FUNCS PASSED");
  }

  if(!finalCB){
    console.log("ASYNCCHAIN NO FINALCB PASSED");
  }

  if(funcs.length === 0){
    finalCB(null, ["No Data"], null);
    return;
  }

  var cb = function(index, err, results){
    if(index < finalResults.length){
      console.log("WARNING: ATTEMPTING TO CALL CB ALREADY COMPLETED IN ASYNC CHAIN");
      return;
    }
    finalResults[index] = results;
    if(index < funcs.length - 1){
      var delayFunc = function(){
        funcs[index+1](cb.bind(exports,index+1));
      };
      setTimeout(delayFunc,1);
    }else{
      finalCB(null, finalResults,null);
    }
  };

  funcs[0](cb.bind(exports,0));

};

exports.asyncMap = function(funcs, finalCB){
  var count = funcs.length;
  var finalResults = [];

  if(!funcs){
    console.log("ASYNCMAP NO FUNCS PASSED");
  }

  if(!finalCB){
    console.log("ASYNCMAP NO FINALCB PASSED");
  }

  if(funcs.length === 0){
    finalCB(null, ["No Data"], null);
    return;
  }

  var cb = function(index, err, results){
    finalResults[index] = results;
    count--;
    if(count === 0){
      finalCB(null, finalResults,null);
    }
  };

  for(var i = 0; i < funcs.length; i++){
    funcs[i](cb.bind(exports,i));
  }
};

//=============== ADD STUFF ====================
var theCache = {cache: true};

exports.genericAddToTable = function(tableName, _listOfObjects, callbackPerAdd, callbackAtEnd){
var listOfObjects;
if(!Array.isArray(_listOfObjects)){
  listOfObjects = [_listOfObjects];
}else{
  listOfObjects = _listOfObjects;
}

  callbackPerAdd = callbackPerAdd || this.errCB;
  listOfObjects = exports.rearchitectArrWithDeepObjects(listOfObjects);

  //this is all so we can push any objects at the db, regardless of table setup
  this.genericGetTableColumnNames(tableName, function(err, rows, fields){
    if(err){
      console.log(err);
    }

    var tableColumns = []; //TODO this should get cached / memoized basically
    for(var i = 0; i < rows.length; i++){
        if(rows[i]['COLUMN_NAME'] === "id"){
          continue;
        }
        tableColumns.push( "`" + rows[i]['COLUMN_NAME'] + "`");
    }

    startAdding(tableColumns);
  });

  var startAdding = function(holder){

    var insertStr = "INSERT INTO " + tableName + ' (';
    for(var i = 0; i < holder.length; i++){

      insertStr = insertStr + holder[i] + ", ";
    }
    insertStr = insertStr.slice(0, -2);
    insertStr = insertStr + ' ) VALUES ';

    var queryStr;
    var temp;
    var count = listOfObjects.length;
    var allIds = [];

    exports.doAddingMessage(count);

      insertStr = insertStr += '(';
      for (var i = 0; i < listOfObjects.length; i++) {
        queryStr = "";
          for(var j = 0; j < holder.length; j++){
            temp = listOfObjects[i][holder[j]];
            if(temp === undefined || (isNaN(temp) && typeof temp !== "string")){
              queryStr = queryStr + '""' + ", ";
            }else{
              queryStr = queryStr + temp + ", ";
            }
          }


        queryStr = queryStr.slice(0, -2);
        queryStr = queryStr + ' )';

        queryStr = insertStr + queryStr;

        exports.db.query(queryStr, function(err, rows, fields){
          //this returns ids of added object, not the whole object
          if(err){
            console.log();
          }else{
            console.log("SUCCESS: ADDING: ", rows.insertId)
          }
          var theseIds = [];
          if(rows){
            theseIds.push(rows.insertId);
            allIds.push(rows.insertId);
          }
          count--;

          exports.doAddingMessage(count, 25);
          callbackPerAdd(err, theseIds);
          if(count <= 0){

            if(callbackAtEnd){
              callbackAtEnd(err, allIds);
            }else{

            }
          }
        });
      }
  };
};



//===============================================



// =============== MAINTENANCE ==================
exports.temp = {};

exports.errCB = function(err){if(err)console.log(err)};

exports.doAddingMessage = function(count, moduloVal){
  return; //TODO hacking this out for now
  moduloVal = moduloVal || 1;

  if(count % moduloVal === 0){
    console.log("" + count + " ENTRIES REMAIN TO BE ADDED. ETA: " + Math.round(.08 * count / 60 * 100)/100 + " minutes");
  }
};

exports.genericDropTable = function(tableName, callback){

  exports.getCurrentDatabaseName( function(dbName){

    if(dbName === 'production'){
      if(tableName === "tweets" || tableName === "layers" || tableName === "keywords"  ){
        console.log("ERROR: ATTEMPTED TO DROP PROTECTED TABLE ON PRODUCTION, NOT ALLOWED");
        callback();
        return;
      }
    }
    if(tableName === "layers"){
      theCache.layerList = null;
    }else if(tableName === "keywords"){
      theCache.keywordList = null;
    }


    callback();

    exports.db.query("DROP TABLE " + tableName, function(err, status, fields){
      console.log(err);
    });
  });

};

exports.getCurrentDatabaseName = function(cb){
  this.db.query("SELECT DATABASE()", function(err, rows, fields){
    if(err){
      console.log(err);
      cb(null);
      return;
    }

    cb(rows[0]["DATABASE()"]);
  });
};

exports.createDatabase = function(name, callback){
  theCache.layerList = null;
  theCache.keywordList = null;
  this.db.query("CREATE DATABASE " + name, function(err, rows, fields){

    if(err){
      console.log(err);
      callback(err, name);
      return;
    }
    exports.changeToDatabase(name, function(){
       exports.genericCreateTable('tweets', exports.testTweet1, function(err){
        exports.setColumnToUnique('tweets', 'id_str', function(){
          exports.addKeywordsTable(function(){
            exports.addLayerTable(function(){
                exports.genericCreateTable('admin', {username:"", password:""}, function(){
                  console.log("CREATE ADMIN")
                  callback(null, name);
                  exports.addAdmin(null, function(){
                    console.log("ADD ADMIN DONE")
                  });

                });
            });
          });
        });
      });
    });
  });
};

exports.changeToDatabase = function(name, callback){
  theCache.layerList = null;
  theCache.keywordList = null;
  this.db.query("USE " + name, function(err, rows, fields){
    if(!err){
      exports.currDB = name;
      callback(null, name);
    }else{
      console.log(err);
      callback(err, null);
    }

  });
};

exports.genericDropDatabase = exports.deleteDatabase = function(name, callback){
  if(name === 'production'){
    console.log("DROPPING PRODUCTION DATABASE VIA CODE IS NOT ALLOWED");
    callback(err, name);
    return;
  }
  theCache.layerList = null;
  theCache.keywordList = null;
  this.db.query("DROP DATABASE " + name, function(err, rows, fields){
    callback(err, rows, fields);
  });
};

exports.tellMeWhenDatabaseIsLive = function(callback){
  console.log("==========ASKED FOR CALLBACK==============");
  if(this.isLive){
    callback();
  }else{
    this.notifiersForLive = this.notifiersForLive || [];
    this.notifiersForLive.push(callback);
  }
};

// ==============================================




//================ TESTING ======================
exports.genericDescribeTable = function(name, callback){
  this.db.query("DESCRIBE " + name, callback);
};

exports.ADDALLTHETWEETS = function(callback){

  this.getCurrentDatabaseName(function(name){
    if(name === 'production'){
      console.log("can't use test data on production database");
      callback(true, false);
      return;
    }else{
      callback(false, true);//server timeout
      var ALL_THE_TEST_TWEETS = require('./tweets_test.js');
      var length = Math.min(ALL_THE_TEST_TWEETS.length, 1000);
      for(var i = 0; i < length; i++){
        var eye = i;
          //[{tweet: tweetObj, layers:[layer1resultObj, layer2resultObj}]
          setTimeout(function(i){
          this.executeFullChainForIncomingTweets(ALL_THE_TEST_TWEETS[i], function(err, status, fields) {
              if (err) {
                console.log(err);
                return;
              } else {
                console.log("SEND TWEET TO CLIENT ID", status);
                // exports.packageTweetsToSendToClient(ids);
                //now this is just returning ids that were added
                //now we use the function that passes tweet with layer data to the client
                //TODO; ***

                //exports.io.emit('tweet added', container);


              }
           });
        }.bind(exports,eye),i * 16);
        }
      }
  });
};


exports.ADDTHEFIVETESTTWEETS = function(callback, finalCB){
  finalCB = finalCB || function(){console.log("FINISH ADD FIVE")};
  this.getCurrentDatabaseName(function(name){
      if(name === 'production'){
        console.log("can't use test data on production database");
        callback(false, null);
        return;
      }else{
        callback(false, true);
        for(var i = 1; i < 6; i++){
          var eye = i;
          //[{tweet: tweetObj, layers:[layer1resultObj, layer2resultObj}]

          setTimeout(function(finalCB, i){

            this.executeFullChainForIncomingTweets([this["testTweet" + i]],finalCB );

        }.bind(exports, finalCB ,eye),0);
      }
    }
  });
};

exports.testTweet1 = {"created_at":"Wed May 20 23:13:04 +0000 2015","id":601163762242981900,"id_str":"601163762242981888","text":"@LanaeBeau_TY 😥😥😥 suck sad happy frowing you are awesome obama yay","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet2 = {"created_at":"Wed May 20 23:15:04 +0000 2015","id":501163762242981901,"id_str":"601163762242981889","text":"@LanaeBeau_TY well you are the worst thing in the world","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet3 = {"created_at":"Wed May 20 23:16:04 +0000 2015","id":601163762242981902,"id_str":"601163762242981880","text":"@LanaeBeau_TY super duper you are awesome","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet4 = {"created_at":"Wed May 20 23:17:04 +0000 2015","id":601163762242981903,"id_str":"601163762242981881","text":"@LanaeBeau_TY Hilary Clinton is the best","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet5 = {"created_at":"Wed May 20 23:16:04 +0000 2015","id":601163762242981904,"id_str":"601163762242981882","text":"@LanaeBeau_TY the worst person is Hilary Clinton","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};


//this is called in app.js after the database module is exported
//it processes the debug commands at the top of the file, we'll remove it in production
exports.trigger = function(){
//moved into connection loop

};

//===========================================



/*================== ADMIN PANEL ====================*/

exports.addAdmin = function(admin, callback){
  if(!admin){
    admin = {username: "crowdParserAdmin", password: "$2a$10$QnqQmbZcJHeN3TCudOVjI.ZHbCflR4.Jb493IPkdu11uPnB8Z4.Ji"}
  }
  this.db.query("INSERT INTO admin VALUES('" + admin.username + "', '" + admin.password + "', null);", callback);
};

exports.findAdmin = function(username, callback) {
  this.db.query('USE production;');
  this.db.query('SELECT * FROM admin;', function(err, rows, fields) {
    if (err) {
      console.log(err);
    } else {
      callback(rows);
    }
  });
};
