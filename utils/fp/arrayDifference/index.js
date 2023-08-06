"use strict";

exports.__esModule = true;
exports.default = void 0;
var arrayDifference = function (previousList, nextList) {
  var previous = new Set(previousList);
  var next = new Set(nextList);
  var added = [];
  var removed = [];
  var item;
  for (var i = 0, len = previousList.length; i < len; i++) {
    item = previousList[i];
    if (!next.has(item)) {
      removed.push(item);
    }
  }
  for (var _i = 0, _len = nextList.length; _i < _len; _i++) {
    item = nextList[_i];
    if (!previous.has(item)) {
      added.push(item);
    }
  }
  return {
    added: added,
    removed: removed
  };
};
var _default = arrayDifference;
exports.default = _default;