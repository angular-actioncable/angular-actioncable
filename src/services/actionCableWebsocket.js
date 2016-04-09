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


ngActionCable.factory("ActionCableWebsocket", function($websocket, ActionCableController, ActionCableConfig) {
  var wsUrl = ActionCableConfig.wsUri;
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
      dataStream = $websocket(wsUrl);
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
});
