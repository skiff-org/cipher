"use strict";

exports.__esModule = true;
exports.default = unique;
// Returns a list of unique elements, compared by identity (===)
// This is a replacement for rambdax uniq() which is based on slow equals()
function unique(list) {
  var result = [];
  for (var i = 0, len = list.length; i < len; i += 1) {
    var value = list[i];
    var isUnique = true;
    for (var j = 0, resultLen = result.length; j < resultLen; j += 1) {
      if (value === result[j]) {
        isUnique = false;
        break;
      }
    }
    if (isUnique) {
      result.push(value);
    }
  }
  return result;
}