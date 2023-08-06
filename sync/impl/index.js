"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.fetchLocalChanges = exports.applyRemoteChanges = void 0;
exports.getLastPulledAt = getLastPulledAt;
exports.getLastPulledSchemaVersion = getLastPulledSchemaVersion;
exports.getMigrationInfo = getMigrationInfo;
exports.markLocalChangesAsSynced = exports.hasUnsyncedChanges = void 0;
exports.setLastPulledAt = setLastPulledAt;
exports.setLastPulledSchemaVersion = setLastPulledSchemaVersion;
var _common = require("../../utils/common");
var _getSyncChanges = _interopRequireDefault(require("../../Schema/migrations/getSyncChanges"));
var _applyRemote = _interopRequireDefault(require("./applyRemote"));
exports.applyRemoteChanges = _applyRemote.default;
var _fetchLocal = _interopRequireWildcard(require("./fetchLocal"));
exports.fetchLocalChanges = _fetchLocal.default;
exports.hasUnsyncedChanges = _fetchLocal.hasUnsyncedChanges;
var _markAsSynced = _interopRequireDefault(require("./markAsSynced"));
exports.markLocalChangesAsSynced = _markAsSynced.default;
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var lastPulledAtKey = '__watermelon_last_pulled_at';
var lastPulledSchemaVersionKey = '__watermelon_last_pulled_schema_version';
function getLastPulledAt(database) {
  return new Promise(function ($return, $error) {
    return Promise.resolve(database.adapter.getLocal(lastPulledAtKey)).then(function ($await_1) {
      try {
        return $return(parseInt($await_1, 10) || null);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
function setLastPulledAt(database, timestamp) {
  return new Promise(function ($return, $error) {
    var previousTimestamp;
    return Promise.resolve(getLastPulledAt(database)).then(function ($await_2) {
      try {
        previousTimestamp = $await_2 || 0;
        if (timestamp < previousTimestamp) {
          (0, _common.logError)("[Sync] Pull has finished and received server time ".concat(timestamp, " \u2014 but previous pulled-at time was greater - ").concat(previousTimestamp, ". This is most likely server bug."));
        }
        return Promise.resolve(database.adapter.setLocal(lastPulledAtKey, "".concat(timestamp))).then(function () {
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
function getLastPulledSchemaVersion(database) {
  return new Promise(function ($return, $error) {
    return Promise.resolve(database.adapter.getLocal(lastPulledSchemaVersionKey)).then(function ($await_4) {
      try {
        return $return(parseInt($await_4, 10) || null);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
function setLastPulledSchemaVersion(database, version) {
  return new Promise(function ($return, $error) {
    return Promise.resolve(database.adapter.setLocal(lastPulledSchemaVersionKey, "".concat(version))).then(function () {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
function getMigrationInfo(database, log, lastPulledAt, migrationsEnabledAtVersion) {
  return new Promise(function ($return, $error) {
    var isFirstSync, schemaVersion, lastPulledSchemaVersion, areMigrationsEnabled, migrations, migrateFrom, shouldMigrate, migration;
    isFirstSync = !lastPulledAt;
    schemaVersion = database.schema.version;
    return Promise.resolve(getLastPulledSchemaVersion(database)).then(function ($await_6) {
      try {
        lastPulledSchemaVersion = $await_6;
        log && (log.lastPulledSchemaVersion = lastPulledSchemaVersion);
        areMigrationsEnabled = !!migrationsEnabledAtVersion;
        ({
          migrations: migrations
        } = database.adapter);
        if (lastPulledSchemaVersion && isFirstSync) {
          (0, _common.logError)('[Sync] lastPulledSchemaVersion is set, but this is the first sync. This most likely means that the backend does not return a correct timestamp');
        }
        if (areMigrationsEnabled) {
          (0, _common.invariant)('number' === typeof migrationsEnabledAtVersion && 1 <= migrationsEnabledAtVersion, '[Sync] Invalid migrationsEnabledAtVersion');
          (0, _common.invariant)(migrationsEnabledAtVersion <= schemaVersion, '[Sync] migrationsEnabledAtVersion must not be greater than current schema version');
          (0, _common.invariant)(migrations, '[Sync] Migration syncs cannot be enabled on a database that does not support migrations');
          (0, _common.invariant)(migrationsEnabledAtVersion >= migrations.minVersion, "[Sync] migrationsEnabledAtVersion is too low - not possible to migrate from schema version ".concat(migrationsEnabledAtVersion));
          lastPulledSchemaVersion && (0, _common.invariant)(lastPulledSchemaVersion <= schemaVersion, "[Sync] Last synced schema version (".concat(lastPulledSchemaVersion, ") is greater than current schema version (").concat(schemaVersion, "). This indicates programmer error"));
        }
        migrateFrom = lastPulledSchemaVersion || migrationsEnabledAtVersion || 0;
        shouldMigrate = areMigrationsEnabled && migrateFrom < schemaVersion && !isFirstSync;
        migration = migrations && shouldMigrate ? (0, _getSyncChanges.default)(migrations, migrateFrom, schemaVersion) : null;
        log && (log.migration = migration);
        if (migration) {
          _common.logger.log("[Sync] Performing migration sync from ".concat(migrateFrom, " to ").concat(schemaVersion));
          if (!lastPulledSchemaVersion) {
            _common.logger.warn("[Sync] Using fallback initial schema version. The migration sync might not contain all necessary migrations");
          }
        }
        return $return({
          schemaVersion: schemaVersion,
          migration: migration,
          shouldSaveSchemaVersion: shouldMigrate || isFirstSync
        });
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}