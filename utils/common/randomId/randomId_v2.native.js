"use strict";

exports.__esModule = true;
exports.default = nativeRandomId_v2;
var _reactNative = require("react-native");
var randomIds = [];
var cur = 9999;

// NOTE: This is 2x faster thn Math.random on iOS (6x faster than _v1)
// Should be ported to Java too… or better yet, implemented in JSI
function nativeRandomId_v2() {
  if (64 <= cur) {
    randomIds = _reactNative.NativeModules.WMDatabaseBridge.getRandomIds().split(',');
    cur = 0;
  }
  return randomIds[cur++];
}