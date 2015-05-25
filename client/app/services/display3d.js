'use strict';

angular.module('parserApp.display3dService', [])

.factory('Display3d', function ($document) {

  // TODO
  // - set pan limits
  // - do something about layer titles overlapping when flattening layers
  // - make text go away when zoomed out past a certain distance
  // - show more info when zoomed in closer than a certain distance?
  // - buttons next to each layer name - remove, solo, move fwd, move back

  var document = $document[0];

  var scene, camera, renderer, controls, prevCameraPosition;

  var layersSeparated = true;

  var layers = [];
  var frontLayerZ = 0;
  var layerSpacing = 300;
  var ribbonTitleOffset = -1000;

  // left and right mouse hover buttons
  var leftHover = false;
  var rightHover = false;
  var scrollSpeed = 15;
  var tick = 0;

  // tweet display settings
  var rows = 4;
  var ySpacing = 200;
  var yStart = 300;
  var xSpacing = 320;
  var xStart = -800;

  var adjustRibbonWidth = function() {
    layers.forEach(function(layer) {
      var cameraDistanceFromTarget = new THREE.Vector3();
      cameraDistanceFromTarget.subVectors(camera.position, controls.target);
      var newRibbonWidth = Math.abs(cameraDistanceFromTarget.length()) * 14;
      layer.ribbonEl.style.width = newRibbonWidth + 'px';
      layer.ribbonEl.children[0].style.left = (newRibbonWidth/2 + ribbonTitleOffset) + 'px';
    });
  };

  var animate = function() {
    requestAnimationFrame( animate );
    tick++;

    // check if camera has moved
    if (!camera.position.equals(prevCameraPosition)) {
      // if so, adjust ribbon width so you don't see the left/right ends of the ribbon
      adjustRibbonWidth();
    }

    prevCameraPosition.copy(camera.position);

    // code for doing something every 30 ticks
    // if (tick >= 30 && keepAddingTweets) {
    //   tick = 0;
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
      var baseBGColor = 'rgba(' + bgRGBA + ')';
      tweet.style.backgroundColor = baseBGColor;

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

      layerObj.tweets.push({obj: object, el: tweet, baseBGColor: baseBGColor});

    });

  };

  var makeTweetLayer = function(layerResultsProp, layerTitle, z) {
    var layerObj = {};
    layerObj.tweets = [];
    layerObj.resultsName = layerResultsProp;
    layerObj.title = layerTitle;
    layerObj.z = z;

    var ribbon = document.createElement('div');
    ribbon.className = 'ribbon-3d';
    var ribbonWidth = Math.abs(camera.position.z) * 14;
    ribbon.style.width = ribbonWidth + 'px';

    var ribbonText = document.createElement( 'div' );
    ribbonText.className = 'layer-title';
    ribbonText.textContent = layerTitle + ' layer';
    ribbonText.style.left = (ribbonWidth/2 + ribbonTitleOffset) + 'px';
    ribbonText.style.opacity = 1;
    ribbon.appendChild( ribbonText );
    layerObj.titleEl = ribbonText;

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

  var init = function(context) {
    console.log(context);

    var height = window.innerHeight;
    var containerID = 'container-3d';
    var cameraY, cameraZ;

    rows = 4;
    layers = [];

    // overwrite defaults if in mini window
    if (context === 'mini') {
      containerID = 'mini-container-3d';
      cameraZ = 400;
      cameraY = 0;
      height = 250;
      rows = 2;
      xStart = -1200;
      ySpacing = 180;
      layerSpacing = 125;
    }

    yStart = ((rows-1)*ySpacing)/2;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, document.getElementById(containerID).clientWidth / height, 0.1, 1000 );
    camera.position.z = cameraZ !== undefined ? cameraZ : 1000;
    camera.position.y = cameraY !== undefined ? cameraY : 200;

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( document.getElementById(containerID).clientWidth, height);
    window.onresize = function () {
      renderer.setSize( document.getElementById(containerID).clientWidth, height);
    };
    document.getElementById( containerID ).appendChild( renderer.domElement );

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 1;
    controls.maxDistance = 4000;
    controls.addEventListener( 'change', render );

    makeTweetLayer('baseLayerResults', 'word', frontLayerZ);
    makeTweetLayer('emoticonLayerResults', 'emoji', frontLayerZ - layerSpacing);

    addButtonEvent('separate-3d', 'click', function(event) {
      if (!layersSeparated) {
        for (var i = 0; i < layers.length; i++) {
          layers[i].tweets.forEach(function(tweet) {
            new TWEEN.Tween( tweet.obj.position )
              .to( {z: frontLayerZ - layerSpacing*i}, 1000 )
              .easing( TWEEN.Easing.Exponential.InOut )
              .start();

            if (tweet.baseBGColor === 'rgba(225,225,225,0.8)') {
              new TWEEN.Tween( {val: 0} )
                .to ( {val: 0.8}, 1000 )
                .easing( TWEEN.Easing.Exponential.InOut )
                .onUpdate( function () {
                  tweet.el.style.backgroundColor = 'rgba(225,225,225,' + this.val + ')';
                })
                .start();
            }
          });
          new TWEEN.Tween( layers[i].ribbonObj.position )
            .to( {z: frontLayerZ - layerSpacing*i - 1}, 1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
          if (i > 0) {
            new TWEEN.Tween( layers[i].titleEl.style )
              .to( {opacity: 1}, 500 )
              .easing( TWEEN.Easing.Exponential.InOut )
              .start();
          }
          layers[i].z = frontLayerZ - layerSpacing*i - 1;
          if (i === 0) {
            var fadeOut = new TWEEN.Tween( layers[i].titleEl.style )
              .to( {opacity: 0}, 500)
              .easing( TWEEN.Easing.Quadratic.InOut )
              .onComplete(function () {
                layers[0].titleEl.textContent = layers[0].title + ' layer';
              });
            var fadeIn = new TWEEN.Tween( layers[i].titleEl.style )
              .to( {opacity: 1}, 500)
              .easing( TWEEN.Easing.Quadratic.InOut );
            fadeOut.chain(fadeIn).start();
          }
        }
        layersSeparated = true;
      }
    });

    addButtonEvent('flatten-3d', 'click', function(event) {
      if (layersSeparated) {
        for (var i = 0; i < layers.length; i++) {
          layers[i].tweets.forEach(function(tweet) {
            new TWEEN.Tween( tweet.obj.position )
              .to( {z: frontLayerZ - 2*i}, 1000 )
              .easing( TWEEN.Easing.Exponential.InOut )
              .start();

            if (tweet.baseBGColor === 'rgba(225,225,225,0.8)') {
              new TWEEN.Tween( {val: 0.8} )
                .to ( {val: 0}, 1000 )
                .easing( TWEEN.Easing.Exponential.InOut )
                .onUpdate( function () {
                  tweet.el.style.backgroundColor = 'rgba(225,225,225,' + this.val + ')';
                })
                .start();
            }
          });
          new TWEEN.Tween( layers[i].ribbonObj.position )
            .to( {z: frontLayerZ - 2*i - 1}, 1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .start();
          if (i > 0) {
            new TWEEN.Tween( layers[i].titleEl.style )
              .to( {opacity: 0}, 500)
              .easing( TWEEN.Easing.Exponential.InOut )
              .start();
          }
          layers[i].z = frontLayerZ - 2*i;
          if (i === 0) {
            var fadeOut = new TWEEN.Tween( layers[i].titleEl.style )
              .to( {opacity: 0}, 500)
              .easing( TWEEN.Easing.Quadratic.InOut )
              .onComplete(function () {
                layers[0].titleEl.textContent = layers.map(function (item) {
                  return item.title;
                }).join(' + ') + ' layers';
              });
            var fadeIn = new TWEEN.Tween( layers[i].titleEl.style )
              .to( {opacity: 1}, 500)
              .easing( TWEEN.Easing.Quadratic.InOut );
            fadeOut.chain(fadeIn).start();
          }
        }
        layersSeparated = false;
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
    return camera;
  };



  return {
    addTweet: addTweet,
    makeTweetLayer: makeTweetLayer,
    init: init,
    animate: animate
  };
});
  