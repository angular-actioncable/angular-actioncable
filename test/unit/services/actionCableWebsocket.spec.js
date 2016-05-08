'use strict';

describe('ActionCableWebsocket', function(){
  var ActionCableWebsocket,
      ActionCableController;

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
    module(function($provide) { $provide.value('ActionCableConfig', { autoStart: false }); });
  });

  beforeEach(inject(function(_ActionCableWebsocket_){
    ActionCableWebsocket= _ActionCableWebsocket_;
  }));





  it('exists', function(){
    expect(ActionCableWebsocket).toBeObject;
  });

});







    // var $websocketBackend;

    // beforeEach(angular.mock.module('ngWebSocket', 'ngWebSocketMock');

    // beforeEach(inject(function (_$websocketBackend_) {
    //   $websocketBackend = _$websocketBackend_;

    //   $websocketBackend.mock();
    //   $websocketBackend.expectConnect('ws://localhost:8080/api');
    //   $websocketBackend.expectSend({data: JSON.stringify({test: true})});
    // }));
