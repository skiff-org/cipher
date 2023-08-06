"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.setGenerator = exports.default = void 0;
var _randomId = _interopRequireDefault(require("./randomId"));
var generator = _randomId.default;

// NOTE: It's is only safe for the ID to contain [a-zA-Z0-9._]. It must not contain other characters
// (especially '"\/$). Never, ever allow the ID to be set by the user w/o validating - this breaks security!
var setGenerator = function (newGenerator) {
  if ('string' !== typeof newGenerator()) {
    throw new Error('RandomId generator function needs to return a string type.');
  }
  generator = newGenerator;
};
exports.setGenerator = setGenerator;
var _default = function () {
  return generator();
};
exports.default = _default;