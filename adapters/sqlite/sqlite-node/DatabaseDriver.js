"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
exports.getPath = getPath;
var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));
var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));
var _Database = _interopRequireDefault(require("./Database"));
function fixArgs(args) {
  return args.map(function (value) {
    if ('boolean' === typeof value) {
      return value ? 1 : 0;
    }
    return value;
  });
}
var MigrationNeededError = /*#__PURE__*/function (_Error) {
  (0, _inheritsLoose2.default)(MigrationNeededError, _Error);
  function MigrationNeededError(databaseVersion) {
    var _this = _Error.call(this, 'MigrationNeededError') || this;
    _this.databaseVersion = databaseVersion;
    _this.type = 'MigrationNeededError';
    _this.message = 'MigrationNeededError';
    return _this;
  }
  return MigrationNeededError;
}( /*#__PURE__*/(0, _wrapNativeSuper2.default)(Error));
var SchemaNeededError = /*#__PURE__*/function (_Error2) {
  (0, _inheritsLoose2.default)(SchemaNeededError, _Error2);
  function SchemaNeededError() {
    var _this2 = _Error2.call(this, 'SchemaNeededError') || this;
    _this2.type = 'SchemaNeededError';
    _this2.message = 'SchemaNeededError';
    return _this2;
  }
  return SchemaNeededError;
}( /*#__PURE__*/(0, _wrapNativeSuper2.default)(Error));
function getPath(dbName) {
  if (':memory:' === dbName || 'file::memory:' === dbName) {
    return dbName;
  }
  var path = dbName.startsWith('/') || dbName.startsWith('file:') ? dbName : "".concat(process.cwd(), "/").concat(dbName);
  if (-1 === path.indexOf('.db')) {
    if (0 <= path.indexOf('?')) {
      var index = path.indexOf('?');
      path = "".concat(path.substring(0, index), ".db").concat(path.substring(index));
    } else {
      path = "".concat(path, ".db");
    }
  }
  return path;
}
var DatabaseDriver = /*#__PURE__*/function () {
  function DatabaseDriver() {
    this.cachedRecords = {};
  }
  var _proto = DatabaseDriver.prototype;
  _proto.initialize = function initialize(dbName, schemaVersion) {
    this.init(dbName);
    this.isCompatible(schemaVersion);
  };
  _proto.setUpWithSchema = function setUpWithSchema(dbName, schema, schemaVersion) {
    this.init(dbName);
    this.unsafeResetDatabase({
      version: schemaVersion,
      sql: schema
    });
    this.isCompatible(schemaVersion);
  };
  _proto.setUpWithMigrations = function setUpWithMigrations(dbName, migrations) {
    this.init(dbName);
    this.migrate(migrations);
    this.isCompatible(migrations.to);
  };
  _proto.init = function init(dbName) {
    this.database = new _Database.default(getPath(dbName));
    var isSharedMemory = 0 < dbName.indexOf('mode=memory') && 0 < dbName.indexOf('cache=shared');
    if (isSharedMemory) {
      if (!DatabaseDriver.sharedMemoryConnections[dbName]) {
        DatabaseDriver.sharedMemoryConnections[dbName] = this.database;
      }
      this.database = DatabaseDriver.sharedMemoryConnections[dbName];
    }
  };
  _proto.find = function find(table, id) {
    if (this.isCached(table, id)) {
      return id;
    }
    var query = "SELECT * FROM '".concat(table, "' WHERE id == ? LIMIT 1");
    var results = this.database.queryRaw(query, [id]);
    if (0 === results.length) {
      return null;
    }
    this.markAsCached(table, id);
    return results[0];
  };
  _proto.cachedQuery = function cachedQuery(table, query, args) {
    var _this3 = this;
    var results = this.database.queryRaw(query, fixArgs(args));
    return results.map(function (row) {
      var id = "".concat(row.id);
      if (_this3.isCached(table, id)) {
        return id;
      }
      _this3.markAsCached(table, id);
      return row;
    });
  };
  _proto.queryIds = function queryIds(query, args) {
    return this.database.queryRaw(query, fixArgs(args)).map(function (row) {
      return "".concat(row.id);
    });
  };
  _proto.unsafeQueryRaw = function unsafeQueryRaw(query, args) {
    return this.database.queryRaw(query, fixArgs(args));
  };
  _proto.count = function count(query, args) {
    return this.database.count(query, fixArgs(args));
  };
  _proto.batch = function batch(operations) {
    var _this4 = this;
    var newIds = [];
    var removedIds = [];
    this.database.inTransaction(function () {
      operations.forEach(function (operation) {
        var [cacheBehavior, table, sql, argBatches] = operation;
        argBatches.forEach(function (args) {
          _this4.database.execute(sql, fixArgs(args));
          if (1 === cacheBehavior) {
            newIds.push([table, args[0]]);
          } else if (-1 === cacheBehavior) {
            removedIds.push([table, args[0]]);
          }
        });
      });
    });
    newIds.forEach(function ([table, id]) {
      _this4.markAsCached(table, id);
    });
    removedIds.forEach(function ([table, id]) {
      _this4.removeFromCache(table, id);
    });
  }

  // MARK: - LocalStorage
  ;
  _proto.getLocal = function getLocal(key) {
    var results = this.database.queryRaw('SELECT `value` FROM `local_storage` WHERE `key` = ?', [key]);
    if (0 < results.length) {
      return results[0].value;
    }
    return null;
  }

  // MARK: - Record caching
  ;
  _proto.hasCachedTable = function hasCachedTable(table) {
    // $FlowFixMe
    return Object.prototype.hasOwnProperty.call(this.cachedRecords, table);
  };
  _proto.isCached = function isCached(table, id) {
    if (this.hasCachedTable(table)) {
      return this.cachedRecords[table].has(id);
    }
    return false;
  };
  _proto.markAsCached = function markAsCached(table, id) {
    if (!this.hasCachedTable(table)) {
      this.cachedRecords[table] = new Set();
    }
    this.cachedRecords[table].add(id);
  };
  _proto.removeFromCache = function removeFromCache(table, id) {
    if (this.hasCachedTable(table) && this.cachedRecords[table].has(id)) {
      this.cachedRecords[table].delete(id);
    }
  }

  // MARK: - Other private details
  ;
  _proto.isCompatible = function isCompatible(schemaVersion) {
    var databaseVersion = this.database.userVersion;
    if (schemaVersion !== databaseVersion) {
      if (0 < databaseVersion && databaseVersion < schemaVersion) {
        throw new MigrationNeededError(databaseVersion);
      } else {
        throw new SchemaNeededError();
      }
    }
  };
  _proto.unsafeResetDatabase = function unsafeResetDatabase(schema) {
    var _this5 = this;
    this.database.unsafeDestroyEverything();
    this.cachedRecords = {};
    this.database.inTransaction(function () {
      _this5.database.executeStatements(schema.sql);
      _this5.database.userVersion = schema.version;
    });
  };
  _proto.migrate = function migrate(migrations) {
    var _this6 = this;
    var databaseVersion = this.database.userVersion;
    if ("".concat(migrations.from) !== "".concat(databaseVersion)) {
      throw new Error("Incompatbile migration set applied. DB: ".concat(databaseVersion, ", migration: ").concat(migrations.from));
    }
    this.database.inTransaction(function () {
      _this6.database.executeStatements(migrations.sql);
      _this6.database.userVersion = migrations.to;
    });
  };
  return DatabaseDriver;
}();
DatabaseDriver.sharedMemoryConnections = {};
var _default = DatabaseDriver;
exports.default = _default;