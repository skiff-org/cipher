"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _makeDecorator = _interopRequireDefault(require("../../utils/common/makeDecorator"));
var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));
// Marks a field as non-writable (throws an error when attempting to set a new value)
// When using multiple decorators, remember to mark as @readonly *last* (leftmost)
var readonly = (0, _makeDecorator.default)(function () {
  return function (target, key, descriptor) {
    // Set a new setter on getter/setter fields
    if (descriptor.get || descriptor.set) {
      return (0, _extends2.default)({}, descriptor, {
        set: function set() {
          (0, _invariant.default)(false, "Attempt to set new value on a property ".concat(target.constructor.name, ".prototype.").concat(key, " marked as @readonly"));
        }
      });
    }

    // Mark as writable=false for simple fields
    descriptor.writable = false;
    return descriptor;
  };
});
var _default = readonly;
exports.default = _default;