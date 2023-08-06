"use strict";

exports.__esModule = true;
exports.default = void 0;
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
function mapObj(fn, obj) {
  if (1 === arguments.length) {
    // $FlowFixMe
    return function (_obj) {
      return mapObj(fn, _obj);
    };
  }
  var result = {};
  for (var prop in obj) {
    result[prop] = fn(obj[prop], prop, obj);
  }
  return result;
}
var _default = mapObj;
exports.default = _default;