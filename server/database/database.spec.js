var expect = require('chai').expect;

var db = require('./database');

before(function(done) {

  this.timeout(10000);

  db.genericDropDatabase('randomcreateddatabase', function(err, response) {
  
    db.createDatabase('randomcreateddatabase', function(err, response) {

      db.currDB = 'dev';
      done();
    });
  });
});

describe('=== DATABASE INITIALIZATION===', function() {

  it('should talk to dev database on initialization', function(done) {

    expect(db.currDB).to.equal('dev');
    done();
  });
});

describe('=== MACRO FUNCTIONS - SEARCHING AND FILTERING TWEETS BY KEYWORDS AND LAYERS ===', function() {

  it('should have a **getAllTweets** function that gets all million tweets', function(done) {

    expect(db.getAllTweets).to.be.a.function;
    done();
  });

  it('should have a **searchForTweetsWithKeyword** function that returns all tweets that contain a given keyword', function(done) {

    expect(db.searchForTweetsWithKeyword).to.be.a.function;
    done();
  });

  it('should have a **filterTweetsFromIdByKeyword** function that inserts tweets containing given keyword that have IDs greater than given ID into the appropriate keyword table', function(done) {

    expect(db.filterTweetsFromIdByKeyword).to.be.a.function;
    done();
  });

  it('should have a **filterTweetObjectsForLayer** function that runs a layer function and inserts the resulting object into the appropriate layer table', function(done) {

    expect(db.filterTweetObjectsForLayer).to.be.a.function;
    done();
  }); 

  it('should have a **executeFullChainForIncomingTweets** function that 1) inserts new tweets into the "tweets" table, 2) checks for keywords in tweets and if found inserts tweet into appropriate keyword table, 3) runs each layer function on the tweet and inserts results object into appropriate layer table, and 4) implements cachine for speed optimization', function(done) {

    expect(db.executeFullChainForIncomingTweets).to.be.a.function;
    done();
  });
});


  it('should have a **layer_Base_Function** function that is imported from the baseWordsLayerAnalysis.js file', function(done) {

    expect(db.layer_Base_Function).to.be.a.function;
    done();
  });

describe('=== MANAGING LAYERS ===', function() {

  it('should have a **layer_Emoticons_Function** function that is imported from the baseEmoticonLayerAnalysis.js file', function(done) {

    expect(db.layer_Emoticons_Function).to.be.a.function;
    done();
  });

  it('should have a **getLayerNames** function retrieves a list of all layer names', function(done) {

    expect(db.getLayerNames).to.be.a.function;
    done();
  });

  it('should have a addNewLayer function that adds the layer to the layers table and runs the layer function on all tweets and adds them to the appropriate layer table with the appropriate foreign key to the analyzed tweet', function(done) {

    expect(db.addNewLayer).to.be.a.function;
    done();
  });

  it('should have a redoLayer function that drops the layer table and re-runs the layer function on all tweets, for when a layer is changed/updated', function(done) {

    expect(db.redoLayer).to.be.a.function;
    done();
  });

  it('should have a deleteLayer function that deletes a layer table', function(done) {

    expect(db.deleteLayer).to.be.a.function;
    done();
  });
});

describe('=== MANAGING KEYWORDS ===', function() {

  it('should have a addNewKeyword function that adds the keyword to the keywords table and searches for all tweets containing that keyword, adding them to the appropriate keyword table with a foreign key pointing to the appropriate tweet in the "tweets" table', function(done) {

    expect(db.addNewKeyword).to.be.a.function;
    done();
  });

  it('should have a redoKeyword function that drops the keyword table and runs the addNewKeyword function again, to update/refresh the table', function(done) { 

    expect(db.redoKeyword).to.be.a.function;
    done();
  });

  it('should have a deleteKeyword function that deletes a keyword table', function(done) {

    expect(db.deleteKeyword).to.be.a.function;
    done();
  });

  it('should have a getKeywordNames function that retrieves the list of all keywords stored', function(done) {

    expect(db.getKeywordNames).to.be.a.function;
    done();
  });
});

