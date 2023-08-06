"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.ensureDecoratorUsedProperly = ensureDecoratorUsedProperly;
var _invariant = _interopRequireDefault(require("../utils/common/invariant"));
// eslint-disable-next-line
function ensureDecoratorUsedProperly(columnName, target, key, descriptor) {
  (0, _invariant.default)(columnName, "Pass column name (raw field name) to the decorator - error in ".concat(target.constructor.name, ".prototype.").concat(key, " given."));
  if (descriptor) {
    (0, _invariant.default)('initializer' in descriptor, "Model field decorators can only be used for simple properties - method, setter or getter ".concat(target.constructor.name, ".prototype.").concat(key, " given."));
    (0, _invariant.default)('function' !== typeof descriptor.initializer, "Model field decorators must not be used on properties with a default value - error in \"".concat(target.constructor.name, ".prototype.").concat(key, "\"."));
  }
}