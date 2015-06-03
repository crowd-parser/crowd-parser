'use strict';

var express = require('express');
var router = express.Router();

router.use('/adminlogin', require('./adminlogin'));
router.use('/checkAuth', require('./checkAuth'));

module.exports = router;