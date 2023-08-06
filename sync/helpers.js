"use strict";

exports.__esModule = true;
exports.addToRawSet = addToRawSet;
exports.setRawColumnChange = setRawColumnChange;
function addToRawSet(rawSet, value) {
  var array = rawSet ? rawSet.split(',') : [];
  var set = new Set(array);
  set.add(value);
  return Array.from(set).join(',');
}

// Mutates `rawRecord` to mark `columName` as modified for sync purposes
function setRawColumnChange(rawRecord, columnName) {
  rawRecord._changed = addToRawSet(rawRecord._changed, columnName);
  if ('created' !== rawRecord._status) {
    rawRecord._status = 'updated';
  }
}