//TODO
//runtime keyword search
//store layer results
//handle emojis inputted into db
//keywords with special symbols, like @, currently break as table names, regardless of escaping

/*============= DATABASE MODULE WRAPPER for SQL commands =========*/

//USAGE
/*

        addTweet(
                  tweetObject,
                  callbackForEachAdd<err, rows, fields>,
                  );

        addTweets(
                  arrOfTweetObjects,
                  callbackForEachAdd<err, rows, fields>,
                  callbackAtEnd< >
                  );

        addKeyword(
                  keyword,
                  callbackAtEndWithTweets< arrayOfObjects >
                  );
*/

//stores connection information from non-shared database configuration file
exports.db = require('./database-config.js');

//establishes connection to persistent database previously configured
exports.db.connect(function(err){
    if(err){
      console.log(">>>>>>>>>>>>>ERROR connecting mysql ", err.stack);
    }else{
      console.log(">>>>>>>>>>>>>CONNECTED as ID ", exports.db.threadId);
    }
});

exports.layerBaseWordsFunction = require('../sentiment/baseWordsLayer/baseWordsLayerAnalysis.js');
exports.layerEmoticonsFunction = require('../sentiment/emoticonLayer/emoticonLayerAnalysis.js');

/*==================================================================*/



/*============= DEBUG and MACRO SETTINGS =================*/
//ONLY SET THIS IF YOU PLAN TO CHANGE SCHEMA, OTHERWISE LEAVE AS IS
var TALK_TO_DEV_DATABASE = false;
  var NUKE_ALL_TABLES_ON_START = false; //false will prevent further debug stuff
  var THIS_IS_REALLY_SURE_YOU_WANT_TO_NUKE_EVERYTHING = false;
    var FILL_TWEETS_TABLE_WITH_THIS_ARRAY_OF_TWEETS = []; //manually add test tweets here
    var ADD_THESE_KEYWORDS = ["Obama", "Apple", "Avengers"]; //manually add test keywords here

    var ADD_ALL_19_MEGS_OF_TEST_TWEETS = false;
      var ALL_THE_TEST_TWEETS = {};
      if(ADD_ALL_19_MEGS_OF_TEST_TWEETS){
        ALL_THE_TEST_TWEETS = require('./tweets_test.js');
      }

  if(TALK_TO_DEV_DATABASE){
    exports.databaseToTalkTo = 'dev';
  }else{
    exports.databaseToTalkTo = 'production';
  }


/*==================================================================*/




//============ GET STUFF ===================

exports.getAllTweets = function(callback){
  this.db.query('SELECT * FROM tweets', callback);
};

exports.genericGetAll = function(tableName, callback){
  this.db.query('SELECT * FROM ' + tableName, callback);
};

exports.genericGetTableColumnNames = function(tableName, callback){
  this.db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION",[this.databaseToTalkTo, tableName] , callback);
};

exports.genericGetItemsWithTextColumnContaining = function(tableName, columnName, string, callback){
  this.db.query("SELECT * FROM " + tableName +  " WHERE " + columnName + " LIKE '%" + string + "%'", callback);
};

exports.searchForTweetsWithKeyword = function(keyword, callback){
  this.genericGetItemsWithTextColumnContaining("tweets", "text", keyword, callback);
};

exports.searchInTweetsForKeyword = function(keyword, tweets, callback){
  //TODO;
};

exports.searchForValueInColumn = function(tableName, columnName, value){
  //TODO;
};

exports.filterTweetsByLayer = function(tweets, layerName, callback){
  //return only the tweets that also exist in the layer table
  var filteredTweets = [];

  //a layer will just have a list of tweet primary keys
  //so the tweets that come in here must come from the database first

  //that probably means we should use a database join on them


  calback(filteredTweets);

};


//===========================================




//============== CREATE STUFF ==================

exports.createLayerTableBase = function(callback){
  this.genericCreateLayerTable("base", this.layerBaseWordsFunction, callback);
};

