"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.getAssociations = void 0;
var _invariant = _interopRequireDefault(require("../utils/common/invariant"));
var getAssociations = function (description, modelClass, db) {
  return description.joinTables.map(function (table) {
    var info = modelClass.associations[table];
    (0, _invariant.default)(info, "Query on '".concat(modelClass.table, "' joins with '").concat(table, "', but ").concat(modelClass.name, " does not have associations={} defined for '").concat(table, "'"));
    return {
      from: modelClass.table,
      to: table,
      info: info
    };
  }).concat(description.nestedJoinTables.map(function ({
    from: from,
    to: to
  }) {
    var collection = db.get(from);
    (0, _invariant.default)(collection, "Query on '".concat(modelClass.table, "' has a nested join with '").concat(from, "', but collection for '").concat(from, "' cannot be found"));
    var info = collection.modelClass.associations[to];
    (0, _invariant.default)(info, "Query on '".concat(modelClass.table, "' has a nested join from '").concat(from, "' to '").concat(to, "', but ").concat(collection.modelClass.name, " does not have associations={} defined for '").concat(to, "'"));
    return {
      from: from,
      to: to,
      info: info
    };
  }));
};
exports.getAssociations = getAssociations;