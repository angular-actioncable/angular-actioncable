'use strict';
describe('ActionCableWebsocket', function(){
  // module dependencies
  beforeEach(module('ngActionCable'));
  // set up mocks
  var resetMocks, $websocketClassMock, ngWebSocketInstanceMock, ActionCableConfigMock;
  resetMocks= function() {
    ActionCableConfigMock= {
      wsUri: 'foobarz42uri',
      protocols: []
    };
    ngWebSocketInstanceMock= {
      close: function() {},
      onClose: function() {},
      onOpen: function() {},
      onMessage: function() {},
      send: function() {}
    };
    $websocketClassMock= jasmine.createSpy('$websocketClassMock').and.returnValue(ngWebSocketInstanceMock);
  };
  // inject mocks
  beforeEach(function(){
    resetMocks();
    module(function($provide) { $provide.value('$websocket', $websocketClassMock); });
    module(function($provide) { $provide.value('ActionCableConfig', ActionCableConfigMock); });
  });
  // get item under test
  var ActionCableWebsocket;
  beforeEach(inject(function(_ActionCableWebsocket_) {
    ActionCableWebsocket= _ActionCableWebsocket_;
  }));
  // unit tests
  it('exists', function(){
    expect(ActionCableWebsocket).toBeObject;
  });
  it('uses the initial URI provided by ActionCableConfig', function(){
    ActionCableWebsocket.attempt_restart();
    expect($websocketClassMock).toHaveBeenCalledWith('foobarz42uri', []);
  });
  it('uses a new URI changed after initialisation', function(){
    ActionCableConfigMock.wsUri= 'newBarzUri';
    ActionCableWebsocket.attempt_restart();
    expect($websocketClassMock).toHaveBeenCalledWith('newBarzUri', []);
  });
  it('uses user-defined protocols for websocket connection if provided', function() {
    ActionCableConfigMock.protocols = ['protocol1', 'protocol2'];
    ActionCableWebsocket.attempt_restart();
    expect($websocketClassMock).toHaveBeenCalledWith('foobarz42uri', ['protocol1', 'protocol2']);
  });
});
