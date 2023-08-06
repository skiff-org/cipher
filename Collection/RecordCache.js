"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _logger = _interopRequireDefault(require("../utils/common/logger"));
var RecordCache = /*#__PURE__*/function () {
  function RecordCache(tableName, recordInsantiator, collection) {
    this.map = new Map();
    this.tableName = tableName;
    this.recordInsantiator = recordInsantiator;
    this._debugCollection = collection;
  }
  var _proto = RecordCache.prototype;
  _proto.get = function get(id) {
    return this.map.get(id);
  };
  _proto.add = function add(record) {
    this.map.set(record.id, record);
  };
  _proto.delete = function _delete(record) {
    this.map.delete(record.id);
  };
  _proto.unsafeClear = function unsafeClear() {
    this.map = new Map();
  };
  _proto.recordsFromQueryResult = function recordsFromQueryResult(result) {
    var _this = this;
    return result.map(function (res) {
      return _this.recordFromQueryResult(res);
    });
  };
  _proto.recordFromQueryResult = function recordFromQueryResult(result) {
    if ('string' === typeof result) {
      return this._cachedModelForId(result);
    }
    return this._modelForRaw(result);
  };
  _proto.rawRecordsFromQueryResult = function rawRecordsFromQueryResult(results) {
    var _this2 = this;
    return results.map(function (res) {
      if ('string' === typeof res) {
        return _this2._cachedModelForId(res)._raw;
      }
      var cachedRecord = _this2.map.get(res.id);
      return cachedRecord ? cachedRecord._raw : res;
    });
  };
  _proto._cachedModelForId = function _cachedModelForId(id) {
    var record = this.map.get(id);
    if (!record) {
      var message = "Record ID ".concat(this.tableName, "#").concat(id, " was sent over the bridge, but it's not cached");
      _logger.default.error(message);

      // Reaching this branch indicates a WatermelonDB/adapter bug. We should never get a record ID
      // if we don't have it in our cache. This probably means that something crashed when adding to
      // adapter-side cached record ID set. NozbeTeams telemetry indicates that this bug *does*
      // nonetheless occur, so when it does, print out useful diagnostics and attempt to recover by
      // resetting adapter-side cached set
      try {
        var adapter = this._debugCollection.database.adapter.underlyingAdapter;

        // $FlowFixMe
        if (adapter._clearCachedRecords) {
          // $FlowFixMe
          adapter._clearCachedRecords();
        }

        // $FlowFixMe
        if (adapter._debugDignoseMissingRecord) {
          // $FlowFixMe
          adapter._debugDignoseMissingRecord(this.tableName, id);
        }
      } catch (error) {
        _logger.default.warn("Ran into an error while running diagnostics:");
        _logger.default.warn(error);
      }
      throw new Error(message);
    }
    return record;
  };
  _proto._modelForRaw = function _modelForRaw(raw, warnIfCached = true) {
    // Sanity check: is this already cached?
    var cachedRecord = this.map.get(raw.id);
    if (cachedRecord) {
      // This may legitimately happen if we previously got ID without a record and we cleared
      // adapter-side cached record ID maps to recover
      warnIfCached && _logger.default.warn("Record ".concat(this.tableName, "#").concat(cachedRecord.id, " is cached, but full raw object was sent over the bridge"));
      return cachedRecord;
    }

    // Return new model
    var newRecord = this.recordInsantiator(raw);
    this.add(newRecord);
    return newRecord;
  };
  return RecordCache;
}();
exports.default = RecordCache;