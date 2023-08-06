"use strict";

exports.__esModule = true;
exports.default = performJoins;
function performJoinsImpl(query, performer) {
  if (!query) {
    return query;
  } else if (query.$join) {
    var _ref;
    var _join = query.$join;
    var joinQuery = performJoinsImpl(_join.query, performer);
    _join.query = joinQuery;
    var records = performer(_join);

    // for queries on `belongs_to` tables, matchingIds will be IDs of the parent table records
    //   (e.g. task: { project_id in ids })
    // and for `has_many` tables, it will be IDs of the main table records
    //   (e.g. task: { id in (ids from tag_assignment.task_id) })
    var matchingIds = records.map(function (record) {
      return record[_join.mapKey];
    });
    return _ref = {}, _ref[_join.joinKey] = {
      $in: matchingIds
    }, _ref;
  } else if (query.$and) {
    return {
      $and: query.$and.map(function (clause) {
        return performJoinsImpl(clause, performer);
      })
    };
  } else if (query.$or) {
    return {
      $or: query.$or.map(function (clause) {
        return performJoinsImpl(clause, performer);
      })
    };
  }
  return query;
}
function performJoins(lokiQuery, performer) {
  var {
    query: query,
    hasJoins: hasJoins
  } = lokiQuery;
  if (!hasJoins) {
    return query;
  }
  return performJoinsImpl(query, performer);
}