var _db = require('./database-config.js');

//External facing functions, agnostic of actual database
// var tweets = exports.tweets = {};
// var layers = exports.layers = {};
// var keywords = exports.keywords = {};
exports.db = _db;


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

exports.getAllTweets = function(callback){
   callback([{username: "Joe", message: "Hi 2 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()},
             {username: "Joe2", message: "Hi 3 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()},
             {username: "Joe3", message: "Hi 4 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()}]);
};

exports.createTable = function(exampleObject, callback){
 this.genericCreateTable("tweets", exampleObject, callback);

};

exports.testTweet = {"created_at":"Wed May 20 23:13:04 +0000 2015","id":601163762242981900,"id_str":"601163762242981888","text":"@LanaeBeau_TY 😥😥😥 you suck","source":"<a href=\"http://twitter.com/download/android\" rel=\"nofollow\">Twitter for Android</a>","truncated":false,"in_reply_to_status_id":601160439414857700,"in_reply_to_status_id_str":"601160439414857728","in_reply_to_user_id":277764780,"in_reply_to_user_id_str":"277764780","in_reply_to_screen_name":"LanaeBeau_TY","user":{"id":3252488177,"id_str":"3252488177","name":"●○●○♡","screen_name":"2411Clark","location":"","url":null,"description":"I'm dope just follow .","protected":false,"verified":false,"followers_count":7,"friends_count":29,"listed_count":0,"favourites_count":11,"statuses_count":40,"created_at":"Wed May 13 19:04:37 +0000 2015","utc_offset":null,"time_zone":null,"geo_enabled":false,"lang":"en","contributors_enabled":false,"is_translator":false,"profile_background_color":"C0DEED","profile_background_image_url":"http://abs.twimg.com/images/themes/theme1/bg.png","profile_background_image_url_https":"https://abs.twimg.com/images/themes/theme1/bg.png","profile_background_tile":false,"profile_link_color":"0084B4","profile_sidebar_border_color":"C0DEED","profile_sidebar_fill_color":"DDEEF6","profile_text_color":"333333","profile_use_background_image":true,"profile_image_url":"http://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/600318202212519937/4Qidlfxo_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/3252488177/1431961882","default_profile":true,"default_profile_image":false,"following":null,"follow_request_sent":null,"notifications":null},"geo":null,"coordinates":null,"place":null,"contributors":null,"retweet_count":0,"favorite_count":0,"entities":{"hashtags":[],"trends":[],"urls":[],"user_mentions":[{"screen_name":"LanaeBeau_TY","name":"tyisha.","id":277764780,"id_str":"277764780","indices":[0,13]}],"symbols":[]},"favorited":false,"retweeted":false,"possibly_sensitive":false,"filter_level":"low","lang":"en","timestamp_ms":"1432163584658"};


exports.genericCreateTable = function(name, exampleObject, callback){
    var str = ("CREATE TABLE " + name + ' (id INTEGER PRIMARY KEY AUTOINCREMENT');
    var key;

    for(key in exampleObject){
      if(key === "id"){
        console.log("ERROR, id is reserved for database PRIMARY KEY");
      }else if(!isNaN(exampleObject[key]) || exampleObject[key].toLowerCase === "number" || exampleObject[key].toLowerCase === "int" || exampleObject[key].toLowerCase === "INTEGER" ){
        exampleObject[key] = "INTEGER";
      }else{
        exampleObject[key] = "TEXT";
      }
      str = str + " " + key + " " + exampleObject[key] + ',';
    }
    str = str + ')';

    this.db.query(str, callback);
};

exports.genericAddToTable = function(tableName, listOfObjects, callback){
  var holder = Object.keys(listOfObjects[0]);
  var marks = "";
  var insertStr = "INSERT INTO " + tableName + ' (';
  for(var i = 0; i < holder.length; i++){
    insertStr = insertStr + " " + holder[i];
    marks = marks + " ?"
  }

  insertStr = insertStr + ' VALUES (';
  insertStr = insertStr + marks + ")";
  var vals;
  var queryStr;
  //var count = 0;
    for (var i = 0; i < listOfObjects.length; i++) {
      vals = [];
        for(var j = 0; j < holder.length; j++){
          vals.push(listOfObjects[i][holder[j]]);
        }
      queryStr = db.format(insertStr, valsStr);
      this.db.query(queryStr, callback); //TODO add callback here for errors
      //count++;
      // if(count >= listOfObjects.length){
      //   callback();
      // }
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
  this.db.query("DROP TABLE IF EXISTS " + tableName);
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




