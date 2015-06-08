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

  var makeLoResMesh = function (layersSeparated, elData, layerObj, type) {
    var loGeo;
    if (type === 'pb') {
      loGeo = new THREE.PlaneBufferGeometry(140, 140);
    } else {
      loGeo = new THREE.PlaneGeometry(140, 140);
    }
    var loMesh;
    var score = elData.score.split(': ')[1];
    if (score === 'N/A') {
      score = 0;
    } else {
      score = +score;
    }
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
    if (score === 0 || score === undefined) {
      bgRGBA = '225,225,225,0.8';
    }
    return bgRGBA;
  };

  return {
    makeLoResElement: makeLoResElement,
    makeLoResMesh: makeLoResMesh,
    getCameraDistanceFrom: getCameraDistanceFrom,
    getDisplayWidthAtPoint: getDisplayWidthAtPoint,
    currentBGColor: currentBGColor,
    calculateColorFromScore: calculateColorFromScore
  };
}])

.factory('Display3d', ['$document', '$window', 'displayHelpers', 'Emoji', function($document, $window, displayHelpers, Emoji) {

  var document = $document[0];
  var THREE = $window.THREE;
  var TWEEN = $window.TWEEN;

  var sceneCSS, sceneGL, camera, rendererCSS, rendererGL, controls, prevCameraPosition;

  var layersSeparated;
  var layers; // visible layers
  var ribbonHeight;
  var scope;

  var lod0Distance = 1000;
  var lod1Distance = 2000;

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

  var clear = function () {
    console.log('calling clear');
    if (layers !== undefined) {
      layers.forEach( function (layer) {
        sceneGL.remove(layer.ribbonMesh);
        layer.ribbonMesh = undefined;
        sceneGL.remove(layer.titleMesh);
        layer.titleMesh = undefined;
        layer.ribbonMaterial.dispose();
        layer.ribbonMaterial = undefined;
        layer.titleMaterial.dispose();
        layer.titleMaterial = undefined;
        layer.tweetMaterialNeutral.dispose();
        layer.tweetMaterialNeutral = undefined;
        layer.tweetMaterialPos.dispose();
        layer.tweetMaterialPos = undefined;
        layer.tweetMaterialNeg.dispose();
        layer.tweetMaterialNeg = undefined;
        layer.tweets.forEach( function (tweet) {
          if (tweet.obj) {
            sceneGL.remove(tweet.obj);
            sceneCSS.remove(tweet.obj);
            if (tweet.obj.geometry) {
              tweet.obj.geometry.dispose();
            }
          }
          tweet.obj = undefined;
          tweet.el = undefined;
        });
        layer.tweets = undefined;
        layer = undefined;
      });
    }
  };

  var updateLayers = function (layersVisible) {
    layers.forEach(function (layerObj, i) {
      // if this layer is hidden and should be visible,
      // toggle on visible and call showLayer
      if (layerObj.visible === false && layersVisible[layerObj.title].viz === true) {
        console.log('toggle on ' + layerObj.title);
        layerObj.visible = true;
        console.log('showing ' + layerObj.title);
        showLayer(i);
      // if this layer is visible and should be hidden
      // toggle off visible and call hideLayer
      } else if (layerObj.visible === true && layersVisible[layerObj.title].viz === false) {
        console.log('toggle off ' + layerObj.title);
        layerObj.visible = false;
        console.log('hiding ' + layerObj.title);
        hideLayer(i);
      }
    });
  };

  var separateLayers = function () {
    for (var i = 0; i < layers.length; i++) {
      // tweet opacity webgl
      if (layers[i].visible) {
        new TWEEN.Tween( layers[i].tweetMaterialNeutral )
          .to ({opacity: 0.5}, 1000)
          .start();
      }
      
      layers[i].tweets.forEach(function(tweet) {
        // tweet position
        tweet.transition = true;
        new TWEEN.Tween( tweet.obj.position )
          .to( {z: frontLayerZ - layerSpacing*i}, 1000 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .onComplete( function() {
            tweet.transition = false;
          })
          .start();
        // tweet opacity css
        if (layers[i].visible && tweet.el && tweet.elData.baseBGColor === 'rgba(225,225,225,0.8)') {
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
      // ribbon position
      new TWEEN.Tween( layers[i].ribbonMesh.position )
        .to( {z: frontLayerZ - layerSpacing*i - 1}, 1000 )
        .easing( TWEEN.Easing.Exponential.InOut )
        .start();
      if (i > 0 && layers[i].title.visible) {
        // ribbon title opacity (not front layer)
        new TWEEN.Tween( layers[i].titleMaterial )
          .to( {opacity: 0.5}, 1300 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();
      }
      layers[i].z = frontLayerZ - layerSpacing*i - 1;
      if (i === 0) {
        // ribbon title opacity (front layer)
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

  var flattenLayers = function () {

    for (var i = 0; i < layers.length; i++) {
      new TWEEN.Tween( layers[i].tweetMaterialNeutral )
        .to ({opacity: 0}, 1000)
        .start();
      layers[i].tweets.forEach(function(tweet) {
        tweet.transition = true;
        new TWEEN.Tween( tweet.obj.position )
          .to( {z: frontLayerZ - 2*i}, 1000 )
          .easing( TWEEN.Easing.Exponential.InOut )
          .onComplete( function () {
            tweet.transition = false;
          })
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
        var layerNames = [];
        layers.forEach(function (item) {
          if (item.visible) {
            layerNames.push(item.title);
          }
        });
        
        var combinedTextGeom = new THREE.TextGeometry( layerNames.join(' + ') + ' layers',
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

  var autoScrollToggle = function () {
    neverAutoScroll = !neverAutoScroll;
  };

  var adjustRibbonWidth = function() {
    var lastX = 50;
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
      // I want the new title to start after the x screen position of the last title
      var desiredTitleScreenXPosition = lastX;
      var screenWidthIn3DCoords = displayHelpers.getDisplayWidthAtPoint(camera, controls.target.x, 0, layer.z);
      var screenWidthInBrowser = window.innerWidth;
      var leftEdgeIn3DCoords = controls.target.x - screenWidthIn3DCoords/2;
      var desiredTitleXCoord = leftEdgeIn3DCoords + desiredTitleScreenXPosition * (screenWidthIn3DCoords/screenWidthInBrowser);

      lastX += layer.titleMesh.textWidth * (screenWidthInBrowser/screenWidthIn3DCoords);
      layer.titleMesh.position.x = desiredTitleXCoord;
    });
  };

  var addButtonEvent = function (buttonId, eventName, callback) {
    var button = document.getElementById( buttonId );
    button.addEventListener( eventName, function ( event ) {
      callback(event);
    }, false);
  };

  var makeTweetElement = function (elData, layerObj) {

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

      if (+elData.score.split(': ')[1] === 0 || elData.score.split(': ')[1] === 'N/A') {
        tweetText.className = 'tweetText';
        score.className = 'score';
        username.className = 'username';
      } else {
        tweetText.className = 'colorTweetText';
        score.className = 'colorScore';
        username.className = 'colorUsername';
      }

      tweet.style.backgroundColor = displayHelpers.currentBGColor(layersSeparated, elData);

      // if current layer is hidden
      if (!layerObj.visible) {
        tweet.className = tweet.className + ' invisible';
      }

      if (scope) {
        tweet.addEventListener( 'click', function ( event ) {
          scope.editTweet(elData);
        }, false);
      }


      return tweet;

  };

  var addTweet = function(rawTweet, index) {

    layers.forEach(function(layerObj) {

      var elData = {};
      var bgRGBA;

      var text = Emoji.restoreEmojisInTweet(rawTweet.text);

      // if the layer data is in the data from the server
      if (rawTweet[layerObj.resultsName]) {
        bgRGBA = displayHelpers.calculateColorFromScore(rawTweet[layerObj.resultsName].score);

        // add into tweet text pos-word/neg-word color spans for relevant layers
        if (layerObj.resultsName === 'baseLayerResults' || layerObj.resultsName === 'slangLayerResults' ||
              layerObj.resultsName === 'negationLayerResults') {
          rawTweet[layerObj.resultsName].positiveWords.forEach( function (posWord) {
            text = text.replace(posWord[0], '<span class="positive-word">' + posWord[0] + '</span>');
          });
          rawTweet[layerObj.resultsName].negativeWords.forEach( function (negWord) {
            text = text.replace(negWord[0], '<span class="negative-word">' + negWord[0] + '</span>');
          });
        }

        // more properties that won't be available if DB didn't send data for this layer
        elData.score = layerObj.title + ' score: ' + rawTweet[layerObj.resultsName].score;

      } else {
        // some backup values if it doesn't have layer data
        bgRGBA = displayHelpers.calculateColorFromScore();
        elData.score = layerObj.title + ' score: N/A';
      }
      
      // calculate BG color values from score
      elData.baseBGColor = 'rgba(' + bgRGBA + ')';
      elData.baseBGColorRGB = 'rgb(' + bgRGBA.split(',').slice(0,3).join(',') + ')';

      elData.text = text;
      elData.username = Emoji.restoreEmojisInTweet(rawTweet.username);

      var x = xStart + Math.floor(index / rows) * xSpacing;
      var y = yStart - (index % rows) * ySpacing;
      var z = layerObj.z;
      var tweet;
      var object;
      var lodLevel;

      var tweetDistance = displayHelpers.getCameraDistanceFrom( camera, x, y, z );

      if (tweetDistance > lod0Distance) {
        lodLevel = 'lo';
        object = displayHelpers.makeLoResMesh(layersSeparated, elData, layerObj, 'pb');
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;
        sceneGL.add( object );
      } else {
        lodLevel = 'hi';
        tweet = makeTweetElement(elData, layerObj);

        object = new THREE.CSS3DObject( tweet );
        object.position.x = x;
        object.position.y = y;
        object.position.z = z;
        sceneCSS.add( object );
      }

      layerObj.tweets.push({
        obj: object,
        el: tweet,
        elData: elData,
        lod: lodLevel,
        index: index,
        position: new THREE.Vector3(x, y, z),
      });

    });

  };

  var mergeTweets = function (tweetsToMerge, layer) {
    var combinedGeo = new THREE.Geometry();
    //var combinedMat = [];
    var combinedMat = [layer.tweetMaterialNeutral, layer.tweetMaterialPos, layer.tweetMaterialNeg];

    if (!window.combinedGeo) {
      window.combinedGeo = combinedGeo;
    }

    for (var i = 0; i < tweetsToMerge.length; i++) {
      var tweet = tweetsToMerge[i];
      if (tweet !== null) {
        tweet.position.copy(tweet.obj.position);
        var tmpRows = rows;
        var x = Math.floor(i / tmpRows) * xSpacing;
        var y = 0 - (i % tmpRows) * ySpacing;
        // console.log('index: ' + tweet.index + ' ypos: ' + y);
        var score = +tweet.elData.score.split(': ')[1];
        var matIndex;
        if (score > 0) {
          matIndex = 1;
        } else if (score < 0) {
          matIndex = 2;
        } else {
          matIndex = 0;
        }
        sceneGL.remove(tweet.obj);
        tweet.obj.geometry.dispose();
        var newPlaneMesh = displayHelpers.makeLoResMesh(layersSeparated, tweet.elData, layer, 'p');
        newPlaneMesh.position.set(x,y,0);
        newPlaneMesh.updateMatrix();
        combinedGeo.merge(newPlaneMesh.geometry, newPlaneMesh.matrix, matIndex);
        //combinedMat.push(tweet.obj.material);
        sceneGL.remove(tweet.obj);
        tweet.obj = undefined;
      }
    }
    var testMat = new THREE.MeshBasicMaterial({color: 'rgb(0,225,0)', wireframe: false, wireframeLinewidth: 1, side: THREE.DoubleSide});
    testMat.transparent = true;
    testMat.opacity = 0.25;
    var combinedMesh = new THREE.Mesh(combinedGeo, new THREE.MeshFaceMaterial(combinedMat));
    //var combinedMesh = new THREE.Mesh(combinedGeo, testMat);
    if (!window.combinedMesh) {
      window.combinedMesh = combinedMesh;
    }
    return combinedMesh;
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
    ribbonMaterial.opacity = 0.3;

    var ribbonGeo = new THREE.PlaneBufferGeometry( 1, ribbonHeight, 2, 2 );
    $window.ribbonGeo = ribbonGeo;
    var ribbonMesh = new THREE.Mesh( ribbonGeo, ribbonMaterial );
    ribbonMesh.position.x = 0;
    ribbonMesh.position.y = 0;
    ribbonMesh.position.z = z-1;

    sceneGL.add( ribbonMesh );
    layerObj.ribbonMesh = ribbonMesh;
    layerObj.ribbonMaterial = ribbonMaterial;

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
    textMesh.position.y = (rows*(ySpacing+35))/2 - textHeight/2;
    textMesh.position.z = z-1;

    sceneGL.add( textMesh );
    layerObj.titleMesh = textMesh;
    layerObj.titleMaterial = layerTitleMaterial;

    // set visibility to true on initial creation
    layerObj.visible = true;

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
    if (layersSeparated) {
      layers[layerIndex].tweetMaterialNeutral.opacity = 0.5;
    } else {
      layers[layerIndex].tweetMaterialNeutral.opacity = 0;
    }
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

  // TEMP NOTES
  // 1. If I'm past a certain distance, I can probably LOD the whole layer, or even all layers at once.
  //    I don't have to ping every tweet.
  // 2. I should super-low LOD stuff that is off screen.
  // 3. I should have flatten and separate treat layers differently at that level
  var updateTweetLOD = function () {
    for (var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      for (var t = 0; t < layers[layerIndex].tweets.length; t++) {
        var tweet = layers[layerIndex].tweets[t];
        if (!tweet.obj) {
        }
        if (tweet.obj) {
          tweet.position.copy(tweet.obj.position);
          if (tweet.index === 0) {
          }
        }
        var tweetDistance = displayHelpers.getCameraDistanceFrom( camera, tweet.position.x, tweet.position.y, tweet.position.z );
        var layerDistance = displayHelpers.getCameraDistanceFrom( camera, controls.target.x, controls.target.y, layers[layerIndex].z );

        // whole layer swaps
        if (layerDistance > lod1Distance) {
          // switch whole layer to LOD1
          swapLayerLOD(layers[layerIndex], 'lo1');
        } else if (layerDistance <= lod1Distance && layers[layerIndex].lod === 'lo1') {
          // switch whole layer to lo
          swapLayerLOD(layers[layerIndex], 'lo');
        }

        // individual tweet swaps
        if (layerDistance <= lod1Distance && tweetDistance > lod0Distance && tweet.el) {
          // switch to lo from hi
          swapLOD(tweet, 'lo', layers[layerIndex]);
          layers[layerIndex].lod = 'individual';
        } else if (layerDistance <= lod1Distance && tweetDistance <= lod0Distance && !tweet.el) {
          // switch to hi from lo
          swapLOD(tweet, 'hi', layers[layerIndex]);
          layers[layerIndex].lod = 'individual';
        }
      }
    }
  };

  var swapLayerLOD = function(layer, swapTo) {
    if (layer.lod === swapTo) {
      return;
    }
    if (layer.lodHolder) {
      sceneGL.remove(layer.lodHolder);
      layer.lodHolder = undefined;
    }
    layer.lodHolder = new THREE.Object3D();
    if (swapTo === 'lo') {
      for (var t = 0; t < layer.tweets.length; t++) {
        var tweet = layer.tweets[t];
        swapLOD(tweet, swapTo, layer);
      }
    } else if (swapTo === 'lo1') {
      swapLOD(layer.tweets[0], swapTo, layer);
    }
    sceneGL.add(layer.lodHolder);
    layer.lod = swapTo;
  };

  var swapLOD = function (tweet, swapTo, layer) {

    var el, object;

    var index = tweet.index;
    var row = index % rows;
    var col = Math.floor(index/rows);

    var x, y, z;

    if (tweet.obj) {
      tweet.position.copy(tweet.obj.position);
    }
    x = tweet.position.x;
    y = tweet.position.y;
    z = tweet.position.z;

    // don't do anything if it's already at the right LOD
    if (swapTo === tweet.lod) {
      return;
    }

    // don't do anything if the tweet is tweening
    if (tweet.transition) {
      return;
    }

    // 'hi' = css div
    if (swapTo === 'hi') {
      //console.log('swapping to hi');
      el = makeTweetElement(tweet.elData, layer);
      sceneGL.remove(tweet.obj);
      tweet.obj.geometry.dispose();
      object = new THREE.CSS3DObject( el );
      object.position.x = x;
      object.position.y = y;
      object.position.z = z;
      sceneCSS.add( object );
      tweet.lod = 'hi';
    }

    // 'lo' = single webgl square
    if (swapTo === 'lo') {
      //console.log('swapping to lo for index:' + tweet.index);
      if (tweet.el) { // swapping from hi
        sceneCSS.remove(tweet.obj);
      } else { // swapping from lo1
        if (tweet.obj) { // only primary box in a merge group should have an obj
          layer.ribbonMesh.remove(tweet.obj);
          tweet.obj.geometry.dispose();
        }
      }
      object = displayHelpers.makeLoResMesh(layersSeparated, tweet.elData, layer, 'pb');
      object.position.x = x;
      object.position.y = y;
      object.position.z = z;
      sceneGL.add( object );
      tweet.lod = 'lo';
    }

    // 'lo1' = 4 square geom merged into 1
    if (swapTo === 'lo1' && tweet.lod === 'lo') { // from lo - need another condition if from lo2
      //console.log('swapping to lo1, index ' + index + ' layer ' + layer.title);
      // var tweetsToMerge = [];
      // var tweetsInLayer = layer.tweets.length;
      // if (row % 2 === 0 && col % 2 === 0) {
      //   //console.log ('merging ' + index + ', ' + (index+1) + ', ' + (index+rows) + ', ' + (index+rows+1));
      //   // this is a primary box, 1 merge per primary
      //   tweetsToMerge.push(tweet);
      //   if (index+1 < tweetsInLayer && row + 1 < 25) {
      //     tweetsToMerge.push(layer.tweets[index+1]); // tweet below
      //   } else {
      //     tweetsToMerge.push(null);
      //   }
      //   if (index+rows < tweetsInLayer) {
      //     tweetsToMerge.push(layer.tweets[index+rows]); // tweet to right
      //   } else {
      //     tweetsToMerge.push(null);
      //   }
      //   if (index+rows+1 < tweetsInLayer && row + 1 < 25) {
      //     tweetsToMerge.push(layer.tweets[index+rows+1]); // tweet 1 below and 1 right
      //   } else {
      //     tweetsToMerge.push(null);
      //   }
      //   object = mergeTweets(tweetsToMerge, layer);
      //   // set necessary values for non-primary squares - need to make sure this is done AFTER merging
      //   for (var j = 1; j < tweetsToMerge.length; j++) {
      //     if (tweetsToMerge[j] !== null) {
      //       tweetsToMerge[j].lod = 'lo1';
      //       tweetsToMerge[j].obj = undefined;
      //       //console.log('swapTo post merge set to undefined, tweet index: ' + tweetsToMerge[j].index);
      //       tweetsToMerge[j].el = undefined;
      //     }
      //   }
        object = mergeTweets(layer.tweets, layer);
        layer.tweets.forEach(function (tweet) {
          tweet.lod = 'lo1';
          tweet.obj = undefined;
          tweet.el = undefined;
        });
        object.position.set(x, y, z);
        //sceneGL.add(object);
        //layer.ribbonMesh.add(object);
        //layer.ribbonMesh.updateMatrixWorld();
        layer.lodHolder.add(object);
        // console.log(layer.lodHolder);
        //THREE.SceneUtils.attach(object, sceneGL, layer.ribbonMesh);
      // } else {
      //   // the non-primary squares don't need to worry about it
      //   return;
      // }
      tweet.lod = 'lo1';
    }


    tweet.obj = object;
    tweet.el = el;
  };

  var animate = function() {
    var cameraMoved = false;

    setTimeout( function() {
        requestAnimationFrame( animate );
    }, 1000 / 15 );

    tick++;

    // check if camera has moved
    //if (!camera.position.equals(prevCameraPosition)) {
    // check if camera has moved more than a certain amount
    if (!camera.position.equals(prevCameraPosition)) {
      // if so, adjust ribbon width so you don't see the left/right ends of the ribbon
      adjustRibbonWidth();
      updateTweetLOD();
      cameraMoved = true;
    }

    prevCameraPosition.copy(camera.position);

    // auto scroll if tweets are falling off the right
    if (cameraMoved && !leftHover && !rightHover) {
      if (layers[0].tweets.length) {
        var lastTweet = layers[0].tweets[layers[0].tweets.length-1];
        if (lastTweet.obj) {
          lastTweet.position.copy(lastTweet.obj.position);
        }
        var lastTweetPosition = lastTweet.position;
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

    // if (leftHover) {
    //   scrollSpeed = baseScrollSpeed;
    //   camera.position.x -= scrollSpeed;
    //   controls.target.x -= scrollSpeed;
    //   // for (var i = 0; i < layers.length; i++) {
    //   //   layers[i].ribbonMesh.position.x -= scrollSpeed;
    //   // }
    // }
    // if (rightHover || (rightAutoScroll && !neverAutoScroll)) {
    //   if (rightHover) {
    //     scrollSpeed = baseScrollSpeed;
    //   }
    //   camera.position.x += scrollSpeed;
    //   controls.target.x += scrollSpeed;
    //   // for (var i = 0; i < layers.length; i++) {
    //   //   layers[i].ribbonMesh.position.x += scrollSpeed;
    //   //   layers[i].titleObj.position.x -= scrollSpeed;
    //   // }
    // }
    TWEEN.update();
    controls.update();
      render();

    // throttle
    // code for doing something every x ticks
    // var freq = 30;
    // if (tick >= 60/freq) {
    //   tick = 0;
    // }
  };

  var makeLayers = function () {
    var numLayers = 4;
    frontLayerZ = numLayers * layerSpacing;
    makeTweetLayer('baseLayerResults', 'word', frontLayerZ);
    makeTweetLayer('emoticonLayerResults', 'emoji', frontLayerZ - layerSpacing);
    makeTweetLayer('slangLayerResults', 'slang', frontLayerZ - layerSpacing*2);
    makeTweetLayer('negationLayerResults', 'negation', frontLayerZ - layerSpacing*3);
    scope.layers = layers;
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
      cameraZ = 200;
      cameraY = 0;
      rows = 1;
      ySpacing = 180;
      layerSpacing = 125;
    } else if (context === 'macro') {
      cameraZ = 5000;
      cameraY = 0;
      rows = 25;
    }
    
    ribbonHeight = rows * (ySpacing + 50);

    sceneCSS = new THREE.Scene();
    sceneGL = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, document.getElementById(containerID).clientWidth / height, 10, 40000 );

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

    camera.aspect = document.getElementById(containerID).clientWidth/document.getElementById(containerID).clientHeight;
    camera.updateProjectionMatrix();

    rendererCSS.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight );
    rendererGL.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight - 1 );
    // rendererGL.domElement.style.width = document.getElementById(containerID).clientWidth + 'px';
    // rendererGL.domElement.style.height = (document.getElementById(containerID).clientHeight - 1) + 'px';

    window.onresize = function () {
      rendererCSS.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight );
      rendererGL.setSize( document.getElementById(containerID).clientWidth, document.getElementById(containerID).clientHeight - 1 );

      camera.aspect = document.getElementById(containerID).clientWidth/document.getElementById(containerID).clientHeight;
      camera.updateProjectionMatrix();
      adjustRibbonWidth();
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

    addButtonEvent('flatten-separate-3d', 'click', function() {
      if (layersSeparated) {
        flattenLayers();
        layersSeparated = false;
      } else {
        separateLayers();
        layersSeparated = true;
      }
    });

    initRepeatable(25);
  };

  var initRepeatable = function (numRows) {

    layers = [];
    layersSeparated = true;

    makeLayers();

    controls.maxDistance = 40000;
    xStart = 0 - (displayHelpers.getDisplayWidthAtPoint(camera,0,0,0) / 2);
    camera.position.z = numRows * 250;

    prevCameraPosition = new THREE.Vector3();
    prevCameraPosition.copy(camera.position);
    
    render();
    adjustRibbonWidth();

  };



  return {
    addTweet: addTweet,
    makeTweetLayer: makeTweetLayer,
    init: init,
    reinit: initRepeatable,
    clear: clear,
    animate: animate,
    autoScrollToggle: autoScrollToggle,
    updateLayers: updateLayers
  };
}]);
  