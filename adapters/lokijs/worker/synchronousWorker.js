"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _DatabaseBridge = _interopRequireDefault(require("./DatabaseBridge"));
var _cloneMessage = _interopRequireDefault(require("./cloneMessage"));
// Simulates the web worker API
var SynchronousWorker = /*#__PURE__*/function () {
  function SynchronousWorker() {
    var _this = this;
    this.onmessage = function () {};
    // $FlowFixMe
    this._workerContext = {
      postMessage: function postMessage(data) {
        _this.onmessage({
          data: (0, _cloneMessage.default)(data)
        });
      },
      onmessage: function onmessage() {}
    };
    // $FlowFixMe
    this._bridge = new _DatabaseBridge.default(this._workerContext);
  }
  var _proto = SynchronousWorker.prototype;
  _proto.postMessage = function postMessage(data) {
    this._workerContext.onmessage({
      data: (0, _cloneMessage.default)(data)
    });
  };
  return SynchronousWorker;
}();
exports.default = SynchronousWorker;