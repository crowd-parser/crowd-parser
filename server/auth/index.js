'use strict';

var express = require('express');
var router = express.Router();

router.use('/login', require('./login'));
router.use('/adminlogin', require('./adminlogin'));

module.exports = router;