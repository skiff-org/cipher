"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = encodeMatcher;
var _allPass = _interopRequireDefault(require("../../utils/fp/allPass"));
var _anyPass = _interopRequireDefault(require("../../utils/fp/anyPass"));
var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));
var _operators = _interopRequireDefault(require("./operators"));
var _canEncode = _interopRequireWildcard(require("./canEncode"));
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/* eslint-disable no-use-before-define */
var encodeWhereDescription = function (description) {
  return function (rawRecord) {
    var left = rawRecord[description.left];
    var {
      comparison: comparison
    } = description;
    var operator = _operators.default[comparison.operator];
    var compRight = comparison.right;
    var right;

    // TODO: What about `undefined`s ?
    if (compRight.value !== undefined) {
      right = compRight.value;
    } else if (compRight.values) {
      right = compRight.values;
    } else if (compRight.column) {
      right = rawRecord[compRight.column];
    } else {
      throw new Error('Invalid comparisonRight');
    }
    return operator(left, right);
  };
};
var encodeWhere = function (where) {
  switch (where.type) {
    case 'where':
      return encodeWhereDescription(where);
    case 'and':
      return (0, _allPass.default)(where.conditions.map(encodeWhere));
    case 'or':
      return (0, _anyPass.default)(where.conditions.map(encodeWhere));
    case 'on':
      throw new Error('Illegal Q.on found -- nested Q.ons require explicit Q.experimentalJoinTables declaration');
    default:
      throw new Error("Illegal clause ".concat(where.type));
  }
};
var encodeConditions = function (conditions) {
  return (0, _allPass.default)(conditions.map(encodeWhere));
};
function encodeMatcher(query) {
  (0, _invariant.default)((0, _canEncode.default)(query), _canEncode.forbiddenError);
  return encodeConditions(query.where);
}