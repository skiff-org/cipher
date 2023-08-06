"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.tableSchema = exports.tableName = exports.localStorageKey = exports.columnName = exports.associations = exports.appSchema = exports.Relation = exports.Query = exports.Q = exports.Model = exports.Database = exports.Collection = void 0;
var Q = _interopRequireWildcard(require("./QueryDescription"));
exports.Q = Q;
var _Collection = _interopRequireDefault(require("./Collection"));
exports.Collection = _Collection.default;
var _Database = _interopRequireDefault(require("./Database"));
exports.Database = _Database.default;
var _Relation = _interopRequireDefault(require("./Relation"));
exports.Relation = _Relation.default;
var _Model = _interopRequireWildcard(require("./Model"));
exports.Model = _Model.default;
exports.associations = _Model.associations;
var _Query = _interopRequireDefault(require("./Query"));
exports.Query = _Query.default;
var _Schema = require("./Schema");
exports.tableName = _Schema.tableName;
exports.columnName = _Schema.columnName;
exports.appSchema = _Schema.appSchema;
exports.tableSchema = _Schema.tableSchema;
var _LocalStorage = require("./Database/LocalStorage");
exports.localStorageKey = _LocalStorage.localStorageKey;
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }