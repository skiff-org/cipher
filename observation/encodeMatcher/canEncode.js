"use strict";

exports.__esModule = true;
exports.default = canEncodeMatcher;
exports.forbiddenError = void 0;
var forbiddenError = "Queries with joins, sortBy, take, skip, lokiTransform can't be encoded into a matcher";
exports.forbiddenError = forbiddenError;
function canEncodeMatcher(query) {
  var {
    joinTables: joinTables,
    nestedJoinTables: nestedJoinTables,
    sortBy: sortBy,
    take: take,
    skip: skip,
    lokiTransform: lokiTransform,
    sql: sql
  } = query;
  return !joinTables.length && !nestedJoinTables.length && !sortBy.length && !take && !skip && !lokiTransform && !sql;
}