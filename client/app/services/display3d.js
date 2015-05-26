'use strict';

angular.module('parserApp.display3dService', [])

.factory('Display3d', function ($document) {

  // TODO
  // - make text go away when zoomed out past a certain distance
  // - show more info when zoomed in closer than a certain distance?
  // - buttons next to each layer name - remove, solo, move fwd, move back

  var document = $document[0];

  var scene, camera, renderer, controls, prevCameraPosition;

  var layersSeparated;
  var layers;
  var ribbonHeight;

  var frontLayerZ = 0;
  var layerSpacing = 300;

  // left and right mouse hover buttons
  var leftHover = false;
  var rightHover = false;
  var scrollSpeed = 15;
  var neverAutoScroll = false;
  var rightAutoScroll = false;
  var tick = 0;

  // tweet display settings
  var rows;
  var ySpacing = 200;
  var yStart = 300;
  var xSpacing = 320;
  var xStart = -800;

  var getCameraDistanceFrom = function(x,y,z) {
    var cameraDistance = new THREE.Vector3();
    var zTarget = new THREE.Vector3(x,y,z);
    cameraDistance.subVectors(camera.position, zTarget);
    return cameraDistance.length();
  };

  var getDisplayWidthAtPoint = function(x,y,z) {
    x = x || 0;
    y = y || 0;
    z = z || 0;
    var cameraDistanceFromZPlane = getCameraDistanceFrom(x,y,z);
    var heightAtZPlane = 2 * cameraDistanceFromZPlane * Math.tan(THREE.Math.degToRad(camera.fov)/2);
    var widthAtZPlane = camera.aspect * heightAtZPlane;
    return widthAtZPlane;
  };

  var adjustRibbonWidth = function() {
    layers.forEach(function(layer) {
      var farthestYOnRibbon;
      // probably would be more precise to find out angle of camera vector relative
      // to ribbon but this should work in most cases
      if (camera.position.y >= 0) {
        farthestYOnRibbon = -1 * ribbonHeight;
      } else {
        farthestYOnRibbon = ribbonHeight;
      }
      var newRibbonWidth = getDisplayWidthAtPoint(0,farthestYOnRibbon,layer.z) + 10;
      layer.ribbonEl.style.width = newRibbonWidth + 'px';
      layer.ribbonEl.style.height = ribbonHeight + 'px';
      var titleWidth = layer.ribbonEl.children[0].clientWidth;
      layer.ribbonEl.children[0].style.left = (newRibbonWidth/2 - getDisplayWidthAtPoint(controls.target.x,ribbonHeight/2,0)/2 + titleWidth) + 'px';
    });
  };

  var autoScrollToggle = function () {
    neverAutoScroll = !neverAutoScroll;
  };

  var currentBGColor = function (elData) {
    if (!layersSeparated && elData.baseBGColor === 'rgba(225,225,225,0.8)') {
      return 'rgba(225,225,225,0)';
    } else {
      return elData.baseBGColor;
    }
  };

  var updateTweetLOD = function () {
    for (var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      for (var t = 0; t < layers[layerIndex].tweets.length; t++) {
        var tweet = layers[layerIndex].tweets[t];
        var tweetDistance = getCameraDistanceFrom( tweet.obj.position.x, tweet.obj.position.y, tweet.obj.position.z );
        if (tweetDistance > 3000 && tweet.el.className !== 'tweet-3d-lod-low') {
          // switch to lower LOD
          var x = tweet.obj.position.x;
          var y = tweet.obj.position.y;
          var z = tweet.obj.position.z;
          scene.remove(tweet.obj);

          var elLo = makeLoResElement(tweet.elData);
          elLo.style.backgroundColor = currentBGColor(tweet.elData);

          var objectLo = new THREE.CSS3DObject( elLo );
          objectLo.position.x = x;
          objectLo.position.y = y;
          objectLo.position.z = z;
          scene.add( objectLo );
          tweet.obj = objectLo;
          tweet.el = elLo;
        } else if (tweetDistance <= 3000 && tweet.el.className !== 'tweet-3d') {
          // switch to higher LOD
          var x = tweet.obj.position.x;
          var y = tweet.obj.position.y;
          var z = tweet.obj.position.z;
          scene.remove(tweet.obj);

          var elHi = makeTweetElement(tweet.elData);
          elHi.style.backgroundColor = currentBGColor(tweet.elData);

          var objectHi = new THREE.CSS3DObject( elHi );
          objectHi.position.x = x;
          objectHi.position.y = y;
          objectHi.position.z = z;
          scene.add( objectHi );
          tweet.obj = objectHi;
          tweet.el = elHi;
        }
      }
    }
  };

  var animate = function() {
    requestAnimationFrame( animate );
    tick++;

    // check if camera has moved
    if (!camera.position.equals(prevCameraPosition)) {
      // if so, adjust ribbon width so you don't see the left/right ends of the ribbon
      adjustRibbonWidth();
      updateTweetLOD();
    }

    prevCameraPosition.copy(camera.position);

    // code for doing something every 30 ticks
    if (tick >= 30) {
      tick = 0;
    }

    // auto scroll if tweets are falling off the right
    if (!leftHover && !rightHover) {
      if (layers[0].tweets.length) {
        var lastTweetPosition = layers[0].tweets[layers[0].tweets.length-1].obj.position;
        var rightEdge = getDisplayWidthAtPoint(controls.target.x, controls.target.y, controls.target.z)/2 + camera.position.x;
        if ((lastTweetPosition.x + xSpacing) > rightEdge) {
          var distanceToGo = (lastTweetPosition.x + xSpacing) - rightEdge;
          scrollSpeed = 10 * distanceToGo/100;
          rightAutoScroll = true;
        } else {
          rightAutoScroll = false;
        }
      }
    }


    if (leftHover) {
      scrollSpeed = 15;
      camera.position.x -= scrollSpeed;
      controls.target.x -= scrollSpeed;
      for (var i = 0; i < layers.length; i++) {
        layers[i].ribbonObj.position.x -= scrollSpeed;
      }
    }
    if (rightHover || (rightAutoScroll && !neverAutoScroll)) {
      if (rightHover) {
        scrollSpeed = 15;
      }
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

  var makeTweetElement = function (elData) {

      var tweet = document.createElement( 'div' );
      tweet.className = 'tweet-3d';
      tweet.style.backgroundColor = elData.baseBGColor;

      var username = document.createElement( 'div' );
      username.className = 'username';
      username.textContent = elData.username;
      tweet.appendChild( username );

      var tweetText = document.createElement( 'div' );
      tweetText.className = 'tweetText';
      tweetText.textContent = elData.text;
      tweet.appendChild( tweetText );

      var score = document.createElement( 'div' );
      score.className = 'score';
      score.textContent = elData.score;
      tweet.appendChild( score );

      return tweet;

  };

  var makeLoResElement = function (elData) {
    var elLo = document.createElement( 'div' );
    elLo.className = ( 'tweet-3d-lod-low' );

    return elLo;
  };

  var addTweet = function(rawTweet, index) {

    layers.forEach(function(layerObj) {

      var elData = {};
      
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
      elData.baseBGColor = 'rgba(' + bgRGBA + ')';
      elData.username = rawTweet.username;
      elData.text = rawTweet.text;
      elData.score = layerObj.title + ' score: ' + rawTweet[layerObj.resultsName].score;

      var x = xStart + Math.floor(index / rows) * xSpacing;
      var y = yStart - (index % rows) * ySpacing;
      var z = layerObj.z;
      var tweet;

      var tweetDistance = getCameraDistanceFrom( x, y, z );
      if (tweetDistance > 3000) {
        tweet = makeLoResElement(elData);
        tweet.style.backgroundColor = currentBGColor(elData);
      } else {
        tweet = makeTweetElement(elData);
        tweet.style.backgroundColor = currentBGColor(elData);
      }

      var object = new THREE.CSS3DObject( tweet );
      object.position.x = x;
      object.position.y = y;
      object.position.z = z;
      scene.add( object );

      layerObj.tweets.push({obj: object, el: tweet, elData: elData});

    });

  };

  var makeTweetLayer = function(layerResultsProp, layerTitle, z) {
    var layerObj = {};
    layerObj.tweets = [];
    layerObj.resultsName = layerResultsProp;
    layerObj.title = layerTitle;
    layerObj.z = z;

    var ribbon = document.createElement('div');
    ribbon.style.height = ribbonHeight + 'px';
    ribbon.className = 'ribbon-3d';

    var ribbonText = document.createElement( 'div' );
    ribbonText.className = 'layer-title';
    ribbonText.textContent = layerTitle + ' layer';
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
    ribbonHeight = 1000;
    layers = [];
    layersSeparated = true;

    // overwrite defaults if in mini window
    if (context === 'mini') {
      containerID = 'mini-container-3d';
      cameraZ = 200;
      cameraY = 0;
      height = document.getElementById(containerID).clientHeight;
      rows = 1;
      ySpacing = 180;
      layerSpacing = 125;
    } else if (context === 'macro') {
      cameraZ = 5000;
      cameraY = 0;
      rows = 15;
    }
    
    ribbonHeight = rows * ySpacing + 200;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, document.getElementById(containerID).clientWidth / height, 0.1, 1000 );
    camera.position.z = cameraZ !== undefined ? cameraZ : 1000;
    camera.position.y = cameraY !== undefined ? cameraY : 200;

    xStart = 0 - (getDisplayWidthAtPoint(0,0,0) / 2) + xSpacing/2;
    yStart = ((rows-1)*ySpacing)/2;

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( document.getElementById(containerID).clientWidth, height);
    window.onresize = function () {
      renderer.setSize( document.getElementById(containerID).clientWidth, height);
    };
    document.getElementById( containerID ).appendChild( renderer.domElement );

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 1;
    controls.maxDistance = 10000;
    controls.addEventListener( 'change', render );
    if (context === 'macro') {
      controls.maxDistance = 40000;
      ribbonHeight = 100;
      xStart = 0 - (getDisplayWidthAtPoint(0,0,0) / 4);
    }

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

            if (tweet.elData.baseBGColor === 'rgba(225,225,225,0.8)') {
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

            if (tweet.elData.baseBGColor === 'rgba(225,225,225,0.8)') {
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
    render();
    adjustRibbonWidth();
    return camera;
  };



  return {
    addTweet: addTweet,
    makeTweetLayer: makeTweetLayer,
    init: init,
    animate: animate,
    autoScrollToggle: autoScrollToggle
  };
});
  