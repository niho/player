Player.js
=========

Player is a playlist abstraction layer on top of
[SoundManager 2](http://www.schillmania.com/projects/soundmanager2/).
It makes it easy to create a full featured music player that can play a list
of songs, complete with play/pause, next/prev, shuffle/repeat and a progress
bar.

Player also fully supports scrobbling and you can easily register a callback
to scrobble a track to any backend service or playlist you want once it has
been played (decided according to the Last.fm rules).

Player currently requires jQuery and jQuery UI (for the progress bar).

Example usage
-------------

    <script type="text/javascript">
    window.SM2_DEFER = true;
    </script>
    <script src="soundmanager2.js" type="text/javascript"></script>
    <script src="jquery.js" type="text/javascript"></script>
    <script src="jquery.ui.js" type="text/javascript"></script>
    <script src="player.js" type="text/javascript"></script>

    <script type="text/javascript">
      $(function(){
        var player = new Player({
          playPause: $('#play-pause'),
          next: $('#next'),
          prev: $('#prev'),
          progress: $('#progress'),
          shuffle: $('#shuffle-button'),
          repeat: $('#repeat-button')
        }, { emulate: true });

        var playlist = [
          {
            url: 'http://example.org/example.mp3',
            play: function() { player.start(this.url) },
            scrobble: function() { $.post('http://example.org/scrobble'); }
          }
        ];

        $('ol.playlist li.track').click(function(e){
          e.preventDefault();
          player
            .setPlaylist(playlist)
            .setPlaylistPosition($(this).parent().index($(this)))
            .playCurrent();
        });
      });
    </script>

Author
------

Player was created by Niklas Holmgren (niklas@sutajio.se) and released under
the MIT license.
