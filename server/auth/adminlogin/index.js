'use strict';

var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var db = require('../../database/database');

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