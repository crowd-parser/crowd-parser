angular.module('parserApp.headerService', [])

.factory('Landing', function () {

  var init = function() {

    // ======= HEADER ROTATION ======== //

    var world = document.getElementById( 'world' );
    var d = 0;
    var worldXAngle = 0;
    var worldYAngle = 0;

    $('body').on( 'mousemove', function( e ) {
      worldYAngle = -( .5 - ( e.clientX / window.innerWidth ) ) * 180;
      worldXAngle = ( .5 - ( e.clientY / window.innerHeight ) ) * 180;
      //worldXAngle = .1 * ( e.clientY - .5 * window.innerHeight );
      //worldYAngle = .1 * ( e.clientX - .5 * window.innerWidth );
      updateView();
    } );

    function updateView() {
      var t = 'translateZ( ' + d + 'px ) rotateX( ' + worldXAngle + 'deg) rotateY( ' + worldYAngle + 'deg)';
      world.style.webkitTransform =
      world.style.MozTransform =
      world.style.oTransform = 
      world.style.transform = t;
    }

    // ======== PANORAMA ========= //

    var cameraMain, sceneMain, rendererMain;
    var geometry, material, mesh;
    var target = new THREE.Vector3();
    var lon = 90, lat = 0;
    var phi = 0, theta = 0;
    var touchX, touchY;
    init();
    animate();
    function init() {
      cameraMain = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
      sceneMain = new THREE.Scene();
      var sides = [
        {
          url: '../../assets/images/cloudscube4.jpg',
          position: [ -512, 0, 0 ],
          rotation: [ 0, Math.PI / 2, 0 ]
        },
        {
          url: '../../assets/images/cloudscube2.jpg',
          position: [ 512, 0, 0 ],
          rotation: [ 0, -Math.PI / 2, 0 ]
        },
        {
          url: '../../assets/images/cloudscube1.jpg',
          position: [ 0,  512, 0 ],
          rotation: [ Math.PI / 2, 0, Math.PI ]
        },
        {
          url: '../../assets/images/cloudscube6.jpg',
          position: [ 0, -512, 0 ],
          rotation: [ - Math.PI / 2, 0, Math.PI ]
        },
        {
          url: '../../assets/images/cloudscube3.jpg',
          position: [ 0, 0,  512 ],
          rotation: [ 0, Math.PI, 0 ]
        },
        {
          url: '../../assets/images/cloudscube5.jpg',
          position: [ 0, 0, -512 ],
          rotation: [ 0, 0, 0 ]
        }
      ];
      for ( var i = 0; i < sides.length; i ++ ) {
        
        var side = sides[ i ];
        var element = document.createElement( 'img' );
        element.className = 'tweets-cube';
        element.width = 1024; // 2 pixels extra to close the gap.
        element.src = side.url;
        var object = new THREE.CSS3DObject( element );
        object.position.fromArray( side.position );
        object.rotation.fromArray( side.rotation );
        sceneMain.add( object );
      }
      rendererMain = new THREE.CSS3DRenderer();
      rendererMain.setSize( window.innerWidth, window.innerHeight );
      document.getElementById('tweets-cube').appendChild( rendererMain.domElement );
      
      document.addEventListener( 'mousedown', onDocumentMouseDown, false );
      document.addEventListener( 'touchstart', onDocumentTouchStart, false );
      document.addEventListener( 'touchmove', onDocumentTouchMove, false );
      window.addEventListener( 'resize', onWindowResize, false );

      $('.click-to-begin').on('click', function() {
        cancelAnimationFrame(mainAnimationFrame);
        $('.tweets-cube').remove();
        cameraMain = null;
        sceneMain = null;
        rendererMain = null;

        document.removeEventListener( 'mousedown', onDocumentMouseDown, false );
        document.removeEventListener( 'touchstart', onDocumentTouchStart, false );
        document.removeEventListener( 'touchmove', onDocumentTouchMove, false );
        window.removeEventListener('resize', onWindowResize, false);
      });
    }
    function onWindowResize() {
      cameraMain.aspect = window.innerWidth / window.innerHeight;
      cameraMain.updateProjectionMatrix();
      rendererMain.setSize( window.innerWidth, window.innerHeight );
    }
    function onDocumentMouseDown( event ) {
      event.preventDefault();
      document.addEventListener( 'mousemove', onDocumentMouseMove, false );
      document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    }
    function onDocumentMouseMove( event ) {
      var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
      var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
      lon -= movementX * 0.1;
      lat += movementY * 0.1;
    }
    function onDocumentMouseUp( event ) {
      document.removeEventListener( 'mousemove', onDocumentMouseMove );
      document.removeEventListener( 'mouseup', onDocumentMouseUp );
    }
    function onDocumentMouseWheel( event ) {
      cameraMain.fov -= event.wheelDeltaY * 0.05;
      cameraMain.updateProjectionMatrix();
    }
    function onDocumentTouchStart( event ) {
      event.preventDefault();
      var touch = event.touches[ 0 ];
      touchX = touch.screenX;
      touchY = touch.screenY;
    }
    function onDocumentTouchMove( event ) {
      event.preventDefault();
      var touch = event.touches[ 0 ];
      lon -= ( touch.screenX - touchX ) * 0.1;
      lat += ( touch.screenY - touchY ) * 0.1;
      touchX = touch.screenX;
      touchY = touch.screenY;
    }
    function animate() {
      mainAnimationFrame = requestAnimationFrame( animate );
      lon +=  0/*.2*/;
      lat = Math.max( - 75, Math.min( 75, lat ) );
      phi = THREE.Math.degToRad( 85 - lat );
      theta = THREE.Math.degToRad( lon );
      target.x = Math.sin( phi ) * Math.cos( theta );
      target.y = Math.cos( phi );
      target.z = Math.sin( phi ) * Math.sin( theta );
      cameraMain.lookAt( target );
      rendererMain.render( sceneMain, cameraMain );
    }

  };

  return {
    init: init
  };
});

