"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.withDatabase = exports.default = exports.DatabaseContext = exports.DatabaseConsumer = void 0;
var _react = _interopRequireDefault(require("react"));
var _Database = _interopRequireDefault(require("../Database"));
var _DatabaseContext = _interopRequireWildcard(require("./DatabaseContext"));
exports.DatabaseContext = _DatabaseContext.default;
exports.DatabaseConsumer = _DatabaseContext.DatabaseConsumer;
var _withDatabase = _interopRequireDefault(require("./withDatabase"));
exports.withDatabase = _withDatabase.default;
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
 * Database provider to create the database context
 * to allow child components to consume the database without prop drilling
 */
function DatabaseProvider({
  children: children,
  database: database
}) {
  if (!(database instanceof _Database.default)) {
    throw new Error('You must supply a valid database prop to the DatabaseProvider');
  }
  return /*#__PURE__*/_react.default.createElement(_DatabaseContext.Provider, {
    value: database
  }, children);
}
var _default = DatabaseProvider;
exports.default = _default;