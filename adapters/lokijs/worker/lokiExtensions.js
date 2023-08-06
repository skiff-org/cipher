"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.deleteDatabase = deleteDatabase;
exports.lokiFatalError = lokiFatalError;
exports.newLoki = newLoki;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _logger = _interopRequireDefault(require("../../../utils/common/logger"));
/* eslint-disable no-undef */
// don't import the whole utils/ here!
var isIDBAvailable = function (onQuotaExceededError) {
  return new Promise(function (resolve) {
    // $FlowFixMe
    if ('undefined' === typeof indexedDB) {
      resolve(false);
    }

    // in Firefox private mode, IDB will be available, but will fail to open
    // $FlowFixMe
    var checkRequest = indexedDB.open('WatermelonIDBChecker');
    checkRequest.onsuccess = function (e) {
      var db = e.target.result;
      db.close();
      resolve(true);
    };
    checkRequest.onerror = function (event) {
      var _event$target;
      var error = null === event || void 0 === event ? void 0 : null === (_event$target = event.target) || void 0 === _event$target ? void 0 : _event$target.error;
      // this is what Firefox in Private Mode returns:
      // DOMException: "A mutation operation was attempted on a database that did not allow mutations."
      // code: 11, name: InvalidStateError
      _logger.default.error('[Loki] IndexedDB checker failed to open. Most likely, user is in Private Mode. It could also be a quota exceeded error. Will fall back to in-memory database.', event, error);
      if (error && 'QuotaExceededError' === error.name) {
        _logger.default.log('[Loki] Looks like disk quota was exceeded: ', error);
        onQuotaExceededError && onQuotaExceededError(error);
      }
      resolve(false);
    };
    checkRequest.onblocked = function () {
      _logger.default.error('IndexedDB checker call is blocked');
    };
  });
};
function getLokiAdapter(options) {
  return new Promise(function ($return, $error) {
    var useIncrementalIndexedDB, adapter, onQuotaExceededError, dbName, extraIncrementalIDBOptions, IncrementalIDBAdapter, LokiIndexedAdapter, LokiMemoryAdapter;
    ({
      useIncrementalIndexedDB: useIncrementalIndexedDB,
      _testLokiAdapter: adapter,
      onQuotaExceededError: onQuotaExceededError,
      dbName: dbName,
      extraIncrementalIDBOptions = {}
    } = options);
    if (adapter) {
      return $return(adapter);
    } else {
      return Promise.resolve(isIDBAvailable(onQuotaExceededError)).then(function ($await_3) {
        try {
          if ($await_3) {
            if (useIncrementalIndexedDB) {
              IncrementalIDBAdapter = options._betaLoki ? require('lokijs/src/incremental-indexeddb-adapter') : require('lokijs/src/incremental-indexeddb-adapter');
              // $FlowFixMe
              return $return(new IncrementalIDBAdapter(extraIncrementalIDBOptions));
            }
            LokiIndexedAdapter = require('lokijs/src/loki-indexed-adapter');
            return $return(new LokiIndexedAdapter(dbName));
          }
          return $If_2.call(this);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }

    // if IDB is unavailable (that happens in private mode), fall back to memory adapter
    // we could also fall back to localstorage adapter, but it will fail in all but the smallest dbs
    function $If_2() {
      ({
        LokiMemoryAdapter: LokiMemoryAdapter
      } = options._betaLoki ? require('lokijs') : require('lokijs'));
      return $return(new LokiMemoryAdapter());
    }
    return $If_2.call(this);
  });
}
function newLoki(options) {
  return new Promise(function ($return, $error) {
    var extraLokiOptions, LokiDb, loki;
    ({
      extraLokiOptions = {}
    } = options);
    LokiDb = options._betaLoki ? require('lokijs') : require('lokijs');
    return Promise.resolve(getLokiAdapter(options)).then(function ($await_4) {
      try {
        loki = new LokiDb(options.dbName, (0, _extends2.default)({
          adapter: $await_4,
          autosave: true,
          autosaveInterval: 500,
          verbose: true
        }, extraLokiOptions));
        return Promise.resolve(new Promise(function (resolve, reject) {
          loki.loadDatabase({}, function (error) {
            error ? reject(error) : resolve();
          });
        })).then(function ($await_5) {
          try {
            return $return(loki);
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
function deleteDatabase(loki) {
  return new Promise(function ($return, $error) {
    return Promise.resolve(new Promise(function (resolve, reject) {
      // Works around a race condition - Loki doesn't disable autosave or drain save queue before
      // deleting database, so it's possible to delete and then have the database be saved
      loki.close(function () {
        loki.deleteDatabase({}, function (response) {
          // LokiIndexedAdapter responds with `{ success: true }`, while
          // LokiMemory adapter just calls it with no params
          if (response && response.success || response === undefined) {
            resolve();
          } else {
            reject(response);
          }
        });
      });
    })).then(function ($await_6) {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}

// In case of a fatal error, break Loki so that it cannot save its contents to disk anymore
// This might result in a loss of data in recent changes, but we assume that whatever caused the
// fatal error has corrupted the database, so we want to prevent it from being persisted
// There's no recovery from this, app must be restarted with a fresh LokiJSAdapter.
function lokiFatalError(loki) {
  try {
    // below is some very ugly defensive coding, but we're fatal and don't trust anyone anymore
    var fatalHandler = function fatalHandler() {
      throw new Error('Illegal attempt to save Loki database after a fatal error');
    };
    loki.save = fatalHandler;
    loki.saveDatabase = fatalHandler;
    loki.saveDatabaseInternal = fatalHandler;
    // disable autosave
    loki.autosave = false;
    loki.autosaveDisable();
    // close db
    loki.close();
  } catch (error) {
    _logger.default.error('Failed to perform loki fatal error');
    _logger.default.error(error);
  }
}