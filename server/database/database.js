var db = require('./database-config.js');

//External facing functions, agnostic of actual database
var tweets = exports.tweets = {};
var layers = exports.layers = {};
var keywords = exports.keywords = {};
exports.db = db;


layers.createLayerData = function(layerName, data){

};

layers.addLayerData = function(layerName, data){

};

tweets.add = function(tweets){
 genericAddToTable("tweets", tweets);

};

keywords.add = function(keyword){
 //user generic
};

tweets.getAllTweets = function(callback){
  //USAGE for callback: function(err, row) {console.log(row.id + ": " + row.text);
   //db.each("SELECT rowid AS id, text FROM tweets", callback);
   callback([{username: "Joe", message: "Hi 2 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()},
             {username: "Joe2", message: "Hi 3 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()},
             {username: "Joe3", message: "Hi 4 You", inReplyTo:null, retweets:3, followers:8, favorited: 3, date: +new Date()}]);
};

tweets.createTable = function(exampleObject, callback){
 genericCreateTable("tweets", exampleObject, callback);

};

var genericCreateTable = function(name, exampleObject, callback){
  db.serialize(function(){

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

    db.run(str);
    if(callback) callback();
  });
};

var genericAddToTable = function(tableName, listOfObjects){
  var holder = Object.keys(listOfObjects[0]);
  var marks = "";
  var insertStr = "INSERT INTO " + tableName + ' (';
  for(var i = 0; i < holder.length; i++){
    insertStr = insertStr + " " + holder[i];
    marks = marks + " ?"
  }

  insertStr = insertStr + ' VALUES (';
  insertStr = insertStr + marks + ")";
  var runStr = "";
  var stmt = db.prepare(insertStr);
    for (var i = 0; i < listOfObjects.length; i++) {
        for(var j = 0; j < holder.length; j++){
          runStr = runStr + " " + listOfObjects[i][holder[j]];
        }
        stmt.run(runStr);
    }
  stmt.finalize();
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



var genericDropTable = function(tableName, callback){
  db.serialize(function(){
    db.run("DROP TABLE IF EXISTS " + tableName);
    if(callback) callback();
  });

}

exports.createFromScratch = function(){
  console.log("CREATING NEW TABLES");
  db.serialize(function() {
    tweets.createTable({username:"", text:"" });
    genericAddToTable("tweets", [
                      {username: "Joe", text: "Hi 2 You"},
                      {username: "Dave", text: "it's dave!"},
                      {username: "Deb", text: "Yo Yo Yo"}]);
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
  });

  exports.createFromScratch();
}




