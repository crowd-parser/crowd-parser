angular.module('parserApp.headerService', [])

.factory('Header', function () {

  var init = function() {

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

  };

  return {
    init: init
  };
});