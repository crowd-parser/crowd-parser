//TODO
//set unique for keyword and layer tables
//bulk add is broken
//investigate connection open and closing for performance
//runtime keyword search
//store layer results
//handle emojis inputted into db
//keywords with special symbols, like @, currently break as table names, regardless of escaping

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

//stores connection information from non-shared database configuration file
exports.db = require('./database-config.js');

//establishes connection to persistent database previously configured
exports.db.connect(function(err){
    if(err){
      console.log(">>>>>>>>>>>>>ERROR connecting mysql ", err.stack);
    }else{
      console.log(">>>>>>>>>>>>>CONNECTED as ID ", exports.db.threadId);
      exports.isLive = true;
    }
});

/*==================================================================*/



/*============= DEBUG and MACRO SETTINGS =================*/
//ONLY SET THIS IF YOU PLAN TO CHANGE SCHEMA, OTHERWISE LEAVE AS IS
exports.currDB = 'dev';

var ALL_THE_TEST_TWEETS = require('./tweets_test.js');


/*==================================================================*/


//============ TWEETS ===================

exports.getAllTweets = function(callback){
  this.db.query('SELECT * FROM tweets', callback);
};

exports.searchForTweetsWithKeyword = function(keyword, callback){
  this.genericGetItemsWithTextColumnContaining(null, "tweets", "text", keyword, callback);
};

exports.filterTweetsFromIdByKeyword = function(id, keyword){
  this.db.query("INSERT INTO tweets_containing_" + keyword + " (tweet_id) SELECT id FROM tweets WHERE id > " + id);
};

exports.filterTweetObjectsForLayer  = function(rows, layerName,callback){

  var addThese = [];

  for(var i = 0; i < rows.length; i++){
    addThese.push({result: exports["layer_"+layerName+"_Function"](rows[i].text), tweet_id: rows[i].id});
  }

  exports.genericAddToTable(layerName,addThese,null,callback,true);

};

exports.executeFullChainForIncomingTweets = function(tweets, callback){


  this.genericAddToTable('tweets', tweets, null, function(err, rows, fields){
    //tweets added to database, done
    var testForKeywordListCache = function(main){
      exports.genericGetAll('keywords', function(err, rows, fields){
        exports.cache.keywordList = [];
        for(var i = 0; i < rows.length; i++){
          exports.cache.keywordList.push(rows[i].keyword);
        }
        main.call(this, rows);
      });
    };

    var main = function(rows){
      for(var i = 0; exports.cache.keywordList.length; i++){
        filterTweetsFromIdByKeyword(rows[0].id, exports.cache.keywordList[i]);
      }
      //database is now cranking on updating keyword lists

      //server starts processing layers
        //pull a layer names
        //loop and run layer functions

        var testForLayerListCache = function(finishLayers){
          exports.genericGetAll('layers', function(err, rows, fields){
            exports.cache.layers = [];
            for(var i = 0; i < rows.length; i++){
              exports.cache.layers.push(rows[i].layer);
            }
            finishLayers(rows);
          });
        };

        var finishLayers = function(){
          //user async map *** BACK HERE
          var funcList = [];
          for(var i = 0; exports.cache.layerList.length; i++){
            funcList.push(filterTweetObjectsForLayer.bind(rows,exports.cache.layerList[i]));
          }

          exports.asyncMap(funcList, function(results){
            callback(results);
          });

          //when async map is done, send tweets back to server
            //to send to client
        };

        if(exports.cache.layerList){
          testForLayerListCache(finishLayers);
        }else{
          finishLayers(rows);
        }

      //then use a loop to tell db to insert into with result data and id

      //at this point, maybe earliet, we could have sent the tweets back to the server to
        //send to all clients on the wire
    };

    if(exports.cache.keywordList){
      testForKeywordListCache(main);
    }else{
      main(rows);
    }

  }, true);

};


//=========== LAYERS ===================

