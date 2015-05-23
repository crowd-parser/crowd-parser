'use strict';

var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  console.log('login');
  res.send('login!');
});

module.exports = router;