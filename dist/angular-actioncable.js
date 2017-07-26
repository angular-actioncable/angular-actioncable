'use strict';

var ngActionCable = angular.module('ngActionCable', ['ngWebSocket']);

(function() {
  'use strict';

  angular.module('ngActionCable')
    .factory('ActionCableChannel', ['$q', '$rootScope', 'ActionCableController', 'ActionCableWebsocket', 'ActionCableConfig', 'ActionCableSocketWrangler', ActionCableChannelFactory]);

  function ActionCableChannelFactory($q, $rootScope, ActionCableController, ActionCableWebsocket, ActionCableConfig, ActionCableSocketWrangler){

    function ActionCableChannel(channelName, channelParams) {
      this.channelName= channelName;
      this.channelParams= channelParams || {};
      this._channelParamsString= JSON.stringify(this.channelParams);
      this.onMessageCallback= null;
      this.callbacks= this._websocketControllerActions();
    }

    ActionCableChannel.prototype._websocketControllerActions = function() {
      ActionCableController.actions[this.channelName]= ActionCableController.actions[this.channelName] || {};
      ActionCableController.actions[this.channelName][this._channelParamsString]= ActionCableController.actions[this.channelName][this._channelParamsString] || [];
      return ActionCableController.actions[this.channelName][this._channelParamsString];
    };

    ActionCableChannel.prototype._subscriptionCount= function(){
      return this.callbacks.length;
    };

    ActionCableChannel.prototype.subscribe = function(cb){
      var request;

      if (typeof(cb) !== 'function') {
        console.error("0x01 Callback function was not defined on subscribe(). ActionCable channel: '"+this.channelName+"', params: '"+this._channelParamsString+"'");
        return $q.reject();
      }

      if (this.onMessageCallback) {
        console.error("0x02 This ActionCableChannel instance is already subscribed. ActionCable channel: '"+this.channelName+"', params: '"+this._channelParamsString+"'");
        return $q.reject();
      }

      if (this._subscriptionCount() === 0) {
        request = ActionCableWebsocket.subscribe(this.channelName, this.channelParams);
      }

      this._addMessageCallback(cb);

      return (request || $q.resolve());
    };

    ActionCableChannel.prototype.unsubscribe = function(){
      var request;
      this._removeMessageCallback();
      if (this._subscriptionCount() === 0) { request= ActionCableWebsocket.unsubscribe(this.channelName, this.channelParams); }
      return (request || $q.resolve());
    };

    ActionCableChannel.prototype.send = function(message, action){
      if (!this.onMessageCallback) {
        console.error("0x03 You need to subscribe before you can send a message. ActionCable channel: '"+this.channelName+"', params: '"+this._channelParamsString+"'");
        return $q.reject();
      }
      return ActionCableWebsocket.send(this.channelName, this.channelParams, message, action);
    };

    ActionCableChannel.prototype.onConfirmSubscription = function(callback) {
      if (ActionCableConfig.debug) { console.log('Callback', 'confirm_subscription:' +  this.channelName); }
      $rootScope.$on('confirm_subscription:' +  this.channelName, callback);
    };

    ActionCableChannel.prototype._addMessageCallback= function(cb){
      this.onMessageCallback= cb;
      this.callbacks.push(this.onMessageCallback);
    };

    ActionCableChannel.prototype._removeMessageCallback= function(){
      for(var i=0; i<this.callbacks.length; i++){
        if (this.callbacks[i]===this.onMessageCallback) {
          this.callbacks.splice(i, 1);
          this.onMessageCallback= null;
          return true;
        }
      }
      if (ActionCableConfig.debug) { console.log("Callbacks:"); console.log(this.callbacks); }
      if (ActionCableConfig.debug) { console.log("onMessageCallback:"); console.log(this.onMessageCallback); }
      throw "Can't find onMessageCallback in callbacks array to remove";
    };

    return ActionCableChannel;
  }
})();

'use strict';