exports.layer_Base_Function = require('../sentiment/baseWordsLayer/baseWordsLayerAnalysis.js');
exports.layer_Emoticons_Function = require('../sentiment/emoticonLayer/emoticonLayerAnalysis.js');

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

exports.addNewLayer = function(layerName, finalCB){

  this.genericCreateTable("layers",{layerName: layerName}, function(){

    exports.getAllTweets(function(err, rows, fields){
      layerName = "layer_" + layerName;
      exports.temp.cLT = {layerName: layerName, rows: rows, finalCB: finalCB};
      exports.genericAddToTable("layers", {layerName: layerName});
      exports.genericCreateTable(exports.temp.cLT.layerName,{result: 1}, function(){
        exports.addForeignKey(exports.temp.cLT.layerName, "tweet_id", "tweets", "id", function(){
          exports.setColumnToUnique("tweets","tweet_id", function(){

            //call filter helper function here now if wanted
            //maybe we just allow table creation and then leave it empty here for now.
            exports.filterTweetObjectsForLayer(rows, layerName, finalCB);
            //that.temp.cLT.finalCB();

          });
        });
      });
    });
  });
};

exports.redoLayer = function(layerName, finalCB){

  this.genericDropTable("layer_" + layerName, function(){
    exports.addNewLayer(layerName, finalCB);
  })
};

exports.deleteLayer = function(layerName, cb){
  this.db.query("DELETE FROM layers WHERE layerName = ?", [layerName], function(){});
  this.genericDropTable("layer_"+layerName, cb);
};


//============= KEYWORDS ==================

exports.addNewKeyword = function(keyword, callbackForTweets){

  this.temp.kObj = {keyword: keyword, tableName: "tweets_containing_" + keyword, lastHighestIndexed: 0};
  this.temp.kCB = {callbackForTweets: callbackForTweets, tweets:false};

  this.genericCreateTable("keywords", exports.temp.kObj , function(err){

    exports.genericAddToTable("keywords", [exports.temp.kObj], null, function(){
      exports.genericCreateTable(exports.temp.kObj['tableName'], { }, function(err){
        exports.addForeignKey(exports.temp.kObj['tableName'], "tweet_id", "tweets", "id", function(err){

          exports.setColumnToUnique(exports.temp.kObj['tableName'], "tweet_id", function(){
            exports.searchForTweetsWithKeyword(exports.temp.kObj.keyword, function(err, rows, fields){
              exports.temp.kCB.tweets = rows;
              var finalSet = [];
              var obj;
              for(var i = 0; i < rows.length; i++){
                obj = {};
                obj['tweet_id'] = rows[i].id;
                finalSet.push(obj);
              }
              exports.genericAddToTable(exports.temp.kObj['tableName'], finalSet, null, function(){

                  if(exports.temp.kCB.callbackForTweets){
                    exports.temp.kCB.callbackForTweets(exports.temp.kCB.tweets);
                  }

              });
            });
          });
        });
      });
    });
  });
};

exports.redoKeyword = function(keyword, callbackForTweets){

  this.genericDropTable("tweets_containing_"+keyword, function(){
    exports.addNewKeyword(keyword, callbackForTweets);
  });
};