// <div style="overflow: hidden; -webkit-transform-style: preserve-3d; transform-style: preserve-3d; width: 670px; height: 486px; -webkit-perspective: 316.683765600413px; perspective: 316.683765600413px;">
//<div style="-webkit-transform-style: preserve-3d; transform-style: preserve-3d; width: 670px; height: 486px; -webkit-transform: translate3d(0px, 0px, 316.683765600413px) matrix3d(-1, 0, 0, 0, 0, -0.99619472026825, -0.087155744433403, 0, 0, 0.087155744433403, -0.99619472026825, 0, 0, 0, 0, 1) translate3d(335px, 243px, 0px); transform: translate3d(0px, 0px, 316.683765600413px) matrix3d(-1, 0, 0, 0, 0, -0.99619472026825, -0.087155744433403, 0, 0, 0.087155744433403, -0.99619472026825, 0, 0, 0, 0, 1) translate3d(335px, 243px, 0px);">
//<img class="tweets-cube" width="1024" src="../../assets/images/cloudscube4.jpg" style="position: absolute; -webkit-transform: translate3d(-50%, -50%, 0px) matrix3d(0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 0, -512, 0, 0, 1); transform: translate3d(-50%, -50%, 0px) matrix3d(0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 0, -512, 0, 0, 1);"><img class="tweets-cube" width="1024" src="../../assets/images/cloudscube2.jpg" style="position: absolute; -webkit-transform: translate3d(-50%, -50%, 0px) matrix3d(0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 512, 0, 0, 1); transform: translate3d(-50%, -50%, 0px) matrix3d(0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 512, 0, 0, 1);"><img class="tweets-cube" width="1024" src="../../assets/images/cloudscube1.jpg" style="position: absolute; -webkit-transform: translate3d(-50%, -50%, 0px) matrix3d(-1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 512, 0, 1); transform: translate3d(-50%, -50%, 0px) matrix3d(-1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 512, 0, 1);"><img class="tweets-cube" width="1024" src="../../assets/images/cloudscube6.jpg" style="position: absolute; -webkit-transform: translate3d(-50%, -50%, 0px) matrix3d(-1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, -512, 0, 1); transform: translate3d(-50%, -50%, 0px) matrix3d(-1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, -512, 0, 1);"><img class="tweets-cube" width="1024" src="../../assets/images/cloudscube3.jpg" style="position: absolute; -webkit-transform: translate3d(-50%, -50%, 0px) matrix3d(-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 512, 1); transform: translate3d(-50%, -50%, 0px) matrix3d(-1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 512, 1);"><img class="tweets-cube" width="1024" src="../../assets/images/cloudscube5.jpg" style="position: absolute; -webkit-transform: translate3d(-50%, -50%, 0px) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, -512, 1); transform: translate3d(-50%, -50%, 0px) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, -512, 1);"></div></div>