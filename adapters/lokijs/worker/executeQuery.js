"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.executeCount = executeCount;
exports.executeQuery = executeQuery;
var _encodeQuery = _interopRequireDefault(require("./encodeQuery"));
var _performJoins = _interopRequireDefault(require("./performJoins"));
// Finds IDs of matching records on foreign table
function performJoin(join, loki) {
  var {
    table: table,
    query: query
  } = join;
  var collection = loki.getCollection(table).chain();
  var records = collection.find(query).data();
  return records;
}
function performQuery(query, loki) {
  // Step one: perform all inner queries (JOINs) to get the single table query
  var lokiQuery = (0, _encodeQuery.default)(query);
  var mainQuery = (0, _performJoins.default)(lokiQuery, function (join) {
    return performJoin(join, loki);
  });

  // Step two: fetch all records matching query
  var collection = loki.getCollection(query.table).chain();
  var resultset = collection.find(mainQuery);

  // Step three: sort, skip, take
  var {
    sortBy: sortBy,
    take: take,
    skip: skip
  } = query.description;
  if (sortBy.length) {
    resultset = resultset.compoundsort(sortBy.map(function ({
      sortColumn: sortColumn,
      sortOrder: sortOrder
    }) {
      return [sortColumn, 'desc' === sortOrder];
    }));
  }
  if (skip) {
    resultset = resultset.offset(skip);
  }
  if (take) {
    resultset = resultset.limit(take);
  }
  return resultset;
}
function executeQuery(query, loki) {
  var {
    lokiTransform: lokiTransform
  } = query.description;
  var results = performQuery(query, loki).data();
  if (lokiTransform) {
    return lokiTransform(results, loki);
  }
  return results;
}
function executeCount(query, loki) {
  var {
    lokiTransform: lokiTransform
  } = query.description;
  var resultset = performQuery(query, loki);
  if (lokiTransform) {
    var records = lokiTransform(resultset.data(), loki);
    return records.length;
  }
  return resultset.count();
}