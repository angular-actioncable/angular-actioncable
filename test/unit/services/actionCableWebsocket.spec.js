'use strict';

describe('ActionCableWebsocket', function(){
  var ActionCableWebsocket,
      ActionCableController,
      wsDataStream,
      resetWebsocketMock,
      $websocketBackend,
      $websocket;

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
  };

  beforeEach(function() {
    resetWebsocketMock();
    // module(function($provide) { $provide.value('$websocket', $websocket); });
    module(function($provide) { $provide.value('ActionCableController', ActionCableController); });
    module(function($provide) { $provide.value('ActionCableConfig', { wsUri: 'ws://localhost:8080/api', autoStart: false }); });
  });



  beforeEach(inject(function (_ActionCableWebsocket_, _$websocketBackend_, _$websocket_, _ActionCableSocketWrangler_) {
    ActionCableWebsocket= _ActionCableWebsocket_;
    $websocketBackend = _$websocketBackend_;
    $websocket = _$websocket_;
    // _ActionCableSocketWrangler_.start();

    $websocketBackend.mock();
    $websocketBackend.expectConnect('ws://localhost:8080/api');
    $websocketBackend.expectClose();
    // $websocketBackend.expectSend({data: JSON.stringify({test: true})});

  }));


  it('exists', function(){
    expect(ActionCableWebsocket).toBeObject;
  });

  describe('subscribe', function() {
    beforeEach(function(done) {
      // var _done= done;
      wsDataStream= $websocket('ws://localhost:8080/api');

      console.log("------------------------------ websocketBackend.isConnected():");
      console.log($websocketBackend.isConnected('ws://localhost:8080/api'));    //returns true
      // done();

      // ActionCableWebsocket.attempt_restart();
      wsDataStream.onOpen(function(arg){   // is never called
        console.log("------------------------------ done:");
        console.log(done);
        done();
      })

      // $websocketBackend.flush();
    });

    it('subscribes a channel', function(){
      console.log("------------------------------ ActionCableWebsocket.connected():");
      console.log(ActionCableWebsocket.connected());

      // expect(ActionCableWebsocket.subscribe('channel',{data: 0})).toBe(wsDataStream);
    })
  });

});








