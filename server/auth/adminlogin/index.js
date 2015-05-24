'use strict';

var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var db = require('../../database/database');

db.tellMeWhenDatabaseIsLive(function() {
  console.log('EOIWJ:LDKFJ')
  db.genericCreateTable('admin', {username: 'name', password: 'password'}, function(err, res) {
    console.log('TESTSETESTES')
    console.log(err, res);
  });
});

router.post('/', function(req, res, next) {
  db.addAdmin({username: req.body.username, password: req.body.password}, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('success!');
      res.send('success.');
    }
  })
});

module.exports = router;
