'use strict';

var express = require('express');
var router = express.Router();

// Set your secret key: remember to change this to your live secret key in production
// See your keys here https://dashboard.stripe.com/account/apikeys
var stripe = require("stripe")("sk_test_nZOqLgj1GjSsAeNNfshNlpdH");

// stripe.charges.create({
//   amount: 400,
//   currency: "usd",
//   source: "tok_16AXvrKoVAhSUuNESs5Cf6pd", // obtained with Stripe.js
//   description: "Charge for test@example.com"
// }, function(err, charge) {
//   // asynchronously called
//   console.log(err, charge)
// });

router.post('/purchase', function(req, res, next) {

  // (Assuming you're using express - expressjs.com)
  // Get the credit card details submitted by the form
  var stripeToken = req.body.stripeToken;
console.log(stripeToken)
  var charge = stripe.charges.create({
    amount: 50, // amount in cents, again
    currency: "usd",
    source: stripeToken,
    description: "Example charge"
  }, function(err, charge) {
    if (err && err.type === 'StripeCardError') {
      // The card has been declined
      res.send('Error: The card has been declined' + err);
    } else {
      console.log(err, charge);
      res.send('Success!' + charge);
    }
  });
});

module.exports = router;
