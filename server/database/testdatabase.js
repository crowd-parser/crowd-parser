var dbwrapper = require("./database.js");
console.log("TESTING DATABASE");
dbwrapper.createTable(dbwrapper.testTweet, function(){
  console.log("done creating table");
});
