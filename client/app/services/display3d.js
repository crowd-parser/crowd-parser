'use strict';

angular.module('parserApp.display3dService', [])

.factory('Display3d', function ($document) {

  // TODO
  // - set pan limits
  // - turn unscored tweets transparent when flattening layers
  // - do something about layer titles overlapping when flattening layers
  // - make text go away when zoomed out past a certain distance
  // - show more info when zoomed in closer than a certain distance?
  // - buttons next to each layer name - remove, solo, move fwd, move back

  var document = $document[0];

  var scene, camera, renderer, controls, prevCameraPosition;

  var keepAddingTweets = true;
  var layers = [];
  var layerSpacing = 300;

  // left and right mouse hover buttons
  var leftHover = false;
  var rightHover = false;
  var scrollSpeed = 15;
  var tick = 0;

  var animate = function() {
    requestAnimationFrame( animate );
    tick++;

    // check if camera has moved
    if (!camera.position.equals(prevCameraPosition)) {
      // if so, adjust ribbon width so you don't see the left/right ends of the ribbon
      layers.forEach(function(layer) {
        var newRibbonWidth = Math.abs(camera.position.z) * 5;
        layer.ribbonEl.style.width = newRibbonWidth + 'px';
        layer.ribbonEl.children[0].style.left = (newRibbonWidth/2 - 1000) + 'px';
      });
    }

    prevCameraPosition.copy(camera.position);


    // every 60 ticks add a tweet
    // if (tick >= 30 && keepAddingTweets) {
    //   tick = 0;
    //   var newTweetIndex = layers[0].tweets.length;
    //   var x = newTweetIndex;
    //   if (x > 23) {
    //     x = x % 23;
    //   }
    //   for (var j = 0; j < layers.length; j++) {
    //     addTweet(tweetData[x], layers[j], newTweetIndex);
    //   }
    // }

    if (leftHover) {
      camera.position.x -= scrollSpeed;
      controls.target.x -= scrollSpeed;
      for (var i = 0; i < layers.length; i++) {
        layers[i].ribbonObj.position.x -= scrollSpeed;
      }
    }
    if (rightHover) {
      camera.position.x += scrollSpeed;
      controls.target.x += scrollSpeed;
      for (var i = 0; i < layers.length; i++) {
        layers[i].ribbonObj.position.x += scrollSpeed;
      }
    }
    TWEEN.update();
    controls.update();
    render();
  };

  var render = function() {
    renderer.render( scene, camera );
  };

  var addTweet = function(rawTweet, index) {

    var rows = 4;
    var ySpacing = 200;
    var yStart = 300;
    var xSpacing = 320;
    var xStart = -800;

    layers.forEach(function(layerObj) {

      var tweet = document.createElement( 'div' );
      tweet.className = 'tweet-3d';
      var normalizedScore = rawTweet[layerObj.resultsName].score;
      var bgRGBA;
      if (normalizedScore < -5) {
        normalizedScore = -5;
      }
      if (normalizedScore > 5) {
        normalizedScore = 5;
      }
      if (normalizedScore < 0) {
        bgRGBA = '225,0,0,' + (0.25 - normalizedScore/10);
      }
      if (normalizedScore > 0) {
        bgRGBA = '0,180,225,' + (0.25 + normalizedScore/10);
      }
      if (normalizedScore === 0) {
        bgRGBA = '225,225,225,0.8';
      }
      tweet.style.backgroundColor = 'rgba(' + bgRGBA + ')';

      var username = document.createElement( 'div' );
      username.className = 'username';
      username.textContent = rawTweet.username;
      tweet.appendChild( username );

      var tweetText = document.createElement( 'div' );
      tweetText.className = 'tweetText';
      tweetText.textContent = rawTweet.text;
      tweet.appendChild( tweetText );

      var score = document.createElement( 'div' );
      score.className = 'score';
      score.textContent = layerObj.title + ' score: ' + rawTweet[layerObj.resultsName].score;
      tweet.appendChild( score );

      var object = new THREE.CSS3DObject( tweet );
      object.position.x = xStart + Math.floor(index / rows) * xSpacing;
      object.position.y = yStart - (index % rows) * ySpacing;
      object.position.z = layerObj.z;
      scene.add( object );

      layerObj.tweets.push({obj: object, el: tweet});

    });

  };

  var makeTweetLayer = function(layerResultsProp, layerTitle, z) {
    var layerObj = {};
    layerObj.name = layerTitle;
    layerObj.tweets = [];
    layerObj.resultsName = layerResultsProp;
    layerObj.title = layerTitle;
    layerObj.z = z;

    var ribbon = document.createElement('div');
    ribbon.className = 'ribbon-3d';
    var ribbonWidth = Math.abs(camera.position.z) * 10;
    ribbon.style.width = ribbonWidth + 'px';

    var ribbonText = document.createElement( 'div' );
    ribbonText.className = 'layer-title';
    ribbonText.textContent = layerTitle + ' layer';
    ribbonText.style.left = (ribbonWidth/2 - 800) + 'px';
    ribbon.appendChild( ribbonText );

    var ribbonObject = new THREE.CSS3DObject( ribbon );
    ribbonObject.position.x = 0;
    ribbonObject.position.y = 0;
    ribbonObject.position.z = z-1;

    scene.add( ribbonObject );
    layerObj.ribbonObj = ribbonObject;
    layerObj.ribbonEl = ribbon;


    // for (var i = 0; i < 24; i++) {
    //   var x=i;

    //   if (x > 23) {
    //     x = x % 23;
    //   }

    //   addTweet(tweetData[x], layerObj, i);

    // }
    layers.push(layerObj);
  };

  var addButtonEvent = function (buttonId, eventName, callback) {
    var button = document.getElementById( buttonId );
    button.addEventListener( eventName, function ( event ) {
      callback(event);
    }, false);
  };

  var init = function() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 1100;
    camera.position.y = 300;

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.getElementById( 'container-3d' ).appendChild( renderer.domElement );

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 1;
    controls.maxDistance = 4000;
    controls.addEventListener( 'change', render );

    makeTweetLayer('baseLayerResults', 'word', layerSpacing);
    makeTweetLayer('emoticonLayerResults', 'emoji', 0);

    addButtonEvent('separate-3d', 'click', function(event) {
      for (var i = 1; i < layers.length; i++) {
        layers[i].tweets.forEach(function(tweet) {
          var tween = new TWEEN.Tween( tweet.obj.position )
            .to( {z: 0}, 1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
        });
        var tween = new TWEEN.Tween( layers[i].ribbonObj.position )
          .to( {z: -1}, 1000 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();
        layers[i].z = 0;
      }
    });

    addButtonEvent('flatten-3d', 'click', function(event) {
      for (var i = 1; i < layers.length; i++) {
        layers[i].tweets.forEach(function(tweet) {
          var tween = new TWEEN.Tween( tweet.obj.position )
            .to( {z: layerSpacing-1}, 1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
        });
        var tween = new TWEEN.Tween( layers[i].ribbonObj.position )
          .to( {z: layerSpacing-2}, 1000 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();
        layers[i].z = layerSpacing-1;
      }
    });

    // addButtonEvent('stop-3d', 'click', function(event) {
    //   keepAddingTweets = false;
    // });

    addButtonEvent('left-3d', 'mouseover', function(event) {
      leftHover = true;
    });
    addButtonEvent('left-3d', 'mouseleave', function(event) {
      leftHover = false;
    });
    addButtonEvent('right-3d', 'mouseover', function(event) {
      rightHover = true;
    });
    addButtonEvent('right-3d', 'mouseleave', function(event) {
      rightHover = false;
    });

    prevCameraPosition = new THREE.Vector3();
    prevCameraPosition.copy(camera.position);
  };


  return {
    addTweet: addTweet,
    makeTweetLayer: makeTweetLayer,
    init: init,
    animate: animate
  };
});
  