// default websocket configs
// looks for Rails' <%= action_cable_meta_tag %> in this format:
// <meta name="action-cable-url" content="ws://localhost:3000/cable"/>
ngActionCable.factory('ActionCableConfig', function() {
  var defaultWsUri= 'wss://please.add.an.actioncable.meta.tag.invalid:12345/path/to/cable';
  var _wsUri;
  var config= {
    autoStart: true,
    debug: false,
    protocols: []
  };
  Object.defineProperty(config, 'wsUri', {
    get: function () {
      _wsUri= _wsUri || actioncable_meta_tag_content() ||  defaultWsUri;
      return _wsUri;
    },
    set: function(newWsUri) {
      _wsUri= newWsUri;
      return _wsUri;
    }
  });
  return config;
  function actioncable_meta_tag_content() {
    var metaTags= document.getElementsByTagName('meta');
    var metaTagContent= false;
    for (var index = 0; index < metaTags.length; index++) {
      if (metaTags[index].hasAttribute('name') && metaTags[index].hasAttribute('content')) {
        if (metaTags[index].getAttribute('name')=== 'action-cable-url' ){
          metaTagContent= metaTags[index].getAttribute('content');
          break;
        }
      }
    }
    return metaTagContent;
  }
});

(function() {
  'use strict';

  angular.module('ngActionCable')
    .factory('ActionCableController', ['$rootScope', 'ActionCableConfig', ActionCableController]);

  function ActionCableController($rootScope, ActionCableConfig) {

    // add a hash of callbacks here that `route_channel` will call on an incoming message.
    // actions format: actions[channelName][dataParams] = [callback1, callback2, ...]
    // e.g. actions["GlobalsData"][JSON.stringify({"responder_id":1})]= [function(message){...}, assignment_2: function(message){...}, ... ]
    var actions = {
      welcome: function(message){
        if (ActionCableConfig.debug) {
          console.log('Willkommen');
        }
      },
      ping: function(message){
        if (ActionCableConfig.debug) {
          console.log('ActionCable ping');
        }
      },

      // Rails5.0.0.beta3 backport
      _ping: function(message){
        if (ActionCableConfig.debug) {
          console.log('ActionCable 5.0.0.beta3 ping');
        }
      },
      confirm_subscription: function(message) {
        var identifier = JSON.parse(message.identifier);
        var channel    = identifier.channel;

        $rootScope.$broadcast('confirm_subscription:' +  channel);

        if (ActionCableConfig.debug) {
          console.log('ActionCable confirm_subscription on channel: ' + message.identifier);
        }
      },
      ws_404: function(message){
        if (ActionCableConfig.debug) {
          console.log('ActionCable route not found: ' + message);
        }
      }
    };

    var routeToActions= function(actionCallbacks, message){
      angular.forEach(actionCallbacks, function(func, id){
        func.apply(null, [message]);
      });
    };

    var route = function(message){
      if (!!actions[message.type]) {
        actions[message.type](message);
        if (message.type == 'ping') methods.after_ping_callback();
      } else if (message.identifier == '_ping') {     // Rails5.0.0.beta3 backport
        actions._ping(message);                       // Rails5.0.0.beta3 backport
        methods.after_ping_callback();                // Rails5.0.0.beta3 backport
      } else if (!!findActionCallbacksForChannel(channel_from(message), params_from(message))) {
        var actionCallbacks= findActionCallbacksForChannel(channel_from(message), params_from(message));
        routeToActions(actionCallbacks, message.message);
      } else {
        actions.ws_404(message);
      }
    };


    function findActionCallbacksForChannel(channelName, params){
      return (actions[channelName] && actions[channelName][params]);
    }

    function channel_from(message){
      if (message && message.identifier) {
        return JSON.parse(message.identifier).channel;
      }
    }

    function params_from(message){
      var paramsData= JSON.parse(message.identifier).data;
      return JSON.stringify(paramsData);
    }

    var methods = {
      post: function(message){
        return route(message);
      },
      actions: actions,
      after_ping_callback: function(){}
    };

    return methods;
  }

})();

'use strict';

// ngActionCableSocketWrangler to start, stop or try reconnect websockets if they die.
//
// Current status is denoted by three booleans:
// connected(), connecting(), and disconnected(), in an abstraction
// of the internal trivalent logic. Exactly one will be true at all times.
//
// Actions are start() and stop()
ngActionCable.factory('ActionCableSocketWrangler', ['$rootScope', 'ActionCableWebsocket', 'ActionCableConfig', 'ActionCableController',
function($rootScope, ActionCableWebsocket, ActionCableConfig, ActionCableController) {
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

  Object.defineProperties(methods, {
    connected: {
      get: function () {
        return (_live && !_connecting);
      }
    },
    connecting: {
      get: function () {
        return (_live && !!_connecting);
      }
    },
    disconnected: {
      get: function(){
        return !_live;
      }
    }
  });

  if (ActionCableConfig.autoStart) methods.start();
  return methods;
}]);

