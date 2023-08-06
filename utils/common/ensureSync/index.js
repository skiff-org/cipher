"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = ensureSync;
var _invariant = _interopRequireDefault(require("../invariant"));
// Throws if passed value is a Promise
// Otherwise, returns the passed value as-is.
//
// Use to ensure API users aren't passing async functions
function ensureSync(value) {
  (0, _invariant.default)(!(value instanceof Promise), 'Unexpected Promise. Passed function should be synchronous.');
  return value;
}