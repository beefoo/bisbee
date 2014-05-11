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
      this.initDraggable();
      this.initControls();
      this.initButtons();
      this.initCanvasMask();
    };
    
    App.prototype.initButtons = function(){
      var that = this;
      $('.mask-mode-button').hammer().on('tap',function(e){
        e.preventDefault();
        that.doMaskMode();
      });
      $('.mask-toggle-button').hammer().on('tap',function(e){
        e.preventDefault();
        that.toggleMask();
      });
    };
    
    App.prototype.initCanvasMask = function(){
      var that = this,
          $canvas_mask = $('#canvas-mask'),
          $canvas_masked = $('#canvas-masked');
          
      // init lastXY
      this.lastX = null;
      this.lastY = null;
      
      // init mask context
      this.mask = $canvas_mask[0].getContext("2d");
      /* this.mask.lineWidth = 20;
      this.mask.strokeStyle = "#dd1a1a";
      this.mask.lineCap = 'round'; */
      
      // init masked context
      this.masked = $canvas_masked[0].getContext("2d");
      this.masked.lineWidth = 20;
      this.masked.lineCap = 'round';   
      $('#present').one('load', function() {
        that.masked.drawImage($('#present')[0],0,0,1024,742);
        console.log('loaded')
      }).each(function() {
        if(this.complete) $(this).load();
      });
      
      // drag events
      $canvas_mask.hammer().on('dragstart',function(e){
        that.drawStart($(this), e);
      });
      $canvas_mask.hammer().on('drag',function(e){
        that.draw($(this), e);
      });
      $canvas_mask.hammer().on('dragend',function(e){
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
          var opacity = 1- parseFloat(ui.value/1000);
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
    
    App.prototype.activateButton = function(selector){
      $(selector).addClass('active');
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
      // update skinnable
      $('.skinnable').animate({
        opacity: 0
      }, 2000);
      // update slider            
      $('#slider .ui-slider-handle').animate({
        left: '100%'
      }, 2000, function(){
        $('.slider').slider( "value", 1000 );
      });
    };
    
    App.prototype.drawStart = function($parent, e){
      this.activateButton('.mask-toggle-button');
      
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
    
    App.prototype.setOpacity = function(value){
      $('.skinnable').css({'opacity': value});
    };
    
    App.prototype.toggleMask = function(){
      var $mask = $('#canvas-mask'),
          $masked = $('#canvas-masked'),
          $button = $('.mask-toggle-button');
      if ($masked.hasClass('active')) {
        $masked.removeClass('active');
        $mask.addClass('active');
        $button.text($button.attr('data-off'));
        
      } else {
        $masked.addClass('active');
        $mask.removeClass('active');
        $button.text($button.attr('data-on'));
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

