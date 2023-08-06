"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = encodeBatch;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _common = require("../../common");
/* eslint-disable import/no-import-module-exports */
function encodeInsertSql(schema) {
  var columns = schema.columnArray;
  var columnsSql = "\"id\", \"_status\", \"_changed".concat(columns.map(function (column) {
    return "\", \"".concat(column.name);
  }).join(''), "\"");
  var placeholders = Array(columns.length + 3).fill('?').join(', ');
  return "insert into \"".concat(schema.name, "\" (").concat(columnsSql, ") values (").concat(placeholders, ")");
}
function encodeInsertArgs(tableSchema, raw) {
  var columns = tableSchema.columnArray;
  var len = columns.length;
  var args = Array(len + 3);
  args[0] = raw.id;
  args[1] = raw._status;
  args[2] = raw._changed;
  for (var i = 0; i < len; i++) {
    args[i + 3] = raw[columns[i].name];
  }
  return args;
}
function encodeUpdateSql(schema) {
  var columns = schema.columnArray;
  var placeholders = columns.map(function (column) {
    return ", \"".concat(column.name, "\" = ?");
  }).join('');
  return "update \"".concat(schema.name, "\" set \"_status\" = ?, \"_changed\" = ?").concat(placeholders, " where \"id\" is ?");
}
function encodeUpdateArgs(tableSchema, raw) {
  var columns = tableSchema.columnArray;
  var len = columns.length;
  var args = Array(len + 3);
  args[0] = raw._status;
  args[1] = raw._changed;
  for (var i = 0; i < len; i++) {
    args[i + 2] = raw[columns[i].name];
  }
  args[len + 2] = raw.id;
  return args;
}
var REMOVE_FROM_CACHE = -1;
var IGNORE_CACHE = 0;
var ADD_TO_CACHE = 1;
function groupOperations(operations) {
  var grouppedOperations = [];
  var previousType = null;
  var previousTable = null;
  var currentOperation = null;
  operations.forEach(function (operation) {
    var [type, table, rawOrId] = operation;
    if (type !== previousType || table !== previousTable) {
      if (currentOperation) {
        grouppedOperations.push(currentOperation);
      }
      previousType = type;
      previousTable = table;
      // $FlowFixMe
      currentOperation = [type, table, []];
    }

    // $FlowFixMe
    currentOperation[2].push(rawOrId);
  });
  if (currentOperation) {
    grouppedOperations.push(currentOperation);
  }
  return grouppedOperations;
}
function withRecreatedIndices(operations, schema) {
  var {
    encodeDropIndices: encodeDropIndices,
    encodeCreateIndices: encodeCreateIndices
  } = require('../encodeSchema');
  var toEncodedOperations = function (sqlStr) {
    return sqlStr.split(';') // TODO: This will break when FTS is merged
    .filter(function (sql) {
      return sql;
    }).map(function (sql) {
      return [0, null, sql, [[]]];
    });
  };
  operations.unshift.apply(operations, (0, _toConsumableArray2.default)(toEncodedOperations(encodeDropIndices(schema))));
  operations.push.apply(operations, (0, _toConsumableArray2.default)(toEncodedOperations(encodeCreateIndices(schema))));
  return operations;
}
function encodeBatch(operations, schema) {
  var nativeOperations = groupOperations(operations).map(function ([type, table, recordsOrIds]) {
    (0, _common.validateTable)(table, schema);
    switch (type) {
      case 'create':
        return [ADD_TO_CACHE, table, encodeInsertSql(schema.tables[table]), recordsOrIds.map(function (raw) {
          return encodeInsertArgs(schema.tables[table], raw);
        })];
      case 'update':
        return [IGNORE_CACHE, null, encodeUpdateSql(schema.tables[table]), recordsOrIds.map(function (raw) {
          return encodeUpdateArgs(schema.tables[table], raw);
        })];
      case 'markAsDeleted':
        return [REMOVE_FROM_CACHE, table, "update \"".concat(table, "\" set \"_status\" = 'deleted' where \"id\" == ?"), recordsOrIds.map(function (id) {
          return [id];
        })];
      case 'destroyPermanently':
        return [REMOVE_FROM_CACHE, table, "delete from \"".concat(table, "\" where \"id\" == ?"), recordsOrIds.map(function (id) {
          return [id];
        })];
      default:
        throw new Error('unknown batch operation type');
    }
  });

  // For large batches, it's profitable to delete all indices and then recreate them
  if (1000 <= operations.length) {
    return withRecreatedIndices(nativeOperations, schema);
  }
  return nativeOperations;
}
if ('test' === process.env.NODE_ENV) {
  /* eslint-disable dot-notation */
  module['exports'].encodeInsertSql = encodeInsertSql;
  module['exports'].encodeInsertArgs = encodeInsertArgs;
  module['exports'].encodeUpdateSql = encodeUpdateSql;
  module['exports'].encodeUpdateArgs = encodeUpdateArgs;
  module['exports'].groupOperations = groupOperations;
}