exports.createLayerTableEmoticon = function(callback){
  this.genericCreateLayerTable("emoticon", this.layerEmoticonsFunction, callback);
};

exports.genericCreateLayerTable = function(layerName, layerFunc, finalCB){
  var that = this;
  this.getAllTweets(function(err, rows, fields){
    layerName = "layer_" + layerName;
    that.temp.cLT = {layerName: layerName, layerFunc: layerFunc, rows: rows, finalCB: finalCB};
    that.genericCreateTable(that.temp.cLT.layerName,{result: 1}, function(){
      that.addForeignKey(that.temp.cLT.layerName, "tweet_id", "tweets", "id", function(){
        that.setColumnToUnique("tweets","tweet_id", function(){

          var addThese = [];

          for(var i = 0; i < rows.length; i++){
            if(i % 100 === 0) console.log("PROCESSED TWEETS: ", i);
            addThese.push({result: that.temp.cLT.layerFunc(that.temp.cLT.rows[i].text), tweet_id: that.temp.cLT.rows[i].id});
          }

          that.genericAddToTable(that.temp.cLT.layerName,addThese,null,function(){
            that.temp.cLT.finalCB(that.temp.cLT.rows);
          });

        });
      });
    });
  });
};

exports.addForeignKey = function(thisTable, thisTableColumn, thatTable, thatTableColumn, callback){
  var that = this;
  that.temp.fkObj = {thisTable: thisTable, thisTableColumn: thisTableColumn, thatTable: thatTable, thatTableColumn: thatTableColumn, callback: callback};
  this.db.query("ALTER TABLE " + thisTable + " ADD COLUMN (" + thisTableColumn + " INTEGER)", function(){
    that.db.query("ALTER TABLE " + that.temp.fkObj.thisTable + " ADD FOREIGN KEY (" + that.temp.fkObj.thisTableColumn + ") REFERENCES " + that.temp.fkObj.thatTable+"("+that.temp.fkObj.thatTableColumn+")", function(err, rows, fields){
      if(!err) console.log("CREATED FOREIGN KEY IN TABLE");
      that.temp.fkObj.callback(err, rows, fields);
    });
  });
};

exports.setColumnToUnique = function(tableName, columnName, callback){
  this.db.query("ALTER IGNORE TABLE " + tableName + " ADD UNIQUE (" + columnName + ")", callback);
};

exports.changeColumnProperty = function(tableName){
  //ALTER TABLE table_name ALTER COLUMN column_name datatype
};

exports.genericCreateTable = function(tableName, exampleObject, callback){
    var AI = "AUTO_INCREMENT";
    // dontIgnoreId = true; //TODO UNDO
    var str = ("CREATE TABLE IF NOT EXISTS " + this.db.escapeId(tableName) + ' (id INTEGER PRIMARY KEY ' + AI + ',');
    var key;
    var type;
    var that = this;


    exampleObject = this.rearchitectArrWithDeepObjects([exampleObject])[0];

    for(key in exampleObject){
        //TODO just doing all text for now, will specify based on content later
      type = "TEXT";
      str = str + " " + key + " " + type + ',';
    }

    str = str.slice(0, -1);
    str = str + ")";
    this.db.query(str, function(err){
      if(!err){
      }else{
        console.log(err);
      }
      callback(err);
    });

};


// ============================================

