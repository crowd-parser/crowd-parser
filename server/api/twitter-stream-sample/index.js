'use strict';

var express = require('express');
var controller = require('./twitter-stream-sample.controller');

var router = express.Router();

router.get('/:id', controller.index);

module.exports = router;