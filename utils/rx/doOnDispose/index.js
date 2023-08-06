"use strict";

exports.__esModule = true;
exports.default = doOnDispose;
var _wmelonRxShim = require("../__wmelonRxShim");
// Performs an action when Observable is disposed; analogous to `Observable.do`
function doOnDispose(onDispose) {
  return function (source) {
    return _wmelonRxShim.Observable.create(function (observer) {
      // $FlowFixMe
      var subscription = source.subscribe(observer);
      return function () {
        subscription.unsubscribe();
        onDispose();
      };
    });
  };
}