exports.deleteKeyword = function(keyword, callback){
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


  this.db.query("SHOW TABLES", function(err, rows){
    console.log("SHOW TABLES: ", rows);
    var tableNames = [];
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
          if(name === "tweets"){
            console.log("TWEET COLUMN NAMES: ", rows);
          }
          var cbArr = [];
          for(var i = 0; i < rows.length; i++){
            cbArr.push(rows[i]["COLUMN_NAME"]);
          }
          cbArr.unshift(name);

          cb(cbArr);
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
    //console.log(exampleObject);
    for(key in exampleObject){
        //there have been isues with larger than 32 bit ints here
      if(isNaN(exampleObject[key]) ){
        type = "VARCHAR(200)";
      }else{
        //console.log("ADDING INTEGER FIELD OF: ", key);
        type = "BIGINT";
      }
      str = str + " " + key + " " + type + ',';
    }

    str = str.slice(0, -1);
    str = str + ")";
    console.log(str);
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

  console.log("inside async");

  if(funcs.length === 0){
    finalCB(["NONE"]);
    return;
  }

  var cb = function(index, result){
    finalResults[index] = result;
    count--;
    if(count === 0){
      finalCB(finalResults);
    }
  };

  for(var i = 0; i < funcs.length; i++){
    funcs[i](cb.bind(null,i));
  }
};

//=============== ADD STUFF ====================
exports.cache = exports.cache || {};

exports.genericAddToTable = function(tableName, listOfObjectsOrig, callbackPerAdd, callbackAtEnd){

  callbackPerAdd = callbackPerAdd || this.errCB;
  listOfObjects = exports.rearchitectArrWithDeepObjects(listOfObjectsOrig);
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

        exports.db.query(queryStr, function(err){
          count--;

          exports.doAddingMessage(count, 25);
          if(callbackPerAdd) callbackPerAdd(err);
          if(count <= 0){
            console.log("COMPLETED ADDING ALL ENTRIES");
            if(callbackAtEnd){
              callbackAtEnd();
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

    exports.db.query("DROP TABLE IF EXISTS " + tableName, callback);
  });

};

exports.getCurrentDatabaseName = function(cb){
  this.db.query("SELECT DATABASE()", function(err, rows, fields){
    if(err)console.log(err);

    cb(rows[0][1]);
  });
};

exports.createDatabase = function(name, callback){
  this.db.query("CREATE DATABASE IF NOT EXISTS " + name, function(){
    exports.changeToDatabase(name, function(){
       exports.genericCreateTable('tweets', exports.testTweet1, function(err){
        exports.setColumnToUnique('tweets', 'id_str', function(){
          exports.genericGetTableColumnNames("tweets", function(err, rows){
          callback(name);
         });
        });
      });
    });
  });
};

exports.changeToDatabase = function(name, callback){
  this.db.query("USE " + name, function(err, rows, fields){
    if(!err){
      exports.currDB = name;
    }else{
      console.log(err);
    }
    callback(err, name);
  });
};

exports.genericDropDatabase = exports.deleteDatabase = function(name, callback){
  if(name === 'production'){
    console.log("DROPPING PRODUCTION DATABASE VIA CODE IS NOT ALLOWED");
    callback();
    return;
  }
  this.db.query("DROP DATABASE IF EXISTS " + name, callback);
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
  this.db.query("DESCRIBE " + name, function(err, rows, fields){
    callback(err,rows);
  });
};

exports.ADDALLTHETWEETS = function(callback){
  this.getCurrentDatabaseName(function(name){
    if(name === 'production'){
      return;
    }else{
      var ALL_THE_TEST_TWEETS = require('./tweets_test.js');

      var finalCall = function(){
        console.log("A BILLION TWEETS ADDED");
        callback();
      };

       exports.genericAddToTable('tweets', ALL_THE_TEST_TWEETS , null, finalCall, true);
     }
  });

};

exports.ADDTHEFIVETESTTWEETS = function(callback){
  this.getCurrentDatabaseName(function(name){
      if(name === 'production'){
        return;
      }else{
        for(var i = 1; i < 6; i++){
          exports.executeFullChainForIncomingTweets(exports["testTweet" + i]);
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
  if(this.triggerHasRun) return;

  if(this.db === undefined || this.isLive !== true){
    console.log("========waiting for db==========");
    setTimeout(this.trigger.bind(this), 100);
    return;
  }else{
    console.log("==========DB exists===========");
  }

  this.triggerHasRun = true;

  exports.changeToDatabase(exports.currDB, function(err){
    if(err)console.log(err);

    if(this.notifiersForLive){
       for(var i = 0; i < this.notifiersForLive.length; i++){
        this.notifiersForLive[i]();
      }
      this.notifiersForLive = null;
    }

 });
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
