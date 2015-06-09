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

var handleError = function(res, err, message) {

  console.log(message, err);

  var errorMessage = new Date() + ' - ' + message + ' - ' + err + '\n\n';

  fs.appendFile('./server/checkout/errors.txt', errorMessage, function(error) {
    if (error) {
      console.log(error);
      res.send('Error logging error!', error);
    } else {

      console.log('Error logged!');
      res.send(message, err);
    }
  });
};

router.post('/purchase', function(req, res, next) {

  if (req.body.fbToken !== req.session.fbToken) {
    
    console.log('Token does not match!');
    res.send('Token does not match!');
  } else {

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

        handleError(res, err, 'Stripe error!');
      } else {
        console.log('User charged!');

        db.db.query('USE production', function(err, response) {

          if (err) {

            handleError(res, err, 'Error switching to database!');
          } else {

            db.db.query('SELECT * FROM purchasing_users WHERE fb_id=' + params.fb_id, function(err, response) {

              if (err) {
                handleError(res. err, 'Error checking if user exists in database!');
              } else {

                if (response.length > 0) {

                  db.db.query('UPDATE purchasing_users SET number_of_keywords=number_of_keywords+' + params.number_of_keywords + ' WHERE purchasing_users.fb_id=' + params.fb_id, function(err, response) {

                    if (err) {

                      handleError(res, err, 'Error updating user keyword count!');
                    } else {

                      res.send('Successfully added more keywords!');
                    }
                  });
                } else {

                  db.db.query('INSERT INTO purchasing_users SET ?', params, function(err, response) {

                    if (err) {
                      
                      handleError(res, err, 'Error inserting user!');
                    } else {
                      
                      console.log('User inserted into database!', response);
                      res.send('Stripe success!', charge);
                    }
                  });
                }
              }
            });
          }
        });
      }
    });
  }
});

router.post('/checkIfPurchased', function(req, res) {

  var fb_id = req.body.fb_id;

  db.db.query('SELECT * FROM purchasing_users WHERE fb_id=' + fb_id, function(err, response) {
    
    res.send(response[0]);
  });
});

router.get('/getUserKeywords/:id', function(req, res) {

  var id = req.params.id;

  db.db.query('SELECT purchased_keyword, finished_processing FROM purchased_keywords WHERE purchasing_user=' + id, function(err, response) {
    
    if (err) {

      handleError(res, err, 'Error getting user keywords!');
    } else {

      res.send(response);
    }
  });
});

var keywordAdded = false;

router.post('/userAddKeyword', function(req, res) {

  if (req.body.fbToken !== req.session.fbToken) {
    
    console.log('Token does not match!');
    res.send('Token does not match!');
  } else {

    if (!req.body.id || !req.body.keyword) {
      res.send('Error! Missing ID/keyword.');
    }

    db.db.query('SELECT number_of_keywords FROM purchasing_users WHERE id=' + req.body.id, function(err, response) {

      if (err) {

        handleError(res, err, 'Error getting user\'s number of keywords from database!');
      } else {
        console.log(response);
        if (response[0].number_of_keywords <= 0) {
          res.send('Out of keywords! Please purchase more to add new keywords.');
        } else {

          var params = {
            id: null,
            purchasing_user: req.body.id,
            purchased_keyword: req.body.keyword
          };

          db.db.query('INSERT INTO purchased_keywords SET ?', params, function(err, response) {

            if (err) {

              handleError(res, err, 'Error inserting keyword into database!');
            } else {

              db.db.query('UPDATE purchasing_users SET number_of_keywords=number_of_keywords-1 WHERE purchasing_users.id=' + params.purchasing_user, function(err, response) {

                if (err) {

                  handleError(res, err, 'Error updating user keyword count!');
                } else {

                  res.send('Successfully added user keyword!');
                }
              });
            }
          });
        }
      }
    });
  }
});

router.get('/getAllUserKeywordsWithNames', function(req, res) {

  db.db.query('SELECT purchasing_users.name, purchased_keywords.purchased_keyword FROM purchasing_users JOIN purchased_keywords ON purchasing_users.id=purchased_keywords.purchasing_user', function(err, response) {

    if (err) {
      handleError(res, err, 'Error getting keywords with user names!');
    } else {

      res.send(response);
    }

  });
});

router.post('/saveToken', function(req, res) {

  req.session.fbToken = req.body.fbToken;

  res.send('Access token saved!');
});

module.exports = router;
