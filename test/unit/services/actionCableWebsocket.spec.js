'use strict';

describe('ActionCableWebsocket', function(){
  var ActionCableWebsocket,
      ActionCableController,
      wsDataStream,
      resetWebsocketMock,
      $websocketBackend,
      $websocket;

  beforeEach(angular.mock.module('ngWebSocket', 'ngWebSocketMock'));
  beforeEach(module('ngActionCable'));

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
    module(function($provide) { $provide.value('ActionCableConfig', { wsUri: 'ws://localhost:8080/api', autoStart: true }); });
  });



  beforeEach(inject(function (_ActionCableWebsocket_, _$websocketBackend_, _$websocket_, _ActionCableSocketWrangler_) {
    ActionCableWebsocket= _ActionCableWebsocket_;
    $websocketBackend = _$websocketBackend_;
    $websocket = _$websocket_;
    // _ActionCableSocketWrangler_.start();

    $websocketBackend.mock();
    $websocketBackend.expectConnect('ws://localhost:8080/api');
    $websocketBackend.expectSend({data: JSON.stringify({test: true})});

  }));


  it('exists', function(){
    expect(ActionCableWebsocket).toBeObject;
  });

  describe('subscribe', function() {
    beforeEach(function(done) {
      $websocket('ws://localhost:8080/api');
      var _done= done;
      // ActionCableWebsocket.attempt_restart();
      $websocket.onOpen = function(){
        console.log("``````````````````````````````");
        console.log(d);
        _done();
      }
    });

    it('subscribes a channel', function(){
      console.log("----------------------------------------------------");
      console.log(ActionCableWebsocket.connected());

      // expect(ActionCableWebsocket.subscribe('channel',{data: 0})).toBe(wsDataStream);
    })
  });

});








