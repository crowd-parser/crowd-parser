var expect = require('chai').expect;

var db = require('./database');

describe('DATABASE INITIALIZATION', function() {

  it('should talk to dev database on initialization', function(done) {

    expect(db.databaseToTalkTo).to.equal('dev');
    done();
  });
});

describe('MACRO FUNCTIONS - SEARCHING AND FILTERING TWEETS BY KEYWORDS AND LAYERS', function() {

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

describe('MANAGING LAYERS', function() {

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

describe('MANAGING KEYWORDS', function() {

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

describe('MANAGING TABLES', function() {

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


describe('MANAGING DATABASES', function() {

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

describe('CALLING DATABASE FUNCTIONS', function() {

  it('should create a database correctly', function(done) {
    
    db.deleteDatabase('randomcreateddatabase', function(err, response) {

      db.createDatabase('randomcreateddatabase', function(err, response) {
        
        expect(err).to.equal(null);
        expect(response.warningCount).to.equal(0);
        done();
      });
    });
  });

  it('should change to a database correctly', function(done) {

    db.changeToDatabase('dev', function(err, response) {
      
      expect(err).to.equal(null);
      done();
    });
  });

  it('should error when changed to a non-existent database', function(done) {

    db.changeToDatabase('idontexist', function(err, response) {

      expect(response).to.equal(undefined);
      done();
    })
  });
});

describe('CALLING TABLE FUNCTIONS', function() {

  it('should create a table with a schema based on the passed in object', function(done) {

    db.changeToDatabase('randomcreateddatabase');

    db.genericDropTable('randomcreatedtable', function(err, response) {
      
      db.genericCreateTable('randomcreatedtable', {testProp1: 'Property 1', testProp2: 'Property 2'}, function(err, response) {

        // db.genericAddToTable('randomcreatedtable', [{testProp1: 'add an item', testProp2: 'add a second item'}], function(err, rows, fields) {

        //   console.log(err, rows, fields);
        //   done();
        // });

        db.genericDescribeTable('randomcreatedtable', function(err, rows, fields) {
          expect(rows[0].Field).to.equal('id');
          expect(rows[1].Field).to.equal('testProp1');
          expect(rows[2].Field).to.equal('testProp2');
          done();
        })
      });
    });
  });

  it('should create a table with a schema only one level deep when given an example object with nested objects', function(done) {

    db.changeToDatabase('randomcreateddatabase');

    db.genericDropTable('randomcreatedtablerecursed', function(err, response) {
      
      db.genericCreateTable('randomcreatedtablerecursed', {testProp1: 'Property 1', testProp2: {testProp3: 'Property 3', testProp4: {testProp5: 'testProp5'}}}, function(err, response) {

        db.genericDescribeTable('randomcreatedtablerecursed', function(err, rows, fields) {
          
          expect(rows[0].Field).to.equal('id');
          expect(rows[1].Field).to.equal('testProp1');
          expect(rows[2].Field).to.equal('testProp2_testProp3');
          expect(rows[3].Field).to.equal('testProp2_testProp4_testProp5');
          done();
        })
      });
    });
  });

  xit('should add an object to a table correctly', function(done) {

    db.changeToDatabase('randomcreateddatabase');

    db.genericDropTable('randomcreatedtable', function(err, response) {
      
      db.genericCreateTable('randomcreatedtable', {testProp1: 'Property 1', testProp2: 'Property 2'}, function(err, response) {

        // db.genericAddToTable('randomcreatedtable', [{testProp1: 'add an item', testProp2: 'add a second item'}], function(err, rows, fields) {

        //   console.log(err, rows, fields);
        //   done();
        // });
      });
    });
  });
});