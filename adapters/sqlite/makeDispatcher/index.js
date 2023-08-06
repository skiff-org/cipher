"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.getDispatcherType = getDispatcherType;
exports.makeDispatcher = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _DatabaseBridge = _interopRequireDefault(require("../sqlite-node/DatabaseBridge"));
/* eslint-disable global-require */
var SqliteNodeDispatcher = /*#__PURE__*/function () {
  function SqliteNodeDispatcher(tag) {
    this._tag = tag;
  }
  var _proto = SqliteNodeDispatcher.prototype;
  _proto.call = function call(methodName, args, callback) {
    // $FlowFixMe
    var method = _DatabaseBridge.default[methodName].bind(_DatabaseBridge.default);
    method.apply(void 0, [this._tag].concat((0, _toConsumableArray2.default)(args), [function (value) {
      return callback({
        value: value
      });
    }, function (code, message, error) {
      return callback({
        error: error
      });
    }]));
  };
  return SqliteNodeDispatcher;
}();
var makeDispatcher = function (_type, tag) {
  return new SqliteNodeDispatcher(tag);
};
exports.makeDispatcher = makeDispatcher;
function getDispatcherType() {
  return 'asynchronous';
}