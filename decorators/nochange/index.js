"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _makeDecorator = _interopRequireDefault(require("../../utils/common/makeDecorator"));
var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));
// Marks a model field as immutable after create — you can set and change the value in
// create() and prepareCreate(), but after it's saved to the database, it cannot be changed
var nochange = (0, _makeDecorator.default)(function () {
  return function (target, key, descriptor) {
    (0, _invariant.default)(descriptor.set, "@nochange can only be applied to model fields (to properties with a setter)");
    var errorMessage = "Attempt to set a new value on a @nochange field: ".concat(target.constructor.name, ".prototype.").concat(key);
    return (0, _extends2.default)({}, descriptor, {
      set: function set(value) {
        // $FlowFixMe
        var model = this;
        (0, _invariant.default)('create' === model.asModel._preparedState, errorMessage);
        descriptor.set.call(model, value);
      }
    });
  };
});
var _default = nochange;
exports.default = _default;