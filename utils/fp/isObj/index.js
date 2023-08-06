"use strict";

exports.__esModule = true;
exports.default = isObj;
function isObj(maybeObject) {
  return null !== maybeObject && 'object' === typeof maybeObject && !Array.isArray(maybeObject);
}