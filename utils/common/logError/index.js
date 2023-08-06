"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = logError;
var _diagnosticError = _interopRequireDefault(require("../diagnosticError"));
var _logger = _interopRequireDefault(require("../logger"));
// Logs an Error to the console with the given message
//
// Use when a *recoverable* error occurs (so you don't want it to throw)
function logError(errorMessage) {
  var error = (0, _diagnosticError.default)(errorMessage);
  error.framesToPop += 1;
  _logger.default.error(error);
}