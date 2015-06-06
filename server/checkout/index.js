'use strict';

var express = require('express');
var router = express.Router();

// Set your secret key: remember to change this to your live secret key in production
// See your keys here https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")("pk_live_x1auH0us8kSI1LvxZ1jcZGc6");

router.post('/purchase', function(req, res, next) {

  // (Assuming you're using express - expressjs.com)
  // Get the credit card details submitted by the form
  var stripeToken = req.body.stripeToken;

  var charge = stripe.charges.create({
    amount: 1, // amount in cents, again
    currency: "usd",
    source: stripeToken,
    description: "Example charge"
  }, function(err, charge) {
    if (err && err.type === 'StripeCardError') {
      // The card has been declined
      res.send('Error: The card has been declined' + err);
    } else {
      res.send('Success!' + charge);
    }
  });
});

module.exports = router;
