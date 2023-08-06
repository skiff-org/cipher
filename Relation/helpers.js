"use strict";

exports.__esModule = true;
exports.createObservable = void 0;
var _rx = require("../utils/rx");
var getImmutableObservable = function (relation) {
  return relation._model.collections.get(relation._relationTableName)
  // $FlowFixMe
  .findAndObserve(relation.id);
};
var getObservable = function (relation) {
  return relation._model.observe()
  // $FlowFixMe
  .pipe((0, _rx.map)(function (model) {
    return model._getRaw(relation._columnName);
  }), (0, _rx.distinctUntilChanged)(), (0, _rx.switchMap)(function (id) {
    return id ? relation._model.collections.get(relation._relationTableName).findAndObserve(id) : (0, _rx.of)(null);
  }));
};

// eslint-disable-next-line
var createObservable = function (relation) {
  return relation._isImmutable ? getImmutableObservable(relation) : getObservable(relation);
};
exports.createObservable = createObservable;