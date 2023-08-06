"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
/* eslint-disable getter-return */
// Used as a placeholder during reset database to catch illegal
// adapter calls
var throwError = function (name) {
  throw new Error("Cannot call database.adapter.".concat(name, " while the database is being reset"));
};
var ErrorAdapter = /*#__PURE__*/function () {
  function ErrorAdapter() {
    var _this = this;
    ['find', 'query', 'queryIds', 'count', 'batch', 'getDeletedRecords', 'destroyDeletedRecords', 'unsafeResetDatabase', 'getLocal', 'setLocal', 'removeLocal', 'testClone'].forEach(function (name) {
      // $FlowFixMe
      _this[name] = function () {
        return throwError(name);
      };
    });
  }
  (0, _createClass2.default)(ErrorAdapter, [{
    key: "underlyingAdapter",
    get: function get() {
      throwError('underlyingAdapter');
    }
  }, {
    key: "schema",
    get: function get() {
      throwError('schema');
    }
  }, {
    key: "migrations",
    get: function get() {
      throwError('migrations');
    }
  }]);
  return ErrorAdapter;
}();
exports.default = ErrorAdapter;