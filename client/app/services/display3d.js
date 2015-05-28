'use strict';

angular.module('parserApp.display3dService', [])


.factory('displayHelpers', ['$window', function($window){

  var THREE = $window.THREE;
  var TWEEN = $window.TWEEN;

  var makeLoResElement = function (layersSeparated, elData) {
    var elLo = document.createElement( 'div' );
    elLo.className = ( 'tweet-3d-lod-low' );
    elLo.style.backgroundColor = currentBGColor(layersSeparated, elData);

    return elLo;
  };

  var tweetMaterialNeutral = new THREE.MeshBasicMaterial( { color: 'rgb(225,225,225)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
  tweetMaterialNeutral.transparent = true;
  tweetMaterialNeutral.opacity = 0.5;

  var tweetMaterialPos = new THREE.MeshBasicMaterial( { color: 'rgb(0,20,190)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
  tweetMaterialPos.transparent = true;
  tweetMaterialPos.opacity = 0.5;

  var tweetMaterialNeg = new THREE.MeshBasicMaterial( { color: 'rgb(225,0,0)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
  tweetMaterialNeg.transparent = true;
  tweetMaterialNeg.opacity = 0.5;

  var makeLoResMesh = function (layersSeparated, elData) {
    var loGeo = new THREE.PlaneBufferGeometry(140, 140);
    var loMesh;
    var score = +elData.score.split(': ')[1]
    if (score > 0) {
      loMesh = new THREE.Mesh(loGeo, tweetMaterialPos);
    } else if (score < 0) {
      loMesh = new THREE.Mesh(loGeo, tweetMaterialNeg);
    } else {
      loMesh = new THREE.Mesh(loGeo, tweetMaterialNeutral);
    }
    //elData.baseBGColorRGB;
    return loMesh;
  };

  var getCameraDistanceFrom = function(camera,x,y,z) {
    var cameraDistance = new THREE.Vector3();
    var zTarget = new THREE.Vector3(x,y,z);
    cameraDistance.subVectors(camera.position, zTarget);
    return cameraDistance.length();
  };

  var getDisplayWidthAtPoint = function(camera,x,y,z) {
    x = x || 0;
    y = y || 0;
    z = z || 0;
    var cameraDistanceFromZPlane = getCameraDistanceFrom(camera, x,y,z);
    var heightAtZPlane = 2 * cameraDistanceFromZPlane * Math.tan(THREE.Math.degToRad(camera.fov)/2);
    var widthAtZPlane = camera.aspect * heightAtZPlane;
    return widthAtZPlane;
  };

  var currentBGColor = function (layersSeparated, elData) {
    if (!layersSeparated && elData.baseBGColor === 'rgba(225,225,225,0.8)') {
      return 'rgba(225,225,225,0)';
    } else {
      return elData.baseBGColor;
    }
  };

  var makeTweetElement = function (layersSeparated, elData) {

      var tweet = document.createElement( 'div' );
      tweet.className = 'tweet-3d';
      tweet.style.backgroundColor = elData.baseBGColor;

      var username = document.createElement( 'div' );
      username.textContent = elData.username;
      tweet.appendChild( username );

      var tweetText = document.createElement( 'div' );
      tweetText.innerHTML = elData.text;
      tweet.appendChild( tweetText );

      var score = document.createElement( 'div' );
      score.textContent = elData.score;
      tweet.appendChild( score );

      if (+elData.score.split(': ')[1] === 0) {
        tweetText.className = 'tweetText';
        score.className = 'score';
        username.className = 'username';
      } else {
        tweetText.className = 'colorTweetText';
        score.className = 'colorScore';
        username.className = 'colorUsername';
      }

      tweet.style.backgroundColor = currentBGColor(layersSeparated, elData);

      return tweet;

  };

  var calculateColorFromScore = function (score) {
    var bgRGBA;
    if (score < -5) {
      score = -5;
    }
    if (score > 5) {
      score = 5;
    }
    if (score < 0) {
      bgRGBA = '225,0,0,' + (0.25 - score/10);
    }
    if (score > 0) {
      bgRGBA = '0,20,190,' + (0.25 + score/10);
    }
    if (score === 0) {
      bgRGBA = '225,225,225,0.8';
    }
    return bgRGBA;
  };

  var swapLOD = function (sceneCSS, sceneGL, tweet, layersSeparated, swapTo) {

    var el, object;

    var x = tweet.obj.position.x;
    var y = tweet.obj.position.y;
    var z = tweet.obj.position.z;

    if (swapTo === 'hi') {
      el = makeTweetElement(layersSeparated, tweet.elData);
      sceneGL.remove(tweet.obj);
      object = new THREE.CSS3DObject( el );
      object.position.x = x;
      object.position.y = y;
      object.position.z = z;
      sceneCSS.add( object );
    }

    if (swapTo === 'lo') {
      sceneCSS.remove(tweet.obj);
      object = makeLoResMesh(layersSeparated, tweet.elData);
      object.position.x = x;
      object.position.y = y;
      object.position.z = z;
      sceneGL.add( object );
    }

    tweet.obj = object;
    tweet.el = el;
  };

  var separateLayers = function (layers, frontLayerZ, layerSpacing) {
    new TWEEN.Tween( tweetMaterialNeutral )
      .to ({opacity: 0.5}, 1000)
      .start();
    for (var i = 0; i < layers.length; i++) {
      layers[i].tweets.forEach(function(tweet) {
        new TWEEN.Tween( tweet.obj.position )
          .to( {z: frontLayerZ - layerSpacing*i}, 1000 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();

        if (tweet.el && tweet.elData.baseBGColor === 'rgba(225,225,225,0.8)') {
          new TWEEN.Tween( {val: 0} )
            .to ( {val: 0.8}, 1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onUpdate( function () {
              if (tweet.el) {
                tweet.el.style.backgroundColor = 'rgba(225,225,225,' + this.val + ')';
              }
            })
            .start();
        }
      });
      new TWEEN.Tween( layers[i].ribbonMesh.position )
        .to( {z: frontLayerZ - layerSpacing*i - 1}, 1000 )
        .easing( TWEEN.Easing.Exponential.InOut )
        .start();
      if (i > 0) {
        new TWEEN.Tween( layers[i].titleEl.style )
          .to( {opacity: 1}, 1300 )
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
  };

  var flattenLayers = function (layers, frontLayerZ, layerSpacing) {
    new TWEEN.Tween( tweetMaterialNeutral )
      .to ({opacity: 0}, 1000)
      .start();
    for (var i = 0; i < layers.length; i++) {
      layers[i].tweets.forEach(function(tweet) {
        new TWEEN.Tween( tweet.obj.position )
          .to( {z: frontLayerZ - 2*i}, 1000 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();

        if (tweet.el && tweet.elData.baseBGColor === 'rgba(225,225,225,0.8)') {
          new TWEEN.Tween( {val: 0.8} )
            .to ( {val: 0}, 1000 )
            .easing( TWEEN.Easing.Exponential.InOut )
            .onUpdate( function () {
              if (tweet.el) {
                tweet.el.style.backgroundColor = 'rgba(225,225,225,' + this.val + ')';
              }
            })
            .start();
        }
      });
      new TWEEN.Tween( layers[i].ribbonMesh.position )
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
  };

  return {
    makeLoResElement: makeLoResElement,
    makeLoResMesh: makeLoResMesh,
    getCameraDistanceFrom: getCameraDistanceFrom,
    getDisplayWidthAtPoint: getDisplayWidthAtPoint,
    currentBGColor: currentBGColor,
    makeTweetElement: makeTweetElement,
    calculateColorFromScore: calculateColorFromScore,
    swapLOD: swapLOD,
    separateLayers: separateLayers,
    flattenLayers: flattenLayers
  };
}])

.factory('Display3d', ['$document', '$window', 'displayHelpers', function($document, $window, displayHelpers) {

  // TODO
  // - make text go away when zoomed out past a certain distance
  // - show more info when zoomed in closer than a certain distance?
  // - buttons next to each layer name - remove, solo, move fwd, move back

  var document = $document[0];
  var THREE = $window.THREE;
  var TWEEN = $window.TWEEN;

  var sceneCSS, sceneGL, camera, rendererCSS, rendererGL, controls, prevCameraPosition;

  var layersSeparated;
  var layers;
  var ribbonHeight;

  var frontLayerZ = 300;
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

  var autoScrollToggle = function () {
    neverAutoScroll = !neverAutoScroll;
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
      var newRibbonWidth = displayHelpers.getDisplayWidthAtPoint(camera, 0, farthestYOnRibbon, layer.z) + 10;
      // layer.ribbonEl.style.width = newRibbonWidth + 'px';
      // layer.ribbonEl.style.height = ribbonHeight + 'px';
      layer.ribbonMesh.scale.x = newRibbonWidth;
      var titleWidth = layer.titleEl.clientWidth;
      layer.titleObj.position.x = -(displayHelpers.getDisplayWidthAtPoint(camera, controls.target.x, 0, 0)/2) + titleWidth*3/4;
    });
  };

  var addButtonEvent = function (buttonId, eventName, callback) {
    var button = document.getElementById( buttonId );
    button.addEventListener( eventName, function ( event ) {
      callback(event);
    }, false);
  };

  var addTweet = function(rawTweet, index) {

    layers.forEach(function(layerObj) {

      var elData = {};
      
      var bgRGBA = displayHelpers.calculateColorFromScore(rawTweet[layerObj.resultsName].score);

      var text = rawTweet.text;
      if (layerObj.resultsName === 'baseLayerResults') {
        rawTweet.baseLayerResults.positiveWords.forEach( function (posWord) {
          text = text.replace(posWord[0], '<span class="positive-word">' + posWord[0] + '</span>');
        });
        rawTweet.baseLayerResults.negativeWords.forEach( function (negWord) {
          text = text.replace(negWord[0], '<span class="negative-word">' + negWord[0] + '</span>');
        });
      }

      elData.baseBGColor = 'rgba(' + bgRGBA + ')';
      elData.baseBGColorRGB = 'rgb(' + bgRGBA.split(',').slice(0,3).join(',') + ')';
      elData.username = rawTweet.username;
      elData.text = text;
      elData.score = layerObj.title + ' score: ' + rawTweet[layerObj.resultsName].score;

      var x = xStart + Math.floor(index / rows) * xSpacing;
      var y = yStart - (index % rows) * ySpacing;
      var z = layerObj.z;
      var tweet;
      var object;

      var tweetDistance = displayHelpers.getCameraDistanceFrom( camera, x, y, z );
      if (tweetDistance > 3000) {
        object = displayHelpers.makeLoResMesh(layersSeparated, elData);
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;
        sceneGL.add( object );
      } else {
        tweet = displayHelpers.makeTweetElement(layersSeparated, elData);

        object = new THREE.CSS3DObject( tweet );
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;
        sceneCSS.add( object );
      }

      layerObj.tweets.push({obj: object, el: tweet, elData: elData});

    });

  };
  var ribbonMaterial = new THREE.MeshBasicMaterial( { color: 'rgb(0,132,180)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
  ribbonMaterial.transparent = true;
  ribbonMaterial.opacity = 0.5;

  var makeTweetLayer = function(layerResultsProp, layerTitle, z) {
    var layerObj = {};
    layerObj.tweets = [];
    layerObj.resultsName = layerResultsProp;
    layerObj.title = layerTitle;
    layerObj.z = z;

    var ribbonGeo = new THREE.PlaneBufferGeometry( 1, ribbonHeight, 2, 2 );
    $window.ribbonGeo = ribbonGeo;
    var ribbonMesh = new THREE.Mesh( ribbonGeo, ribbonMaterial );
    ribbonMesh.position.x = 0;
    ribbonMesh.position.y = 0;
    ribbonMesh.position.z = z-1;

    sceneGL.add( ribbonMesh );
    layerObj.ribbonMesh = ribbonMesh;

    // var ribbon = document.createElement('div');
    // ribbon.style.height = ribbonHeight + 'px';
    // ribbon.className = 'ribbon-3d';

    // Figure out how to put layer titles back later

    var ribbonText = document.createElement( 'div' );
    ribbonText.className = 'layer-title';
    ribbonText.textContent = layerTitle + ' layer';
    ribbonText.style.opacity = 1;
    ribbonText.style.fontSize = (15*rows) + 'px';
    ribbonText.style.width = (150*rows) + 'px';

    layerObj.titleEl = ribbonText;

    var ribbonTitleObject = new THREE.CSS3DObject( ribbonText );
    ribbonTitleObject.position.x = 0;
    ribbonTitleObject.position.y = (rows*(ySpacing+12))/2;
    ribbonTitleObject.position.z = z-1;

    sceneCSS.add( ribbonTitleObject );
    layerObj.titleObj = ribbonTitleObject;
    //layerObj.ribbonEl = ribbon;

    layers.push(layerObj);
  };

  var render = function() {
    rendererCSS.render( sceneCSS, camera );
    rendererGL.render( sceneGL, camera );
  };

  var updateTweetLOD = function () {
    for (var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      for (var t = 0; t < layers[layerIndex].tweets.length; t++) {
        var tweet = layers[layerIndex].tweets[t];
        var tweetDistance = displayHelpers.getCameraDistanceFrom( camera, tweet.obj.position.x, tweet.obj.position.y, tweet.obj.position.z );

        if (tweetDistance > 1000 && tweet.el) {

          // switch to lower LOD
          displayHelpers.swapLOD(sceneCSS, sceneGL, tweet, layersSeparated, 'lo');
        } else if (tweetDistance <= 1000 && !tweet.el) {

          // switch to higher LOD
          displayHelpers.swapLOD(sceneCSS, sceneGL, tweet, layersSeparated, 'hi');
        }
      }
    }
  };

  var animate = function() {
    requestAnimationFrame( animate );
    tick++;

    // check if camera has moved
    //if (!camera.position.equals(prevCameraPosition)) {
    // check if camera has moved more than a certain amount
    if (!camera.position.equals(prevCameraPosition)) {
      // if so, adjust ribbon width so you don't see the left/right ends of the ribbon
      adjustRibbonWidth();
      updateTweetLOD();
    }

    prevCameraPosition.copy(camera.position);

    // auto scroll if tweets are falling off the right
    if (!leftHover && !rightHover) {
      if (layers[0].tweets.length) {
        var lastTweetPosition = layers[0].tweets[layers[0].tweets.length-1].obj.position;
        var rightEdge = displayHelpers.getDisplayWidthAtPoint(camera, controls.target.x, controls.target.y, controls.target.z)/2 + camera.position.x;
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
        layers[i].ribbonMesh.position.x -= scrollSpeed;
      }
    }
    if (rightHover || (rightAutoScroll && !neverAutoScroll)) {
      if (rightHover) {
        scrollSpeed = 15;
      }
      camera.position.x += scrollSpeed;
      controls.target.x += scrollSpeed;
      for (var i = 0; i < layers.length; i++) {
        layers[i].ribbonMesh.position.x += scrollSpeed;
      }
    }
    TWEEN.update();
    controls.update();

    // throttle
    // code for doing something every x ticks
    var freq = 30;
    if (tick >= 60/freq) {
      tick = 0;
      render();
    }
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
      rows = 25;
    }
    
    ribbonHeight = rows * (ySpacing + 15);

    sceneCSS = new THREE.Scene();
    sceneGL = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, document.getElementById(containerID).clientWidth / height, 10, 10000 );
    camera.position.z = cameraZ !== undefined ? cameraZ : 1000;
    camera.position.y = cameraY !== undefined ? cameraY : 200;

    xStart = 0 - (displayHelpers.getDisplayWidthAtPoint(camera,0,0,0) / 2) + xSpacing/2;
    yStart = ((rows-1)*ySpacing)/2;

    rendererCSS = new THREE.CSS3DRenderer();
    rendererCSS.domElement.style.position = 'absolute';
    rendererCSS.domElement.style.top = 0;

    rendererGL = new THREE.WebGLRenderer();
    rendererGL.setClearColor( 0x000000 );
    rendererGL.setPixelRatio( window.devicePixelRatio );

    document.getElementById( containerID ).appendChild( rendererGL.domElement );
    document.getElementById( containerID ).appendChild( rendererCSS.domElement );

    rendererCSS.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight );
    rendererGL.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight - 1 );
    // rendererGL.domElement.style.width = document.getElementById(containerID).clientWidth + 'px';
    // rendererGL.domElement.style.height = (document.getElementById(containerID).clientHeight - 1) + 'px';

    window.onresize = function () {
      rendererCSS.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight );
      rendererGL.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight - 1 );
      // rendererGL.domElement.style.width = document.getElementById(containerID).clientWidth + 'px';
      // rendererGL.domElement.style.height = (document.getElementById(containerID).clientHeight - 1) + 'px';
    };

    controls = new THREE.TrackballControls( camera, rendererCSS.domElement );
    controls.rotateSpeed = 1;
    controls.maxDistance = 10000;
    controls.addEventListener( 'change', render );
    if (context === 'macro') {
      controls.maxDistance = 40000;
      //ribbonHeight = 100;
      xStart = 0 - (displayHelpers.getDisplayWidthAtPoint(camera,0,0,0) / 4);
    }

    makeTweetLayer('baseLayerResults', 'word', frontLayerZ);
    makeTweetLayer('emoticonLayerResults', 'emoji', frontLayerZ - layerSpacing);


    addButtonEvent('separate-3d', 'click', function() {
      if (!layersSeparated) {
        displayHelpers.separateLayers(layers, frontLayerZ, layerSpacing);
        layersSeparated = true;
      }
    });

    addButtonEvent('flatten-3d', 'click', function() {
      if (layersSeparated) {
        displayHelpers.flattenLayers(layers, frontLayerZ, layerSpacing);
        layersSeparated = false;
      }
    });

    // addButtonEvent('stop-3d', 'click', function(event) {
    //   keepAddingTweets = false;
    // });

    addButtonEvent('left-3d', 'mouseover', function() {
      leftHover = true;
    });
    addButtonEvent('left-3d', 'mouseleave', function() {
      leftHover = false;
    });
    addButtonEvent('right-3d', 'mouseover', function() {
      rightHover = true;
    });
    addButtonEvent('right-3d', 'mouseleave', function() {
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
}]);
  