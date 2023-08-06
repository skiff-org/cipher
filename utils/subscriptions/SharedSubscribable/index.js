"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _invariant = _interopRequireDefault(require("../../common/invariant"));
// A subscribable that implements the equivalent of:
// multicast(() => new ReplaySubject(1)) |> refCount Rx operation
//
// In other words:
// - Upon subscription, the source subscribable is subscribed to,
//   and its notifications are passed to subscribers here.
// - Multiple subscribers only cause a single subscription of the source
// - When last subscriber unsubscribes, the source is unsubscribed
// - Upon subscription, the subscriber receives last value sent by source (if any)
var SharedSubscribable = /*#__PURE__*/function () {
  function SharedSubscribable(source) {
    this._unsubscribeSource = null;
    this._subscribers = [];
    this._didEmit = false;
    this._lastValue = null;
    this._source = source;
  }
  var _proto = SharedSubscribable.prototype;
  _proto.subscribe = function subscribe(subscriber, debugInfo) {
    var _this = this;
    var entry = [subscriber, debugInfo];
    this._subscribers.push(entry);
    if (this._didEmit) {
      subscriber(this._lastValue);
    }
    if (1 === this._subscribers.length) {
      // TODO: What if this throws?
      this._unsubscribeSource = this._source(function (value) {
        return _this._notify(value);
      });
    }
    return function () {
      return _this._unsubscribe(entry);
    };
  };
  _proto._notify = function _notify(value) {
    (0, _invariant.default)(this._subscribers.length, "SharedSubscribable's source emitted a value after it was unsubscribed from");
    this._didEmit = true;
    this._lastValue = value;
    this._subscribers.forEach(function ([subscriber]) {
      subscriber(value);
    });
  };
  _proto._unsubscribe = function _unsubscribe(entry) {
    var idx = this._subscribers.indexOf(entry);
    -1 !== idx && this._subscribers.splice(idx, 1);
    if (!this._subscribers.length) {
      var unsubscribe = this._unsubscribeSource;
      this._unsubscribeSource = null;
      this._didEmit = false;
      unsubscribe && unsubscribe();
    }
  };
  return SharedSubscribable;
}();
exports.default = SharedSubscribable;