'use strict';

// ActionCable JSON formats:
//
// "identifier" for subscribe, unsubscribe and message must be the same to refer the same subscription!
//
// {
//   "command": "subscribe",
//   "identifier": JSON.stringify({"channel": "UpdatesChannel",  "data": "name"}),
// }
//  - will set params to ["identifier"]["data"]
//
// {
//   "command": "unsubscribe",
//   "identifier": JSON.stringify({"channel": "UpdatesChannel",  "data": "name"}),
// }
//  - will set params to ["identifier"]["data"]
//
// {
//   "command": "message",
//   "identifier": JSON.stringify({"channel": "UpdatesChannel",  "data": "name"}),
//   "data": JSON.stringify({"message": "bla bla", "action": "foobar"})
// }
//  - will call foobar(data)
//  - will set params to ["identifier"]["data"]


ngActionCable.factory("ActionCableWebsocket", ['$websocket', 'ActionCableController', 'ActionCableConfig', function($websocket, ActionCableController, ActionCableConfig) {
  var settings= {};
  Object.defineProperties(settings, {
    wsUrl: {
      get: function(){ return ActionCableConfig.wsUri; }
    },
    protocols: {
      get: function(){ return ActionCableConfig.protocols; }
    }
  });
  var controller = ActionCableController;
  var dataStream = null;
  var methods;
  var connected = false;
  var currentChannels = [];
  var close_connection = function(){
    if (dataStream){
      dataStream.close({"force":true});
      dataStream = null;
      connected = false;
    }
  };
  var subscribe_to = function(channel, data){
    if (typeof(data)==='undefined') data = "N/A";
    if (ActionCableConfig.debug) console.log("-> subscribing to: " + channel);
    return new_data_stream().send(JSON.stringify({
        "command": "subscribe",
        "identifier": JSON.stringify({"channel": channel, "data": data})
      }));
  };
  var unsubscribe_from = function(channel, data){
    if (typeof(data)==='undefined') data = "N/A";
    if (ActionCableConfig.debug) console.log("<- unsubscribing from: " + channel);
    return new_data_stream().send(JSON.stringify({
        "command": "unsubscribe",
        "identifier": JSON.stringify({"channel": channel, "data": data})
      }));
  };
  var send_to = function(channel, data, message, action){
    if (typeof(data)==='undefined') data = "N/A";
    if (ActionCableConfig.debug) console.log("=> sending to: " + channel);
    return new_data_stream().send(JSON.stringify({
        "command": "message",
        "identifier": JSON.stringify({"channel": channel, "data": data}),
        "data": JSON.stringify({"message": message, "action": action})
      }));
  };
  var new_data_stream = function(){
    if(dataStream === null) {
      dataStream = $websocket(settings.wsUrl, settings.protocols);
      dataStream.onClose(function(arg){
        close_connection();
        connected = false;
        methods.on_connection_close_callback();
      });
      dataStream.onOpen(function(arg){
        connected = true;
        currentChannels.forEach(function(channel){ subscribe_to(channel.name, channel.data); });
        methods.on_connection_open_callback();
      });
      dataStream.onMessage(function(message) {   //arriving message from backend
        controller.post(JSON.parse(message.data));
      });
    }
    return dataStream;
  };
  methods = {
    connected: function(){ return connected; },
    attempt_restart: function(){
      close_connection();
      new_data_stream();
      return true;
    },
    currentChannels: currentChannels,
    close: function(){ return close_connection(); },
    on_connection_close_callback: function(){},
    on_connection_open_callback: function(){},
    subscribe: function(channel, data){
      currentChannels.push({name: channel, data: data});
      return (this.connected() && subscribe_to(channel, data));
    },
    unsubscribe: function(channel, data){
      for(var i=0; i<currentChannels.length; i++){ if (currentChannels[i].name===channel) {currentChannels.splice(i, 1);} }
      return (this.connected() && unsubscribe_from(channel, data));
    },
    send: function(channel, data, message, action){
      if (ActionCableConfig.debug) console.log("send requested");
      return (this.connected() && send_to(channel, data, message, action));
    }
  };
  return methods;
}]);

//# sourceMappingURL
