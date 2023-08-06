"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _Result = require("../utils/fp/Result");
var DatabaseAdapterCompat = /*#__PURE__*/function () {
  function DatabaseAdapterCompat(adapter) {
    this.underlyingAdapter = adapter;
  }
  var _proto = DatabaseAdapterCompat.prototype;
  _proto.find = function find(table, id) {
    var _this = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this.underlyingAdapter.find(table, id, callback);
    });
  };
  _proto.query = function query(_query) {
    var _this2 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this2.underlyingAdapter.query(_query, callback);
    });
  };
  _proto.queryIds = function queryIds(query) {
    var _this3 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this3.underlyingAdapter.queryIds(query, callback);
    });
  };
  _proto.unsafeQueryRaw = function unsafeQueryRaw(query) {
    var _this4 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this4.underlyingAdapter.unsafeQueryRaw(query, callback);
    });
  };
  _proto.count = function count(query) {
    var _this5 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this5.underlyingAdapter.count(query, callback);
    });
  };
  _proto.batch = function batch(operations) {
    var _this6 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this6.underlyingAdapter.batch(operations, callback);
    });
  };
  _proto.getDeletedRecords = function getDeletedRecords(tableName) {
    var _this7 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this7.underlyingAdapter.getDeletedRecords(tableName, callback);
    });
  };
  _proto.destroyDeletedRecords = function destroyDeletedRecords(tableName, recordIds) {
    var _this8 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this8.underlyingAdapter.destroyDeletedRecords(tableName, recordIds, callback);
    });
  };
  _proto.unsafeLoadFromSync = function unsafeLoadFromSync(jsonId) {
    var _this9 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this9.underlyingAdapter.unsafeLoadFromSync(jsonId, callback);
    });
  };
  _proto.provideSyncJson = function provideSyncJson(id, syncPullResultJson) {
    var _this10 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this10.underlyingAdapter.provideSyncJson(id, syncPullResultJson, callback);
    });
  };
  _proto.unsafeResetDatabase = function unsafeResetDatabase() {
    var _this11 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this11.underlyingAdapter.unsafeResetDatabase(callback);
    });
  };
  _proto.unsafeExecute = function unsafeExecute(work) {
    var _this12 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this12.underlyingAdapter.unsafeExecute(work, callback);
    });
  };
  _proto.getLocal = function getLocal(key) {
    var _this13 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this13.underlyingAdapter.getLocal(key, callback);
    });
  };
  _proto.setLocal = function setLocal(key, value) {
    var _this14 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this14.underlyingAdapter.setLocal(key, value, callback);
    });
  };
  _proto.removeLocal = function removeLocal(key) {
    var _this15 = this;
    return (0, _Result.toPromise)(function (callback) {
      return _this15.underlyingAdapter.removeLocal(key, callback);
    });
  }

  // untyped - test-only code
  ;
  _proto.testClone = function testClone(options) {
    return new Promise(function ($return, $error) {
      return Promise.resolve(this.underlyingAdapter.testClone(options)).then(function ($await_1) {
        try {
          // $FlowFixMe
          return $return(new DatabaseAdapterCompat($await_1));
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  };
  (0, _createClass2.default)(DatabaseAdapterCompat, [{
    key: "schema",
    get: function get() {
      return this.underlyingAdapter.schema;
    }
  }, {
    key: "dbName",
    get: function get() {
      return this.underlyingAdapter.dbName;
    }
  }, {
    key: "migrations",
    get: function get() {
      return this.underlyingAdapter.migrations;
    }
  }]);
  return DatabaseAdapterCompat;
}();
exports.default = DatabaseAdapterCompat;