"use strict";

exports.__esModule = true;
exports.default = connectionTag;
var previousTag = 0;
function connectionTag() {
  previousTag += 1;
  return previousTag;
}