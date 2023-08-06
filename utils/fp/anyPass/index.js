"use strict";

exports.__esModule = true;
exports.default = anyPass;
function anyPass(predicates) {
  var len = predicates.length;
  return function (obj) {
    for (var i = 0; i < len; i++) {
      if (predicates[i](obj)) {
        return true;
      }
    }
    return false;
  };
}