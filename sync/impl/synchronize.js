"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = synchronize;
var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));
var _common = require("../../utils/common");
var _index = require("./index");
var _helpers = require("./helpers");
var _excluded = ["changes"];
function synchronize({
  database: database,
  pullChanges: pullChanges,
  onWillApplyRemoteChanges: onWillApplyRemoteChanges,
  onDidPullChanges: onDidPullChanges,
  pushChanges: pushChanges,
  sendCreatedAsUpdated = false,
  migrationsEnabledAtVersion: migrationsEnabledAtVersion,
  log: log,
  conflictResolver: conflictResolver,
  _unsafeBatchPerCollection: _unsafeBatchPerCollection,
  unsafeTurbo: unsafeTurbo
}) {
  return new Promise(function ($return, $error) {
    var resetCount, lastPulledAt, schemaVersion, migration, shouldSaveSchemaVersion, pullResult, newLastPulledAt, remoteChangeCount, localChanges, pushResult;
    resetCount = database._resetCount;
    log && (log.startedAt = new Date());
    log && (log.phase = 'starting');

    // TODO: Wrap the three computionally intensive phases in `requestIdleCallback`

    // pull phase
    return Promise.resolve((0, _index.getLastPulledAt)(database)).then(function ($await_8) {
      try {
        lastPulledAt = $await_8;
        log && (log.lastPulledAt = lastPulledAt);
        return Promise.resolve((0, _index.getMigrationInfo)(database, log, lastPulledAt, migrationsEnabledAtVersion)).then(function ($await_9) {
          try {
            ({
              schemaVersion: schemaVersion,
              migration: migration,
              shouldSaveSchemaVersion: shouldSaveSchemaVersion
            } = $await_9);
            log && (log.phase = 'ready to pull');

            // $FlowFixMe
            return Promise.resolve(pullChanges({
              lastPulledAt: lastPulledAt,
              schemaVersion: schemaVersion,
              migration: migration
            })).then(function ($await_10) {
              try {
                pullResult = $await_10;
                log && (log.phase = 'pulled');
                newLastPulledAt = pullResult.timestamp;
                remoteChangeCount = pullResult.changes ? (0, _helpers.changeSetCount)(pullResult.changes) : NaN;
                if (onWillApplyRemoteChanges) {
                  return Promise.resolve(onWillApplyRemoteChanges({
                    remoteChangeCount: remoteChangeCount
                  })).then(function () {
                    try {
                      return $If_1.call(this);
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }
                function $If_1() {
                  return Promise.resolve(database.write(function () {
                    return new Promise(function ($return, $error) {
                      var syncJsonId, resultRest, remoteChanges, _resultRest;
                      (0, _helpers.ensureSameDatabase)(database, resetCount);
                      return Promise.resolve((0, _index.getLastPulledAt)(database)).then(function ($await_12) {
                        try {
                          (0, _common.invariant)(lastPulledAt === $await_12, '[Sync] Concurrent synchronization is not allowed. More than one synchronize() call was running at the same time, and the later one was aborted before committing results to local database.');
                          if (unsafeTurbo) {
                            (0, _common.invariant)(!_unsafeBatchPerCollection, 'unsafeTurbo must not be used with _unsafeBatchPerCollection');
                            (0, _common.invariant)('syncJson' in pullResult || 'syncJsonId' in pullResult, 'missing syncJson/syncJsonId');
                            (0, _common.invariant)(null === lastPulledAt, 'unsafeTurbo can only be used as the first sync');
                            syncJsonId = pullResult.syncJsonId || Math.floor(1000000000 * Math.random());
                            if (pullResult.syncJson) {
                              return Promise.resolve(database.adapter.provideSyncJson(syncJsonId, pullResult.syncJson)).then(function ($await_13) {
                                try {
                                  return $If_5.call(this);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            }
                            function $If_5() {
                              return Promise.resolve(database.adapter.unsafeLoadFromSync(syncJsonId)).then(function ($await_14) {
                                try {
                                  resultRest = $await_14;
                                  newLastPulledAt = resultRest.timestamp;
                                  onDidPullChanges && onDidPullChanges(resultRest);
                                  return $If_2.call(this);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            }
                            return $If_5.call(this);
                          }
                          function $If_2() {
                            log && (log.newLastPulledAt = newLastPulledAt);
                            (0, _common.invariant)('number' === typeof newLastPulledAt && 0 < newLastPulledAt, "pullChanges() returned invalid timestamp ".concat(newLastPulledAt, ". timestamp must be a non-zero number"));
                            if (!unsafeTurbo) {
                              ({
                                changes: remoteChanges
                              } = pullResult), _resultRest = (0, _objectWithoutPropertiesLoose2.default)(pullResult, _excluded);
                              log && (log.remoteChangeCount = remoteChangeCount);
                              // $FlowFixMe
                              return Promise.resolve((0, _index.applyRemoteChanges)(remoteChanges, {
                                db: database,
                                strategy: pullResult.experimentalStrategy,
                                sendCreatedAsUpdated: sendCreatedAsUpdated,
                                log: log,
                                conflictResolver: conflictResolver,
                                _unsafeBatchPerCollection: _unsafeBatchPerCollection
                              })).then(function ($await_15) {
                                try {
                                  onDidPullChanges && onDidPullChanges(_resultRest);
                                  return $If_3.call(this);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            }
                            function $If_3() {
                              log && (log.phase = 'applied remote changes');
                              return Promise.resolve((0, _index.setLastPulledAt)(database, newLastPulledAt)).then(function ($await_16) {
                                try {
                                  if (shouldSaveSchemaVersion) {
                                    return Promise.resolve((0, _index.setLastPulledSchemaVersion)(database, schemaVersion)).then(function ($await_17) {
                                      try {
                                        return $If_4.call(this);
                                      } catch ($boundEx) {
                                        return $error($boundEx);
                                      }
                                    }.bind(this), $error);
                                  }
                                  function $If_4() {
                                    return $return();
                                  }
                                  return $If_4.call(this);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            }
                            return $If_3.call(this);
                          }
                          return $If_2.call(this);
                        } catch ($boundEx) {
                          return $error($boundEx);
                        }
                      }.bind(this), $error);
                    });
                  }, 'sync-synchronize-apply')).then(function ($await_18) {
                    try {
                      // push phase
                      if (pushChanges) {
                        log && (log.phase = 'ready to fetch local changes');
                        return Promise.resolve((0, _index.fetchLocalChanges)(database)).then(function ($await_19) {
                          try {
                            localChanges = $await_19;
                            log && (log.localChangeCount = (0, _helpers.changeSetCount)(localChanges.changes));
                            log && (log.phase = 'fetched local changes');
                            (0, _helpers.ensureSameDatabase)(database, resetCount);
                            if (!(0, _helpers.isChangeSetEmpty)(localChanges.changes)) {
                              log && (log.phase = 'ready to push');
                              return Promise.resolve(pushChanges({
                                changes: localChanges.changes,
                                lastPulledAt: newLastPulledAt
                              })).then(function ($await_20) {
                                try {
                                  pushResult = $await_20 || {};
                                  log && (log.phase = 'pushed');
                                  log && (log.rejectedIds = pushResult.experimentalRejectedIds);
                                  (0, _helpers.ensureSameDatabase)(database, resetCount);
                                  return Promise.resolve((0, _index.markLocalChangesAsSynced)(database, localChanges, pushResult.experimentalRejectedIds)).then(function ($await_21) {
                                    try {
                                      log && (log.phase = 'marked local changes as synced');
                                      return $If_7.call(this);
                                    } catch ($boundEx) {
                                      return $error($boundEx);
                                    }
                                  }.bind(this), $error);
                                } catch ($boundEx) {
                                  return $error($boundEx);
                                }
                              }.bind(this), $error);
                            }
                            function $If_7() {
                              return $If_6.call(this);
                            }
                            return $If_7.call(this);
                          } catch ($boundEx) {
                            return $error($boundEx);
                          }
                        }.bind(this), $error);
                      } else {
                        log && (log.phase = 'pushChanges not defined');
                        return $If_6.call(this);
                      }
                      function $If_6() {
                        log && (log.finishedAt = new Date());
                        log && (log.phase = 'done');
                        return $return();
                      }
                    } catch ($boundEx) {
                      return $error($boundEx);
                    }
                  }.bind(this), $error);
                }
                return $If_1.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }.bind(this), $error);
  });
}