'use strict';

angular.module('parserApp')
  .controller('NavbarCtrl', function ($scope) {
    
    $scope.toggleNavbar = function() {
      $('.navbar-menu').fadeToggle();
    };

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

    sbg();
  });