"use strict";

exports.__esModule = true;
exports.default = allPass;
function allPass(predicates) {
  var len = predicates.length;
  return function (obj) {
    for (var i = 0; i < len; i++) {
      if (!predicates[i](obj)) {
        return false;
      }
    }
    return true;
  };
}