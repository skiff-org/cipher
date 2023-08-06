"use strict";

exports.__esModule = true;
exports.default = void 0;
exports.localStorageKey = localStorageKey;
var _common = require("../../utils/common");
function localStorageKey(name) {
  return name;
}
var LocalStorage = /*#__PURE__*/function () {
  function LocalStorage(database) {
    this._db = database;
  }

  // Get value from LocalStorage (returns value deserialized from JSON)
  // Returns `undefined` if not found
  var _proto = LocalStorage.prototype;
  _proto.get = function get(key) {
    return new Promise(function ($return, $error) {
      var json;
      return Promise.resolve(this._db.adapter.getLocal(key)).then(function ($await_1) {
        try {
          json = $await_1;
          return $return(null == json ? undefined : JSON.parse(json));
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }, $error);
    }.bind(this));
  }

  // Experimental: Same as get(), but can be called synchronously
  ;
  _proto._getSync = function _getSync(key, callback) {
    this._db.adapter.underlyingAdapter.getLocal(key, function (result) {
      var json = result.value ? result.value : undefined;
      var value = null == json ? undefined : JSON.parse(json);
      callback(value);
    });
  }

  // Set value to LocalStorage
  // Only JSON-serializable values are allowed and well-behaved:
  // strings, numbers, booleans, and null; as well as arrays and objects only containing those
  //
  // Serializing other values will either throw an error (e.g. function passed) or be serialized
  // such that deserializing it won't yield an equal value (e.g. NaN to null, Dates to a string)
  // See details:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description
  ;
  _proto.set = function set(key, value) {
    return new Promise(function ($return) {
      var json = JSON.stringify(value);
      (0, _common.invariant)('string' === typeof json, 'Value not JSON-serializable');
      return $return(this._db.adapter.setLocal(key, json));
    }.bind(this));
  };
  _proto.remove = function remove(key) {
    return new Promise(function ($return) {
      return $return(this._db.adapter.removeLocal(key));
    }.bind(this));
  };
  return LocalStorage;
}();
exports.default = LocalStorage;