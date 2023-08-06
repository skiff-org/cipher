"use strict";

exports.__esModule = true;
exports.default = doOnSubscribe;
var _wmelonRxShim = require("../__wmelonRxShim");
// Performs an action when Observable is subscribed to; analogous to `Observable.do`
function doOnSubscribe(onSubscribe) {
  return function (source) {
    return (0, _wmelonRxShim.defer)(function () {
      onSubscribe();
      return source;
    });
  };
}