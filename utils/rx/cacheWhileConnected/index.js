"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = cacheWhileConnected;
var _wmelonRxShim = require("../__wmelonRxShim");
var _publishReplayLatestWhileConnected = _interopRequireDefault(require("../publishReplayLatestWhileConnected"));
// Equivalent to observable |> distinctUntilChanged |> publishReplayLatestWhileConnected |> refCount
//
// Creates an observable that shares the connection with and replays the latest value from the underlying
// observable, and skips emissions that are the same as the previous one
function cacheWhileConnected(source) {
  return source.pipe((0, _wmelonRxShim.distinctUntilChanged)(), _publishReplayLatestWhileConnected.default).refCount();
}