var _mysql = require('mysql');

var mysql = _mysql.createConnection({
  host: 'crowdparser.cloudapp.net',
  port: 3307,
  user: 'root',
  password: 'Michael123'
});

var connection = mysql.connect(function(err){
  if(err){
    console.log("error connecting mysql ", err.stack);
  }else{
    console.log("connected as ID ", mysql.threadId);
  }
});

module.exports = connection;

