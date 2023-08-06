"use strict";

exports.__esModule = true;
exports.default = void 0;
function createWorker(useWebWorker) {
  if (useWebWorker) {
    var LokiWebWorker = require('./worker/loki.worker');
    return new LokiWebWorker();
  }
  var LokiSynchronousWorker = require('./worker/synchronousWorker').default;
  return new LokiSynchronousWorker();
}
var _actionId = 0;
function nextActionId() {
  _actionId += 1;
  return _actionId;
}
var LokiDispatcher = /*#__PURE__*/function () {
  function LokiDispatcher(useWebWorker) {
    var _this = this;
    this._pendingCalls = [];
    this._worker = createWorker(useWebWorker);
    this._worker.onmessage = function ({
      data: data
    }) {
      var {
        result: result,
        id: responseId
      } = data;
      var {
        callback: callback,
        id: id
      } = _this._pendingCalls.shift();

      // sanity check
      if (id !== responseId) {
        callback({
          error: new Error('Loki worker responses are out of order')
        });
        return;
      }
      callback(result);
    };
  }

  // TODO: `any` return should be `WorkerResponsePayload`
  var _proto = LokiDispatcher.prototype;
  _proto.call = function call(type, payload = [], callback = function () {},
  // NOTE: This are used when not using web workers (otherwise, the data naturally is just copied)
  cloneMethod = 'immutable', returnCloneMethod = 'immutable') {
    var id = nextActionId();
    this._pendingCalls.push({
      callback: callback,
      id: id
    });
    this._worker.postMessage({
      id: id,
      type: type,
      payload: payload,
      cloneMethod: cloneMethod,
      returnCloneMethod: returnCloneMethod
    });
  };
  return LokiDispatcher;
}();
exports.default = LokiDispatcher;