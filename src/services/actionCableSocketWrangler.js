// ngActionCableSocketWrangler to start, stop or try reconnect websockets if they die.
//
// Current status is denoted by three booleans:
// connected(), connecting(), and disconnected(), in an abstraction
// of the internal trivalent logic. Exactly one will be true at all times.
//
// Actions are start() and stop()
ngActionCable.factory("ActionCableSocketWrangler", function($rootScope, ActionCableWebsocket, ActionCableConfig, ActionCableController) {
  var reconnectIntervalTime= 7537;
  var timeoutTime= 20143;
  var websocket= ActionCableWebsocket;
  var controller= ActionCableController;
  var _live= false;
  var _connecting= false;
  var _reconnectTimeout= false;
  var setReconnectTimeout= function(){
    stopReconnectTimeout();
    _reconnectTimeout = _reconnectTimeout || setTimeout(function(){
      if (ActionCableConfig.debug) console.log("ActionCable connection might be dead; no pings received recently");
      connection_dead();
    }, timeoutTime + Math.floor(Math.random() * timeoutTime / 5));
  };
  var stopReconnectTimeout= function(){
    clearTimeout(_reconnectTimeout);
    _reconnectTimeout= false;
  };
  controller.after_ping_callback= function(){
    setReconnectTimeout();
  };
  var connectNow= function(){
    websocket.attempt_restart();
    setReconnectTimeout();
  };
  var startReconnectInterval= function(){
    _connecting= _connecting || setInterval(function(){
      connectNow();
    }, reconnectIntervalTime + Math.floor(Math.random() * reconnectIntervalTime / 5));
  };
  var stopReconnectInterval= function(){
    clearInterval(_connecting);
    _connecting= false;
    clearTimeout(_reconnectTimeout);
    _reconnectTimeout= false;
  };
  var connection_dead= function(){
    if (_live) { startReconnectInterval(); }
    if (ActionCableConfig.debug) console.log("socket close");
    $rootScope.$apply();
  };
  websocket.on_connection_close_callback= connection_dead;
  var connection_alive= function(){
    stopReconnectInterval();
    setReconnectTimeout();
    if (ActionCableConfig.debug) console.log("socket open");
    $rootScope.$apply();
  };
  websocket.on_connection_open_callback= connection_alive;
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
      startReconnectInterval();
      connectNow();
    },
    stop: function(){
      if (ActionCableConfig.debug) console.info("Live stopped");
      _live= false;
      stopReconnectInterval();
      stopReconnectTimeout();
      websocket.close();
    }
  };
  if (ActionCableConfig.autoStart) methods.start();
  return methods;
});
