"use strict";

exports.__esModule = true;
exports.default = sortBy;
function sortBy(sorter, list) {
  var clone = list.slice();
  var a;
  var b;
  return clone.sort(function (left, right) {
    a = sorter(left);
    b = sorter(right);
    if (a === b) {
      return 0;
    }
    // $FlowFixMe
    return a < b ? -1 : 1;
  });
}