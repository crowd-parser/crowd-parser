'use strict';

var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt-nodejs');
var db = require('../../database/database');
var jwt = require('jwt-simple');
var secret = require('./adminloginsecret');

// db.db.query('USE production');
// db.db.query("INSERT INTO admin VALUES('aaa', 'bbb', null);", function(err, rows) {
//   console.log(err, rows);
// });

    // db.db.query('USE production');
    // db.db.query("SELECT * FROM admin WHERE username='crowdParserAdmin';", function(err, rows) {
    //   console.log(err, rows);
    //   bcrypt.compare('CrowdAdmin1*', rows[0].password, function(err, res) {
    //     console.log(err, res);
    //   })
    // });


router.post('/', function(req, res, next) {
  // db.db.query('USE production');
  // db.db.query('INSERT INTO admin VALUES("' + req.body.username + '", "' + req.body.password + '", null);', function(err, results) {
  //   console.log(err, rows);
  //   res.send('success!');
  // });

  // db.db.query('USE production');
  // db.db.query("INSERT INTO admin VALUES('crowdParserAdmin', 'bbb', null);", function(err, rows) {
  //   console.log(err, rows);
  //   res.send('success!')
  // });
  // console.log('after db')

  db.db.query('USE production');
  db.db.query("SELECT * FROM admin WHERE username='" + req.body.username + "';", function(err, rows) {
    console.log(rows);
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
    // bcrypt.compare(req.body.password, rows[0].password, function(err, res) {
    //   console.log(err, res);
    // })
  });
});

module.exports = router;
