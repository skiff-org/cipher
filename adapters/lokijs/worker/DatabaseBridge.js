"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _logError = _interopRequireDefault(require("../../../utils/common/logError"));
var _invariant = _interopRequireDefault(require("../../../utils/common/invariant"));
var _DatabaseDriver = _interopRequireDefault(require("./DatabaseDriver"));
// don't import whole `utils` to keep worker size small
var DatabaseBridge = /*#__PURE__*/function () {
  function DatabaseBridge(workerContext) {
    var _this = this;
    this.queue = [];
    this._actionsExecuting = 0;
    this.workerContext = workerContext;
    this.workerContext.onmessage = function (e) {
      var action = e.data;
      // enqueue action
      _this.queue.push(action);
      if (1 === _this.queue.length) {
        _this.executeNext();
      }
    };
  }
  var _proto = DatabaseBridge.prototype;
  _proto.executeNext = function executeNext() {
    var action = this.queue[0];
    try {
      (0, _invariant.default)(0 === this._actionsExecuting, 'worker should not have ongoing actions'); // sanity check
      this._actionsExecuting += 1;
      var {
        type: type,
        payload: payload
      } = action;
      if ('setUp' === type || 'unsafeResetDatabase' === type) {
        this.processActionAsync(action);
      } else {
        var response = this._driverAction(type).apply(void 0, (0, _toConsumableArray2.default)(payload));
        this.onActionDone(action, {
          value: response
        });
      }
    } catch (error) {
      this._onError(action, error);
    }
  };
  _proto.processActionAsync = function processActionAsync(action) {
    return new Promise(function ($return, $error) {
      var type, payload, options, driver, response;
      var $Try_2_Post = function () {
        try {
          return $return();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      };
      var $Try_2_Catch = function (error) {
        try {
          this._onError(action, error);
          return $Try_2_Post();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this);
      try {
        ({
          type: type,
          payload: payload
        } = action);
        if ('setUp' === type) {
          // app just launched, set up driver with options sent
          (0, _invariant.default)(!this.driver, "Loki driver already set up - cannot set up again");
          [options] = payload;
          driver = new _DatabaseDriver.default(options);
          return Promise.resolve(driver.setUp()).then(function () {
            try {
              this.driver = driver;
              this.onActionDone(action, {
                value: null
              });
              return $If_4.call(this);
            } catch ($boundEx) {
              return $Try_2_Catch($boundEx);
            }
          }.bind(this), $Try_2_Catch);
        } else {
          return Promise.resolve(this._driverAction(type).apply(void 0, (0, _toConsumableArray2.default)(payload))).then(function ($await_6) {
            try {
              response = $await_6;
              this.onActionDone(action, {
                value: response
              });
              return $If_4.call(this);
            } catch ($boundEx) {
              return $Try_2_Catch($boundEx);
            }
          }.bind(this), $Try_2_Catch);
        }
        function $If_4() {
          return $Try_2_Post();
        }
      } catch (error) {
        $Try_2_Catch(error)
      }
    }.bind(this));
  };
  _proto.onActionDone = function onActionDone(action, result) {
    (0, _invariant.default)(1 === this._actionsExecuting, 'worker should be executing 1 action'); // sanity check
    this._actionsExecuting = 0;
    this.queue.shift();
    try {
      var response = {
        id: action.id,
        result: result,
        cloneMethod: action.returnCloneMethod
      };
      this.workerContext.postMessage(response);
    } catch (error) {
      (0, _logError.default)(error);
    }
    if (this.queue.length) {
      this.executeNext();
    }
  };
  _proto._driverAction = function _driverAction(type) {
    (0, _invariant.default)(this.driver, "Cannot run actions because driver is not set up");
    var action = this.driver[type].bind(this.driver);
    (0, _invariant.default)(action, "Unknown worker action ".concat(type));
    return action;
  };
  _proto._onError = function _onError(action, error) {
    // Main process only receives error message (when using web workers) — this logError is to retain call stack
    (0, _logError.default)(error);
    this.onActionDone(action, {
      error: error
    });
  };
  return DatabaseBridge;
}();
exports.default = DatabaseBridge;