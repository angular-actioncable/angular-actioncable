'use strict';

describe('ActionCableWebsocket', function(){
  var ActionCableWebsocket,
      ActionCableController,
      wsDataStream,
      resetWebsocketMock,
      $websocket,
      dataStreamMock;

  beforeEach(module('ngActionCable'));
  beforeEach(angular.mock.module('ngWebSocket', 'ngWebSocketMock'));

  resetWebsocketMock = function () {
    ActionCableController = {
      post: function() {},
      actions: function() {
        return {};
      },
      after_ping_callback: function() {},
    };

    $websocket= function(url){
      if (dataStreamMock) {
        dataStreamMock.onopen();
        return dataStreamMock;
      }

      var callbacks= {
        open: [],
        close: [],
        message: []
      }

      dataStreamMock= new WebSocket(url);
      dataStreamMock.onOpen= function(cb){ dataStreamMock.onopen= cb; }
      dataStreamMock.onClose = function(cb){ dataStreamMock.onclose= cb; }
      dataStreamMock.onMessage = function(cb){ dataStreamMock.onmessage= cb; }

      dataStreamMock.start = function(args){ dataStreamMock.onopen(); }
      dataStreamMock.close = function(args){ dataStreamMock.onclose(); }
      setTimeout(function(){dataStreamMock.onopen()}, 10);
      return dataStreamMock;
    }

  };

  beforeEach(function() {
    resetWebsocketMock();
    module(function($provide) { $provide.value('$websocket', $websocket); });
    module(function($provide) { $provide.value('ActionCableController', ActionCableController); });
    module(function($provide) { $provide.value('ActionCableConfig', { wsUri: 'ws://localhost:12345', autoStart: false }); });
  });



  beforeEach(inject(function (_ActionCableWebsocket_, _$websocketBackend_, _ActionCableSocketWrangler_, _$rootScope_) {
    ActionCableWebsocket= _ActionCableWebsocket_;
  }));


  it('exists', function(){
    expect(ActionCableWebsocket).toBeObject;
  });

  describe('subscribe', function() {
    beforeEach(function(done) {
      // wsDataStream= $websocket('ws://localhost:12345');
      ActionCableWebsocket.attempt_restart();
      setTimeout(function(){ done() },50);
      // wsDataStream.onOpen(function(arg){   // is never called
      //   console.log("------------------------------ done:");
      //   console.log(done);
      //   done();
      // })
    });

    it('subscribes a channel', function(){
      console.log("------------------------------ ActionCableWebsocket.connected():");
      console.log(ActionCableWebsocket.connected());

      // expect(ActionCableWebsocket.subscribe('channel',{data: 0})).toBe(wsDataStream);
    })
  });

});








