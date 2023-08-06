"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.devSetupCallback = devSetupCallback;
exports.sanitizeFindResult = sanitizeFindResult;
exports.sanitizeQueryResult = sanitizeQueryResult;
exports.validateAdapter = validateAdapter;
exports.validateTable = validateTable;
var _invariant = _interopRequireDefault(require("../utils/common/invariant"));
var _logger = _interopRequireDefault(require("../utils/common/logger"));
var _RawRecord = require("../RawRecord");
// don't import the whole utils/ here!
function validateAdapter(adapter) {
  if ('production' !== process.env.NODE_ENV) {
    var {
      schema: schema,
      migrations: migrations
    } = adapter;
    // TODO: uncomment when full migrations are shipped
    // invariant(migrations, `Missing migrations`)
    if (migrations) {
      (0, _invariant.default)(migrations.validated, "Invalid migrations - use schemaMigrations() to create migrations. See docs for more details.");
      var {
        minVersion: minVersion,
        maxVersion: maxVersion
      } = migrations;
      (0, _invariant.default)(maxVersion <= schema.version, "Migrations can't be newer than schema. Schema is version ".concat(schema.version, " and migrations cover range from ").concat(minVersion, " to ").concat(maxVersion));
      (0, _invariant.default)(maxVersion === schema.version, "Missing migration. Database schema is currently at version ".concat(schema.version, ", but migrations only cover range from ").concat(minVersion, " to ").concat(maxVersion));
    }
  }
}
function validateTable(tableName, schema) {
  (0, _invariant.default)(
  // $FlowFixMe
  Object.prototype.hasOwnProperty.call(schema.tables, tableName), "Could not invoke Adapter method because table name '".concat(tableName, "' does not exist in the schema. Most likely, it's a sync bug, and you're sending tables that don't exist in the current version of the app. Or, you made a mistake in migrations. Reminder: it's a serious programming error to pass non-whitelisted table names to Adapter."));
}
function sanitizeFindResult(dirtyRecord, tableSchema) {
  return dirtyRecord && 'object' === typeof dirtyRecord ? (0, _RawRecord.sanitizedRaw)(dirtyRecord, tableSchema) : dirtyRecord;
}
function sanitizeQueryResult(dirtyRecords, tableSchema) {
  return dirtyRecords.map(function (dirtyRecord) {
    return 'string' === typeof dirtyRecord ? dirtyRecord : (0, _RawRecord.sanitizedRaw)(dirtyRecord, tableSchema);
  });
}
function devSetupCallback(result, onSetUpError) {
  if (result.error) {
    _logger.default.error("Uh-oh. Database failed to load, we're in big trouble. This might happen if you didn't set up native code correctly (iOS, Android), or if you didn't recompile native app after WatermelonDB update. It might also mean that IndexedDB or SQLite refused to open.", result.error);
    onSetUpError && onSetUpError(result.error);
  }
}