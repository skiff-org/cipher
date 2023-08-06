"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _rx = require("../utils/rx");
var _invariant = _interopRequireDefault(require("../utils/common/invariant"));
var _fp = require("../utils/fp");
var _Result = require("../utils/fp/Result");
var _Query = _interopRequireDefault(require("../Query"));
var _RecordCache = _interopRequireDefault(require("./RecordCache"));
var Collection = /*#__PURE__*/function () {
  /**
   * `Model` subclass associated with this Collection
   */

  /**
   * An `Rx.Subject` that emits a signal on every change (record creation/update/deletion) in
   * this Collection.
   *
   * The emissions contain information about which record was changed and what the change was.
   *
   * Warning: You can easily introduce performance bugs in your application by using this method
   * inappropriately. You generally should just use the `Query` API.
   */

  function Collection(database, ModelClass) {
    var _this = this;
    this.changes = new _rx.Subject();
    this._subscribers = [];
    this.database = database;
    this.modelClass = ModelClass;
    this._cache = new _RecordCache.default(ModelClass.table, function (raw) {
      return new ModelClass(_this, raw);
    }, this);
  }

  /**
   * `Database` associated with this Collection.
   */
  var _proto = Collection.prototype;
  /**
   * Fetches the record with the given ID.
   *
   * If the record is not found, the Promise will reject.
   */
  _proto.find = function find(id) {
    return new Promise(function ($return) {
      var _this2 = this;
      return $return((0, _Result.toPromise)(function (callback) {
        return _this2._fetchRecord(id, callback);
      }));
    }.bind(this));
  }

  /**
   * Fetches the given record and then starts observing it.
   *
   * This is a convenience method that's equivalent to
   * `collection.find(id)`, followed by `record.observe()`.
   */;
  _proto.findAndObserve = function findAndObserve(id) {
    var _this3 = this;
    return _rx.Observable.create(function (observer) {
      var unsubscribe = null;
      var unsubscribed = false;
      _this3._fetchRecord(id, function (result) {
        if (result.value) {
          var record = result.value;
          observer.next(record);
          unsubscribe = record.experimentalSubscribe(function (isDeleted) {
            if (!unsubscribed) {
              isDeleted ? observer.complete() : observer.next(record);
            }
          });
        } else {
          // $FlowFixMe
          observer.error(result.error);
        }
      });
      return function () {
        unsubscribed = true;
        unsubscribe && unsubscribe();
      };
    });
  }

  /*:: query: ArrayOrSpreadFn<Clause, Query<Record>>  */
  /**
   * Returns a `Query` with conditions given.
   *
   * You can pass conditions as multiple arguments or a single array.
   *
   * See docs for details about the Query API.
   */
  // $FlowFixMe
  ;
  _proto.query = function query(...args) {
    var clauses = (0, _fp.fromArrayOrSpread)(args, 'Collection.query', 'Clause');
    return new _Query.default(this, clauses);
  }

  /**
   * Creates a new record.
   * Pass a function to set attributes of the new record.
   *
   * Note: This method must be called within a Writer {@link Database#write}.
   *
   * @example
   * ```js
   * db.get(Tables.tasks).create(task => {
   *   task.name = 'Task name'
   * })
   * ```
   */;
  _proto.create = function create(recordBuilder = _fp.noop) {
    return new Promise(function ($return, $error) {
      var record;
      this.database._ensureInWriter("Collection.create()");
      record = this.prepareCreate(recordBuilder);
      return Promise.resolve(this.database.batch(record)).then(function () {
        try {
          return $return(record);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  }

  /**
   * Prepares a new record to be created
   *
   * Use this to batch-execute multiple changes at once.
   * @see {Collection#create}
   * @see {Database#batch}
   */;
  _proto.prepareCreate = function prepareCreate(recordBuilder = _fp.noop) {
    // $FlowFixMe
    return this.modelClass._prepareCreate(this, recordBuilder);
  }

  /**
   * Prepares a new record to be created, based on a raw object.
   *
   * Don't use this unless you know how RawRecords work in WatermelonDB. See docs for more details.
   *
   * This is useful as a performance optimization, when adding online-only features to an otherwise
   * offline-first app, or if you're implementing your own sync mechanism.
   */;
  _proto.prepareCreateFromDirtyRaw = function prepareCreateFromDirtyRaw(dirtyRaw) {
    // $FlowFixMe
    return this.modelClass._prepareCreateFromDirtyRaw(this, dirtyRaw);
  }

  /**
   * Returns a disposable record, based on a raw object.
   *
   * A disposable record is a read-only record that **does not** exist in the actual database. It's
   * not cached and cannot be saved in the database, updated, deleted, queried, or found by ID. It
   * only exists for as long as you keep a reference to it.
   *
   * Don't use this unless you know how RawRecords work in WatermelonDB. See docs for more details.
   *
   * This is useful for adding online-only features to an otherwise offline-first app, or for
   * temporary objects that are not meant to be persisted (as you can reuse existing Model helpers
   * and compatible UI components to display a disposable record).
   */;
  _proto.disposableFromDirtyRaw = function disposableFromDirtyRaw(dirtyRaw) {
    // $FlowFixMe
    return this.modelClass._disposableFromDirtyRaw(this, dirtyRaw);
  }

  // *** Implementation details ***

  // See: Query.fetch
  ;
  _proto._fetchQuery = function _fetchQuery(query, callback) {
    var _this4 = this;
    this.database.adapter.underlyingAdapter.query(query.serialize(), function (result) {
      return callback((0, _Result.mapValue)(function (rawRecords) {
        return _this4._cache.recordsFromQueryResult(rawRecords);
      }, result));
    });
  };
  _proto._fetchIds = function _fetchIds(query, callback) {
    this.database.adapter.underlyingAdapter.queryIds(query.serialize(), callback);
  };
  _proto._fetchCount = function _fetchCount(query, callback) {
    this.database.adapter.underlyingAdapter.count(query.serialize(), callback);
  };
  _proto._unsafeFetchRaw = function _unsafeFetchRaw(query, callback) {
    this.database.adapter.underlyingAdapter.unsafeQueryRaw(query.serialize(), callback);
  }

  // Fetches exactly one record (See: Collection.find)
  ;
  _proto._fetchRecord = function _fetchRecord(id, callback) {
    var _this5 = this;
    if ('string' !== typeof id) {
      callback({
        error: new Error("Invalid record ID ".concat(this.table, "#").concat(id))
      });
      return;
    }
    var cachedRecord = this._cache.get(id);
    if (cachedRecord) {
      callback({
        value: cachedRecord
      });
      return;
    }
    this.database.adapter.underlyingAdapter.find(this.table, id, function (result) {
      return callback((0, _Result.mapValue)(function (rawRecord) {
        (0, _invariant.default)(rawRecord, "Record ".concat(_this5.table, "#").concat(id, " not found"));
        return _this5._cache.recordFromQueryResult(rawRecord);
      }, result));
    });
  };
  _proto._applyChangesToCache = function _applyChangesToCache(operations) {
    var _this6 = this;
    operations.forEach(function ({
      record: record,
      type: type
    }) {
      if ('created' === type) {
        record._preparedState = null;
        _this6._cache.add(record);
      } else if ('destroyed' === type) {
        _this6._cache.delete(record);
      }
    });
  };
  _proto._notify = function _notify(operations) {
    this._subscribers.forEach(function collectionChangeNotifySubscribers([subscriber]) {
      subscriber(operations);
    });
    this.changes.next(operations);
    operations.forEach(function collectionChangeNotifyModels({
      record: record,
      type: type
    }) {
      if ('updated' === type) {
        record._notifyChanged();
      } else if ('destroyed' === type) {
        record._notifyDestroyed();
      }
    });
  };
  /**
   * Notifies `subscriber` on every change (record creation/update/deletion) in this Collection.
   *
   * Notifications contain information about which record was changed and what the change was.
   * (Currently, subscribers are called before `changes` emissions, but this behavior might change)
   *
   * Warning: You can easily introduce performance bugs in your application by using this method
   * inappropriately. You generally should just use the `Query` API.
   */
  _proto.experimentalSubscribe = function experimentalSubscribe(subscriber, debugInfo) {
    var _this7 = this;
    var entry = [subscriber, debugInfo];
    this._subscribers.push(entry);
    return function () {
      var idx = _this7._subscribers.indexOf(entry);
      -1 !== idx && _this7._subscribers.splice(idx, 1);
    };
  };
  (0, _createClass2.default)(Collection, [{
    key: "db",
    get: function get() {
      return this.database;
    }

    /**
     * Table name associated with this Collection
     */
  }, {
    key: "table",
    get: function get() {
      // $FlowFixMe
      return this.modelClass.table;
    }

    /**
     * Table schema associated with this Collection
     */
  }, {
    key: "schema",
    get: function get() {
      return this.database.schema.tables[this.table];
    }
  }]);
  return Collection;
}();
exports.default = Collection;