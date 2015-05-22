var dbConfig = require('./database-config-1');

var _mysql = require('mysql');

var mysql = _mysql.createConnection({
  host: process.env.MYSQLHOST || dbConfig.host,
  port: process.env.MYSQLPORT || dbConfig.port,
  user: process.env.MYSQLUSER || dbConfig.user,
  password: process.env.MYSQLPW || dbConfig.pw
});

module.exports = mysql;