"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = fromArrayOrSpread;
var _invariant = _interopRequireDefault(require("../../common/invariant"));
var _logger = _interopRequireDefault(require("../../common/logger"));
// This helper makes it easy to make functions that can take either spread or array arguments
function fromArrayOrSpread(args, debugName, debugArgName) {
  if (Array.isArray(args[0])) {
    (0, _invariant.default)(1 === args.length, "".concat(debugName, " should be called with either a list of '").concat(debugArgName, "' arguments or a single array, but multiple arrays were passed"));
    return args[0];
  }
  if ('production' !== process.env.NODE_ENV) {
    if (200 < args.length) {
      _logger.default.warn("".concat(debugName, " was called with ").concat(args.length, " arguments. It might be a performance bug. For very large arrays, pass a single array instead of a spread to avoid \"Maximum callstack exceeded\" error."));
    }
  }
  return args;
}