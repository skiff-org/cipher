"use strict";

exports.__esModule = true;
exports.default = void 0;
/* eslint-disable no-bitwise */
var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var randomNumbers = new Uint8Array(256);
var cur = 9999999;

/*:: declare var globalThis: WindowProxy */

function cryptoRandomId() {
  var id = '';
  var len = 0;
  var v = 0;
  while (16 > len) {
    if (256 > cur) {
      v = randomNumbers[cur] >> 2;
      cur++;
      if (62 > v) {
        id += alphabet[v];
        len++;
      }
    } else {
      globalThis.crypto.getRandomValues(randomNumbers);
      cur = 0;
    }
  }
  return id;
}
var isCryptoAvailable = globalThis.crypto && globalThis.crypto.getRandomValues;
var randomId = isCryptoAvailable ? cryptoRandomId : require('./fallback').default;
var _default = randomId;
exports.default = _default;