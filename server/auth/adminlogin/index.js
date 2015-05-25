'use strict';

var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var db = require('../../database/database');
var jwt = require('jwt-simple');
var secret = require('./adminloginsecret');

router.post('/', function(req, res, next) {

  db.db.query('USE production');
  db.db.query("SELECT * FROM admin WHERE username='" + req.body.username + "';", function(err, rows) {
    
    if (rows.length !== 0) {
      bcrypt.compare(req.body.password, rows[0].password, function(err, match) {
        if (match) {
          var token = jwt.encode(rows[0], secret.secret);
          res.send({token: token});
        } else {
          res.send('Password is incorrect');
        }
      });
    } else {
      res.send('Username is incorrect');
    }

  });
});

router.get('/getTables', function(req, res, next) {
  
  db.db.query('USE production');
  db.db.query('SHOW TABLES;', function(err, response) {
    try {
      response.forEach(function(table) {
        table.table = table["Tables_in_production"];
      })
      res.send(response);
    } catch(e) {
      console.log(e);
      res.send(response);
    }
  });

});

router.post('/showTableSize', function(req, res, next) {
  db.db.query('SELECT COUNT(*) FROM ' + req.body.tableName, function(err, response) {
    if (err) {
      console.log(err);
      res.send('error!');
    } else {
      console.log(response);
      res.send(response);
    }
  })
});

router.get('/showAllKeywords', function(req, res, next) {
  db.db.query('SELECT * FROM keywords;', function(err, rows) {
    console.log(err, rows);

    res.send(rows);
  });
})

module.exports = router;
