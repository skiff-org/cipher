"use strict";

exports.__esModule = true;
exports.default = decodeQueryResult;
// Compressed records have this syntax:
// [
//   ['id', 'body', ...], // 0: column names
//   ['foo', 'bar', ...], // values matching column names
//   'id',                // only cached id
// ]
function decodeQueryResult(compressedRecords) {
  var len = compressedRecords.length;
  if (!len) {
    return [];
  }
  var columnNames = compressedRecords[0];
  var columnsLen = columnNames.length;
  var rawRecords = new Array(len - 1);
  var rawRecord, compressedRecord;
  for (var i = 1; i < len; i++) {
    compressedRecord = compressedRecords[i];
    if ('string' === typeof compressedRecord) {
      rawRecord = compressedRecord;
    } else {
      rawRecord = {};
      for (var j = 0; j < columnsLen; j++) {
        rawRecord[columnNames[j]] = compressedRecord[j];
      }
    }
    rawRecords[i - 1] = rawRecord;
  }
  return rawRecords;
}