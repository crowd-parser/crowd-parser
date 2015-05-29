//TODO


//test delete database

//test add layer
//test redo layer
//test delete layer

//test add keyword
//test redo keyword
//test delete keyword

//test refresh table
//test refresh layers
//test refresh keywords

//test add 5000 tweets

//test stream on off
//only allow stream on production eventually


//cleanup live production database
//run keywords on production
//run layers on production
//restart stream


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
      setTimout(connectionLoop, 1000);
    }else{
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
           connectionLoop();
         } else {
           throw err;
         }
       });
    }
  });
};

connectionLoop();


/*==================================================================*/


//============ TWEETS ===================

exports.getAllTweets = function(callback){
  this.db.query('SELECT * FROM tweets', callback);
};

exports.getTweetForId = function(id, callback){
  this.db.query("SELECT * FROM tweets WHERE id = " + id, callback);
}

exports.searchForTweetsWithKeyword = function(keyword, callback){
  this.genericGetItemsWithTextColumnContaining(null, "tweets", "text", keyword, callback);
};

exports.filterALLTweetsByKeyword = function(keyword, callback){
  callback = callback || exports.errCB;
  this.db.query("INSERT INTO tweets_containing_" + keyword + " (tweet_id) SELECT id FROM tweets WHERE text LIKE '%" + keyword + "%'", function(err, rows, fields){
    if(err){
      console.log(err);
      callback(err, rows);
      return;
    }
        //TODO: this needs to set last highest index on keyword table

    callback(err, rows, fields);
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

//MOST IMPORTANTLY
//this func adds a {layer: layerName, result: thing.result} to the container passed into it
exports.processSingleTweetObjForLayer = function(tweetHolder, layerName, callback){
  callback = callback || exports.errCB;

  var tweetObject = tweetHolder.tweet;
    var thing = {result: exports["layer_"+layerName+"_Function"](tweetObj.text), tweet_id: tweetObj.id};
    tweetHolder.layers.push({layer: layerName, result: thing.result});
    exports.genericAddToTable(layerName,[thing],callback, null);

};

exports.filterSingleTweetForLayer = function(tweetObj, layerName, callback){
  console.log("FILTER: ", layerName, tweetObj);
//hmm
  var rowObj = {result: exports[layerName+"_Function"](tweetObj.text), tweet_id: tweetObj.id};
  //hmm
  exports.genericAddToTable(layerName,[rowObj],callback, null);
};


// exports.filterTweetObjectsForLayer  = function(rows, layerName,callback){

//   var addThese = [];

//   for(var i = 0; i < rows.length; i++){
//     addThese.push({result: exports["layer_"+layerName+"_Function"](rows[i].text), tweet_id: rows[i].id});
//   }

//   exports.genericAddToTable(layerName,addThese,null,callback,true);

// };


//THIS IS THE WHOLE SHEBANG
//IT RETURNS AN OBJECT {tweets: tweets, results: results}

exports.executeFullChainForIncomingTweets = function(tweets, callback){
  console.log("start tweet chain");
  var finalCallback = callback;
  if(!Array.isArray(tweets)){
    tweets = [tweets];
  }

  this.genericAddToTable('tweets', tweets, function(err, _tweetIds, fields){
    //tweets added to database, done
    var newTweetIds = _tweetIds;

    var preBuildForkeywordCache = function(main){
      exports.genericGetAll('keywords', function(err, theKeywords, fields){

        if(err){
          console.log(err);
          theKeywords = theKeywords || [];
        }
        exports.cache.keywordList = [];
        for(var i = 0; i < theKeywords.length; i++){
          exports.cache.keywordList.push(theKeywords[i].keyword);
        }
        main.call(exports);
      });
    };

    var main = function(){

      for(var i = 0; exports.cache.keywordList.length; i++){
          for(var j = 0; j < newTweetIds.length; j++ ){
            exports.processSingleTweetIDForKeyword(newTweetIds[j], exports.cache.keywordList[i],exports.errCB);
          }
      }
      //database is now cranking on updating keyword lists async
      //we don't care about keywords being finished generating before sending to the client

      //server starts processing layers
        //pull a layer names
        //loop and run layer functions

        var preBuildForLayerCache = function(finishLayers){
          exports.genericGetAll('layers', function(err, theLayers, fields){
            exports.cache.layerList = [];
            for(var i = 0; i < theLayers.length; i++){
              exports.cache.layerList.push(theLayers[i].layer);
            }
            finishLayers.call(exports);
          });
        };

        var finishLayers = function(){

          var funcList = [];
          var container = [];
          var count = newTweetIds.length;
          for(var i = 0; i < newTweetIds.length; i++){
            exports.getTweetForId(newTweetIds[i], function(err, rows, fields){
             var tweetObj = {tweet: rows[0], layers:[]};
             container.push(tweetObj);
              for(var j = 0; j < exports.cache.layerList.length; j++){
                funcList.push(exports.processSingleTweetObjForLayer.bind(tweetObj,exports.cache.layerList[i]));
              }
              count--;
              if(count === 0){
                exports.asyncMap(funcList, function(finalCallback, container, err, results, fields){
                  //ignore results from callback, containing is holding all data

                    finalCallback(null, container, null);
                 }.bind(exports, finalCallback, container));
              }
            });
          }

        };

        if(!exports.cache.layerList){
          preBuildForLayerCache(finishLayers);
        }else{
          finishLayers();
        }

      //then use a loop to tell db to insert into with result data and id

      //at this point, maybe earliet, we could have sent the tweets back to the server to
        //send to all clients on the wire
    };

    if(!exports.cache.keywordList){
      preBuildForkeywordCache(main);
    }else{
      main();
    }

  });

};


//=========== LAYERS ===================

exports.layer_Base_Function = require('../sentiment/baseWordsLayer/baseWordsLayerAnalysis.js');
exports.layer_Emoticons_Function = require('../sentiment/emoticonLayer/emoticonLayerAnalysis.js');
exports.layer_Random_Function = function(){return Math.random()};
exports.layer_Test_Function = function(){return "TEST STRING FOR TEST LAYER"};

exports.currentValidLayerNames = {"Base":true, "Emoticons":true, "Random":true, "Test":true};

exports.getLayerNames = function(cb){
  if(this.cache.layerList){
    cb(this.cache.layerList)
  }else{
    this.db.query("SELECT layerName FROM layers", function(err, rows){
      exports.cache.layerList = rows;
      cb(rows);
    });
  }
};

exports.addLayerTable = function(callback){
  this.cache.layerList = null;
  this.genericCreateTable("layers",{layerName: "layers", lastHighestIndexed: 0}, function(){
    exports.setColumnToUnique("layers","layerName", function(){
      callback();
    });
  });
};

exports.addNewLayer = function(layerName, finalCB){
  if(exports.currentValidLayerNames[layerName] !== true){
    finalCB(true, false);
    return;
  }

  this.addLayerTable(function(){
    layerName = "layer_" + layerName;
      exports.genericAddToTable("layers", {layerName: layerName}, function(err, rows, fields){

        if(err || !rows){
          finalCB(err, false);
          return;
        }
        exports.genericCreateTable(layerName,{result: 1}, function(err,rows){
          if(err){
            console.log(err);
            finalCB(err, null);
            return;
          }
          exports.addForeignKey(layerName, "tweet_id", "tweets", "id", function(){
            exports.setColumnToUnique(layerName,"tweet_id", function(){
              finalCB(null, layerName); //calling here to avoid server timeout
              exports.getAllTweets(function(err, rows, fields){
                if(err){
                  console.log(err);
                  return;
                }
                var count = 0;
                console.log("LAYER ADD: PULLED TWEETS COUNT: ", rows.length);
                for(var i = 0; i < rows.length; i++){

                  exports.filterSingleTweetForLayer(rows[i], layerName, function(count, err,rows){
                    count++;
                    if(count % 100 === 0){
                      console.log("LAYER ADD: PROCESSED ANOTHER 100 TWEETS");
                    }
                  }.bind(exports, count));
                }
            });
          });
        });
      });
    });
  });
};

exports.redoLayer = function(layerName, finalCB){

  this.genericDropTable("layer_" + layerName, function(){
    exports.addLayerTable(layerName, finalCB);
  })
};

exports.deleteLayer = function(layerName, cb){
  this.cache.layerList = null;
  this.db.query("DELETE FROM layers WHERE layerName = ?", [layerName], function(){});
  this.genericDropTable("layer_"+layerName, cb);
};


//============= KEYWORDS ==================
exports.addKeywordsTable = function(callback){
  this.cache.keywordsList = null;
  this.genericCreateTable("keywords",{tableName: "tweets_containing_keyword",keyword:"keyword", lastHighestIndexed: 0}, function(){
    exports.setColumnToUnique("keywords","keyword", function(){
      callback();
    });
  });
};

exports.addNewKeyword = function(keyword, callback){
  this.cache.keywordList = null;
  this.temp.kObj = {keyword: keyword, tableName: "tweets_containing_" + keyword, lastHighestIndexed: 0};
  this.temp.kCB = {tweets:false};

  this.addKeywordsTable(function(err){

    exports.genericAddToTable("keywords", [exports.temp.kObj], function(){
      exports.genericCreateTable(exports.temp.kObj['tableName'], { }, function(err){
        exports.addForeignKey(exports.temp.kObj['tableName'], "tweet_id", "tweets", "id", function(err){
          callback();//Avoid long delay on server timeout
          exports.filterALLTweetsByKeyword(exports.temp.kObj.keyword,function(err, rows, fields){
            if(err){
              console.log(err);
            }
            });
          });
        });
      });
    });
};

exports.updateKeyword = function(keyword, callback){
  callback();


}

exports.redoKeyword = function(keyword, callbackForTweets){

  this.genericDropTable("tweets_containing_"+keyword, function(){
    exports.addNewKeyword(keyword, callbackForTweets);
  });
};

exports.deleteKeyword = function(keyword, callback){
  this.cache.keywordList = null;
  this.db.query("DELETE FROM keywords WHERE keyword = ?", [keyword], function(){});
  this.genericDropTable("tweets_containing_"+keyword, callback);
}

exports.getKeywordNames = function(cb){
  if(this.cache.keywordList){
    cb(this.cache.keywordList)
  }else{
    this.db.query("SELECT keyword FROM keywords", function(err, rows){
      exports.cache.keywordList = rows;
      cb(rows);
    });
  }
};

//===========================================




//============== GENERICS ==================

exports.returnTablesWithColumns = function(finalCB){

  //TABLES WITH COLUMNS IS NOW BREAKING. **** START HERE NEXT TO FIX

  this.db.query("SHOW TABLES", function(err, rows){
    console.log("SHOW TABLES: ", rows);
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
    console.log("TABLE NAMES: ", tableNames);

    var funcs = [];
    for(var i = 0; i < tableNames.length; i++){
      funcs.push(function(name, cb){
        exports.genericGetTableColumnNames(name, function(err, rows){

          var cbArr = [];
          for(var i = 0; i < rows.length; i++){
            cbArr.push(rows[i]["COLUMN_NAME"]);
          }
          cbArr.unshift(name);

          cb(err,cbArr);
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
        console.log(err);
      }
      callback(err, response);
    });
};


// ============= HELPERS =================

exports.rearchitectArrWithDeepObjects = function(arr){

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
      if(Array.isArray(thing)){
        tryToPushObject(thing.join(","), nameSoFar, finalObject);
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


exports.asyncMap = function(funcs, finalCB){
  var count = funcs.length;
  var finalResults = [];

  if(funcs.length === 0){
    finalCB(null, ["No Data"], null);
    return;
  }

  var cb = function(index, err, results, fields){
    finalResults[index] = results;
    count--;
    if(count === 0){
      finalCB(null, finalResults,null);
    }
  };

  for(var i = 0; i < funcs.length; i++){
    funcs[i](cb.bind(null,i));
  }
};

//=============== ADD STUFF ====================
exports.cache = exports.cache || {};

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

    var tableColumns = []; //TODO this should get cached / memoized basically
    for(var i = 0; i < rows.length; i++){
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
            console.log(err);
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

  this.db.query("SELECT DATABASE()", function(err, rows, fields){

    if(tableName === "tweets" && rows[0][1] === 'production'){
      console.log("ERROR: ATTEMPTED TO DROP TWEETS TABLE ON PRODUCTION, NOT ALLOWED");
      callback();
      return;
    }
    if(tableName === "layers"){
      exports.cache.layerList = null;
    }else if(tableName === "keywords"){
      exports.cache.keywordList = null;
    }
    exports.db.query("DROP TABLE IF EXISTS " + tableName, callback);
  });

};

exports.getCurrentDatabaseName = function(cb){
  this.db.query("SELECT DATABASE()", function(err, rows, fields){
    if(err){
      console.log(err);
      return;
    }

    cb(rows[0][1]);
  });
};

exports.createDatabase = function(name, callback){
  exports.cache.layerList = null;
  exports.cache.keywordList = null;
  this.db.query("CREATE DATABASE " + name, function(err, rows, fields){
    console.log("INSIDE CREATE:", arguments);
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

                callback(null, name);

            });
          });
        });
      });
    });
  });
};

