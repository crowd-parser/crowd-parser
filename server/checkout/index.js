'use strict';

var express = require('express');
var router = express.Router();

var fs = require('fs');

var db = require('../database/database');

// var params = {
//   id: null,
//   fb_id: '298792385',
//   name: 'Michael Cheng',
//   email: 'test@test.com',
//   number_of_keywords: 5
// };

// var params2 = {
//   id: null,
//   purchasing_user: 1,
//   purchased_keyword: 'lebron'
// }

// db.db.query('USE production', function(err, response) {

//   db.db.query('INSERT INTO purchased_keywords SET ?', params2, function(err, response) {
//     console.log(err,response);
//   });
// });


// Set your secret key: remember to change this to your live secret key in production
// See your keys here https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")("sk_test_nZOqLgj1GjSsAeNNfshNlpdH");

router.post('/purchase', function(req, res, next) {

  var params = {
    id: null,
    fb_id: req.body.purchaseDetails.fb_id,
    name: req.body.purchaseDetails.name,
    email: req.body.purchaseDetails.email,
    number_of_keywords: req.body.purchaseDetails.number_of_keywords
  }

  var chargeAmount;

  if (params.number_of_keywords === 1) {
    chargeAmount = 200;
  } else if (params.number_of_keywords === 5) {
    chargeAmount = 800;
  } else if (params.number_of_keywords === 10) {
    chargeAmount = 1500;
  }

  var stripeToken = req.body.stripeToken;

  var charge = stripe.charges.create({
    amount: chargeAmount, // amount in cents, again
    currency: "usd",
    source: stripeToken,
    description: params.number_of_keywords + ' keywords purchased' 
  }, function(err, charge) {
    if (err) {
      console.log('Stripe error!', err);

      var errorMessage = new Date() + ' - ' + 'Stripe error! - ' + err + '\n\n';

      fs.appendFile('errors.txt', errorMessage, function(err) {
        if (err) {
          console.log(err);
        } else {

          res.send('Stripe error!', err);
        }
      });
    } else {
      console.log('User charged!', charge);

      db.db.query('USE production', function(err, response) {

        if (err) {

          console.log('Error switching database!', err);

          var errorMessage = new Date() + ' - ' + 'Error switching database! - ' + err + '\n\n';

          fs.appendFile('errors.txt', errorMessage, function(err) {
            if (err) {
              console.log(err);
            } else {

              res.send('Error switching to database!', err)
            }
          });
        } else {
          
          db.db.query('INSERT INTO purchasing_users SET ?', params, function(err, response) {

            if (err) {
              console.log('Error inserting into database!', err);

              var errorMessage = new Date() + ' - ' + 'Error inserting into database! - ' + err + '\n\n';

              fs.appendFile('errors.txt', errorMessage, function(err) {
                if (err) {
                  console.log(err);
                } else {

                  res.send('Error inserting information!', err);
                }
              });

            } else {
              
              console.log('User inserted into database!', response);
              res.send('Stripe success!', charge);
            }
          });
        }
      });
    }
  });
});

router.post('/checkIfPurchased', function(req, res) {

  var fb_id = req.body.fb_id;

  db.db.query('SELECT * FROM purchasing_users WHERE fb_id=' + fb_id, function(err, response) {
    
    res.send(response[0]);
  });
});

router.get('/getUserKeywords/:id', function(req, res) {

  var id = req.params.id;

  db.db.query('SELECT purchased_keyword FROM purchased_keywords WHERE purchasing_user=' + id, function(err, response) {
    
    console.log(err, response);
    res.send(response);
  });
});

router.post('/userAddKeyword', function(req, res) {

  var params = {
    id: null,
    purchasing_user: req.body.id,
    purchased_keyword: req.body.keyword
  };

  db.db.query('INSERT INTO purchased_keywords SET ?', params, function(err, response) {

    console.log('INSERT', err, response);

    db.db.query('UPDATE purchasing_users SET number_of_keywords=number_of_keywords-1 WHERE purchasing_users.id=' + params.purchasing_user, function(err, response) {

      console.log('UPDATE', err, response);
      res.send('successfully added keyword!');
    });

  });
});

router.get('/getAllUserKeywordsWithNames', function(req, res) {

  db.db.query('SELECT purchasing_users.name, purchased_keywords.purchased_keyword FROM purchasing_users JOIN purchased_keywords ON purchasing_users.id=purchased_keywords.purchasing_user', function(err, response) {

    console.log(err, response);
  });
});

module.exports = router;
