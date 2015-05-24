'use strict';

var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var db = require('../../database/database');

// db.db.query('USE production');
// db.db.query("INSERT INTO admin VALUES('aaa', 'bbb', null);", function(err, rows) {
//   console.log(err, rows);
// });

router.post('/', function(req, res, next) {
  console.log(req.body);
  // db.db.query('USE production');
  // db.db.query('INSERT INTO admin VALUES("' + req.body.username + '", "' + req.body.password + '", null);', function(err, results) {
  //   console.log(err, rows);
  //   res.send('success!');
  // });
  db.db.query('USE production');
  db.db.query("INSERT INTO admin VALUES('aaa', 'bbb', null);", function(err, rows) {
    console.log(err, rows);
    res.send('success!')
  });
  console.log('after db')
});

module.exports = router;
