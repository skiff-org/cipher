"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _reactNative = require("react-native");
var _randomId_v = _interopRequireDefault(require("./randomId_v2.native"));
/* eslint-disable no-bitwise */
var alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
var randomNumbers = [];
var cur = 9999999;

// TODO: This is 3-5x slower than Math.random()-based implementation
// Should be migrated to JSI, or simply implemented fully in native
// (bridging is the bottleneck)
function nativeRandomId_v1() {
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
      randomNumbers = _reactNative.NativeModules.WMDatabaseBridge.getRandomBytes(256);
      cur = 0;
    }
  }
  return id;
}
var isV2Available = !!_reactNative.NativeModules.WMDatabaseBridge.getRandomIds;
var nativeRandomId = isV2Available ? _randomId_v.default : nativeRandomId_v1;
var _default = nativeRandomId;
exports.default = _default;