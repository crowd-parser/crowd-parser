'use strict';

var express = require('express');
var router = express.Router();

var db = require('../database/database');

router.get('/getTweetsCount', function(req, res, next) {

  
  db.currDB = 'production';

  db.changeToDatabase('production', function(err, response) {

    db.db.query('select id from tweets order by id desc limit 1;', function(err, response) {

      res.send(response);
    });
  });
});

module.exports = router;
