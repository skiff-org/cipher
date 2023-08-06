"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));
var _logger = _interopRequireDefault(require("../../utils/common/logger"));
var _common = require("../common");
var _dispatcher = _interopRequireDefault(require("./dispatcher"));
// don't import the whole utils/ here!
var LokiJSAdapter = /*#__PURE__*/function () {
  function LokiJSAdapter(options) {
    var _options$useWebWorker;
    this._options = options;
    this.dbName = options.dbName || 'loki';
    var {
      schema: schema,
      migrations: migrations
    } = options;
    var useWebWorker = null !== (_options$useWebWorker = options.useWebWorker) && void 0 !== _options$useWebWorker ? _options$useWebWorker : 'test' !== process.env.NODE_ENV;
    this._dispatcher = new _dispatcher.default(useWebWorker);
    this.schema = schema;
    this.migrations = migrations;
    if ('production' !== process.env.NODE_ENV) {
      (0, _invariant.default)('useWebWorker' in options, 'LokiJSAdapter `useWebWorker` option is required. Pass `{ useWebWorker: false }` to adopt the new behavior, or `{ useWebWorker: true }` to supress this warning with no changes');
      if (true === options.useWebWorker) {
        _logger.default.warn('LokiJSAdapter {useWebWorker: true} option is now deprecated. If you rely on this feature, please file an issue');
      }
      (0, _invariant.default)('useIncrementalIndexedDB' in options, 'LokiJSAdapter `useIncrementalIndexedDB` option is required. Pass `{ useIncrementalIndexedDB: true }` to adopt the new behavior, or `{ useIncrementalIndexedDB: false }` to supress this warning with no changes');
      if (false === options.useIncrementalIndexedDB) {
        _logger.default.warn('LokiJSAdapter {useIncrementalIndexedDB: false} option is now deprecated. If you rely on this feature, please file an issue');
      }
      (0, _common.validateAdapter)(this);
    }
    this._dispatcher.call('setUp', [options], function callback(result) {
      return (0, _common.devSetupCallback)(result, options.onSetUpError);
    });
  }

  // eslint-disable-next-line no-use-before-define
  var _proto = LokiJSAdapter.prototype;
  _proto.testClone = function testClone(options = {}) {
    return new Promise(function ($return) {
      // Ensure data is saved to memory
      // $FlowFixMe
      var driver = this._driver;
      driver.loki.close();

      // $FlowFixMe
      return $return(new LokiJSAdapter((0, _extends2.default)({}, this._options, {
        _testLokiAdapter: driver.loki.persistenceAdapter
      }, options)));
    }.bind(this));
  };
  _proto.find = function find(table, id, callback) {
    (0, _common.validateTable)(table, this.schema);
    this._dispatcher.call('find', [table, id], callback);
  };
  _proto.query = function query(_query, callback) {
    (0, _common.validateTable)(_query.table, this.schema);
    this._dispatcher.call('query', [_query], callback);
  };
  _proto.queryIds = function queryIds(query, callback) {
    (0, _common.validateTable)(query.table, this.schema);
    this._dispatcher.call('queryIds', [query], callback);
  };
  _proto.unsafeQueryRaw = function unsafeQueryRaw(query, callback) {
    (0, _common.validateTable)(query.table, this.schema);
    this._dispatcher.call('unsafeQueryRaw', [query], callback);
  };
  _proto.count = function count(query, callback) {
    (0, _common.validateTable)(query.table, this.schema);
    this._dispatcher.call('count', [query], callback);
  };
  _proto.batch = function batch(operations, callback) {
    var _this = this;
    operations.forEach(function ([, table]) {
      return (0, _common.validateTable)(table, _this.schema);
    });
    // batches are only strings + raws which only have JSON-compatible values, rest is immutable
    this._dispatcher.call('batch', [operations], callback, 'shallowCloneDeepObjects');
  };
  _proto.getDeletedRecords = function getDeletedRecords(table, callback) {
    (0, _common.validateTable)(table, this.schema);
    this._dispatcher.call('getDeletedRecords', [table], callback);
  };
  _proto.destroyDeletedRecords = function destroyDeletedRecords(table, recordIds, callback) {
    (0, _common.validateTable)(table, this.schema);
    this._dispatcher.call('batch', [recordIds.map(function (id) {
      return ['destroyPermanently', table, id];
    })], callback, 'immutable', 'immutable');
  };
  _proto.unsafeLoadFromSync = function unsafeLoadFromSync(jsonId, callback) {
    callback({
      error: new Error('unsafeLoadFromSync unavailable in LokiJS')
    });
  };
  _proto.provideSyncJson = function provideSyncJson(id, syncPullResultJson, callback) {
    callback({
      error: new Error('provideSyncJson unavailable in LokiJS')
    });
  };
  _proto.unsafeResetDatabase = function unsafeResetDatabase(callback) {
    this._dispatcher.call('unsafeResetDatabase', [], callback);
  };
  _proto.unsafeExecute = function unsafeExecute(operations, callback) {
    this._dispatcher.call('unsafeExecute', [operations], callback);
  };
  _proto.getLocal = function getLocal(key, callback) {
    this._dispatcher.call('getLocal', [key], callback);
  };
  _proto.setLocal = function setLocal(key, value, callback) {
    (0, _invariant.default)('string' === typeof value, 'adapter.setLocal() value must be a string');
    this._dispatcher.call('setLocal', [key, value], callback);
  };
  _proto.removeLocal = function removeLocal(key, callback) {
    this._dispatcher.call('removeLocal', [key], callback);
  }

  // dev/debug utility
  ;
  // (experimental)
  _proto._fatalError = function _fatalError(error) {
    this._dispatcher.call('_fatalError', [error], function () {});
  }

  // (experimental)
  ;
  _proto._clearCachedRecords = function _clearCachedRecords() {
    this._dispatcher.call('clearCachedRecords', [], function () {});
  };
  _proto._debugDignoseMissingRecord = function _debugDignoseMissingRecord(table, id) {
    var driver = this._driver;
    if (driver) {
      var lokiCollection = driver.loki.getCollection(table);
      // if we can find the record by ID, it just means that the record cache ID was corrupted
      var didFindById = !!lokiCollection.by('id', id);
      _logger.default.log("Did find ".concat(table, "#").concat(id, " in Loki collection by ID? ").concat(didFindById));

      // if we can't, but can filter to it, it means that Loki indices are corrupted
      var didFindByFilter = !!lokiCollection.data.filter(function (doc) {
        return doc.id === id;
      });
      _logger.default.log("Did find ".concat(table, "#").concat(id, " in Loki collection by filtering the collection? ").concat(didFindByFilter));
    }
  };
  (0, _createClass2.default)(LokiJSAdapter, [{
    key: "_driver",
    get: function get() {
      // $FlowFixMe
      return this._dispatcher._worker._bridge.driver;
    }
  }]);
  return LokiJSAdapter;
}();
exports.default = LokiJSAdapter;
LokiJSAdapter.adapterType = 'loki';