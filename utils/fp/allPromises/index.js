"use strict";

exports.__esModule = true;
exports.default = void 0;
var allPromises = function (action, promises) {
  return Promise.all(promises.map(action));
};
var _default = allPromises;
exports.default = _default;