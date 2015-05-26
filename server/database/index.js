'use strict';

var express = require('express');
var router = express.Router();

router.get('/getTweetsForKeyword', function(req, res, next) {

  res.send('tweets');
});

module.exports = router;
