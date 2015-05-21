var NUKEDBONSERVERSTART = false;
var USEALL19GIGS = false;

exports.db = require('./database-config.js');

//External facing functions, agnostic of actual database
// var tweets = exports.tweets = {};
// var layers = exports.layers = {};
// var keywords = exports.keywords = {};

exports.db.connect(function(err){
    if(err){
      console.log(">>>>>>>>>>>>>ERROR connecting mysql ", err.stack);
    }else{
      console.log(">>>>>>>>>>>>>CONNECTED as ID ", this.threadId);
      //database is ready
    }
});

// layers.createLayerData = function(layerName, data){

// };

// layers.addLayerData = function(layerName, data){

// };

// tweets.add = function(tweets){
//  genericAddToTable("tweets", tweets);

// };

// keywords.add = function(keyword){
//  //user generic
// };
exports.AAAAA = 0;
exports.getAllTweets = function(callback){

  this.db.query('SELECT * FROM tweets', callback);

   /*callback([{username: "Joe", message: "Hi 2 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()},
             {username: "Joe2", message: "Hi 3 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()},
             {username: "Joe3", message: "Hi 4 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()}]);
*/
};

exports.createTweetsTable = function(exampleObject, callback){
 this.genericCreateTable("tweets", exampleObject, callback);

};

