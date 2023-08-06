"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var fs = require("fs");
var SQliteDatabase = require('better-sqlite3');
var Database = /*#__PURE__*/function () {
  function Database(path = ':memory:') {
    this.instance = undefined;
    this.path = path;
    // this.instance = new SQliteDatabase(path);
    this.open();
  }
  var _proto = Database.prototype;
  _proto.open = function open() {
    var {
      path: path
    } = this;
    if ('file::memory:' === path || 0 <= path.indexOf('?mode=memory')) {
      path = ':memory:';
    }
    try {
      // eslint-disable-next-line no-console
      this.instance = new SQliteDatabase(path, {
        verboze: console.log
      });
    } catch (error) {
      throw new Error("Failed to open the database. - ".concat(error.message));
    }
    if (!this.instance || !this.instance.open) {
      throw new Error('Failed to open the database.');
    }
  };
  _proto.inTransaction = function inTransaction(executeBlock) {
    this.instance.transaction(executeBlock)();
  };
  _proto.execute = function execute(query, args = []) {
    return this.instance.prepare(query).run(args);
  };
  _proto.executeStatements = function executeStatements(queries) {
    return this.instance.exec(queries);
  };
  _proto.queryRaw = function queryRaw(query, args = []) {
    var results = [];
    var stmt = this.instance.prepare(query);
    if (stmt.get(args)) {
      results = stmt.all(args);
    }
    return results;
  };
  _proto.count = function count(query, args = []) {
    var results = this.instance.prepare(query).all(args);
    if (0 === results.length) {
      throw new Error('Invalid count query, can`t find next() on the result');
    }
    var result = results[0];
    if (result.count === undefined) {
      throw new Error('Invalid count query, can`t find `count` column');
    }
    return Number.parseInt(result.count, 10);
  };
  _proto.unsafeDestroyEverything = function unsafeDestroyEverything() {
    var _this = this;
    // Deleting files by default because it seems simpler, more reliable
    // And we have a weird problem with sqlite code 6 (database busy) in sync mode
    // But sadly this won't work for in-memory (shared) databases, so in those cases,
    // drop all tables, indexes, and reset user version to 0

    if (this.isInMemoryDatabase()) {
      this.inTransaction(function () {
        var results = _this.queryRaw("SELECT * FROM sqlite_master WHERE type = 'table'");
        var tables = results.map(function (table) {
          return table.name;
        });
        tables.forEach(function (table) {
          _this.execute("DROP TABLE IF EXISTS '".concat(table, "'"));
        });
        _this.execute('PRAGMA writable_schema=1');
        var count = _this.queryRaw("SELECT * FROM sqlite_master").length;
        if (count) {
          // IF required to avoid SQLIte Error
          _this.execute('DELETE FROM sqlite_master');
        }
        _this.execute('PRAGMA user_version=0');
        _this.execute('PRAGMA writable_schema=0');
      });
    } else {
      this.instance.close();
      if (this.instance.open) {
        throw new Error('Could not close database');
      }
      if (fs.existsSync(this.path)) {
        fs.unlinkSync(this.path);
      }
      if (fs.existsSync("".concat(this.path, "-wal"))) {
        fs.unlinkSync("".concat(this.path, "-wal"));
      }
      if (fs.existsSync("".concat(this.path, "-shm"))) {
        fs.unlinkSync("".concat(this.path, "-shm"));
      }
      this.open();
    }
  };
  _proto.isInMemoryDatabase = function isInMemoryDatabase() {
    return this.instance.memory;
  };
  (0, _createClass2.default)(Database, [{
    key: "userVersion",
    get: function get() {
      return this.instance.pragma('user_version', {
        simple: true
      });
    },
    set: function set(version) {
      this.instance.pragma("user_version = ".concat(version));
    }
  }]);
  return Database;
}();
var _default = Database;
exports.default = _default;