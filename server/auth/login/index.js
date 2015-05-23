'use strict';

var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var db = require('../../database/database');

router.post('/', function(req, res, next) {
  
  // db.addUser({username: req.body.username, password: req.body.password}, function(err, res) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log('user added!')
  //   }
  // })
  
  bcrypt.hash(req.body.password, null, null, function(err, hash) {
    console.log(hash);
  })

  res.send('login!');
});

module.exports = router;