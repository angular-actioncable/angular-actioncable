// ngActionCableSocketWrangler to start, stop or try reconnect websockets every intervalTime milliseconds.
//
// Current status is denoted by three booleans:
// connected(), connecting(), and disconnected(), in an abstraction
// of the internal trivalent logic. Exactly one will be true at all times.
//
// Actions are start() and stop()
ngActionCable.factory("ActionCableSocketWrangler", function(ActionCableWebsocket, ActionCableConfig) {
  var intervalTime= 8647;
  var websocket= ActionCableWebsocket;
  var _live= false;
  var _connecting= false;
  var connectNow= function(){
    websocket.attempt_restart();
  };
  var startInterval= function(){
    _connecting= _connecting || setInterval(function(){
      connectNow();
    }, intervalTime);
  };
  var stopInterval= function(){
    clearInterval(_connecting);
    _connecting= false;
  };
  websocket.on_connection_close_callback = function(){
    if (_live) { startInterval(); }
    if (ActionCableConfig.debug) console.log("close callback");
  };
  websocket.on_connection_open_callback = function(){
    stopInterval();
    if (ActionCableConfig.debug) console.log("open callback");
  };
  var methods= {
    connected: function(){
      return (_live && !_connecting);
    },
    connecting: function(){
      return (_live && !!_connecting);
    },
    disconnected: function(){
      return !_live;
    },
    start: function(){
      if (ActionCableConfig.debug) console.info("Live STARTED");
      _live= true;
      startInterval();
      connectNow();
    },
    stop: function(){
      if (ActionCableConfig.debug) console.info("Live stopped");
      _live= false;
      stopInterval();
      websocket.close();
    }
  };
  return methods;
});
