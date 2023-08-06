"use strict";

exports.__esModule = true;
exports.default = fromPairs;
// inspired by ramda and rambda
/* eslint-disable */

function fromPairs(pairs) {
  var result = {};
  for (var i = 0, l = pairs.length; i < l; i++) {
    result[pairs[i][0]] = pairs[i][1];
  }
  return result;
}