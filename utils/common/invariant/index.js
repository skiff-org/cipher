"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = invariant;
var _diagnosticError = _interopRequireDefault(require("../diagnosticError"));
// If `condition` is falsy, throws an Error with the passed message
function invariant(condition, errorMessage) {
  if (!condition) {
    var error = (0, _diagnosticError.default)(errorMessage || 'Broken invariant');
    error.framesToPop += 1;
    throw error;
  }
}