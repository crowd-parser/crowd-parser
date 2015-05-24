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


  bcrypt.hash(req.body.password, null, null, function(err, hash) {
    console.log(hash);
    db.addAdmin({username: req.body.username, password: hash}, function(err) {
      console.log(err, 'test');
    })
    
  })

});

module.exports = router;
