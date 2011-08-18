var Player = function(controls, options) {
  var self = this;
  var options = options || {};
  this.controls = controls;
  this.playlist = null;
  this.playlistPosition = null;
  this.shuffle = false;
  this.repeat = false;

  window.soundManager = this.soundManager = new SoundManager();
  this.soundManager.flashVersion = 9; 
  this.soundManager.useMovieStar = true;
  this.soundManager.useHTML5Audio = true;
  this.soundManager.flashLoadTimeout = 0;
  if(options.soundManagerUrl) {
    this.soundManager.url = options.soundManagerUrl;
  }
  this.soundManager.beginDelayedInit();

  if(this.controls.progress) {
    this.controls.progress.slider({
      range: 'min', value: 0, min: 0, max: 100,
      slide: function(e, ui){
        self.setCurrentTime(ui.value);
      }
    }).slider('disable');
  }

  if(this.controls.playPause) {
    this.controls.playPause.click(function(e){
      e.preventDefault();
      self.toggle();
    });
  }

  if(this.controls.next) {
    this.controls.next.click(function(e){
      e.preventDefault();
      self.next();
    });
  }

  if(this.controls.prev) {
    this.controls.prev.click(function(e){
      e.preventDefault();
      self.prev();
    });
  }

  if(this.controls.shuffle) {
    this.controls.shuffle.change(function(e){
      self.shuffle = this.checked;
      if(this.checked) {
        $(this).next('label').addClass('checked');
        if(self.playlist) {
          self.controls.prev.attr('disabled', null);
          self.controls.next.attr('disabled', null);
        }
      } else {
        $(this).next('label').removeClass('checked');
      }
    });
  }

  if(this.controls.repeat) {
    this.controls.repeat.change(function(e){
      self.repeat = this.checked;
      if(this.checked) {
        $(this).next('label').addClass('checked');
        if(self.playlist) {
          self.controls.prev.attr('disabled', null);
          self.controls.next.attr('disabled', null);
        }
      } else {
        $(this).next('label').removeClass('checked');
        if(self.playlistPosition == 0) {
          self.controls.prev.attr('disabled', 'disabled');
        }
        if(self.playlist &&
           self.playlistPosition == (self.playlist.length - 1)) {
          self.controls.next.attr('disabled', 'disabled');
        }
      }
    });
  }

  $(document).keydown(function(e){
    if(e.keyCode == 32) {
      if(e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
        e.preventDefault();
        self.toggle();
      }
    }
  });
};

Player.prototype = {
  setPlaylist: function(playlist) {
    this.playlist = playlist;
    return this;
  },
  setPlaylistPosition: function(position) {
    this.playlistPosition = position;
    return this;
  },
  currentTrack: function() {
    return this.playlist ? this.playlist[this.playlistPosition] : null;
  },
  start: function(url, callback) {
    var self = this;
    this.shouldScrobble = false;
    this.hasScrobbled = false;
    this.totalPlayedTime = 0;
    this.previousPlayedTime = 0;
    this.paused = true;
    if(this.sound) {
      this.sound.destruct();
    }
    this.sound = this.soundManager.createSound({
      id: 'sound',
      url: url,
      isMovieStar: url.search(/mp4|m4a$/i) == -1 ? false : true,
      onplay: function() {
        self.controls.playPause.addClass('pause').attr('disabled', null);
        self.controls.progress.slider('enable');
        self.paused = false;
        if(callback) {
          callback();
        }
      },
      onresume: function() {
        self.controls.playPause.addClass('pause');
        self.paused = false;
      },
      onpause: function() {
        self.scrobbleTrack();
        self.controls.playPause.removeClass('pause');
        self.paused = true;
      },
      onfinish: function() {
        self.scrobbleTrack();
        if(self.playlistPosition ==
          (self.playlist.length - 1)) {
          if((self.repeat == true) ||
             (self.shuffle == true)) {
            self.next();
          } else {
            self.playlist = null;
            self.playlistPosition = null;
            self.controls.progress.slider('disable').slider('value', 0);
            self.controls.playPause.attr('disabled','disabled')
                                   .removeClass('pause');
            self.controls.next.attr('disabled', 'disabled');
            self.controls.prev.attr('disabled', 'disabled');
            $('.playing').removeClass('playing');
          }
        } else {
          self.next();
        }
      },
      whileloading: function() {
        self.controls.progress.slider('option', 'max', this.duration);
      },
      whileplaying: function() {
        if(Math.abs((this.position - self.previousPlayedTime)) < 1000) {
          self.totalPlayedTime = self.totalPlayedTime + Math.abs(this.position - self.previousPlayedTime);
          if(((self.totalPlayedTime > 240000) || (self.totalPlayedTime > (this.duration * 0.5))) && (self.shouldScrobble == false)) {
            self.shouldScrobble = true;
          }
        }
        self.previousPlayedTime = this.position;
        self.controls.progress.slider('value', this.position);
      }
    });
    this.startPlayback();
    return this;
  },
  startPlayback: function() {
    this.sound.play();
    return this;
  },
  pausePlayback: function(){
    this.sound.pause();
    return this;
  },
  toggle: function() {
    if(this.playlist) {
      if(this.paused) { this.startPlayback(); } else { this.pausePlayback(); }
    }
    return this;
  },
  playCurrent: function() {
    if(this.currentTrack()) {
      this.currentTrack().play();
    }
    if(this.playlistPosition == 0) {
      if((this.repeat == false) &&
         (this.shuffle == false)) {
        this.controls.prev.attr('disabled', 'disabled');
      } else {
        this.controls.prev.attr('disabled', null);
      }
    } else {
      this.controls.prev.attr('disabled', null);
    }
    if(this.playlistPosition ==
      (this.playlist.length - 1)) {
      if((this.repeat == false) &&
         (this.shuffle == false)) {
        this.controls.next.attr('disabled', 'disabled');
      } else {
        this.controls.next.attr('disabled', null);
      }
    } else {
      this.controls.next.attr('disabled', null);
    }
    return this;
  },
  next: function() {
    this.scrobbleTrack();
    if(this.shuffle) {
      this.playlistPosition = Math.floor(Math.random()*this.playlist.length);
      this.playCurrent();
    } else {
      if(this.repeat &&
          (this.playlistPosition ==
          (this.playlist.length - 1))) {
        this.playlistPosition = 0;
        this.playCurrent();
      } else {
        this.playlistPosition = this.playlistPosition + 1;
        this.playCurrent();
      }
    }
    return this;
  },
  prev: function() {
    this.scrobbleTrack();
    if(this.shuffle) {
      this.playlistPosition = Math.floor(Math.random()*this.playlist.length);
      this.playCurrent();
    } else {
      if(this.repeat &&
        (this.playlistPosition == 0)) {
        this.playlistPosition = this.playlist.length - 1;
        this.playCurrent();
      } else {
        this.playlistPosition = this.playlistPosition - 1;
        this.playCurrent();
      }
    }
    return this;
  },
  setCurrentTime: function(value) {
    this.sound.setPosition(value);
    return this;
  },
  setVolume: function(value) {
    this.sound.setVolume(value*100.0);
    return this;
  },
  scrobbleTrack: function() {
    if(this.currentTrack() &&
       this.shouldScrobble == true &&
       this.hasScrobbled == false) {
      this.hasScrobbled = true;
      if(this.currentTrack().scrobble) {
        this.currentTrack().scrobble();
      }
    }
    return this;
  }
};
