'use strict';

var express = require('express');
var router = express.Router();

var db = require('../database/database');

router.get('/getTweetsCount', function(req, res) {

  db.currDB = 'production';

  db.changeToDatabase('production', function(err, response) {

    db.db.query('SELECT id FROM tweets ORDER BY id DESC LIMIT 1;', function(err, response) {

      res.send(response);
    });
  });
});

router.get('/getKeywordCount/:id', function(req, res) {

  var tableName = req.params.id;

  db.currDB = 'production';

  db.changeToDatabase('production', function(err, response) {

    db.db.query('SELECT id FROM tweets_containing_' + tableName + ' ORDER BY id DESC LIMIT 1;', function(err, response) {

      res.send(response);
    });
  });
});

router.get('/getTotalPositiveSentiment', function(req, res) {

  var tableName = req.params.id;

  db.currDB = 'production';

  db.changeToDatabase('production', function(err, response) {

    db.db.query('SELECT COUNT(*) FROM layer_Base WHERE score>0', function(err, response) {

      res.send(response);
    });
  });
});

router.get('/getTotalNegativeSentiment', function(req, res) {

  var tableName = req.params.id;

  db.currDB = 'production';

  db.changeToDatabase('production', function(err, response) {

    db.db.query('SELECT COUNT(*) FROM layer_Base WHERE score<0', function(err, response) {

      res.send(response);
    });
  });
});

router.get('/getKeywordPositiveSentiment/:id', function(req, res) {

  var tableName = req.params.id;

  db.currDB = 'production';

  db.changeToDatabase('production', function(err, response) {

    db.db.query('SELECT COUNT(*) FROM layer_Base, tweets_containing_' + tableName + ' WHERE tweets_containing_' + tableName + '.tweet_id=layer_Base.tweet_id AND layer_Base.score>0', function(err, response) {

      res.send(response);
    });
  });
});

router.get('/getKeywordNegativeSentiment/:id', function(req, res) {

  var tableName = req.params.id;

    db.currDB = 'production';

    db.changeToDatabase('production', function(err, response) {

      db.db.query('SELECT COUNT(*) FROM layer_Base, tweets_containing_' + tableName + ' WHERE tweets_containing_' + tableName + '.tweet_id=layer_Base.tweet_id AND layer_Base.score<0', function(err, response) {

        res.send(response);
      });
    });
});

module.exports = router;
