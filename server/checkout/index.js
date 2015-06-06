'use strict';

var express = require('express');
var router = express.Router();

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


  var stripeToken = req.body.stripeToken;

  var charge = stripe.charges.create({
    amount: 50, // amount in cents, again
    currency: "usd",
    source: stripeToken,
    description: params.number_of_keywords + ' keywords purchased' 
  }, function(err, charge) {
    if (err) {
      console.log(err);
      res.send('Stripe error!', err);
    } else {
      console.log(charge);

      db.db.query('USE production', function(err, response) {

        if (err) {

          console.log(err);
          res.send('Error switching to database!', err)
        } else {
          
          db.db.query('INSERT INTO purchasing_users SET ?', params, function(err, response) {

            if (err) {
              console.log(err);
              res.send('Error inserting information!', err);
            } else {
              
              console.log(response);
              res.send('Success!', charge);
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

module.exports = router;
