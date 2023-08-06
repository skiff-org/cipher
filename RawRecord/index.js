"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.nullValue = nullValue;
exports.sanitizedRaw = sanitizedRaw;
exports.setRawSanitized = setRawSanitized;
var _randomId = _interopRequireDefault(require("../utils/common/randomId"));
/* eslint-disable no-lonely-if */
/* eslint-disable no-self-compare */
// a number, but not NaN (NaN !== NaN) or Infinity
function isValidNumber(value) {
  return 'number' === typeof value && value === value && value !== Infinity && value !== -Infinity;
}

// Note: This is performance-critical code
function _setRaw(raw, key, value, columnSchema) {
  var {
    type: type,
    isOptional: isOptional
  } = columnSchema;

  // If the value is wrong type or invalid, it's set to `null` (if optional) or empty value ('', 0, false)
  if ('string' === type) {
    if ('string' === typeof value) {
      raw[key] = value;
    } else {
      raw[key] = isOptional ? null : '';
    }
  } else if ('boolean' === type) {
    if ('boolean' === typeof value) {
      raw[key] = value;
    } else if (1 === value || 0 === value) {
      // Exception to the standard rule — because SQLite turns true/false into 1/0
      raw[key] = Boolean(value);
    } else {
      raw[key] = isOptional ? null : false;
    }
  } else {
    // type = number
    // Treat NaN and Infinity as null
    if (isValidNumber(value)) {
      raw[key] = value || 0;
    } else {
      raw[key] = isOptional ? null : 0;
    }
  }
}
function isValidStatus(value) {
  return 'created' === value || 'updated' === value || 'deleted' === value || 'synced' === value;
}

// Transforms a dirty raw record object into a trusted sanitized RawRecord according to passed TableSchema
// TODO: Should we make this public API for advanced users?
function sanitizedRaw(dirtyRaw, tableSchema) {
  var {
    id: id,
    _status: _status,
    _changed: _changed
  } = dirtyRaw;

  // This is called with `{}` when making a new record, so we need to set a new ID, status
  // Also: If an existing has one of those fields broken, we're screwed. Safest to treat it as a
  // new record (so that it gets synced)

  // TODO: Think about whether prototypeless objects are a useful mitigation
  // const raw = Object.create(null) // create a prototypeless object
  var raw = {};
  if ('string' === typeof id) {
    // TODO: Can we trust IDs passed? Maybe we want to split this implementation, depending on whether
    // this is used on implicitly-trusted (persisted or Watermelon-created) records, or if this is user input?
    raw.id = id;
    raw._status = isValidStatus(_status) ? _status : 'created';
    raw._changed = 'string' === typeof _changed ? _changed : '';
  } else {
    raw.id = (0, _randomId.default)();
    raw._status = 'created';
    raw._changed = '';
  }

  // faster than Object.values on a map
  var columns = tableSchema.columnArray;
  for (var i = 0, len = columns.length; i < len; i += 1) {
    var columnSchema = columns[i];
    var key = columnSchema.name;
    // TODO: Check performance
    // $FlowFixMe
    var value = Object.prototype.hasOwnProperty.call(dirtyRaw, key) ? dirtyRaw[key] : null;
    _setRaw(raw, key, value, columnSchema);
  }
  return raw;
}

// Modifies passed rawRecord by setting sanitized `value` to `columnName`
// Note: Assumes columnName exists and columnSchema matches the name
function setRawSanitized(rawRecord, columnName, value, columnSchema) {
  _setRaw(rawRecord, columnName, value, columnSchema);
}
function nullValue(columnSchema) {
  var {
    isOptional: isOptional,
    type: type
  } = columnSchema;
  if (isOptional) {
    return null;
  } else if ('string' === type) {
    return '';
  } else if ('number' === type) {
    return 0;
  } else if ('boolean' === type) {
    return false;
  }
  throw new Error("Unknown type for column schema ".concat(JSON.stringify(columnSchema)));
}