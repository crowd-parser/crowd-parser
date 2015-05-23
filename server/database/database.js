//TODO
//runtime keyword search
//store layer results
//build table for chosen keyword function
  //search all tweets for keyword base function
//handle emojis inputted into db

/*============= DATABASE MODULE WRAPPER for SQL commands =========*/

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

/*==================================================================*/



/*============= DEBUG and MACRO SETTINGS =================*/
var NUKE_ENTIRE_TWEETS_TABLE_ON_SERVER_START = true; //false will prevent further debug stuff
var FILL_TWEETS_DATABASE_WITH_THIS_ARRAY_OF_TWEETS = []; //manually add test tweets here
var ADD_ALL_19_MEGS_OF_TEST_TWEETS = false;

var ALL_THE_TEST_TWEETS = {};
if(ADD_ALL_19_MEGS_OF_TEST_TWEETS){
  ALL_THE_TEST_TWEETS = require('./tweets_test.js');
}
/*==================================================================*/




//============ GET STUFF ===================

exports.getAllTweets = function(callback){
  this.db.query('SELECT * FROM tweets', callback);
};

exports.genericGetAll = function(tableName, callback){
  this.db.query('SELECT * FROM ' + tableName, callback);
};

exports.genericGetMatching = function(tableName, callback){
  //TODO
};

exports.genericGetTableColumnNames = function(tableName, callback){
  this.db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? ORDER BY ORDINAL_POSITION",[tableName] , callback);
};

exports.genericGetItemsWithTextColumnContaining = function(tableName, columnName, string, callback){
  this.db.query("SELECT * FROM " + tableName +  " WHERE " + columnName + " LIKE '%" + string + "%'", callback);
};

exports.searchForTweetForKeyword = function(keyword, callback){
  this.genericGetItemsWithTextColumnContaining("tweets", "text", keyword, callback);
};

exports.searchForTweetForKeywordRuntime = function(keyword, callback){

};

//===========================================




//============== CREATE STUFF ==================
exports.addForeignKey = function(thisTable, thisTableColumn, thatTable, thatTableColumn, callback){
  var that = this;
  that.temp.fkObj = {thisTable: thisTable, thisTableColumn: thisTableColumn, thatTable: thatTable, thatTableColumn: thatTableColumn, callback: callback};
  this.db.query("ALTER TABLE " + thisTable + " ADD COLUMN (" + thisTableColumn + " INTEGER)", function(){
    that.db.query("ALTER TABLE " + that.temp.fkObj.thisTable + " ADD FOREIGN KEY (" + that.temp.fkObj.thisTableColumn + ") REFERENCES " + that.temp.fkObj.thatTable+"("+that.temp.fkObj.thatTableColumn+")", function(err, rows, fields){
      if(!err) console.log("CREATED FOREIGN KEY IN TABLE");
      that.temp.fkObj.callback(err, rows, fields);
    });
  });

  // function(){
  //   that.db.query("ALTER TABLE " + that.temp.fkObj.thisTable + " ADD FOREIGN KEY (" + that.temp.fkObj.thisTableColumn + ") REFERENCES " + that.temp.fkObj.thatTable+"("+that.temp.fkObj.thatTableColumn+")");

  // }
};

exports.changeColumnProperty = function(tableName ){
  //ALTER TABLE table_name ALTER COLUMN column_name datatype
}