exports.rearchitectArrWithDeepObjects = function(arr){
  var that = this;
  var newArr = [];
  var temp;

  var tryToPushObject = function(thing, nameSoFar, finalObject){
       if(nameSoFar !== ""){
          finalObject[that.db.escapeId(nameSoFar)] = that.db.escape(thing);
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



//=============== ADD STUFF ====================
exports.addKeyword = function(keyword, callbackForTweets){
  var that = this;
  // keyword = this.db.escapeId(keyword);
  this.temp.kObj = {keyword: keyword, tableName: "tweets_containing_" + keyword};
  this.temp.kCB = {callbackForTweets: callbackForTweets, tweets:false};

  this.genericCreateTable("keywords", that.temp.kObj , function(err){

    that.genericAddToTable("keywords", [that.temp.kObj], null, function(){
      that.genericCreateTable(that.temp.kObj['tableName'], { }, function(err){
        that.addForeignKey(that.temp.kObj['tableName'], "tweet_id", "tweets", "id", function(err){

          that.setColumnToUnique(that.temp.kObj['tableName'], "tweet_id", function(){
            that.searchForTweetsWithKeyword(that.temp.kObj.keyword, function(err, rows, fields){
              console.log("" + rows.length + " tweets found containing the keyword");
              that.temp.kCB.tweets = rows;
              var finalSet = [];
              var obj;
              for(var i = 0; i < rows.length; i++){
                obj = {};
                obj['tweet_id'] = rows[i].id;
                finalSet.push(obj);
              }
              that.genericAddToTable(that.temp.kObj['tableName'], finalSet, null, function(){
                // that.genericGetAll(that.temp.kObj['tableName'], function(err, rows){

                  if(that.temp.kCB.callbackForTweets){
                    that.temp.kCB.callbackForTweets(that.temp.kCB.tweets);
                  }

                // });
              });

            });
          });
        });
      });
    });
  });
};

exports.addTweet = function(tweet, callback){
  this.genericAddToTable('tweets', [tweet], callback, null);
}

exports.addTweets = function(tweets, callbackPer, callbackEnd){

  var newCallbackPer = function(err, rows, fields){
    //could reindex on keywords here, or something
    //maybe set them as not indexed yet, like in a columln
    if(callbackPer) callbackPer(err, rows, fields);
  }

  var finalCallback = function(){
    if(callbackEnd) callBackEnd();
  };

  this.genericAddToTable('tweets', tweets, newCallbackPer, finalCallback);
};

exports.updateKeywordListsForTweets = function(tweets, callbackEnd){
  //TODO
  //take highest id for tweet in list then search all tweets higher than that on all keywords.
};


exports.genericAddToTable = function(tableName, listOfObjects, callbackPerAdd, callbackAtEnd){

  var that = this;
  callbackPerAdd = callbackPerAdd || this.errCB;
  listOfObjects = that.rearchitectArrWithDeepObjects(listOfObjects);
  //this is all so we can push any objects at the db, regardless of table setup

  this.genericGetTableColumnNames(tableName, function(err, rows, fields){

    var tableColumns = []; //TODO this should get cached / memoized basically
    for(var i = 0; i < rows.length; i++){
      tableColumns.push( "`" + rows[i]['COLUMN_NAME'] + "`");
    }

    startAdding(that, tableColumns);
  });

  var startAdding = function(that, holder){

    var insertStr = "INSERT INTO " + tableName + ' (';
    for(var i = 0; i < holder.length; i++){

      insertStr = insertStr + holder[i] + ", ";
    }
    insertStr = insertStr.slice(0, -2);
    insertStr = insertStr + ' ) VALUES (';

    var queryStr;
    var temp;
    var count = listOfObjects.length;

    that.doAddingMessage(count);

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

        that.db.query(queryStr, function(err){
          count--;

          that.doAddingMessage(count, 25);
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

exports.doAddingMessage = function(count, moduloVal){
  moduloVal = moduloVal || 1;

  if(count % moduloVal === 0){
    console.log("" + count + " ENTRIES REMAIN TO BE ADDED. ETA: " + Math.round(.08 * count / 60 * 100)/100 + " minutes");
  }
};

//==============================================




// =============== MAINTENANCE ==================
exports.temp = {};
exports.errCB = function(err){if(err)console.log(err)};

exports.genericDropTable = function(tableName, callback){
  this.db.query("DROP TABLE IF EXISTS " + tableName, callback);
};

exports.createDatabase = function(name, callback){
  this.db.query("CREATE DATABASE IF NOT EXISTS " + name, callback);
};

exports.changeToDatabase = function(name, callback){
  this.db.query("USE " + name, callback);
};

exports.genericDropDatabase = function(name, callback){
  this.db.query("DROP DATABASE IF EXISTS " + name, callback);
};

// ==============================================




//================ TESTING ======================
exports.genericDescribeTable = function(name){
  this.db.query("DESCRIBE " + name, function(err, rows, fields){
    console.log(rows);
  });
};

exports.ADDALLTHETWEETS = function(callback){
  if(ADD_ALL_19_MEGS_OF_TEST_TWEETS !== true) return;
  var indieCall = function(err){
    if(err){
      console.log(err);
    }else{
    }
  };

  var finalCall = function(){
    console.log("A BILLION TWEETS ADDED");
    callback();
  };
  console.log("HERE");
  this.genericAddToTable('tweets', ALL_THE_TEST_TWEETS , indieCall, finalCall);
};

exports.testTweet1 = {"created_at":"Wed May 20 23:13:04 +0000 2015","id":601163762242981900,"id_str":"601163762242981888","text":"@LanaeBeau_TY 😥😥😥 suck sad happy frowing","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet2 = {"created_at":"Wed May 20 23:15:04 +0000 2015","id":501163762242981901,"id_str":"601163762242981889","text":"@LanaeBeau_TY well you are the worst thing in the world","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet3 = {"created_at":"Wed May 20 23:16:04 +0000 2015","id":601163762242981902,"id_str":"601163762242981880","text":"@LanaeBeau_TY super duper you are awesome","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet4 = {"created_at":"Wed May 20 23:17:04 +0000 2015","id":601163762242981903,"id_str":"601163762242981881","text":"@LanaeBeau_TY Hilary Clinton is the best","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet5 = {"created_at":"Wed May 20 23:16:04 +0000 2015","id":601163762242981904,"id_str":"601163762242981882","text":"@LanaeBeau_TY the worst person is Hilary Clinton","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};


//this is called in app.js after the database module is exported
//it processes the debug commands at the top of the file, we'll remove it in production
exports.trigger = function(db,callback){

  var that = this;

  if(this.db === undefined){
    setTimeout(this.trigger.bind(this), 100);
    return;
  }else{
    console.log("==========DB exists===========");
    //callback();
  }

  this.isLive = true;

  that.changeToDatabase(that.databaseToTalkTo, that.errCB);

  //TODO UNDO THIS
  that.getAllTweets(function(err, rows, fields){
    console.log("NUMBER OF CURRENT TWEETS: ", rows.length);

    // that.addKeyword("potus", function(tweets){
    //  console.log(tweets.length);
    //  //that.createLayerTableBase();
    // });

  });

  if(!NUKE_ALL_TABLES_ON_START || !THIS_IS_REALLY_SURE_YOU_WANT_TO_NUKE_EVERYTHING) return;

  that.genericDropDatabase(this.databaseToTalkTo, function(err){

    that.createDatabase(that.databaseToTalkTo,function(err){

      that.changeToDatabase(that.databaseToTalkTo, function(err){

        that.genericCreateTable('tweets', that.testTweet1, function(err){
          that.setColumnToUnique('tweets', 'id_str', function(){
            var addTheseTweets;
            if(FILL_TWEETS_TABLE_WITH_THIS_ARRAY_OF_TWEETS.length > 0){
              addTheseTweets = FILL_TWEETS_TABLE_WITH_THIS_ARRAY_OF_TWEETS;
            }else{
              addTheseTweets = [that.testTweet1, that.testTweet2, that.testTweet3, that.testTweet4, that.testTweet5];
            }
            //there are two functions being passed in here, a callback per add, and a callback for the end of adds

            that.genericAddToTable('tweets', addTheseTweets, that.errCB, function(msg){
              that.getAllTweets(function(err, rows, fields){
                that.ADDALLTHETWEETS(function(){
                    for(var i = 0; i < ADD_THESE_KEYWORDS.length; i++){
                      that.addKeyword(ADD_THESE_KEYWORDS[i]);
                    }
                });
              });
            });
          });
        });
      });
    });
  });
};

//===========================================

exports.addUser = function(user, callback){
  this.genericAddToTable('users', [user], callback, null);
}