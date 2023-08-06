"use strict";

exports.__esModule = true;
exports.default = void 0;
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
function filterObj(predicate, obj) {
  if (1 === arguments.length) {
    // $FlowFixMe
    return function (_obj) {
      return filterObj(predicate, _obj);
    };
  }
  var result = {};
  var value;
  for (var prop in obj) {
    value = obj[prop];
    if (predicate(value, prop, obj)) {
      result[prop] = value;
    }
  }
  return result;
}
var _default = filterObj;
exports.default = _default;