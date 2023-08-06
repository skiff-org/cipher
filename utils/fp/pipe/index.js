"use strict";

exports.__esModule = true;
exports.default = void 0;
function pipe(...fns) {
  var fnsLen = fns.length;
  return function (...args) {
    var result;
    if (fnsLen) {
      result = fns[0].apply(fns, args);
      for (var i = 1; i < fnsLen; i++) {
        result = fns[i](result);
      }
    }
    return result;
  };
}
var _default = pipe;
exports.default = _default;