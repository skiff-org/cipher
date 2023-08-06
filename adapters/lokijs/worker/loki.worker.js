"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _DatabaseBridge = _interopRequireDefault(require("./DatabaseBridge"));
/* eslint-disable no-restricted-globals */
var getDefaultExport = function () {
  self.workerClass = new _DatabaseBridge.default(self);
  return self;
};
var _default = getDefaultExport();
exports.default = _default;