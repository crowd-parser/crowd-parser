'use strict';

var express = require('express');
var router = express.Router();

var fs = require('fs');

var db = require('../database/database');

var stripe = require("stripe")("sk_live_CFGeujb4KYZXrHWeYZo8ZyK2");

// Handles errors and writes them to a file to review later
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

// Route for when a user purchases keywords
router.post('/purchase', function(req, res, next) {

  // Check to make sure user is authenticated with Facebook login
  if (req.body.fbToken !== req.session.fbToken) {
    
    console.log('Token does not match!');
    res.send('Token does not match!');
  } else {

    // Parameters for making a charge through Stripe
    var params = {
      id: null,
      fb_id: req.body.purchaseDetails.fb_id,
      name: req.body.purchaseDetails.name,
      email: req.body.purchaseDetails.email,
      number_of_keywords: req.body.purchaseDetails.number_of_keywords
    }

    // Customize the charge amount depending on how many keywords the user selects
    var chargeAmount;

    if (params.number_of_keywords === 1) {
      chargeAmount = 200;
    } else if (params.number_of_keywords === 5) {
      chargeAmount = 800;
    } else if (params.number_of_keywords === 10) {
      chargeAmount = 1500;
    }

    var stripeToken = req.body.stripeToken;

    // Creates the Stripe charge
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

            // Check if user already exists if the database. If so, keyword count will be increased for existing user.
            db.db.query('SELECT * FROM purchasing_users WHERE fb_id=' + params.fb_id, function(err, response) {

              if (err) {
                handleError(res. err, 'Error checking if user exists in database!');
              } else {

                if (response.length > 0) {

                  // If user already exists in the database, simply increase the keyword count based on the purchase
                  db.db.query('UPDATE purchasing_users SET number_of_keywords=number_of_keywords+' + params.number_of_keywords + ' WHERE purchasing_users.fb_id=' + params.fb_id, function(err, response) {

                    if (err) {

                      handleError(res, err, 'Error updating user keyword count!');
                    } else {

                      res.send('Successfully added more keywords!');
                    }
                  });
                } else {

                  // If user does not exist in the database, insert the user with the number of keywords purchased
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

// Checks if user is a purchasing user. Used for display purposes.
// If user has purchased, dashboard is shown instead
router.post('/checkIfPurchased', function(req, res) {

  var fb_id = req.body.fb_id;

  db.db.query('SELECT * FROM purchasing_users WHERE fb_id=' + fb_id, function(err, response) {
    
    res.send(response[0]);
  });
});

// Gets the user's keywords to be displayed on the dashboard
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

// Used when user purchases keyword. Function that processes user keyword is run externally
// because it takes some time for keywords to be processed and we want to be 
// able to return a quick response to the user after the keyword request
var addUserKeyword = {
  status: false,
  keyword: ''
};

// Route for when a user wants to add a keyword to the database
router.post('/userAddKeyword', function(req, res) {

  // Make sure user is authenticated
  if (req.body.fbToken !== req.session.fbToken) {
    
    console.log('Token does not match!');
    res.send('Token does not match!');
  } else {

    // Make sure proper information is sent
    if (!req.body.id || !req.body.keyword) {
      res.send('Error! Missing ID/keyword.');
    }

    // Get the current number of keywords the user has remaining
    db.db.query('SELECT number_of_keywords FROM purchasing_users WHERE id=' + req.body.id, function(err, response) {

      if (err) {

        handleError(res, err, 'Error getting user\'s number of keywords from database!');
      } else {
        
        // Check if the user has run out of keywords to add
        if (response[0].number_of_keywords <= 0) {
          res.send('Out of keywords! Please purchase more to add new keywords.');
        } else {

          // Add the keyword the user requests into the purchased_keywords table
          var params = {
            id: null,
            purchasing_user: req.body.id,
            purchased_keyword: req.body.keyword
          };

          db.db.query('INSERT INTO purchased_keywords SET ?', params, function(err, response) {

            if (err) {

              handleError(res, err, 'Error inserting keyword into database!');
            } else {

              // Update the number of keywords the user has remaining
              db.db.query('UPDATE purchasing_users SET number_of_keywords=number_of_keywords-1 WHERE purchasing_users.id=' + params.purchasing_user, function(err, response) {

                if (err) {

                  handleError(res, err, 'Error updating user keyword count!');
                } else {

                  // Modify the object that will cause the process keywords function to be called
                  addUserKeyword.status = true;
                  addUserKeyword.keyword = params.purchased_keyword;

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

// Checks every three seconds to see if a user has added a keyword
// If so, process the keyword, which will take some time
setInterval(function() {

  if (addUserKeyword.status) {

    var keyword = addUserKeyword.keyword;

    // Reset the object that handles processing keywords
    addUserKeyword.status = false;
    addUserKeyword.keyword = '';

    // Process the user-requested keyword across our database of tweets
    db.processAuthorizedUserKeyword(keyword, function(err, response) {

      if (err) {
        console.log(err);

        var errorMessage = new Date() + ' - ' + 'Error processing user keyword!' + ' - ' + err + '\n\n';

        fs.appendFile('./server/checkout/errors.txt', errorMessage, function(error) {
          if (error) {
            console.log(error);
            res.send('Error logging error!', error);
          } else {

            console.log('Error logged!');
          }
        });
      } else {

        console.log(response);
      }
    });
  }
}, 3000);

// Gets user keywords with their names to display on the 3D  and stats page
router.get('/getAllUserKeywordsWithNames', function(req, res) {

  db.db.query('SELECT purchasing_users.name, purchased_keywords.purchased_keyword FROM purchasing_users JOIN purchased_keywords ON purchasing_users.id=purchased_keywords.purchasing_user', function(err, response) {

    if (err) {
      handleError(res, err, 'Error getting keywords with user names!');
    } else {

      res.send(response);
    }

  });
});

// Saves the user's Facebook login authentication token for security
router.post('/saveToken', function(req, res) {

  req.session.fbToken = req.body.fbToken;

  res.send('Access token saved!');
});

module.exports = router;
