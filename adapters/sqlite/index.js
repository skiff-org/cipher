"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _common = require("../../utils/common");
var _Result = require("../../utils/fp/Result");
var _fp = require("../../utils/fp");
var _common2 = require("../common");
var _encodeQuery = _interopRequireDefault(require("./encodeQuery"));
var _makeDispatcher = require("./makeDispatcher");
/* eslint-disable global-require */
if ('production' !== process.env.NODE_ENV) {
  require('./devtools');
}
var IGNORE_CACHE = 0;
var SQLiteAdapter = /*#__PURE__*/function () {
  function SQLiteAdapter(options) {
    var _this$passphrase,
      _this = this;
    this._tag = (0, _common.connectionTag)();
    // console.log(`---> Initializing new adapter (${this._tag})`)
    var {
      dbName: dbName,
      schema: schema,
      migrations: migrations,
      migrationEvents: migrationEvents,
      usesExclusiveLocking = false,
      experimentalUnsafeNativeReuse = false,
      passphrase = null
    } = options;
    this.schema = schema;
    this.migrations = migrations;
    this._migrationEvents = migrationEvents;
    this.passphrase = passphrase;
    this.dbName = this._getName(dbName);
    this._dispatcherType = (0, _makeDispatcher.getDispatcherType)(options);
    // Hacky-ish way to create an object with NativeModule-like shape, but that can dispatch method
    // calls to async, synch NativeModule, or JSI implementation w/ type safety in rest of the impl
    this._dispatcher = (0, _makeDispatcher.makeDispatcher)(this._dispatcherType, this._tag, this.dbName, {
      usesExclusiveLocking: usesExclusiveLocking,
      experimentalUnsafeNativeReuse: experimentalUnsafeNativeReuse,
      password: null !== (_this$passphrase = this.passphrase) && void 0 !== _this$passphrase ? _this$passphrase : ''
    });
    if ('production' !== process.env.NODE_ENV) {
      (0, _common2.validateAdapter)(this);
    }
    this._initPromise = (0, _Result.toPromise)(function (callback) {
      _this._init(function (result) {
        callback(result);
        (0, _common2.devSetupCallback)(result, options.onSetUpError);
      });
    });
  }
  var _proto = SQLiteAdapter.prototype;
  // eslint-disable-next-line no-use-before-define
  _proto.testClone = function testClone(options = {}) {
    return new Promise(function ($return, $error) {
      var clone = new SQLiteAdapter((0, _extends2.default)({
        dbName: this.dbName,
        schema: this.schema,
        jsi: 'jsi' === this._dispatcherType
      }, this.migrations ? {
        migrations: this.migrations
      } : {}, options));
      (0, _common.invariant)(clone._dispatcherType === this._dispatcherType, 'testCloned adapter has bad dispatcher type');
      return Promise.resolve(clone._initPromise).then(function () {
        try {
          return $return(clone);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  };
  _proto._getName = function _getName(name) {
    if ('test' === process.env.NODE_ENV) {
      return name || "file:testdb".concat(this._tag, "?mode=memory&cache=shared");
    }
    return name || 'watermelon';
  };
  _proto._init = function _init(callback) {
    var _this2 = this;
    // Try to initialize the database with just the schema number. If it matches the database,
    // we're good. If not, we try again, this time sending the compiled schema or a migration set
    // This is to speed up the launch (less to do and pass through bridge), and avoid repeating
    // migration logic inside native code
    this._dispatcher.call('initialize', [this.dbName, this.schema.version], function (result) {
      if (result.error) {
        callback(result);
        return;
      }
      var status = result.value;
      if ('schema_needed' === status.code) {
        _this2._setUpWithSchema(callback);
      } else if ('migrations_needed' === status.code) {
        _this2._setUpWithMigrations(status.databaseVersion, callback);
      } else if ('ok' !== status.code) {
        callback({
          error: new Error('Invalid database initialization status')
        });
      } else {
        callback({
          value: undefined
        });
      }
    });
  };
  _proto._setUpWithMigrations = function _setUpWithMigrations(databaseVersion, callback) {
    var _this3 = this;
    _common.logger.log('[SQLite] Database needs migrations');
    (0, _common.invariant)(0 < databaseVersion, 'Invalid database schema version');
    var migrationSteps = this._migrationSteps(databaseVersion);
    if (migrationSteps) {
      _common.logger.log("[SQLite] Migrating from version ".concat(databaseVersion, " to ").concat(this.schema.version, "..."));
      if (this._migrationEvents && this._migrationEvents.onStart) {
        this._migrationEvents.onStart();
      }
      this._dispatcher.call('setUpWithMigrations', [this.dbName, require('./encodeSchema').encodeMigrationSteps(migrationSteps), databaseVersion, this.schema.version], function (result) {
        if (result.error) {
          _common.logger.error('[SQLite] Migration failed', result.error);
          if (_this3._migrationEvents && _this3._migrationEvents.onError) {
            _this3._migrationEvents.onError(result.error);
          }
        } else {
          _common.logger.log('[SQLite] Migration successful');
          if (_this3._migrationEvents && _this3._migrationEvents.onSuccess) {
            _this3._migrationEvents.onSuccess();
          }
        }
        callback(result);
      });
    } else {
      _common.logger.warn('[SQLite] Migrations not available for this version range, resetting database instead');
      this._setUpWithSchema(callback);
    }
  };
  _proto._setUpWithSchema = function _setUpWithSchema(callback) {
    _common.logger.log("[SQLite] Setting up database with schema version ".concat(this.schema.version));
    this._dispatcher.call('setUpWithSchema', [this.dbName, this._encodedSchema(), this.schema.version], function (result) {
      if (!result.error) {
        _common.logger.log("[SQLite] Schema set up successfully");
      }
      callback(result);
    });
  };
  _proto.find = function find(table, id, callback) {
    var _this4 = this;
    (0, _common2.validateTable)(table, this.schema);
    this._dispatcher.call('find', [table, id], function (result) {
      return callback((0, _Result.mapValue)(function (rawRecord) {
        return (0, _common2.sanitizeFindResult)(rawRecord, _this4.schema.tables[table]);
      }, result));
    });
  };
  _proto.query = function query(_query, callback) {
    var _this5 = this;
    (0, _common2.validateTable)(_query.table, this.schema);
    var {
      table: table
    } = _query;
    var [sql, args] = (0, _encodeQuery.default)(_query);
    this._dispatcher.call('query', [table, sql, args], function (result) {
      return callback((0, _Result.mapValue)(function (rawRecords) {
        return (0, _common2.sanitizeQueryResult)(rawRecords, _this5.schema.tables[table]);
      }, result));
    });
  };
  _proto.queryIds = function queryIds(query, callback) {
    (0, _common2.validateTable)(query.table, this.schema);
    this._dispatcher.call('queryIds',
    // $FlowFixMe
    (0, _encodeQuery.default)(query), callback);
  };
  _proto.unsafeQueryRaw = function unsafeQueryRaw(query, callback) {
    (0, _common2.validateTable)(query.table, this.schema);
    this._dispatcher.call('unsafeQueryRaw',
    // $FlowFixMe
    (0, _encodeQuery.default)(query), callback);
  };
  _proto.count = function count(query, callback) {
    (0, _common2.validateTable)(query.table, this.schema);
    this._dispatcher.call('count',
    // $FlowFixMe
    (0, _encodeQuery.default)(query, true), callback);
  };
  _proto.batch = function batch(operations, callback) {
    this._dispatcher.call('batch', [require('./encodeBatch').default(operations, this.schema)], callback);
  };
  _proto.getDeletedRecords = function getDeletedRecords(table, callback) {
    (0, _common2.validateTable)(table, this.schema);
    this._dispatcher.call('queryIds', ["select id from \"".concat(table, "\" where _status='deleted'"), []], callback);
  };
  _proto.destroyDeletedRecords = function destroyDeletedRecords(table, recordIds, callback) {
    (0, _common2.validateTable)(table, this.schema);
    var operation = [0, null, "delete from \"".concat(table, "\" where \"id\" == ?"), recordIds.map(function (id) {
      return [id];
    })];
    this._dispatcher.call('batch', [[operation]], callback);
  };
  _proto.unsafeLoadFromSync = function unsafeLoadFromSync(jsonId, callback) {
    if ('jsi' !== this._dispatcherType) {
      callback({
        error: new Error('unsafeLoadFromSync unavailable. Use JSI mode to enable.')
      });
      return;
    }
    var {
      encodeDropIndices: encodeDropIndices,
      encodeCreateIndices: encodeCreateIndices
    } = require('./encodeSchema');
    var {
      schema: schema
    } = this;
    this._dispatcher.call('unsafeLoadFromSync', [jsonId, schema, encodeDropIndices(schema), encodeCreateIndices(schema)], function (result) {
      return callback((0, _Result.mapValue)(
      // { key: JSON.stringify(value) } -> { key: value }
      function (residualValues) {
        return (0, _fp.mapObj)(function (values) {
          return JSON.parse(values);
        }, residualValues);
      }, result));
    });
  };
  _proto.provideSyncJson = function provideSyncJson(id, syncPullResultJson, callback) {
    if ('jsi' !== this._dispatcherType) {
      callback({
        error: new Error('provideSyncJson unavailable. Use JSI mode to enable.')
      });
      return;
    }
    this._dispatcher.call('provideSyncJson', [id, syncPullResultJson], callback);
  };
  _proto.unsafeResetDatabase = function unsafeResetDatabase(callback) {
    this._dispatcher.call('unsafeResetDatabase', [this._encodedSchema(), this.schema.version], function (result) {
      if (result.value) {
        _common.logger.log('[SQLite] Database is now reset');
      }
      callback(result);
    });
  };
  _proto.unsafeExecute = function unsafeExecute(operations, callback) {
    if ('production' !== process.env.NODE_ENV) {
      (0, _common.invariant)(operations && 'object' === typeof operations && 1 === Object.keys(operations).length && (Array.isArray(operations.sqls) || 'string' === typeof operations.sqlString), "unsafeExecute expects an { sqls: [ [sql, [args..]], ... ] } or { sqlString: 'foo; bar' } object");
    }
    if (operations.sqls) {
      var queries = operations.sqls;
      var batchOperations = queries.map(function ([sql, args]) {
        return [IGNORE_CACHE, null, sql, [args]];
      });
      this._dispatcher.call('batch', [batchOperations], callback);
    } else if (operations.sqlString) {
      this._dispatcher.call('unsafeExecuteMultiple', [operations.sqlString], callback);
    }
  };
  _proto.getLocal = function getLocal(key, callback) {
    this._dispatcher.call('getLocal', [key], callback);
  };
  _proto.setLocal = function setLocal(key, value, callback) {
    (0, _common.invariant)('string' === typeof value, 'adapter.setLocal() value must be a string');
    this._dispatcher.call('batch', [[[IGNORE_CACHE, null, "insert or replace into \"local_storage\" (\"key\", \"value\") values (?, ?)", [[key, value]]]]], callback);
  };
  _proto.removeLocal = function removeLocal(key, callback) {
    this._dispatcher.call('batch', [[[IGNORE_CACHE, null, "delete from \"local_storage\" where \"key\" == ?", [[key]]]]], callback);
  };
  _proto._encodedSchema = function _encodedSchema() {
    return require('./encodeSchema').encodeSchema(this.schema);
  };
  _proto._migrationSteps = function _migrationSteps(fromVersion) {
    var {
      stepsForMigration: stepsForMigration
    } = require('../../Schema/migrations/stepsForMigration');
    var {
      migrations: migrations
    } = this;
    // TODO: Remove this after migrations are shipped
    if (!migrations) {
      return null;
    }
    return stepsForMigration({
      migrations: migrations,
      fromVersion: fromVersion,
      toVersion: this.schema.version
    });
  };
  (0, _createClass2.default)(SQLiteAdapter, [{
    key: "initializingPromise",
    get: function get() {
      return this._initPromise;
    }
  }]);
  return SQLiteAdapter;
}();
exports.default = SQLiteAdapter;
SQLiteAdapter.adapterType = 'sqlite';