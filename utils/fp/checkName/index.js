"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = checkName;
var _invariant = _interopRequireDefault(require("../../common/invariant"));
// Asserts that `name` (table or column name) should be safe for inclusion in SQL queries
// and Loki queries (JS objects)
//
// IMPORTANT: This should NEVER be used as the only line of defense! These checks may be incomplete.
// Any table or column name passed anywhere near the database should be hardcoded or whitelisted.
// This is a "defense in depth" type of check - checking for common mistakes in case library user
// is not following safe coding practices or the primary defense fails.
//
// This will throw an error on:
// - JavaScript Object prototype properties
// - Magic Loki and SQLite column names
// - names starting with __
// - names that are not essentially alphanumeric
//
// Note that for SQL, you always MUST wrap table/column names with `'name'`, otherwise query may fail
// for some keywords
//
// Note that this doesn't throw for Watermelon builtins (id, _changed, _status...)
var safeNameCharacters = /^[a-zA-Z_]\w*$/;
var knownSafeNames = new Set();
function checkName(name) {
  if (knownSafeNames.has(name)) {
    return name;
  }
  (0, _invariant.default)('string' === typeof name, "Unsafe name '".concat(name, "' not allowed (not a string)"));
  (0, _invariant.default)(!['__proto__', 'constructor', 'prototype', 'hasOwnProperty', 'isPrototypeOf', 'toString', 'toLocaleString', 'valueOf'].includes(name), "Unsafe name '".concat(name, "' not allowed (Object prototype property)"));
  (0, _invariant.default)('$loki' !== name.toLowerCase(), "Unsafe name '".concat(name, "' not allowed (reserved for LokiJS compatibility)"));
  (0, _invariant.default)(!['rowid', 'oid', '_rowid_', 'sqlite_master'].includes(name.toLowerCase()), "Unsafe name '".concat(name, "' not allowed (reserved for SQLite compatibility)"));
  (0, _invariant.default)(!name.toLowerCase().startsWith('sqlite_stat'), "Unsafe name '".concat(name, "' not allowed (reserved for SQLite compatibility)"));
  (0, _invariant.default)(!name.startsWith('__'), "Unsafe name '".concat(name, "' not allowed (names starting with '__' are reserved for internal purposes)"));
  (0, _invariant.default)(safeNameCharacters.test(name), "Unsafe name '".concat(name, "' not allowed (names must contain only safe characters ").concat(safeNameCharacters.toString(), ")"));
  knownSafeNames.add(name);
  return name;
}