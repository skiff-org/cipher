"use strict";

exports.__esModule = true;
exports.default = fallbackRandomId;
var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function fallbackRandomId() {
  var id = '';
  var v = 0;
  for (var i = 0; 16 > i; i += 1) {
    v = Math.floor(62 * Math.random());
    id += alphabet[v % 62];
  }
  return id;
}