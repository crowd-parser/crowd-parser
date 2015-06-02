try {
  var dbConfig = require('./database-config-1');
} catch (e) {
  console.log(e);
  var dbConfig = {};
}

var connectionObject = {
  host: dbConfig.host || 'localhost',
  port: dbConfig.port || null,
  user: dbConfig.user || 'root',
  password: dbConfig.pw || null
};

module.exports = connectionObject;