exports.genericCreateTable = function(tableName, exampleObject, callback){
    var AI = "AUTO_INCREMENT";
    // dontIgnoreId = true; //TODO UNDO
    var str = ("CREATE TABLE IF NOT EXISTS " + this.db.escapeId(tableName) + ' (id INTEGER PRIMARY KEY ' + AI + ',');
    var key;
    var type;


    exampleObject = this.rearchitectArrWithDeepObjects([exampleObject])[0];
    //console.log(exampleObject);
    for(key in exampleObject){
        //TODO just doing all text for now, will specify based on content later
      type = "TEXT";
      str = str + " " + key + " " + type + ',';
    }

    str = str.slice(0, -1);
    str = str + ")";
    this.db.query(str, function(err){
      if(!err){
        console.log("CREATED NEW TABLE: " + tableName);
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
exports.addKeyword = function(keyword){
  var that = this;
  this.temp.kObj = {keyword: keyword, tableName: "tweets_containing_" + keyword};

  this.genericCreateTable("keywords", that.temp.kObj , function(err){

    that.genericAddToTable("keywords", [that.temp.kObj], null, function(){
      that.genericCreateTable(that.temp.kObj['tableName'], {test: 999 }, function(err){
        that.addForeignKey(that.temp.kObj['tableName'], "tweet_id", "tweets", "id", function(err){
          that.errCB(err);
            console.log("HERE");
            that.searchForTweetForKeyword(that.temp.kObj.keyword, function(err, rows, fields){
              console.log("" + rows.length + " tweets found containing the keyword");

              // that.db.query("DESCRIBE " + that.temp.kObj.tableName, function(err, rows, fields){
              //   console.log(arguments);
              // });
              // return;
              // console.log(rows[0]);
              var finalSet = [];
              var obj;
              for(var i = 0; i < rows.length; i++){
                obj = {};
                obj['tweet_id'] = rows[i].id;
                finalSet.push(obj);
              }
              that.genericAddToTable(that.temp.kObj['tableName'], finalSet, null, function(){
                that.genericGetAll(that.temp.kObj['tableName'], function(err, rows){
                  console.log(rows);
                })
              });

            });
        });
      });
    });
  });
}


exports.genericAddToTable = function(tableName, listOfObjects, callbackPerAdd, callbackAtEnd){
  var that = this;
  callbackPerAdd = callbackPerAdd || this.errCB;
  listOfObjects = that.rearchitectArrWithDeepObjects(listOfObjects);
  //this is all so we can push any objects at the db, regardless of table setup
  this.genericGetTableColumnNames(tableName, function(err, rows, fields){
    //console.log(arguments);
    var tableColumns = [];
    for(var i = 0; i < rows.length; i++){
      tableColumns.push( "`" + rows[i]['COLUMN_NAME'] + "`");
    }
    startAdding(that, tableColumns);
  });

  var startAdding = function(that, holder){
    //var holder = Object.keys(listOfObjects[0]);

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
    //recurse this for child objects I guess

    // console.log(Object.keys(listOfObjects[0]));
    // console.log(holder);

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
              console.log("No final callback provided");
            }

          }
        });
      }
  };
};

exports.doAddingMessage = function(count, moduloVal){
  moduloVal = moduloVal || 1;
  if(count & moduloVal === 0){
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

exports.nukeAll = function(){
  //TODO
};

exports.createDatabase = function(name, callback){
  this.db.query("CREATE DATABASE IF NOT EXISTS " + name, callback);
};

exports.changeToDatabase = function(name, callback){
  this.db.query("USE " + name, callback);
};

// ==============================================




//================ TESTING ======================

exports.ADDALLTHETWEETS = function(){
  if(ADD_ALL_19_MEGS_OF_TEST_TWEETS !== true) return;
  var indieCall = function(err){
    if(err){
      console.log(err);
    }
  };

  var finalCall = function(){
    console.log("A BILLION TWEETS ADDED");
  };

  this.genericAddToTable('tweets', ALL_THE_TEST_TWEETS , indieCall, finalCall);
};

exports.testTweet1 = {"created_at":"Wed May 20 23:13:04 +0000 2015","id":601163762242981900,"id_str":"601163762242981888","text":"@LanaeBeau_TY 😥😥😥 you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet2 = {"created_at":"Wed May 20 23:15:04 +0000 2015","id":501163762242981901,"id_str":"601163762242981889","text":"@LanaeBeau_TY well you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet3 = {"created_at":"Wed May 20 23:16:04 +0000 2015","id":601163762242981902,"id_str":"601163762242981880","text":"@LanaeBeau_TY super duper you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};

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

  that.createDatabase('dev',function(){
    that.changeToDatabase('dev', function(){
      if(!NUKE_ENTIRE_TWEETS_TABLE_ON_SERVER_START) return;
      // that.db.query("DESCRIBE");
      that.db.query("SHOW TABLES", function(err, rows, fields){
        console.log(rows);
      });
      that.genericDropTable('keywords');
      that.genericDropTable('tweets_containing_you');
      that.genericDropTable('tweets', function(){
        that.genericCreateTable('tweets', that.testTweet1, function(err){
          if(err){console.log(err); return;}
          var addTheseTweets;
          if(FILL_TWEETS_DATABASE_WITH_THIS_ARRAY_OF_TWEETS.length > 0){
            addTheseTweets = FILL_TWEETS_DATABASE_WITH_THIS_ARRAY_OF_TWEETS;
          }else{
            addTheseTweets = [that.testTweet1, that.testTweet2, that.testTweet3];
          }
          //there are two functions being passed in here, a callback per add, and a callback for the end of adds
          that.genericAddToTable('tweets', addTheseTweets, function(err){if(err){console.log(err); return;}}, function(msg){
            that.getAllTweets(function(err, rows, fields){
              if(err){console.log(err); return;}
              //console.log("TWEET 0 in Table Tweets: ", rows[0]);
              that.addKeyword("you");
              that.ADDALLTHETWEETS();
            });
          });
        });
      });
    });
  });

};

//===========================================

