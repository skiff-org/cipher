"use strict";

exports.__esModule = true;
exports.default = areRecordsEqual;
// NOTE: Only use with records! Not guaranteed to work correctly if keys have undefineds as values
function areRecordsEqual(left, right) {
  if (left === right) {
    return true;
  }
  var leftKeys = Object.keys(left);
  var leftKeysLen = leftKeys.length;
  if (leftKeysLen !== Object.keys(right).length) {
    return false;
  }
  var key;
  for (var i = 0; i < leftKeysLen; i++) {
    key = leftKeys[i];
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}