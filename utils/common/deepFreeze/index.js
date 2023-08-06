"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = deepFreeze;
var _invariant = _interopRequireDefault(require("../invariant"));
// Deep-freezes an object, but DOES NOT handle cycles
function deepFreeze(object) {
  (0, _invariant.default)(object && 'object' === typeof object, 'Invalid attempt to deepFreeze not-an-Object');
  Object.getOwnPropertyNames(object).forEach(function (name) {
    var value = object[name];
    if (value && 'object' === typeof value) {
      deepFreeze(value);
    }
  });
  return Object.freeze(object);
}