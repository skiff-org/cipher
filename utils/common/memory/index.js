"use strict";

exports.__esModule = true;
exports._triggerOnLowMemory = _triggerOnLowMemory;
exports.onLowMemory = onLowMemory;
var lowMemoryCallbacks = [];
function onLowMemory(callback) {
  lowMemoryCallbacks.push(callback);
}

// TODO: Not currently hooked up to anything
function _triggerOnLowMemory() {
  lowMemoryCallbacks.forEach(function (callback) {
    return callback();
  });
}