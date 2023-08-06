"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.useDatabase = useDatabase;
var _react = _interopRequireDefault(require("react"));
var _DatabaseProvider = require("../DatabaseProvider");
var _invariant = _interopRequireDefault(require("../utils/common/invariant"));
function useDatabase() {
  var database = _react.default.useContext(_DatabaseProvider.DatabaseContext);
  (0, _invariant.default)(database, 'Could not find database context, please make sure the component is wrapped in the <DatabaseProvider>');
  return database;
}