exports.changeToDatabase = function(name, callback){
  exports.cache.layerList = null;
  exports.cache.keywordList = null;
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
  exports.cache.layerList = null;
  exports.cache.keywordList = null;
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

  var modForTest = 75;

  this.getCurrentDatabaseName(function(name){
    if(name === 'production'){
      console.log("can't use test data on production database");
      return;
    }else{

      var ALL_THE_TEST_TWEETS = require('./tweets_test.js');
      var sendCallback = true;
      for(var i = 0; i < ALL_THE_TEST_TWEETS.length; i++){
            if(i !== 1 && i !== 0){
              if(i % modForTest !== 0){
                continue;
              }

            }
          exports.executeFullChainForIncomingTweets([ALL_THE_TEST_TWEETS[i]],function(err, container, fields) {
             if (err) {
                console.log(err);
                callback(err, container);
                return;
              } else {

                exports.io.emit('tweet added', container);
                if(sendCallback === true){
                  sendCallback = false;
                  callback(err, container);
                }
                console.log('Tweet id: ' + container[0].tweet.id + " Layers: " + container[0].layers.length);
              }
           });
        }
      }
  });
};

exports.ADDTHEFIVETESTTWEETS = function(callback){

  this.getCurrentDatabaseName(function(name){
      if(name === 'production'){
        console.log("can't use test data on production database");
        return;
      }else{
        var sendCallback = true;
        for(var i = 1; i < 6; i++){
          //[{tweet: tweetObj, layers:[layer1resultObj, layer2resultObj}]
          exports.executeFullChainForIncomingTweets([exports["testTweet" + i]], function(err, container, fields) {
              if (err) {
                console.log(err);
                callback(err, container);
                return;
              } else {
                exports.io.emit('tweet added', container);
                if(sendCallback === true){
                  sendCallback = false;
                  callback(err, container);
                }
                console.log('Tweet id: ' + container[0].tweet.id + " Layers: " + container[0].layers.length);

              }
           });
      }
    }
  });
};

exports.testTweet1 = {"created_at":"Wed May 20 23:13:04 +0000 2015","id":601163762242981900,"id_str":"601163762242981888","text":"@LanaeBeau_TY 😥😥😥 suck sad happy frowing","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
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
  console.log(admin);
  this.db.query('USE production');
  this.db.query("INSERT INTO admin VALUES('" + admin.username + "', '" + admin.password + "', null);", function(err, rows) {

  });
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
