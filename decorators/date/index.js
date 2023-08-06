"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _makeDecorator = _interopRequireDefault(require("../../utils/common/makeDecorator"));
var _memory = require("../../utils/common/memory");
var _common = require("../common");
// Defines a model property representing a date
//
// Serializes dates to milisecond-precision Unix timestamps, and deserializes them to Date objects
// (but passes null values as-is)
//
// Pass the database column name as an argument
//
// Examples:
//   @date('reacted_at') reactedAt: Date
var cache = new Map();
(0, _memory.onLowMemory)(function () {
  return cache.clear();
});
var dateDecorator = (0, _makeDecorator.default)(function (columnName) {
  return function (target, key, descriptor) {
    (0, _common.ensureDecoratorUsedProperly)(columnName, target, key, descriptor);
    return {
      configurable: true,
      enumerable: true,
      get: function get() {
        // $FlowFixMe
        var rawValue = this.asModel._getRaw(columnName);
        if ('number' === typeof rawValue) {
          var cached = cache.get(rawValue);
          if (cached) {
            return cached;
          }
          var date = new Date(rawValue);
          cache.set(rawValue, date);
          return date;
        }
        return null;
      },
      set: function set(date) {
        var rawValue = date ? +new Date(date) : null;
        if (rawValue && date) {
          cache.set(rawValue, new Date(date));
        }
        // $FlowFixMe
        this.asModel._setRaw(columnName, rawValue);
      }
    };
  };
});
var _default = dateDecorator;
exports.default = _default;