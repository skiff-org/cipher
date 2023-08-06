"use strict";

exports.__esModule = true;
exports.default = likeToRegexp;
function likeToRegexp(likeQuery) {
  var regexp = "^".concat(likeQuery, "$").replace(/%/g, '.*').replace(/_/g, '.');
  return new RegExp(regexp, 'is');
}