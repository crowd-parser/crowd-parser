'use strict';

angular.module('parserApp.display3dService', [])


.factory('displayHelpers', ['$window', function($window){

  window.WebFontConfig = {
    google: { families: [ 'Lato::latin' ] }
  };
  (function() {
    var wf = document.createElement('script');
    wf.src = ('https:' === document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
  })();

  var THREE = $window.THREE;
  var TWEEN = $window.TWEEN;

  var makeLoResElement = function (layersSeparated, elData) {
    var elLo = document.createElement( 'div' );
    elLo.className = ( 'tweet-3d-lod-low' );
    elLo.style.backgroundColor = currentBGColor(layersSeparated, elData);

    return elLo;
  };

  var makeLoResMesh = function (layersSeparated, elData, layerObj) {
    var loGeo = new THREE.PlaneBufferGeometry(140, 140);
    var loMesh;
    var score = +elData.score.split(': ')[1]
    if (score > 0) {
      loMesh = new THREE.Mesh(loGeo, layerObj.tweetMaterialPos);
    } else if (score < 0) {
      loMesh = new THREE.Mesh(loGeo, layerObj.tweetMaterialNeg);
    } else {
      loMesh = new THREE.Mesh(loGeo, layerObj.tweetMaterialNeutral);
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

  var makeTweetElement = function (layersSeparated, elData, scope, layerObj) {

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

      if (scope) {
        tweet.addEventListener( 'click', function ( event ) {
          scope.editTweet(elData);
        }, false);
      }

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

  var swapLOD = function (sceneCSS, sceneGL, tweet, layersSeparated, swapTo, scope, layer) {

    var el, object;

    var x = tweet.obj.position.x;
    var y = tweet.obj.position.y;
    var z = tweet.obj.position.z;

    if (swapTo === 'hi') {
      el = makeTweetElement(layersSeparated, tweet.elData, scope);
      sceneGL.remove(tweet.obj);
      object = new THREE.CSS3DObject( el );
      object.position.x = x;
      object.position.y = y;
      object.position.z = z;
      sceneCSS.add( object );
    }

    if (swapTo === 'lo') {
      sceneCSS.remove(tweet.obj);
      object = makeLoResMesh(layersSeparated, tweet.elData, layer);
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
        new TWEEN.Tween( layers[i].titleMaterial )
          .to( {opacity: 0.5}, 1300 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();
      }
      layers[i].z = frontLayerZ - layerSpacing*i - 1;
      if (i === 0) {

        var fadeOut = new TWEEN.Tween( layers[i].combinedMaterial )
          .to( {opacity: 0}, 500)
          .easing( TWEEN.Easing.Quadratic.InOut );
        var fadeIn = new TWEEN.Tween( layers[i].titleMaterial )
          .to( {opacity: 0.5}, 500)
          .easing( TWEEN.Easing.Quadratic.InOut );
        fadeOut.chain(fadeIn).start();
      }
    }
  };

  var flattenLayers = function (layers, frontLayerZ, layerSpacing, rows, sceneGL) {
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
        new TWEEN.Tween( layers[i].titleMaterial )
          .to( {opacity: 0}, 500)
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();
      }
      layers[i].z = frontLayerZ - 2*i;
      if (i === 0) {

        if (layers[i].combinedMesh) {
          sceneGL.remove(layers[i].combinedMesh);
          layers[i].combinedMesh.geometry.dispose();
          layers[i].combinedMaterial.dispose();
        }
        var combinedMaterial = new THREE.MeshBasicMaterial( { color: 'rgb(0,150,210)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
        combinedMaterial.transparent = true;
        combinedMaterial.opacity = 0;
        var combinedTextGeom = new THREE.TextGeometry( layers.map(function (item) {
                  return item.title;
                }).join(' + ') + ' layers',
          {
            size: (12*rows),
            font: 'droid sans', // Must be lowercase!
            height: 0
          });
        var combinedTextMesh = new THREE.Mesh(combinedTextGeom, combinedMaterial);
        combinedTextMesh.position.x = layers[i].titleMesh.position.x;
        combinedTextMesh.position.y = layers[i].titleMesh.position.y;
        combinedTextMesh.position.z = layers[i].titleMesh.position.z;
        sceneGL.add(combinedTextMesh);
        layers[i].combinedMesh = combinedTextMesh;
        layers[i].combinedMaterial = combinedMaterial;

        var fadeOut = new TWEEN.Tween( layers[i].titleMaterial )
          .to( {opacity: 0}, 500)
          .easing( TWEEN.Easing.Quadratic.InOut );
        var fadeIn = new TWEEN.Tween( combinedMaterial )
          .to( {opacity: 0.5}, 500)
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
  var layers; // visible layers
  var allLayers = {};
  var ribbonHeight;
  var scope;

  var frontLayerZ = 300;
  var layerSpacing = 300;

  // left and right mouse hover buttons
  var leftHover = false;
  var rightHover = false;
  var baseScrollSpeed = 25;
  var scrollSpeed = baseScrollSpeed;
  var neverAutoScroll = false;
  var rightAutoScroll = false;
  var tick = 0;

  // tweet display settings
  var rows;
  var ySpacing = 200;
  var yStart = 300;
  var xSpacing = 320;
  var xStart = -800;

  var updateLayers = function (layersVisible) {
    // uiLayer is a layer title
    for (var uiLayer in layersVisible) {
      // if there is a hidden layer that should be visible,
      // toggle on visible and put it in layers
      if (layersVisible[uiLayer].viz && !allLayers[uiLayer].visible) {
        allLayers[uiLayer].visible = true;
        layers.push(allLayers[uiLayer].layer);
        showLayer(layers.length-1);
      } else if (!layersVisible[uiLayer].viz && allLayers[uiLayer].visible) {
      // if there is a visible layer that should be hidden,
      // toggle off visible and splice it out of layers
        allLayers[uiLayer].visible = false;
        layers.forEach(function (layer, i) {
          if (layer.title === uiLayer) {
            hideLayer(i);
            layers.splice(i, 1);
          }
        });
      }
    }
  };

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
      layer.ribbonMesh.scale.x = newRibbonWidth;
      layer.ribbonMesh.position.x = controls.target.x;
      //var titleWidth = layer.titleEl.clientWidth;
      layer.titleMesh.position.x = controls.target.x-(displayHelpers.getDisplayWidthAtPoint(camera, controls.target.x, 0, 0)/2) + layer.titleMesh.textWidth*3/4;
      //layer.titleObj.position.x = controls.target.x-(displayHelpers.getDisplayWidthAtPoint(camera, controls.target.x, 0, 0)/2) + titleWidth*3/4;
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
        object = displayHelpers.makeLoResMesh(layersSeparated, elData, layerObj);
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;
        sceneGL.add( object );
      } else {
        tweet = displayHelpers.makeTweetElement(layersSeparated, elData, scope, layerObj);

        object = new THREE.CSS3DObject( tweet );
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;
        sceneCSS.add( object );
      }

      layerObj.tweets.push({obj: object, el: tweet, elData: elData});

    });

  };

  var makeTweetLayer = function(layerResultsProp, layerTitle, z) {
    var layerObj = {};
    layerObj.tweets = [];
    layerObj.resultsName = layerResultsProp;
    layerObj.title = layerTitle;
    layerObj.z = z;

    layerObj.tweetMaterialNeutral = new THREE.MeshBasicMaterial( { color: 'rgb(225,225,225)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
    layerObj.tweetMaterialNeutral.transparent = true;
    layerObj.tweetMaterialNeutral.opacity = 0.5;

    layerObj.tweetMaterialPos = new THREE.MeshBasicMaterial( { color: 'rgb(0,20,190)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
    layerObj.tweetMaterialPos.transparent = true;
    layerObj.tweetMaterialPos.opacity = 0.5;

    layerObj.tweetMaterialNeg = new THREE.MeshBasicMaterial( { color: 'rgb(225,0,0)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
    layerObj.tweetMaterialNeg.transparent = true;
    layerObj.tweetMaterialNeg.opacity = 0.5;

    var ribbonMaterial = new THREE.MeshBasicMaterial( { color: 'rgb(0,132,180)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
    ribbonMaterial.transparent = true;
    ribbonMaterial.opacity = 0.5;

    var ribbonGeo = new THREE.PlaneBufferGeometry( 1, ribbonHeight, 2, 2 );
    $window.ribbonGeo = ribbonGeo;
    var ribbonMesh = new THREE.Mesh( ribbonGeo, ribbonMaterial );
    ribbonMesh.position.x = 0;
    ribbonMesh.position.y = 0;
    ribbonMesh.position.z = z-1;

    sceneGL.add( ribbonMesh );
    layerObj.ribbonMesh = ribbonMesh;
    layerObj.ribbonMaterial = ribbonMaterial;

    // var ribbon = document.createElement('div');
    // ribbon.style.height = ribbonHeight + 'px';
    // ribbon.className = 'ribbon-3d';

    // Figure out how to put layer titles back later
    var layerTitleMaterial = new THREE.MeshBasicMaterial( { color: 'rgb(0,150,210)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide } );
    layerTitleMaterial.transparent = true;
    layerTitleMaterial.opacity = 0.5;

    var textGeom = new THREE.TextGeometry( layerTitle + ' layer', {
      size: (12*rows),
      font: 'droid sans', // Must be lowercase!
      height: 0
    });
    var textMesh = new THREE.Mesh( textGeom, layerTitleMaterial );
    textGeom.computeBoundingBox();
    textMesh.textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;
    var textHeight = textGeom.boundingBox.max.y - textGeom.boundingBox.min.y;
    textMesh.position.y = (rows*(ySpacing+15))/2 - textHeight/2;
    textMesh.position.z = z-1;

    sceneGL.add( textMesh );
    layerObj.titleMesh = textMesh;
    layerObj.titleMaterial = layerTitleMaterial;

    //layerObj.ribbonEl = ribbon;

    // stores all layers (hidden and visible) and their current visibility
    allLayers[layerObj.title] = {visible: true, layer: layerObj};
    // stores visible layers
    layers.push(layerObj);
  };

  var hideLayer = function (layerIndex) {
    // hide tweets
    layers[layerIndex].tweetMaterialNeg.opacity = 0;
    layers[layerIndex].tweetMaterialNeutral.opacity = 0;
    layers[layerIndex].tweetMaterialPos.opacity = 0;
    layers[layerIndex].tweets.forEach(function (tweet) {
      if (tweet.el) {
        tweet.el.className = tweet.el.className + ' invisible';
      }
    });
    // hide ribbon mesh
    layers[layerIndex].ribbonMaterial.opacity = 0;
    // hide layer title
    layers[layerIndex].titleMaterial.opacity = 0;
  };

  var showLayer = function (layerIndex) {
    // show tweets
    layers[layerIndex].tweetMaterialNeg.opacity = 0.5;
    layers[layerIndex].tweetMaterialNeutral.opacity = 0.5;
    layers[layerIndex].tweetMaterialPos.opacity = 0.5;
    layers[layerIndex].tweets.forEach(function (tweet) {
      if (tweet.el) {
        tweet.el.className = tweet.el.className.split(' ')[0];
      }
    });
    //layers[layerIndex].tweets;
    // show ribbon mesh
    layers[layerIndex].ribbonMaterial.opacity = 0.5;
    // show layer title
    layers[layerIndex].titleMaterial.opacity = 0.5;
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
          displayHelpers.swapLOD(sceneCSS, sceneGL, tweet, layersSeparated, 'lo', scope, layers[layerIndex]);
        } else if (tweetDistance <= 1000 && !tweet.el) {

          // switch to higher LOD
          displayHelpers.swapLOD(sceneCSS, sceneGL, tweet, layersSeparated, 'hi', scope, layers[layerIndex]);
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
      scrollSpeed = baseScrollSpeed;
      camera.position.x -= scrollSpeed;
      controls.target.x -= scrollSpeed;
      // for (var i = 0; i < layers.length; i++) {
      //   layers[i].ribbonMesh.position.x -= scrollSpeed;
      // }
    }
    if (rightHover || (rightAutoScroll && !neverAutoScroll)) {
      if (rightHover) {
        scrollSpeed = baseScrollSpeed;
      }
      camera.position.x += scrollSpeed;
      controls.target.x += scrollSpeed;
      // for (var i = 0; i < layers.length; i++) {
      //   layers[i].ribbonMesh.position.x += scrollSpeed;
      //   layers[i].titleObj.position.x -= scrollSpeed;
      // }
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

  var makeLayers = function () {
    makeTweetLayer('baseLayerResults', 'word', frontLayerZ);
    makeTweetLayer('emoticonLayerResults', 'emoji', frontLayerZ - layerSpacing);
    scope.allLayers = allLayers;
  };

  var init = function(context, passedScope) {
    scope = passedScope;
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

    rendererGL = new THREE.WebGLRenderer( {antialias: true} );
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

    makeLayers();

    addButtonEvent('separate-3d', 'click', function() {
      if (!layersSeparated) {
        displayHelpers.separateLayers(layers, frontLayerZ, layerSpacing);
        layersSeparated = true;
      }
    });

    addButtonEvent('flatten-3d', 'click', function() {
      if (layersSeparated) {
        displayHelpers.flattenLayers(layers, frontLayerZ, layerSpacing, rows, sceneGL);
        layersSeparated = false;
      }
    });

    // addButtonEvent('stop-3d', 'click', function(event) {
    //   keepAddingTweets = false;
    // });

    // addButtonEvent('left-3d', 'mouseover', function() {
    //   leftHover = true;
    // });
    addButtonEvent('left-3d', 'mousedown', function() {
      leftHover = true;
    });
    // addButtonEvent('left-3d', 'mouseleave', function() {
    //   leftHover = false;
    // });
    addButtonEvent('left-3d', 'mouseup', function() {
      leftHover = false;
    });
    // addButtonEvent('right-3d', 'mouseover', function() {
    //   rightHover = true;
    // });
    addButtonEvent('right-3d', 'mousedown', function() {
      rightHover = true;
    });
    // addButtonEvent('right-3d', 'mouseleave', function() {
    //   rightHover = false;
    // });
    addButtonEvent('right-3d', 'mouseup', function() {
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
    autoScrollToggle: autoScrollToggle,
    updateLayers: updateLayers
  };
}]);
  