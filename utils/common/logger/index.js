"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
/* eslint-disable no-console */
var formatMessages = function (messages) {
  var [first, ...other] = messages;
  return ['string' === typeof first ? "[\uD83C\uDF49] ".concat(first) : first].concat((0, _toConsumableArray2.default)(other));
};
var Logger = /*#__PURE__*/function () {
  function Logger() {
    this.silent = false;
  }
  var _proto = Logger.prototype;
  _proto.log = function log(...messages) {
    var _console;
    this.silent || (_console = console).log.apply(_console, (0, _toConsumableArray2.default)(formatMessages(messages)));
  };
  _proto.warn = function warn(...messages) {
    var _console2;
    this.silent || (_console2 = console).warn.apply(_console2, (0, _toConsumableArray2.default)(formatMessages(messages)));
  };
  _proto.error = function error(...messages) {
    var _console3;
    this.silent || (_console3 = console).error.apply(_console3, (0, _toConsumableArray2.default)(formatMessages(messages)));
  };
  _proto.silence = function silence() {
    this.silent = true;
  };
  return Logger;
}();
var _default = new Logger();
exports.default = _default;