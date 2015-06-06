angular.module('parserApp.socialService', [])

.factory('Social', function (Auth) {

  // ***** FACEBOOK SETUP ****** //

  // This is called with the results from from FB.getLoginStatus().
  function statusChangeCallback(response) {
    // console.log('statusChangeCallback');
    // console.log(response);
    // The response object is returned with a status field that lets the
    // app know the current login status of the person.
    // Full docs on the response object can be found in the documentation
    // for FB.getLoginStatus().
    if (response.status === 'connected') {
      // Logged into your app and Facebook.
      Auth.loggedIn = true;
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app.
      // document.getElementById('fb-status').innerHTML = 'Please log ' +
      //   'into this app to purchase.';
    } else {
      // The person is not logged into Facebook, so we're not sure if
      // they are logged into this app or not.
      // document.getElementById('fb-status').innerHTML = 'Please log ' +
      //   'into Facebook to purchase.';
    }
  }

  // This function is called when someone finishes with the Login
  // Button.  See the onlogin handler attached to it in the sample
  // code below.
  function checkLoginState() {
    FB.getLoginStatus(function(response) {
      statusChangeCallback(response);
    });
  }

  window.fbAsyncInit = function() {
  FB.init({
    appId      : '461808473996671',
    cookie     : true,  // enable cookies to allow the server to access 
                        // the session
    xfbml      : true,  // parse social plugins on this page
    version    : 'v2.2' // use version 2.2
  });

  // Now that we've initialized the JavaScript SDK, we call 
  // FB.getLoginStatus().  This function gets the state of the
  // person visiting this page and can return one of three states to
  // the callback you provide.  They can be:
  //
  // 1. Logged into your app ('connected')
  // 2. Logged into Facebook, but not your app ('not_authorized')
  // 3. Not logged into Facebook and can't tell if they are logged into
  //    your app or not.
  //
  // These three cases are handled in the callback function.

  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });

  };

  // Load the SDK asynchronously
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

  // Here we run a very simple test of the Graph API after login is
  // successful.  See statusChangeCallback() for when this call is made.
  function testAPI() {
    console.log('Welcome!  Fetching your information.... ');
    FB.api('/me', function(response) {
      console.log('Successful login for: ' + response.name);
      // document.getElementById('status').innerHTML =
      //   'Thanks for logging in, ' + response.name + '!';
    });
  }

  // ****** SOCIAL SHARING BUTTONS ***** //

  function sbg(){
    var buttons = document.getElementsByClassName('sbg-button')

    for(var i=0;i<buttons.length;i++){
      var button = buttons[i]

      if(button.hasAttribute('data-sbg-isBinded')){continue}
      button.setAttribute('data-sbg-isBinded','true')

      var network = button.getAttribute('data-sbg-network')

      bindButton(network,button)
    }

    function bindButton(network,button){
      var height = button.getAttribute('data-sbg-height')
        ,width = button.getAttribute('data-sbg-width')
        ,top = Math.max(0,(screen.height-height)/2)
        ,left = Math.max(0,(screen.width-width)/2)
        ,specs = 
          'height='+height+',width='+width+',top='+top+',left='+left
          +',status=0,toolbar=0,directories=0,location=0'
          +',menubar=0,resizable=1,scrollbars=1'
        ,windowName = 'sbg-window-'+Math.random()

      switch(network){
        case 'facebook':
          var url = buildUrl('http://www.facebook.com/sharer.php',{
            's':100
            ,'p[url]':button.getAttribute('data-sbg-url')
            ,'p[title]':button.getAttribute('data-sbg-title')
            ,'p[summary]':button.getAttribute('data-sbg-summary')
            ,'p[images][0]':button.getAttribute('data-sbg-image')
          })
          button.onclick=function(){
            window.open(url,windowName,specs);
          }
          break;
        case 'twitter':
          var url = buildUrl('http://twitter.com/intent/tweet',{
            'text':button.getAttribute('data-sbg-text')
            ,'via':button.getAttribute('data-sbg-via')
            ,'hashtags':button.getAttribute('data-sbg-hashtags')
          })
          button.onclick=function(){
            window.open(url,windowName,specs);
          }
          break;
        case 'linkedin':
          var url = buildUrl('http://www.linkedin.com/shareArticle',{
            'mini':'true'
            ,'url':button.getAttribute('data-sbg-url')
            ,'title':button.getAttribute('data-sbg-title')
            ,'source':button.getAttribute('data-sbg-source')
            ,'summary':button.getAttribute('data-sbg-summary')
          })
          button.onclick=function(){
            window.open(url,windowName,specs);
          }
          break;
        case 'google-plus':
          var url = buildUrl(' https://plus.google.com/share',{
            'url':button.getAttribute('data-sbg-url')
          })
          button.onclick=function(){
            window.open(url,windowName,specs);
          }
          break;
        case 'pinterest':
          var url = buildUrl('http://www.pinterest.com/pin/create/button/',{
            'url':button.getAttribute('data-sbg-url')
            ,'media':button.getAttribute('data-sbg-media')
            ,'description':button.getAttribute('data-sbg-description')
          })
          button.onclick=function(){
            window.open(url,windowName,specs);
          }
          break;
        case 'email':
          var url = buildUrl('mailto:',{
            'su':button.getAttribute('data-sbg-subject')
            ,'subject':button.getAttribute('data-sbg-subject')
            ,'body':button.getAttribute('data-sbg-body')
          })
          button.setAttribute('href',url)
          break;

      }
    }

    function buildUrl(url, parameters){
      var qs = "";
      for(var key in parameters) {
        var value = parameters[key];
        if(!value){continue}
        value = value.toString().split('\"').join('"');
        qs += key + "=" + encodeURIComponent(value) + "&";
      }
      if (qs.length > 0){
        qs = qs.substring(0, qs.length-1); //chop off last "&"
        url = url + "?" + qs;
      }
      return url;
    }

  }

  return {
    checkLoginState: checkLoginState,
    sbg: sbg
  };
});