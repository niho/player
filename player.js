var Player = function(controls) {
  var self = this;
  this.controls = controls;
  this.playlist = null;
  this.playlistPosition = null;
  this.shuffle = false;
  this.repeat = false;
  this.el = document.createElement('audio');
  $(this.el)
  .bind('playing', function(e){
    self.controls.playPause.addClass('pause').attr('disabled', null);
    self.controls.progress.slider('enable');
  })
  .bind('pause', function(e){
    self.scrobbleTrack();
    self.controls.playPause.removeClass('pause');
  })
  .bind('ended', function(e){
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
  })
  .bind('durationchange', function(e){
    $('a.loading').removeClass('loading');
    self.controls.progress.slider('option', 'max', this.duration);
  })
  .bind('timeupdate', function(e){
    if(Math.abs((this.currentTime - self.previousPlayedTime)) < 1000) {
      self.totalPlayedTime = self.totalPlayedTime + Math.abs(this.currentTime - self.previousPlayedTime);
      if(((self.totalPlayedTime > 240000) || (self.totalPlayedTime > (this.duration * 0.5))) && (self.shouldScrobble == false)) {
        self.shouldScrobble = true;
      }
    }
    self.previousPlayedTime = this.currentTime;
    self.controls.progress.slider('value', this.currentTime);
  })
  .bind('error', function(e){
    $('a.loading').removeClass('loading');
    switch(this.error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        $('#error').text('Error - Unable to play track.').fadeIn('slow');
      break;
      case MediaError.MEDIA_ERR_NETWORK:
        $('#error').text('Error - Failed to load the track. ' +
          'Check your internet connection.').fadeIn('slow');
      break;
      case MediaError.MEDIA_ERR_DECODE:
        $('#error').text('Error - Failed to decode track.').fadeIn('slow');
      break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        $('#error').text('Error - Unable to play track. Either the file is ' +
            ' corrupt or you might need to install a codec for the file type.'
          ).fadeIn('slow');
      break;
    }
  });
  this.controls.progress.slider({
    range: 'min', value: 0, min: 0, max: 100,
    slide: function(e, ui){
      self.setCurrentTime(ui.value);
    }
  }).slider('disable');
  this.controls.playPause.click(function(e){
    e.preventDefault();
    self.toggle();
  });
  this.controls.next.click(function(e){
    e.preventDefault();
    self.next();
  });
  this.controls.prev.click(function(e){
    e.preventDefault();
    self.prev();
  });
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
  bind: function(event, callback) {
    $(this.el).bind(event, callback);
    return this;
  },
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
  start: function(url) {
    this.shouldScrobble = false;
    this.hasScrobbled = false;
    this.totalPlayedTime = 0;
    this.previousPlayedTime = 0;
    this.el.src = url;
    this.el.load();
    this.startPlayback();
    return this;
  },
  startPlayback: function() {
    this.el.play();
    return this;
  },
  pausePlayback: function() {
    this.el.pause();
    return this;
  },
  toggle: function() {
    if(this.playlist) {
      if(this.el.paused) { this.startPlayback(); } else { this.pausePlayback(); }
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
  setCurrentTime: function(time) {
    this.el.currentTime = time;
    return this;
  },
  setVolume: function(value) {
    $(this.el).animate({ volume: value });
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
