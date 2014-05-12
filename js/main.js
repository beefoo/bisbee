(function() {
  var App;

  App = (function() {
    function App(options) {
      var defaults = {
        debug: false
      };
      this.options = $.extend(defaults, options);
      this.init();      
    }   
    
    App.prototype.init = function(){      
      this.initIntroSteps();
      this.initDraggable();
      this.initControls();
      this.initButtons();
      this.initCanvasMask('#canvas-mask','#canvas-masked','#present');
      this.initVideoFeed();
      this.initFullscreen();
    };
    
    App.prototype.initButtons = function(){
      var that = this;
      $('.mask-mode-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        that.doMaskMode();
      });
      $('.mask-toggle-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        that.toggleMask();
      });
      $('.camera-mode-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        that.doCameraMode();
      });
      $('.camera-capture-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        that.captureImage();
        that.doCameraMaskMode();
      });
      $('.camera-mask-toggle-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        that.toggleCameraMask();
      });
      $('.camera-submit-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        that.doSubmitMode();
      });
      $('.submit-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        $('#share').hide();
      });
      $('.caption-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        $('#caption').show();
        $('.caption-button').removeClass('active');
      });
      $('.close-button').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        $('#caption').hide();
        $('.caption-button').addClass('active');
      }); 
    };
    
    App.prototype.initCanvasMask = function(mask_selector, masked_selector, image_masked){
      var that = this,
          $canvas_mask = $(mask_selector),
          $canvas_masked = $(masked_selector);
          
      // init lastXY
      this.lastX = null;
      this.lastY = null;
      
      // init mask context
      this.mask = $canvas_mask[0].getContext("2d");
      
      // init masked context
      this.masked = $canvas_masked[0].getContext("2d");
      
      // draw images
      if (image_masked) {
        $(image_masked).one('load', function() {
          that.masked.drawImage($(image_masked)[0],0,0,1024,768);
          console.log('loaded', image_masked);
        }).each(function() {
          if(this.complete) $(this).load();
        });
      }     
      
      // drag events
      $canvas_mask.hammer().on('dragstart',function(e){
        e.gesture.preventDefault();
        that.drawStart($(this), e);
      });
      $canvas_mask.hammer().on('drag',function(e){
        e.gesture.preventDefault();
        that.draw($(this), e);
      });
      $canvas_mask.hammer().on('dragend',function(e){
        e.gesture.preventDefault();
        that.drawStop($(this), e);
      });
    };
    
    App.prototype.initControls = function(){
      var that = this;
      
      $( ".slider" ).slider({
        min: 0,
        max: 1000,
        value: 500,
        start: function(event, ui) {
          that.activateButton('.mask-mode-button');
        },
        slide: function(event, ui ) {
          var opacity = parseFloat(ui.value/1000);
          that.setOpacity(opacity);
        }
      });
    };   
    
    App.prototype.initDraggable = function(){
      var that = this;
      
      $('.draggable').draggable({
        start: function(event, ui) {
          that.activateButton('.mask-mode-button');
        }
      });
    };
    
    App.prototype.initFullscreen = function(){
      
      $('body').keyup(function(e){
        if(e.keyCode == 32){
            if ((document.fullScreenElement && document.fullScreenElement !== null) ||    // alternative standard method
              (!document.mozFullScreen && !document.webkitIsFullScreen)) {               // current working methods
            if (document.documentElement.requestFullScreen) {
              document.documentElement.requestFullScreen();
            } else if (document.documentElement.mozRequestFullScreen) {
              document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullScreen) {
              document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          }
        }
      });
      
      
    };
    
    App.prototype.initIntroSteps = function(){
      var that = this,
          $steps = $('#intro-steps > .step'),
          steps_length = $steps.length,
          current_step = 0;
      
      $('.next-step').hammer().on('tap',function(e){
        e.gesture.preventDefault();
        current_step++;
        if (current_step<steps_length) {
          $steps.removeClass('active');
          $steps.eq(current_step).addClass('active');
        } else {
          $('#intro-steps').hide();
          $('#main').addClass('skin');
          that.activateButton('.caption-button');
        }        
      });
    };
    
    App.prototype.initVideoFeed = function(){
      var that = this,
          gUM;
          
      this.video = document.getElementById('webcam-video');
      this.localMediaStream = null;
          
      if (this.hasGetUserMedia()){
        // Init video
        console.log('initializing video feed...');        
        gUM = Modernizr.prefixed('getUserMedia', navigator);        
        gUM({video: true}, function(stream) {
          that.video.src = window.URL.createObjectURL(stream);
          that.localMediaStream = stream;
        }, function(er){ console.log('error', er)});        
      }
    };
    
    App.prototype.activateButton = function(selector){
      $(selector).addClass('active');
    };
    
    App.prototype.captureImage = function(){
      var canvas = $('#webcam-canvas-image')[0],
          context = canvas.getContext('2d'),
          $image = $('#webcam-capture'),
          $video = $('#webcam-video');
      if (this.localMediaStream) {        
        context.drawImage(this.video, 0, 0, 1024, 768);
        $image.attr('src', canvas.toDataURL('image/webp'));
        // Disable video
        $video.hide();
        $video[0].pause();
        $video[0].src = '';
        this.localMediaStream.stop();
      }
    };

    App.prototype.deactivateButton = function(selector){
      $(selector).removeClass('active');
    };
    
    App.prototype.doMaskMode = function(){
      var $main = $('#main'),
          modes = $main.attr('data-modes');
      // change main class mode
      $main.removeClass(modes);
      $main.addClass('mask');
      // update buttons
      this.deactivateButton('.mask-mode-button');
      this.deactivateButton('.caption-button');
      // update skinnable
      $('.skinnable').animate({
        opacity: 0
      }, 2000);
      // update slider            
      $('#slider .ui-slider-handle').animate({
        left: '0%'
      }, 2000, function(){
        $('.slider').slider( "value", 0 );
      });
    };
    
    App.prototype.doCameraMaskMode = function(){
      var $main = $('#main'),
          modes = $main.attr('data-modes');
      // change main class mode
      $main.removeClass(modes);
      $main.addClass('camera-mask');
      // update buttons
      this.deactivateButton('.camera-capture-button');
      this.deactivateButton('.camera-mask-toggle-button');   
      // update skinnable
      $('.skinnable').animate({
        opacity: 1
      }, 2000);
      // update slider            
      $('#slider .ui-slider-handle').animate({
        left: '100%'
      }, 2000, function(){
        $('.slider').slider( "value", 1000 );
      });
    };
    
    App.prototype.doCameraMode = function(){
      var $main = $('#main'),
          modes = $main.attr('data-modes');      
      // change main class mode
      $main.removeClass(modes);
      $main.addClass('camera');
      // update buttons
      this.deactivateButton('.camera-mode-button');
      this.activateButton('.camera-capture-button');
      // update skinnable
      $('.skinnable').animate({
        opacity: 0.5
      }, 2000);
      // update slider            
      $('#slider .ui-slider-handle').animate({
        left: '50%'
      }, 2000, function(){
        $('.slider').slider( "value", 500 );
      });
      // init canvas mask
      this.initCanvasMask('#webcam-canvas-mask','#webcam-canvas-masked','#empty');
    };
    
    App.prototype.doSubmitMode = function(){
      $('#share').show();
    };
    
    App.prototype.drawStart = function($parent, e){
      this.activateButton('.mask-done-button');
      this.activateButton('.camera-mask-done-button');
      
      this.updateLastPos($parent, e);
      
      this.mask.beginPath();
      this.mask.moveTo(this.lastX,this.lastY);
      
      this.masked.globalCompositeOperation = 'destination-out';
      this.masked.beginPath();
      this.masked.moveTo(this.lastX,this.lastY);
      
      // console.log('moving to', this.lastX, this.lastY);
    };
    
    App.prototype.draw = function($parent, e){  
      this.updateLastPos($parent, e);
      
      var gradient_red = this.mask.createRadialGradient(this.lastX, this.lastY, 0, this.lastX, this.lastY, 20);
        gradient_red.addColorStop(0, 'rgba(221, 26, 26, 1)');
        gradient_red.addColorStop(1, 'rgba(221, 26, 26, 0)');
        
      this.mask.arc(this.lastX, this.lastY, 20, 0, 2 * Math.PI);
      this.mask.fillStyle = gradient_red;
      this.mask.fill();
      
      var gradient_black = this.masked.createRadialGradient(this.lastX, this.lastY, 0, this.lastX, this.lastY, 20);
        gradient_black.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient_black.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
      this.masked.arc(this.lastX, this.lastY, 20, 0, 2 * Math.PI);
      this.masked.fillStyle = gradient_black;
      this.masked.fill();
      
      // console.log('line to', this.lastX, this.lastY);
    };
    
    App.prototype.drawStop = function($parent, e){     
      this.mask.closePath();
      
      this.masked.globalCompositeOperation = 'source-over';
      this.masked.closePath();

      // console.log('last stroke', this.lastX, this.lastY);
    };
    
    App.prototype.hasGetUserMedia = function() {
      return !!Modernizr.prefixed('getUserMedia', navigator);
    };
    
    App.prototype.setOpacity = function(value){
      $('.skinnable').css({'opacity': value});
    };
    
    App.prototype.toggleCameraMask = function(){
      var $mask = $('#webcam-canvas-mask'),
          $masked = $('#webcam-canvas-masked'),
          $button_done = $('.camera-mask-done-button'),
          $button_back = $('.camera-mask-back-button'),
          $submit_button = $('.camera-submit-button');
      if ($masked.hasClass('active')) {
        $masked.removeClass('active');
        $mask.addClass('active');
        $button_back.removeClass('active');
        $button_done.addClass('active');
        $submit_button.removeClass('active');
        
      } else {
        $masked.addClass('active');
        $mask.removeClass('active');
        $button_done.removeClass('active');
        $button_back.addClass('active');
        $submit_button.addClass('active');
      }
    };
    
    App.prototype.toggleMask = function(){
      var $mask = $('#canvas-mask'),
          $masked = $('#canvas-masked'),
          $button_done = $('.mask-done-button'),
          $button_back = $('.mask-back-button'),
          $webcam_button = $('.camera-mode-button');
      if ($masked.hasClass('active')) {
        $masked.removeClass('active');
        $mask.addClass('active');
        $webcam_button.removeClass('active');
        $button_back.removeClass('active');
        $button_done.addClass('active');        
        
      } else {
        $masked.addClass('active');
        $mask.removeClass('active');
        $webcam_button.addClass('active');
        $button_done.removeClass('active');
        $button_back.addClass('active');
      }
    };
    
    App.prototype.updateLastPos = function($parent, e){
      var x = e.gesture.center.clientX,
          y = e.gesture.center.clientY;
      this.lastX = parseInt(x-$parent.offset().left);
      this.lastY = parseInt(y-$parent.offset().top);
    };

    return App;

  })();

  $(function() {
    return new App({});
  });

}).call(this);

