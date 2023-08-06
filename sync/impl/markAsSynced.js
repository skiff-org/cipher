"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = markLocalChangesAsSynced;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _areRecordsEqual = _interopRequireDefault(require("../../utils/fp/areRecordsEqual"));
var _common = require("../../utils/common");
var _helpers = require("./helpers");
var recordsToMarkAsSynced = function ({
  changes: changes,
  affectedRecords: affectedRecords
}, allRejectedIds) {
  var syncedRecords = [];
  Object.keys(changes).forEach(function (table) {
    var {
      created: created,
      updated: updated
    } = changes[table];
    var raws = created.concat(updated);
    var rejectedIds = new Set(allRejectedIds[table]);
    raws.forEach(function (raw) {
      var {
        id: id
      } = raw;
      var record = affectedRecords.find(function (model) {
        return model.id === id && model.table === table;
      });
      if (!record) {
        (0, _common.logError)("[Sync] Looking for record ".concat(table, "#").concat(id, " to mark it as synced, but I can't find it. Will ignore it (it should get synced next time). This is probably a Watermelon bug \u2014 please file an issue!"));
        return;
      }
      if ((0, _areRecordsEqual.default)(record._raw, raw) && !rejectedIds.has(id)) {
        syncedRecords.push(record);
      }
    });
  });
  return syncedRecords;
};
var destroyDeletedRecords = function (db, {
  changes: changes
}, allRejectedIds) {
  return Object.keys(changes).map(function (_tableName) {
    var tableName = _tableName;
    var rejectedIds = new Set(allRejectedIds[tableName]);
    var deleted = changes[tableName].deleted.filter(function (id) {
      return !rejectedIds.has(id);
    });
    return deleted.length ? db.adapter.destroyDeletedRecords(tableName, deleted) : Promise.resolve();
  });
};
function markLocalChangesAsSynced(db, syncedLocalChanges, rejectedIds) {
  return db.write(function () {
    return new Promise(function ($return, $error) {
      return Promise.resolve(Promise.all([db.batch(recordsToMarkAsSynced(syncedLocalChanges, rejectedIds || {}).map(_helpers.prepareMarkAsSynced))].concat((0, _toConsumableArray2.default)(destroyDeletedRecords(db, syncedLocalChanges, rejectedIds || {}))))).then(function () {
        try {
          return $return();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    });
  }, 'sync-markLocalChangesAsSynced');
}