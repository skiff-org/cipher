"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
exports.setExperimentalAllowsFatalError = setExperimentalAllowsFatalError;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _logger = _interopRequireDefault(require("../../../utils/common/logger"));
var _invariant = _interopRequireDefault(require("../../../utils/common/invariant"));
var _RawRecord = require("../../../RawRecord");
var _lokiExtensions = require("./lokiExtensions");
var _executeQuery = require("./executeQuery");
// don't import the whole utils/ here!
var SCHEMA_VERSION_KEY = '_loki_schema_version';
var experimentalAllowsFatalError = false;
function setExperimentalAllowsFatalError() {
  experimentalAllowsFatalError = true;
}
var DatabaseDriver = /*#__PURE__*/function () {
  // (experimental) if true, DatabaseDriver is in a broken state and should not be used anymore

  function DatabaseDriver(options) {
    this.cachedRecords = new Map();
    this._isBroken = false;
    var {
      schema: schema,
      migrations: migrations
    } = options;
    this.options = options;
    this.schema = schema;
    this.migrations = migrations;
  }
  var _proto = DatabaseDriver.prototype;
  _proto.setUp = function setUp() {
    return new Promise(function ($return, $error) {
      return Promise.resolve(this._openDatabase()).then(function () {
        try {
          return Promise.resolve(this._migrateIfNeeded()).then(function () {
            try {
              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }.bind(this));
  };
  _proto.isCached = function isCached(table, id) {
    var cachedSet = this.cachedRecords.get(table);
    return cachedSet ? cachedSet.has(id) : false;
  };
  _proto.markAsCached = function markAsCached(table, id) {
    var cachedSet = this.cachedRecords.get(table);
    if (cachedSet) {
      cachedSet.add(id);
    } else {
      this.cachedRecords.set(table, new Set([id]));
    }
  };
  _proto.removeFromCache = function removeFromCache(table, id) {
    var cachedSet = this.cachedRecords.get(table);
    if (cachedSet) {
      cachedSet.delete(id);
    }
  };
  _proto.clearCachedRecords = function clearCachedRecords() {
    this.cachedRecords = new Map();
  };
  _proto.getCache = function getCache(table) {
    var cache = this.cachedRecords.get(table);
    if (cache) {
      return cache;
    }
    var newCache = new Set([]);
    this.cachedRecords.set(table, newCache);
    return newCache;
  };
  _proto.find = function find(table, id) {
    if (this.isCached(table, id)) {
      return id;
    }
    var raw = this.loki.getCollection(table).by('id', id);
    if (!raw) {
      return null;
    }
    this.markAsCached(table, id);
    return (0, _RawRecord.sanitizedRaw)(raw, this.schema.tables[table]);
  };
  _proto.query = function query(_query) {
    var records = (0, _executeQuery.executeQuery)(_query, this.loki);
    return this._compactQueryResults(records, _query.table);
  };
  _proto.queryIds = function queryIds(query) {
    return (0, _executeQuery.executeQuery)(query, this.loki).map(function (record) {
      return record.id;
    });
  };
  _proto.unsafeQueryRaw = function unsafeQueryRaw(query) {
    return (0, _executeQuery.executeQuery)(query, this.loki);
  };
  _proto.count = function count(query) {
    return (0, _executeQuery.executeCount)(query, this.loki);
  };
  _proto.batch = function batch(operations) {
    var _this = this;
    // NOTE: Mutations to LokiJS db are *not* transactional!
    // This is terrible and lame for a database, but there's just no simple and good solution to this
    // Loki transactions rely on making a full copy of the data, and reverting to it if something breaks.
    // This is just unbearable for production-sized databases (too much memory required)
    // It could be done with some sort of advanced journaling/CoW structure scheme, but that would
    // be very complicated (in itself a source of bugs), and possibly quite expensive cpu-wise
    //
    // So instead, we assume that writes MUST succeed. If they don't, we put DatabaseDriver in a "broken"
    // state, refuse to persist or further mutate the DB, and notify the app (and user) about it.
    //
    // It can be assumed that Loki-level mutations that fail are WatermelonDB bugs that must be fixed
    this._assertNotBroken();
    try {
      var recordsToCreate = {};
      operations.forEach(function (operation) {
        var [type, table, raw] = operation;
        switch (type) {
          case 'create':
            if (!recordsToCreate[table]) {
              recordsToCreate[table] = [];
            }
            recordsToCreate[table].push(raw);
            break;
          default:
            break;
        }
      });

      // We're doing a second pass, because batch insert is much faster in Loki
      Object.entries(recordsToCreate).forEach(function (args) {
        var [table, raws] = args;
        var shouldRebuildIndexAfterInsert = 1000 <= raws.length; // only profitable for large inserts
        _this.loki.getCollection(table).insert(raws, shouldRebuildIndexAfterInsert);
        var cache = _this.getCache(table);
        raws.forEach(function (raw) {
          cache.add(raw.id);
        });
      });
      operations.forEach(function (operation) {
        var [type, table, rawOrId] = operation;
        var collection = _this.loki.getCollection(table);
        switch (type) {
          case 'update':
            // Loki identifies records using internal $loki ID so we must find the saved record first
            var lokiId = collection.by('id', rawOrId.id).$loki;
            var raw = rawOrId;
            raw.$loki = lokiId;
            collection.update(raw);
            break;
          case 'markAsDeleted':
            var id = rawOrId;
            var record = collection.by('id', id);
            if (record) {
              record._status = 'deleted';
              collection.update(record);
              _this.removeFromCache(table, id);
            }
            break;
          case 'destroyPermanently':
            var _id = rawOrId;
            var _record = collection.by('id', _id);
            _record && collection.remove(_record);
            _this.removeFromCache(table, _id);
            break;
          default:
            break;
        }
      });
    } catch (error) {
      this._fatalError(error);
    }
  };
  _proto.getDeletedRecords = function getDeletedRecords(table) {
    return this.loki.getCollection(table).find({
      _status: {
        $eq: 'deleted'
      }
    }).map(function (record) {
      return record.id;
    });
  };
  _proto.unsafeExecute = function unsafeExecute(operations) {
    if ('production' !== process.env.NODE_ENV) {
      (0, _invariant.default)(operations && 'object' === typeof operations && 1 === Object.keys(operations).length && 'function' === typeof operations.loki, 'unsafeExecute expects an { loki: loki => { ... } } object');
    }
    var lokiBlock = operations.loki;
    lokiBlock(this.loki);
  };
  _proto.unsafeResetDatabase = function unsafeResetDatabase() {
    return new Promise(function ($return, $error) {
      return Promise.resolve((0, _lokiExtensions.deleteDatabase)(this.loki)).then(function () {
        try {
          this.cachedRecords.clear();
          _logger.default.log('[Loki] Database is now reset');
          return Promise.resolve(this._openDatabase()).then(function () {
            try {
              this._setUpSchema();
              return $return();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }.bind(this));
  }

  // *** LocalStorage ***
  ;
  _proto.getLocal = function getLocal(key) {
    var record = this._findLocal(key);
    return record ? record.value : null;
  };
  _proto.setLocal = function setLocal(key, value) {
    this._assertNotBroken();
    try {
      var record = this._findLocal(key);
      if (record) {
        record.value = value;
        this._localStorage.update(record);
      } else {
        this._localStorage.insert({
          key: key,
          value: value
        });
      }
    } catch (error) {
      this._fatalError(error);
    }
  };
  _proto.removeLocal = function removeLocal(key) {
    this._assertNotBroken();
    try {
      var record = this._findLocal(key);
      if (record) {
        this._localStorage.remove(record);
      }
    } catch (error) {
      this._fatalError(error);
    }
  }

  // *** Internals ***
  ;
  _proto._openDatabase = function _openDatabase() {
    return new Promise(function ($return, $error) {
      _logger.default.log('[Loki] Initializing IndexedDB');
      return Promise.resolve((0, _lokiExtensions.newLoki)(this.options)).then(function ($await_13) {
        try {
          this.loki = $await_13;
          _logger.default.log('[Loki] Database loaded');
          return $return();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }.bind(this));
  };
  _proto._setUpSchema = function _setUpSchema() {
    var _this2 = this;
    _logger.default.log('[Loki] Setting up schema');

    // Add collections
    var tables = Object.values(this.schema.tables);
    tables.forEach(function (tableSchema) {
      _this2._addCollection(tableSchema);
    });
    this.loki.addCollection('local_storage', {
      unique: ['key'],
      indices: [],
      disableMeta: true
    });

    // Set database version
    this._databaseVersion = this.schema.version;
    _logger.default.log('[Loki] Database collections set up');
  };
  _proto._addCollection = function _addCollection(tableSchema) {
    var {
      name: name,
      columnArray: columnArray
    } = tableSchema;
    var indexedColumns = columnArray.reduce(function (indexes, column) {
      return column.isIndexed ? indexes.concat([column.name]) : indexes;
    }, []);
    this.loki.addCollection(name, {
      unique: ['id'],
      indices: ['_status'].concat((0, _toConsumableArray2.default)(indexedColumns)),
      disableMeta: true
    });
  };
  _proto._migrateIfNeeded = function _migrateIfNeeded() {
    return new Promise(function ($return, $error) {
      var dbVersion, schemaVersion, migrationSteps;
      dbVersion = this._databaseVersion;
      schemaVersion = this.schema.version;
      if (dbVersion === schemaVersion) {
        return $If_5.call(this);
      } // All good!
      else {
        if (0 === dbVersion) {
          _logger.default.log('[Loki] Empty database, setting up');
          return Promise.resolve(this.unsafeResetDatabase()).then(function () {
            try {
              return $If_6.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        } else {
          if (0 < dbVersion && dbVersion < schemaVersion) {
            _logger.default.log('[Loki] Database has old schema version. Migration is required.');
            migrationSteps = this._getMigrationSteps(dbVersion);
            if (migrationSteps) {
              _logger.default.log("[Loki] Migrating from version ".concat(dbVersion, " to ").concat(this.schema.version, "..."));
              var $Try_4_Post = function () {
                try {
                  return $If_8.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this);
              var $Try_4_Catch = function (error) {
                try {
                  _logger.default.error('[Loki] Migration failed', error);
                  throw error;
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              };
              try {
                return Promise.resolve(this._migrate(migrationSteps)).then(function () {
                  try {
                    return $Try_4_Post();
                  } catch ($boundEx) {
                    return $Try_4_Catch($boundEx);
                  }
                }, $Try_4_Catch);
              } catch (error) {
                $Try_4_Catch(error)
              }
            } else {
              _logger.default.warn('[Loki] Migrations not available for this version range, resetting database instead');
              return Promise.resolve(this.unsafeResetDatabase()).then(function () {
                try {
                  return $If_8.call(this);
                } catch ($boundEx) {
                  return $error($boundEx);
                }
              }.bind(this), $error);
            }
            function $If_8() {
              return $If_7.call(this);
            }
          } else {
            _logger.default.warn("[Loki] Database has newer version ".concat(dbVersion, " than app schema ").concat(schemaVersion, ". Resetting database."));
            return Promise.resolve(this.unsafeResetDatabase()).then(function () {
              try {
                return $If_7.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }
          function $If_7() {
            return $If_6.call(this);
          }
        }
        function $If_6() {
          return $If_5.call(this);
        }
      }
      function $If_5() {
        return $return();
      }
    }.bind(this));
  };
  _proto._getMigrationSteps = function _getMigrationSteps(fromVersion) {
    // TODO: Remove this after migrations are shipped
    var {
      migrations: migrations
    } = this;
    if (!migrations) {
      return null;
    }
    var {
      stepsForMigration: stepsForMigration
    } = require('../../../Schema/migrations/stepsForMigration');
    return stepsForMigration({
      migrations: migrations,
      fromVersion: fromVersion,
      toVersion: this.schema.version
    });
  };
  _proto._migrate = function _migrate(steps) {
    return new Promise(function ($return) {
      var _this3 = this;
      steps.forEach(function (step) {
        if ('create_table' === step.type) {
          _this3._executeCreateTableMigration(step);
        } else if ('add_columns' === step.type) {
          _this3._executeAddColumnsMigration(step);
        } else if (!('sql' === step.type)) {
          throw new Error("Unsupported migration step ".concat(step.type));
        } // ignore
      });

      // Set database version
      this._databaseVersion = this.schema.version;
      _logger.default.log("[Loki] Migration successful");
      return $return();
    }.bind(this));
  };
  _proto._executeCreateTableMigration = function _executeCreateTableMigration({
    schema: schema
  }) {
    this._addCollection(schema);
  };
  _proto._executeAddColumnsMigration = function _executeAddColumnsMigration({
    table: table,
    columns: columns
  }) {
    var collection = this.loki.getCollection(table);

    // update ALL records in the collection, adding new fields
    collection.findAndUpdate({}, function (record) {
      columns.forEach(function (column) {
        (0, _RawRecord.setRawSanitized)(record, column.name, null, column);
      });
    });

    // add indexes, if needed
    columns.forEach(function (column) {
      if (column.isIndexed) {
        collection.ensureIndex(column.name);
      }
    });
  }

  // Maps records to their IDs if the record is already cached on JS side
  ;
  _proto._compactQueryResults = function _compactQueryResults(records, table) {
    var _this4 = this;
    var cache = this.getCache(table);
    return records.map(function (raw) {
      var {
        id: id
      } = raw;
      if (cache.has(id)) {
        return id;
      }
      cache.add(id);
      return (0, _RawRecord.sanitizedRaw)(raw, _this4.schema.tables[table]);
    });
  };
  _proto._findLocal = function _findLocal(key) {
    var localStorage = this._localStorage;
    return localStorage && localStorage.by('key', key);
  };
  _proto._assertNotBroken = function _assertNotBroken() {
    if (this._isBroken) {
      throw new Error('DatabaseDriver is in a broken state, bailing...');
    }
  }

  // (experimental)
  // TODO: Setup, migrations, delete database should also break driver
  ;
  _proto._fatalError = function _fatalError(error) {
    if (!experimentalAllowsFatalError) {
      _logger.default.warn('DatabaseDriver is broken, but experimentalAllowsFatalError has not been enabled to do anything about it...');
      throw error;
    }
    // Stop further mutations
    this._isBroken = true;

    // Disable Loki autosave
    (0, _lokiExtensions.lokiFatalError)(this.loki);

    // Notify handler
    _logger.default.error('DatabaseDriver is broken. App must be reloaded before continuing.');
    var handler = this.options._onFatalError;
    handler && handler(error);

    // Rethrow error
    throw error;
  };
  (0, _createClass2.default)(DatabaseDriver, [{
    key: "_databaseVersion",
    get: function get() {
      var databaseVersionRaw = this.getLocal(SCHEMA_VERSION_KEY) || '';
      return parseInt(databaseVersionRaw, 10) || 0;
    },
    set: function set(version) {
      this.setLocal(SCHEMA_VERSION_KEY, "".concat(version));
    }
  }, {
    key: "_localStorage",
    get: function get() {
      return this.loki.getCollection('local_storage');
    }
  }]);
  return DatabaseDriver;
}();
exports.default = DatabaseDriver;