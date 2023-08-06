"use strict";

exports.__esModule = true;
exports.default = identicalArrays;
function identicalArrays(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (var i = 0, len = left.length; i < len; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}