describe('=== MANAGING TABLES ===', function() {

  it('should have a genericGetAll function that retrieves all rows from a given table', function(done) {

    expect(db.genericGetAll).to.be.a.function;
    done();
  });

  it('should have a genericGetTableColumnNames function that returns a list of all column names in that table', function(done) {

    expect(db.genericGetTableColumnNames).to.be.a.function;
    done();
  });

  it('should have a genericGetItemsWithTextColumnContaining that returns all items/tweets that contain the given string', function(done) {

    expect(db.genericGetItemsWithTextColumnContaining).to.be.a.function;
    done();
  });

  it('should have an addForeignKey function that adds a foreign key between columns in two different tables', function(done) {

    expect(db.addForeignKey).to.be.a.function;
    done();
  });

  it('should have a setColumnToUnique function that adds a unique column to a table', function(done) {

    expect(db.setColumnToUnique).to.be.a.function;
    done();
  });

  it('should have a genericCreateTable function that creates a table that automatically generates a schema based on the passed in example object', function(done) {

    expect(db.genericCreateTable).to.be.a.function;
    done();
  });

  it('should have a rearchitectArrWithDeepObjects function that causes all deep objects/arrays in the example object to end up on the first level of the table schema', function(done) {

    expect(db.rearchitectArrWithDeepObjects).to.be.a.function;
    done();
  });

  it('should have an asyncMap function that runs an array of asynchronous functions in the proper order', function(done) {

    expect(db.asyncMap).to.be.a.function;
    done();
  });

  it('should have a genericAddToTable function that adds an array of objects to a chosen table', function(done) {

    expect(db.genericAddToTable).to.be.a.function;
    done();
  });

  it('should have a doAddingMessage function that estimates how much more time it will take to finish adding objects to a table', function(done) {

    expect(db.doAddingMessage).to.be.a.function;
    done();
  });

  it('should have a genericDropTable function that drops the given table', function(done) {

    expect(db.genericDropTable).to.be.a.function;
    done();
  });

  it('should have a genericDescribeTable function', function(done) {

    expect(db.genericDescribeTable).to.be.a.function;
    done();
  });
});


describe('=== MANAGING DATABASES ===', function() {

  it('should have a createDatabase function that creates a new database', function(done) {

    expect(db.createDatabase).to.be.a.function;
    done();
  });

  it('should have a changeToDatabase function that switches to the chosen database', function(done) {

    expect(db.changeToDatabase).to.be.a.function;
    done();
  });

  it('should have a deleteDatabase/genericDropDatabase function that deletes the chosen database', function(done) {

    expect(db.deleteDatabase).to.be.a.function;
    expect(db.genericDropDatabase).to.be.a.function;
    done();
  });
});

describe('=== ADMIN PANEL FUNCTIONS ===', function() {

  // Just for safety, change back to 'dev' database at the end of each test
  // Probably not necessary, just being paranoid
  afterEach(function(done) {
    this.timeout(6000);

    db.currDB = 'dev';
    db.changeToDatabase(db.currDB, function(err, response) {

      done();
    });
  });

  it('should return tables with columns', function(done) {

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.returnTablesWithColumns(function(err, tables) {
        var keywords = false;
        var layers = false;
        var tweets = false;

        tables.forEach(function(item) {
          if (item[0] === 'keywords') {
            keywords = true;
          }
          if (item[0] === 'layers') {
            layers = true;
          }
          if (item[0] === 'tweets') {
            tweets = true;
          }
        })
        expect(keywords).to.equal(true);
        expect(layers).to.equal(true);
        expect(tweets).to.equal(true);
        done();
      });
    });
  });
});

describe('=== GETTING INFORMATION FUNCTIONS ===', function() {

  it('should get the current database name', function(done) {

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.getCurrentDatabaseName(function(currentDB) {
        expect(currentDB).to.equal('randomcreateddatabase');
        done();
      });
    });
  });

  it('should describe a table', function(done) {

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.genericDescribeTable('keywords', function(err, rows) {

        expect(rows[0].Field).to.equal('id');
        expect(rows[1].Field).to.equal('tableName');
        expect(rows[2].Field).to.equal('keyword');
        expect(rows[3].Field).to.equal('lastHighestIndexed');
        done();
      });
    });
  });
});

