var dbConfig = require('./database-config-1');

var connectionObject = {
  host: process.env.MYSQLHOST || dbConfig.host,
  port: process.env.MYSQLPORT || dbConfig.port,
  user: process.env.MYSQLUSER || dbConfig.user,
  password: process.env.MYSQLPW || dbConfig.pw
};

module.exports = connectionObject;
