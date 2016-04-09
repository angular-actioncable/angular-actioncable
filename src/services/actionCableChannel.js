ngActionCable.factory("ActionCableChannel",function ($q, ActionCableController, ActionCableWebsocket, ActionCableConfig){
  return function(channelName, channelParams){
    this._websocketControllerActions= function(){
      ActionCableController.actions[this.channelName]= ActionCableController.actions[this.channelName] || {};
      ActionCableController.actions[this.channelName][this._channelParamsString]= ActionCableController.actions[this.channelName][this._channelParamsString] || [];
      return ActionCableController.actions[this.channelName][this._channelParamsString];
    };

    this._subscriptionCount= function(){
      return this.callbacks.length;
    };

    this.channelName= channelName;
    this.channelParams= channelParams || {};
    this._channelParamsString= JSON.stringify(this.channelParams);
    this.onMessageCallback= null;
    this.callbacks= this._websocketControllerActions();

    this.subscribe= function(cb){
      var request;
      if ((typeof(cb)!=="function")) {
        console.error("0x01 Callback function was not defined on subscribe(). ActionCable channel: '"+this.channelName+"', params: '"+this._channelParamsString+"'");
        return $q.reject();
      }
      if (this.onMessageCallback) {
        console.error("0x02 This ActionCableChannel instance is already subscribed. ActionCable channel: '"+this.channelName+"', params: '"+this._channelParamsString+"'");
        return $q.reject();
      }
      if (this._subscriptionCount() === 0) { request= ActionCableWebsocket.subscribe(this.channelName, this.channelParams); }
      this._addMessageCallback(cb);
      return (request || $q.resolve());
    };
    this.unsubscribe= function(){
      var request;
      this._removeMessageCallback();
      if (this._subscriptionCount() === 0) { request= ActionCableWebsocket.unsubscribe(this.channelName, this.channelParams); }
      return (request || $q.resolve());
    };
    this.send= function(message, action){
      if (!this.onMessageCallback) {
        console.error("0x03 You need to subscribe before you can send a message. ActionCable channel: '"+this.channelName+"', params: '"+this._channelParamsString+"'");
        return $q.reject();
      }
      return ActionCableWebsocket.send(this.channelName, this.channelParams, message, action);
    };

    this._addMessageCallback= function(cb){
      this.onMessageCallback= cb;
      this.callbacks.push(this.onMessageCallback);
    };

    this._removeMessageCallback= function(){
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
  };
});
