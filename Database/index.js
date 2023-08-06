"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
exports.setExperimentalAllowsFatalError = setExperimentalAllowsFatalError;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _rx = require("../utils/rx");
var _common = require("../utils/common");
var _fp = require("../utils/fp");
var _compat = _interopRequireDefault(require("../adapters/compat"));
var _CollectionMap = _interopRequireDefault(require("./CollectionMap"));
var _WorkQueue = _interopRequireDefault(require("./WorkQueue"));
var experimentalAllowsFatalError = false;
function setExperimentalAllowsFatalError() {
  experimentalAllowsFatalError = true;
}
var Database = /*#__PURE__*/function () {
  /**
   * Database's adapter - the low-level connection with the underlying database (e.g. SQLite)
   *
   * Unless you understand WatermelonDB's internals, you SHOULD NOT use adapter directly.
   * Running queries, or updating/deleting records on the adapter will corrupt the in-memory cache
   * if special care is not taken
   */

  // (experimental) if true, Database is in a broken state and should not be used anymore

  function Database(options) {
    this._workQueue = new _WorkQueue.default(this);
    this._isBroken = false;
    this._pendingNotificationBatches = 0;
    this._pendingNotificationChanges = [];
    this._subscribers = [];
    this._resetCount = 0;
    this._isBeingReset = false;
    var {
      adapter: adapter,
      modelClasses: modelClasses
    } = options;
    if ('production' !== process.env.NODE_ENV) {
      (0, _common.invariant)(adapter, "Missing adapter parameter for new Database()");
      (0, _common.invariant)(modelClasses && Array.isArray(modelClasses), "Missing modelClasses parameter for new Database()");
    }
    this.adapter = new _compat.default(adapter);
    this.schema = adapter.schema;
    this.collections = new _CollectionMap.default(this, modelClasses);
  }

  /**
   * Returns a `Collection` for a given table name
   */
  var _proto = Database.prototype;
  _proto.get = function get(tableName) {
    return this.collections.get(tableName);
  }

  /**
   * Returns a `LocalStorage` (WatermelonDB-based localStorage/AsyncStorage alternative)
   */;
  /*:: batch: ArrayOrSpreadFn<?Model | false, Promise<void>>  */
  /**
   * Executes multiple prepared operations
   *
   * Pass a list (or array) of operations like so:
   * - `collection.prepareCreate(...)`
   * - `record.prepareUpdate(...)`
   * - `record.prepareMarkAsDeleted()` (or `record.prepareDestroyPermanently()`)
   *
   * Note that falsy values (null, undefined, false) passed to batch are simply ignored
   * so you can use patterns like `.batch(condition && record.prepareUpdate(...))` for convenience.
   *
   * Note: This method must be called within a Writer {@link Database#write}.
   */
  // $FlowFixMe
  _proto.batch = function batch(...records) {
    return new Promise(function ($return, $error) {
      var _this, actualRecords, batchOperations, changeNotifications, changes;
      _this = this;
      actualRecords = (0, _fp.fromArrayOrSpread)(records, 'Database.batch', 'Model');
      this._ensureInWriter("Database.batch()");

      // performance critical - using mutations
      batchOperations = [];
      changeNotifications = {};
      actualRecords.forEach(function (record) {
        if (!record) {
          return;
        }
        var preparedState = record._preparedState;
        if (!preparedState) {
          (0, _common.invariant)('disposable' !== record._raw._status, "Cannot batch a disposable record");
          throw new Error("Cannot batch a record that doesn't have a prepared create/update/delete");
        }
        var raw = record._raw;
        var {
          id: id
        } = raw; // faster than Model.id
        var {
          table: table
        } = record.constructor; // faster than Model.table

        var changeType;
        if ('update' === preparedState) {
          batchOperations.push(['update', table, raw]);
          changeType = 'updated';
        } else if ('create' === preparedState) {
          batchOperations.push(['create', table, raw]);
          changeType = 'created';
        } else if ('markAsDeleted' === preparedState) {
          batchOperations.push(['markAsDeleted', table, id]);
          changeType = 'destroyed';
        } else if ('destroyPermanently' === preparedState) {
          batchOperations.push(['destroyPermanently', table, id]);
          changeType = 'destroyed';
        } else {
          (0, _common.invariant)(false, 'bad preparedState');
        }
        if ('create' !== preparedState) {
          // We're (unsafely) assuming that batch will succeed and removing the "pending" state so that
          // subsequent changes to the record don't trip up the invariant
          // TODO: What if this fails?
          record._preparedState = null;
        }
        if (!changeNotifications[table]) {
          changeNotifications[table] = [];
        }
        changeNotifications[table].push({
          record: record,
          type: changeType
        });
      });
      return Promise.resolve(this.adapter.batch(batchOperations)).then(function () {
        try {
          changes = Object.entries(changeNotifications);
          changes.forEach(function ([table, changeSet]) {
            _this.collections.get(table)._applyChangesToCache(changeSet);
          });
          this._notify(changes);
          return $return(undefined); // shuts up flow
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }.bind(this));
  };
  _proto._notify = function _notify(changes) {
    var _this2 = this;
    if (0 < this._pendingNotificationBatches) {
      this._pendingNotificationChanges.push(changes);
      return;
    }
    var affectedTables = new Set(changes.map(function ([table]) {
      return table;
    }));
    this._subscribers.forEach(function databaseChangeNotifySubscribers([tables, subscriber]) {
      if (tables.some(function (table) {
        return affectedTables.has(table);
      })) {
        subscriber();
      }
    });
    changes.forEach(function ([table, changeSet]) {
      _this2.collections.get(table)._notify(changeSet);
    });
  };
  _proto.experimentalBatchNotifications = function experimentalBatchNotifications(work) {
    return new Promise(function ($return, $error) {
      var $Try_1_Finally = function ($Try_1_Exit) {
        return function ($Try_1_Value) {
          try {
            this._pendingNotificationBatches -= 1;
            if (0 === this._pendingNotificationBatches) {
              changes = this._pendingNotificationChanges;
              this._pendingNotificationChanges = [];
              changes.forEach(function (_changes) {
                return _this3._notify(_changes);
              });
            }
            return $Try_1_Exit && $Try_1_Exit.call(this, $Try_1_Value);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this);
      }.bind(this);
      var _this3, result, changes;
      _this3 = this;
      var $Try_1_Catch = function ($exception_2) {
        try {
          throw $exception_2;
        } catch ($boundEx) {
          return $Try_1_Finally($error)($boundEx);
        }
      };
      // TODO: Document & add tests if this proves useful
      try {
        this._pendingNotificationBatches += 1;
        return Promise.resolve(work()).then(function ($await_6) {
          try {
            result = $await_6;
            return $Try_1_Finally($return)(result);
          } catch ($boundEx) {
            return $Try_1_Catch($boundEx);
          }
        }, $Try_1_Catch);
      } catch ($exception_2) {
        $Try_1_Catch($exception_2)
      }
    }.bind(this));
  }

  /**
   * Schedules a Writer
   *
   * Writer is a block of code, inside of which you can modify the database
   * (call `Collection.create`, `Model.update`, `Database.batch` and so on).
   *
   * In a Writer, you're guaranteed that no other Writer is simultaneously executing. Therefore, you
   * can rely on the results of queries and other asynchronous operations - they won't change for
   * the duration of this Writer (except if changed by it).
   *
   * To call another Writer (or Reader) from this one without deadlocking, use `callWriter`
   * (or `callReader`).
   *
   * See docs for more details and a practical guide.
   *
   * @param work - Block of code to execute
   * @param [description] - Debug description of this Writer
   */;
  _proto.write = function write(work, description) {
    return this._workQueue.enqueue(work, description, true);
  }

  /**
   * Schedules a Reader
   *
   * In a Reader, you're guaranteed that no Writer is running at the same time. Therefore, you can
   * run many queries or other asynchronous operations, and you can rely on their results - they
   * won't change for the duration of this Reader. However, other Readers might run concurrently.
   *
   * To call another Reader from this one, use `callReader`
   *
   * See docs for more details and a practical guide.
   *
   * @param work - Block of code to execute
   * @param [description] - Debug description of this Reader
   */;
  _proto.read = function read(work, description) {
    return this._workQueue.enqueue(work, description, false);
  }

  /**
   * Returns an `Observable` that emits a signal (`null`) immediately, and on every change in
   * any of the passed tables.
   *
   * A set of changes made is passed with the signal, with an array of changes per-table
   * (Currently, if changes are made to multiple different tables, multiple signals will be emitted,
   * even if they're made with a batch. However, this behavior might change. Use Rx to debounce,
   * throttle, merge as appropriate for your use case.)
   *
   * Warning: You can easily introduce performance bugs in your application by using this method
   * inappropriately.
   */;
  _proto.withChangesForTables = function withChangesForTables(tables) {
    var _this4 = this;
    var changesSignals = tables.map(function (table) {
      return _this4.collections.get(table).changes;
    });
    return _rx.merge.apply(void 0, (0, _toConsumableArray2.default)(changesSignals)).pipe((0, _rx.startWith)(null));
  };
  /**
   * Notifies `subscriber` on change in any of the passed tables.
   *
   * A single notification will be sent per `database.batch()` call.
   * (Currently, no details about the changes made are provided, only a signal, but this behavior
   * might change. Currently, subscribers are called before `withChangesForTables`).
   *
   * Warning: You can easily introduce performance bugs in your application by using this method
   * inappropriately.
   */
  _proto.experimentalSubscribe = function experimentalSubscribe(tables, subscriber, debugInfo) {
    var _this5 = this;
    if (!tables.length) {
      return _fp.noop;
    }
    var entry = [tables, subscriber, debugInfo];
    this._subscribers.push(entry);
    return function () {
      var idx = _this5._subscribers.indexOf(entry);
      -1 !== idx && _this5._subscribers.splice(idx, 1);
    };
  };
  /**
   * Resets the database
   *
   * This permanently deletes the database (all records, metadata, and `LocalStorage`) and sets
   * up an empty database.
   *
   * Special care must be taken to safely reset the database. Ideally, you should reset your app
   * to an empty / "logging out" state while doing this. Specifically:
   *
   * - You MUST NOT hold onto Watermelon records other than this `Database`. Do not keep references
   *   to records, collections, or any other objects from before database reset
   * - You MUST NOT observe any Watermelon state. All Database, Collection, Query, and Model
   *   observers/subscribers should be disposed of before resetting
   * - You SHOULD NOT have any pending (queued) Readers or Writers. Pending work will be aborted
   *   (rejected with an error)
   */
  _proto.unsafeResetDatabase = function unsafeResetDatabase() {
    return new Promise(function ($return, $error) {
      var $Try_3_Finally = function ($Try_3_Exit) {
        return function ($Try_3_Value) {
          try {
            this._isBeingReset = false;
            return $Try_3_Exit && $Try_3_Exit.call(this, $Try_3_Value);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this);
      }.bind(this);
      var adapter, ErrorAdapter;
      this._ensureInWriter("Database.unsafeResetDatabase()");
      var $Try_3_Post = function () {
        try {
          return $return();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      };
      var $Try_3_Catch = function ($exception_4) {
        try {
          throw $exception_4;
        } catch ($boundEx) {
          return $Try_3_Finally($error)($boundEx);
        }
      };
      try {
        this._isBeingReset = true;
        // First kill actions, to ensure no more traffic to adapter happens
        this._workQueue._abortPendingWork();

        // Kill ability to call adapter methods during reset (to catch bugs if someone does this)
        ({
          adapter: adapter
        } = this);
        ErrorAdapter = require('../adapters/error').default;
        this.adapter = new ErrorAdapter();

        // Check for illegal subscribers
        if (this._subscribers.length) {
          // TODO: This should be an error, not a console.log, but actually useful diagnostics are necessary for this to work, otherwise people will be confused
          // eslint-disable-next-line no-console
          console.log("Application error! Unexpected ".concat(this._subscribers.length, " Database subscribers were detected during database.unsafeResetDatabase() call. App should not hold onto subscriptions or Watermelon objects while resetting database."));
          // eslint-disable-next-line no-console
          console.log(this._subscribers);
          this._subscribers = [];
        }

        // Clear the database
        return Promise.resolve(adapter.unsafeResetDatabase()).then(function () {
          try {
            // Only now clear caches, since there may have been queued fetches from DB still bringing in items to cache
            Object.values(this.collections.map).forEach(function (collection) {
              // $FlowFixMe
              collection._cache.unsafeClear();
            });

            // Restore working Database
            this._resetCount += 1;
            this.adapter = adapter;
            return $Try_3_Finally($Try_3_Post)();
          } catch ($boundEx) {
            return $Try_3_Catch($boundEx);
          }
        }.bind(this), $Try_3_Catch);
      } catch ($exception_4) {
        $Try_3_Catch($exception_4)
      }
    }.bind(this));
  };
  _proto._ensureInWriter = function _ensureInWriter(diagnosticMethodName) {
    (0, _common.invariant)(this._workQueue.isWriterRunning, "".concat(diagnosticMethodName, " can only be called from inside of a Writer. See docs for more details."));
  }

  // (experimental) puts Database in a broken state
  // TODO: Not used anywhere yet
  ;
  _proto._fatalError = function _fatalError(error) {
    if (!experimentalAllowsFatalError) {
      _common.logger.warn('Database is now broken, but experimentalAllowsFatalError has not been enabled to do anything about it...');
      return;
    }
    this._isBroken = true;
    _common.logger.error('Database is broken. App must be reloaded before continuing.');

    // TODO: Passing this to an adapter feels wrong, but it's tricky.
    // $FlowFixMe
    if (this.adapter.underlyingAdapter._fatalError) {
      // $FlowFixMe
      this.adapter.underlyingAdapter._fatalError(error);
    }
  };
  (0, _createClass2.default)(Database, [{
    key: "localStorage",
    get: function get() {
      if (!this._localStorage) {
        var LocalStorageClass = require('./LocalStorage').default;
        this._localStorage = new LocalStorageClass(this);
      }
      return this._localStorage;
    }
  }]);
  return Database;
}();
exports.default = Database;