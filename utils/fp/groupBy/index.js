"use strict";

exports.__esModule = true;
exports.default = groupBy;
function groupBy(predicate) {
  return function (list) {
    var groupped = {};
    var item;
    var key;
    var group;
    for (var i = 0, len = list.length; i < len; i++) {
      item = list[i];
      key = predicate(item);
      group = groupped[key];
      if (group) {
        group.push(item);
      } else {
        groupped[key] = [item];
      }
    }
    return groupped;
  };
}