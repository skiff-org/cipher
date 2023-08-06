"use strict";

exports.__esModule = true;
exports.default = publishReplayLatestWhileConnected;
var _wmelonRxShim = require("../__wmelonRxShim");
// Creates a Connectable observable, that, while connected, replays the latest emission
// upon subscription. When disconnected, the replay cache is cleared.
function publishReplayLatestWhileConnected(source) {
  return source.pipe((0, _wmelonRxShim.multicast)(function () {
    return new _wmelonRxShim.ReplaySubject(1);
  }));
}