exports.testTweet1 = {"created_at":"Wed May 20 23:13:04 +0000 2015","id":601163762242981900,"id_str":"601163762242981888","text":"@LanaeBeau_TY 😥😥😥 you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet2 = {"created_at":"Wed May 20 23:15:04 +0000 2015","id":501163762242981901,"id_str":"601163762242981889","text":"@LanaeBeau_TY well you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};
exports.testTweet3 = {"created_at":"Wed May 20 23:16:04 +0000 2015","id":601163762242981902,"id_str":"601163762242981880","text":"@LanaeBeau_TY super duper you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};


exports.genericCreateTable = function(name, exampleObject, callback){
    var str = ("CREATE TABLE " + this.db.escapeId(name) + ' (id INTEGER PRIMARY KEY AUTO_INCREMENT,');
    var key;
    var type;

    for(key in exampleObject){
      if(key === "id"){
        continue;
      /*}else if(!isNaN(exampleObject[key]) ){
        type = "INTEGER";*/
      }else{
        type = "TEXT";
      }
      str = str + " " + this.db.escapeId(key) + " " + type + ',';
    }
    str = str.slice(0, -1);
    str = str + ")";
    this.db.query(str, callback);
};

exports.genericAddToTable = function(tableName, listOfObjects, callback){
  delete listOfObjects[0]['id'];
  var holder = Object.keys(listOfObjects[0]);
  //console.log(holder);

  var insertStr = "INSERT INTO " + tableName + ' (';
  for(var i = 0; i < holder.length; i++){

    insertStr = insertStr + this.db.escapeId(holder[i]) + ", ";

  }
  console.log("generic add");
  insertStr = insertStr.slice(0, -2);
  insertStr = insertStr + ' ) VALUES (';


  var queryStr;
  var temp;
  //var count = 0;
    for (var i = 0; i < listOfObjects.length; i++) {
      queryStr = "";
        for(var j = 0; j < holder.length; j++){
          temp = listOfObjects[i][holder[j]];
          if(isNaN(temp) && typeof temp !== "string"){
            queryStr = queryStr + "''" + ", ";
          }else{

            queryStr = queryStr + "'" + temp + "'" + ", ";
          }

        }
      queryStr = queryStr.slice(0, -2);
      queryStr = queryStr + ' )';

      queryStr = insertStr + queryStr;
      console.log(queryStr);
      this.db.query(queryStr, callback);

    }

};



/*var createTest = function(cb) {
    dw.connect(function(conn, cb) {
        cps.seq([
            function(_, cb) {
                User.Table.create(conn, {
                    first_name: 'Hannah',
                    last_name: 'Mckay',
                    gender: 'female'
                    // ....
                }, cb);
            },
            function(user, cb) {  // user is an object of the class User.Row
                console.log(user.get('first_name')); // print out 'Hannah'
                cb();
            }
        ], cb);
    }, cb);
};
*/



exports.genericDropTable = function(tableName, callback){
  this.db.query("DROP TABLE IF EXISTS " + tableName, callback);
};

exports.nukeAll = function(){

};

exports.createFromScratch = function(){
  console.log("CREATING NEW TABLES PH");
  // db.serialize(function() {
  //   tweets.createTable({username:"", text:"" });
  //   genericAddToTable("tweets", [
  //                     {username: "Joe", text: "Hi 2 You"},
  //                     {username: "Dave", text: "it's dave!"},
  //                     {username: "Deb", text: "Yo Yo Yo"}]);
    // var stmt = db.prepare("INSERT INTO tweets VALUES (?)");
    // for (var i = 0; i < 10000; i++) {
    //     stmt.run("this is tweet number " + i);
    // }
    // stmt.run("this is a cat and a dog and Hilary Clinton and the next Avengers Movie");
    // stmt.run("I love all female politicians");
    // stmt.run("I love all Marvel movies");
    // stmt.run("My brother is voting for Hilary, yuck");
    // stmt.run("Who would ever go to see an Avengers movie?");
    // stmt.run("Hilary Clinton and dogs");
    // stmt.run("Avengers and dogs");
    // stmt.run("Clinton, Avengers, dogs");
    // stmt.finalize();

    // db.run("CREATE TABLE keywords (word TEXT)");

    // stmt = db.prepare("INSERT INTO keywords VALUES (?)");
    // for (var i = 0; i < 10000; i++){
    //   stmt.run("keyword" + i);
    // }
    // stmt.run("dogs");
    // stmt.run("Hilary");
    // stmt.run("Avengers");

    // stmt.finalize();
};

exports.createDatabase = function(name, callback){
  this.db.query("CREATE DATABASE IF NOT EXISTS " + name, callback);
};

exports.changeToDatabase = function(name, callback){
  this.db.query("USE " + name, callback);
};

exports.ALLTHETWEETS = function(){
  if(USEALL19GIGS === false) return;

  var count = 1;
  this.genericAddToTable('tweets', require('./tweets_test.js'), function(err){
    if(err) console.log(err);
    console.log(count);
    count++;

  } );
}

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
      if(!NUKEDBONSERVERSTART) return;
      that.genericDropTable('tweets', function(){
        that.genericCreateTable('tweets', that.testTweet1, function(err){
          console.log("HERE5");
          if(err)console.log(err);
          that.genericAddToTable('tweets', [that.testTweet1, that.testTweet2, that.testTweet3], function(err){
            console.log("HERE6");
            if(err)console.log(err); //this is now erroring
            that.getAllTweets(function(err, rows, fields){
              console.log("HERE7");
              if(err)console.log(err);
              console.log("A TWEET", rows[0]);
              console.log("A TWEET", rows[1]);
              console.log("A TWEET", rows[2]);
              that.ALLTHETWEETS();
            });
          });
        });
      });
    });
  });

};




      // this.genericDropTable('tweets', function(err){
      //   console.log("DROP TABLE");
      //   if(err){
      //     //ignoring errors here on purpose
      //   }

      //   this.genericCreateTable("tweets", this.testTweet, function(err){
      //     if(err){
      //       console.log("DB ERR:", err);
      //       return;
      //     }
      //     console.log("DB CREATED");
      //     this.genericAddToTable("tweets", function(){
      //       console.log("Tweets added");
      //       this.getAllTweets(function(err, rows, fields){
      //         for(var i = 0; i < rows.length; i++){
      //           console.log(rows[i]);
      //         }
      //       });
      //     }.bind(this));
      //   }.bind(this));
      // }.bind(this));



