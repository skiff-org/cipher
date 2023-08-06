"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = applyRemoteChanges;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _fp = require("../../utils/fp");
var _splitEvery = _interopRequireDefault(require("../../utils/fp/splitEvery"));
var _allPromisesObj = _interopRequireDefault(require("../../utils/fp/allPromisesObj"));
var _Result = require("../../utils/fp/Result");
var _common = require("../../utils/common");
var Q = _interopRequireWildcard(require("../../QueryDescription"));
var _Schema = require("../../Schema");
var _helpers = require("./helpers");
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
// NOTE: Creating JS models is expensive/memory-intensive, so we want to avoid it if possible
// In replacement sync, we can avoid it if record already exists and didn't change. Note that we're not
// using unsafeQueryRaw, because we DO want to reuse JS model if already in memory
// This is only safe to do within a single db.write block, because otherwise we risk that the record
// changed and we can no longer instantiate a JS model from an outdated raw record
var unsafeFetchAsRaws = function (query) {
  return new Promise(function ($return, $error) {
    var db, result, raws;
    ({
      db: db
    } = query.collection);
    return Promise.resolve((0, _Result.toPromise)(function (callback) {
      return db.adapter.underlyingAdapter.query(query.serialize(), callback);
    })).then(function ($await_2) {
      try {
        result = $await_2;
        raws = query.collection._cache.rawRecordsFromQueryResult(result);
        // FIXME: The above actually causes RecordCache corruption, because we're not adding record to
        // RecordCache, but adapter notes that we did. Temporary quick fix below to undo the optimization.
        raws.forEach(function (raw) {
          query.collection._cache._modelForRaw(raw, false);
        });
        return $return(raws);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
};
var idsForChanges = function ({
  created: created,
  updated: updated,
  deleted: deleted
}) {
  var ids = [];
  created.forEach(function (record) {
    ids.push(record.id);
  });
  updated.forEach(function (record) {
    ids.push(record.id);
  });
  return ids.concat(deleted);
};
var fetchRecordsForChanges = function (collection, changes) {
  var ids = idsForChanges(changes);
  if (ids.length) {
    return unsafeFetchAsRaws(collection.query(Q.where((0, _Schema.columnName)('id'), Q.oneOf(ids))));
  }
  return Promise.resolve([]);
};
function recordsToApplyRemoteChangesTo_incremental(collection, changes, context) {
  return new Promise(function ($return, $error) {
    var db, table, deletedIds, deletedIdsSet, rawRecords, locallyDeletedIds;
    ({
      db: db
    } = context);
    ({
      table: table
    } = collection);
    ({
      deleted: deletedIds
    } = changes);
    deletedIdsSet = new Set(deletedIds);
    return Promise.resolve(Promise.all([fetchRecordsForChanges(collection, changes), db.adapter.getDeletedRecords(table)])).then(function ($await_3) {
      try {
        [rawRecords, locallyDeletedIds] = $await_3;
        return $return((0, _extends2.default)({}, changes, {
          recordsMap: new Map(rawRecords.map(function (raw) {
            return [raw.id, raw];
          })),
          locallyDeletedIds: locallyDeletedIds,
          recordsToDestroy: rawRecords.filter(function (raw) {
            return deletedIdsSet.has(raw.id);
          }).map(function (raw) {
            return (0, _helpers.recordFromRaw)(raw, collection);
          }),
          deletedRecordsToDestroy: locallyDeletedIds.filter(function (id) {
            return deletedIdsSet.has(id);
          })
        }));
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
function recordsToApplyRemoteChangesTo_replacement(collection, changes, context) {
  return new Promise(function ($return, $error) {
    var _context$strategy$exp, _context$strategy$exp2, db, table, queryForReplacement, created, updated, changesDeletedIds, deletedIdsSet, rawRecords, locallyDeletedIds, replacementRecords, recordsToKeep;
    ({
      db: db
    } = context);
    ({
      table: table
    } = collection);
    queryForReplacement = context.strategy && 'object' === typeof context.strategy && context.strategy.experimentalQueryRecordsForReplacement ? null === (_context$strategy$exp = (_context$strategy$exp2 = context.strategy.experimentalQueryRecordsForReplacement)[table]) || void 0 === _context$strategy$exp ? void 0 : _context$strategy$exp.call(_context$strategy$exp2) : null;
    ({
      created: created,
      updated: updated,
      deleted: changesDeletedIds
    } = changes);
    deletedIdsSet = new Set(changesDeletedIds);
    return Promise.resolve(Promise.all([unsafeFetchAsRaws(collection.query(queryForReplacement ? [Q.or(Q.where((0, _Schema.columnName)('id'), Q.oneOf(idsForChanges(changes))), Q.and(queryForReplacement))] : [])), db.adapter.getDeletedRecords(table)])).then(function ($await_4) {
      try {
        [rawRecords, locallyDeletedIds] = $await_4;
        return Promise.resolve(function () {
          return new Promise(function ($return, $error) {
            var clauses, modifiedQuery;
            if (queryForReplacement) {
              clauses = queryForReplacement;
              modifiedQuery = collection.query(clauses);
              modifiedQuery.description = modifiedQuery._rawDescription;
              return Promise.resolve(modifiedQuery.fetchIds()).then(function ($await_5) {
                try {
                  return $return(new Set($await_5));
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }, $error);
            }
            return $return(null);
          });
        }()).then(function ($await_6) {
          try {
            replacementRecords = $await_6;
            recordsToKeep = new Set([].concat((0, _toConsumableArray2.default)(created.map(function (record) {
              return record.id;
            })), (0, _toConsumableArray2.default)(updated.map(function (record) {
              return record.id;
            }))));
            return $return((0, _extends2.default)({}, changes, {
              recordsMap: new Map(rawRecords.map(function (raw) {
                return [raw.id, raw];
              })),
              locallyDeletedIds: locallyDeletedIds,
              recordsToDestroy: rawRecords.filter(function (raw) {
                if (deletedIdsSet.has(raw.id)) {
                  return true;
                }
                var subjectToReplacement = replacementRecords ? replacementRecords.has(raw.id) : true;
                return subjectToReplacement && !recordsToKeep.has(raw.id) && 'created' !== raw._status;
              }).map(function (raw) {
                return (0, _helpers.recordFromRaw)(raw, collection);
              }),
              deletedRecordsToDestroy: locallyDeletedIds.filter(function (id) {
                if (deletedIdsSet.has(id)) {
                  return true;
                }
                var subjectToReplacement = replacementRecords ? replacementRecords.has(id) : true;
                return subjectToReplacement && !recordsToKeep.has(id);
              })
            }));
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
var strategyForCollection = function (collection, strategy) {
  if (!strategy) {
    return 'incremental';
  } else if ('string' === typeof strategy) {
    return strategy;
  }
  return strategy.override[collection.table] || strategy.default;
};
function recordsToApplyRemoteChangesTo(collection, changes, context) {
  return new Promise(function ($return) {
    var strategy = strategyForCollection(collection, context.strategy);
    (0, _common.invariant)(['incremental', 'replacement'].includes(strategy), '[Sync] Invalid pull strategy');
    switch (strategy) {
      case 'replacement':
        return $return(recordsToApplyRemoteChangesTo_replacement(collection, changes, context));
      case 'incremental':
      default:
        return $return(recordsToApplyRemoteChangesTo_incremental(collection, changes, context));
    }
    return $return();
  });
}
var getAllRecordsToApply = function (remoteChanges, context) {
  var {
    db: db
  } = context;
  return (0, _allPromisesObj.default)((0, _fp.pipe)((0, _fp.filterObj)(function (_changes, tableName) {
    var collection = db.get(tableName);
    if (!collection) {
      _common.logger.warn("You are trying to sync a collection named ".concat(tableName, ", but it does not exist. Will skip it (for forward-compatibility). If this is unexpected, perhaps you forgot to add it to your Database constructor's modelClasses property?"));
    }
    return !!collection;
  }), (0, _fp.mapObj)(function (changes, tableName) {
    return recordsToApplyRemoteChangesTo(db.get(tableName), changes, context);
  }))(remoteChanges));
};
function validateRemoteRaw(raw) {
  // TODO: I think other code is actually resilient enough to handle illegal _status and _changed
  // would be best to change that part to a warning - but tests are needed
  (0, _common.invariant)(raw && 'object' === typeof raw && 'id' in raw && !('_status' in raw || '_changed' in raw), "[Sync] Invalid raw record supplied to Sync. Records must be objects, must have an 'id' field, and must NOT have a '_status' or '_changed' fields");
}
function prepareApplyRemoteChangesToCollection(recordsToApply, collection, context) {
  var {
    db: db,
    sendCreatedAsUpdated: sendCreatedAsUpdated,
    log: log,
    conflictResolver: conflictResolver
  } = context;
  var {
    table: table
  } = collection;
  var {
    created: created,
    updated: updated,
    recordsToDestroy: deleted,
    recordsMap: recordsMap,
    locallyDeletedIds: locallyDeletedIds
  } = recordsToApply;

  // if `sendCreatedAsUpdated`, server should send all non-deleted records as `updated`
  // log error if it doesn't — but disable standard created vs updated errors
  if (sendCreatedAsUpdated && created.length) {
    (0, _common.logError)("[Sync] 'sendCreatedAsUpdated' option is enabled, and yet server sends some records as 'created'");
  }
  var recordsToBatch = []; // mutating - perf critical

  // Insert and update records
  created.forEach(function (raw) {
    validateRemoteRaw(raw);
    var currentRecord = recordsMap.get(raw.id);
    if (currentRecord) {
      (0, _common.logError)("[Sync] Server wants client to create record ".concat(table, "#").concat(raw.id, ", but it already exists locally. This may suggest last sync partially executed, and then failed; or it could be a serious bug. Will update existing record instead."));
      recordsToBatch.push((0, _helpers.prepareUpdateFromRaw)(currentRecord, raw, collection, log, conflictResolver));
    } else if (locallyDeletedIds.includes(raw.id)) {
      (0, _common.logError)("[Sync] Server wants client to create record ".concat(table, "#").concat(raw.id, ", but it already exists locally and is marked as deleted. This may suggest last sync partially executed, and then failed; or it could be a serious bug. Will delete local record and recreate it instead."));
      // Note: we're not awaiting the async operation (but it will always complete before the batch)
      db.adapter.destroyDeletedRecords(table, [raw.id]);
      recordsToBatch.push((0, _helpers.prepareCreateFromRaw)(collection, raw));
    } else {
      recordsToBatch.push((0, _helpers.prepareCreateFromRaw)(collection, raw));
    }
  });
  updated.forEach(function (raw) {
    validateRemoteRaw(raw);
    var currentRecord = recordsMap.get(raw.id);
    if (currentRecord) {
      recordsToBatch.push((0, _helpers.prepareUpdateFromRaw)(currentRecord, raw, collection, log, conflictResolver));
    } else if (!locallyDeletedIds.includes(raw.id)) {
      // Record doesn't exist (but should) — just create it
      sendCreatedAsUpdated || (0, _common.logError)("[Sync] Server wants client to update record ".concat(table, "#").concat(raw.id, ", but it doesn't exist locally. This could be a serious bug. Will create record instead. If this was intentional, please check the flag sendCreatedAsUpdated in https://watermelondb.dev/docs/Sync/Frontend#additional-synchronize-flags"));
      recordsToBatch.push((0, _helpers.prepareCreateFromRaw)(collection, raw));
    } // Nothing to do, record was locally deleted, deletion will be pushed later
  });

  deleted.forEach(function (record) {
    // $FlowFixMe
    recordsToBatch.push(record.prepareDestroyPermanently());
  });
  return recordsToBatch;
}
var destroyAllDeletedRecords = function (db, recordsToApply) {
  return new Promise(function ($return, $error) {
    var promises = (0, _fp.toPairs)(recordsToApply).map(function ([tableName, {
      deletedRecordsToDestroy: deletedRecordsToDestroy
    }]) {
      return deletedRecordsToDestroy.length ? db.adapter.destroyDeletedRecords(tableName, deletedRecordsToDestroy) : null;
    });
    return Promise.resolve(Promise.all(promises)).then(function () {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
};
var applyAllRemoteChanges = function (recordsToApply, context) {
  return new Promise(function ($return, $error) {
    var db, allRecords;
    ({
      db: db
    } = context);
    allRecords = [];
    (0, _fp.toPairs)(recordsToApply).forEach(function ([tableName, records]) {
      prepareApplyRemoteChangesToCollection(records, db.get(tableName), context).forEach(function (record) {
        allRecords.push(record);
      });
    });
    // $FlowFixMe
    return Promise.resolve(db.batch(allRecords)).then(function () {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
};

// See _unsafeBatchPerCollection - temporary fix
var unsafeApplyAllRemoteChangesByBatches = function (recordsToApply, context) {
  return new Promise(function ($return, $error) {
    var db, promises;
    ({
      db: db
    } = context);
    promises = [];
    (0, _fp.toPairs)(recordsToApply).forEach(function ([tableName, records]) {
      var preparedModels = prepareApplyRemoteChangesToCollection(records, db.get(tableName), context);
      (0, _splitEvery.default)(5000, preparedModels).forEach(function (recordBatch) {
        promises.push(db.batch(recordBatch));
      });
    });
    return Promise.resolve(Promise.all(promises)).then(function () {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
};
function applyRemoteChanges(remoteChanges, context) {
  return new Promise(function ($return, $error) {
    var db, _unsafeBatchPerCollection, recordsToApply;
    ({
      db: db,
      _unsafeBatchPerCollection: _unsafeBatchPerCollection
    } = context);
    return Promise.resolve(getAllRecordsToApply(remoteChanges, context)).then(function ($await_10) {
      try {
        recordsToApply = $await_10;
        return Promise.resolve(Promise.all([destroyAllDeletedRecords(db, recordsToApply), _unsafeBatchPerCollection ? unsafeApplyAllRemoteChangesByBatches(recordsToApply, context) : applyAllRemoteChanges(recordsToApply, context)])).then(function () {
          try {
            return $return();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}