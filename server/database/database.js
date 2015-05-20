var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

//External facing functions, agnostic of actual database
var tweets = exports.tweets = {};
var layers = exports.layers = {};
var keywords = exports.keywords = {};






