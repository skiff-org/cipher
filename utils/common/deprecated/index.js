"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = deprecated;
var _logger = _interopRequireDefault(require("../logger"));
var deprecationsReported = {};
function deprecated(name, deprecationInfo) {
  if (!deprecationsReported[name]) {
    deprecationsReported[name] = true;
    _logger.default.warn("DEPRECATION: ".concat(name, " is deprecated. ").concat(deprecationInfo, " See changelog & docs for more info."));
  }
}