describe('=== KEYWORDS FUNCTIONS ===', function() {

  it('should add new keywords to the keywords table', function(done) {

    this.timeout(10000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.deleteKeyword('zztestKeyword', function(err, rows) {

        db.addNewKeyword('zztestKeyword', function(err, rows) {

          db.db.query('SELECT * FROM keywords WHERE keyword="zztestKeyword"', function(err, rows) {
            expect(rows[0].keyword).to.equal('zztestKeyword');
            done();
          })
        });
      });
    });
  });

  it('should create a new keyword table', function(done) {

    this.timeout(6000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.deleteKeyword('zztestKeyword', function(err, rows) {

        db.addNewKeyword('zztestKeyword', function(err, rows) {

          db.db.query('SHOW TABLES;', function(err, rows) {

            var contains = false;
            rows.forEach(function(item) {
              if (item["Tables_in_randomcreateddatabase"] === 'tweets_containing_zztestKeyword') {
                contains = true;
              }
            });
            expect(contains).to.equal(true);
            done();
          })
        });
      });
    });
  });

  it('should delete a keyword table', function(done) {

    this.timeout(10000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.addNewKeyword('zzztestKeyword', function(err, response) {

        db.deleteKeyword('zzztestKeyword', function(err, response) {

          db.db.query('SHOW TABLES;', function(err, rows) {

            var contains = false;
            rows.forEach(function(item) {
              if (item["Tables_in_randomcreateddatabase"] === 'tweets_containing_zzztestKeyword') {
                contains = true;
              }
            });
            expect(contains).to.equal(false);
            done();
          });
        });
      });

    });
  });

  it('should redo a keyword table, filtering all tweets again', function(done) {

    this.timeout(10000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.genericAddToTable('tweets', db.testTweet1, function(err, response) {

        db.redoKeyword('obama', function(){}, function(err, response) {

          db.db.query('SELECT * FROM tweets_containing_obama', function(err, rows) {
  console.log('TEST ***', rows);
            expect(rows.length).to.equal(1);

            db.deleteKeyword('obama', function(err, response) {

              done();
            });
          });
        });
      });
    });
  });
});

describe('=== LAYERS FUNCTIONS ===', function() {
  
  it('should add a new layer', function(done) {

    this.timeout(10000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.deleteLayer('Base', function(err, response) {

        db.addNewLayer('Base', function(err, response) {

          db.db.query('SHOW TABLES', function(err, response) {

            var contains = false;

            response.forEach(function(item) {
              if (item["Tables_in_randomcreateddatabase"] === 'layer_Base') {
                contains = true;
              }
            });
            
            expect(contains).to.equal(true);
            done();
          });
        });
      });
    });
  });

  it('should delete a layer', function(done) {

    this.timeout(10000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.deleteLayer('Base', function(err, response) {

        db.db.query('SHOW TABLES', function(err, response) {

          var contains = false;

          response.forEach(function(item) {
            if (item["Tables_in_randomcreateddatabase"] === 'layer_Base') {
              contains = true;
            }
          });
          
          expect(contains).to.equal(false);
          done();
        });
      });
    });
  });
});

describe('=== FULL PIPELINE FUNCTION ===', function() {

  it('should add the five test tweets and do everything', function(done) {

    this.timeout(20000);

    db.currDB = 'randomcreateddatabase';

    db.changeToDatabase(db.currDB, function(err, response) {

      db.db.query('DELETE FROM tweets WHERE id > 0 LIMIT 5', function(err, response) {

        db.addNewKeyword('obama', function(err, response) {

          db.addNewLayer('Base', function(err, response) {

            db.ADDTHEFIVETESTTWEETS(function(err, response) {

              setTimeout(function() {

                db.db.query('SELECT * FROM tweets', function(err, rows) {

                  expect(rows.length).to.equal(5);

                  db.db.query('SELECT * FROM tweets_containing_obama', function(err, response) {

                    expect(response.length).to.equal(1);
                    
                    db.db.query('SELECT COUNT(*) FROM layer_Base', function(err, response) {

                      expect(response[0]["COUNT(*)"]).to.equal(5);
                      
                      db.deleteKeyword('obama', function(err, response) {

                        db.deleteLayer('Base', function(err, response) {

                          done();
                        });
                      });
                    });
                  });
                });
              }, 4000);
            });
          });
        });
      });
    });
  });
});