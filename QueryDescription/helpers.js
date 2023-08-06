"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.buildQueryDescription = buildQueryDescription;
exports.queryWithoutDeleted = queryWithoutDeleted;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _fp = require("../utils/fp");
var _invariant = _interopRequireDefault(require("../utils/common/invariant"));
var _deepFreeze = _interopRequireDefault(require("../utils/common/deepFreeze"));
var _Schema = require("../Schema");
var _operators = require("./operators");
/* eslint-disable no-use-before-define */
// don't import whole `utils` to keep worker size small
var syncStatusColumn = (0, _Schema.columnName)('_status');
var extractClauses = function (clauses) {
  var query = {
    where: [],
    joinTables: [],
    nestedJoinTables: [],
    sortBy: []
  };
  clauses.forEach(function (clause) {
    switch (clause.type) {
      case 'where':
      case 'and':
      case 'or':
      case 'sql':
      case 'loki':
        query.where.push(clause);
        break;
      case 'on':
        {
          var {
            table: table
          } = clause;
          query.joinTables.push(table);
          query.where.push(clause);
          break;
        }
      case 'sortBy':
        query.sortBy.push(clause);
        break;
      case 'take':
        query.take = clause.count;
        break;
      case 'skip':
        query.skip = clause.count;
        break;
      case 'joinTables':
        {
          var _query$joinTables;
          var {
            tables: tables
          } = clause;
          (_query$joinTables = query.joinTables).push.apply(_query$joinTables, (0, _toConsumableArray2.default)(tables));
          break;
        }
      case 'nestedJoinTable':
        query.nestedJoinTables.push({
          from: clause.from,
          to: clause.to
        });
        break;
      case 'lokiTransform':
        // TODO: Check for duplicates
        query.lokiTransform = clause.function;
        break;
      case 'sqlQuery':
        query.sql = clause;
        if ('production' !== process.env.NODE_ENV) {
          (0, _invariant.default)(clauses.every(function (_clause) {
            return ['sqlQuery', 'joinTables', 'nestedJoinTable'].includes(_clause.type);
          }), 'Cannot use Q.unsafeSqlQuery with other clauses, except for Q.experimentalJoinTables and Q.experimentalNestedJoin (Did you mean Q.unsafeSqlExpr?)');
        }
        break;
      default:
        throw new Error('Invalid Query clause passed');
    }
  });
  query.joinTables = (0, _fp.unique)(query.joinTables);

  // $FlowFixMe: Flow is too dumb to realize that it is valid
  return query;
};
function buildQueryDescription(clauses) {
  var query = extractClauses(clauses);
  if ('production' !== process.env.NODE_ENV) {
    (0, _invariant.default)(!(query.skip && !query.take), 'cannot skip without take');
    (0, _deepFreeze.default)(query);
  }
  return query;
}
var whereNotDeleted = (0, _operators.where)(syncStatusColumn, (0, _operators.notEq)('deleted'));
function conditionsWithoutDeleted(conditions) {
  return conditions.map(queryWithoutDeletedImpl);
}
function queryWithoutDeletedImpl(clause) {
  if ('and' === clause.type) {
    return {
      type: 'and',
      conditions: conditionsWithoutDeleted(clause.conditions)
    };
  } else if ('or' === clause.type) {
    return {
      type: 'or',
      conditions: conditionsWithoutDeleted(clause.conditions)
    };
  } else if ('on' === clause.type) {
    var onClause = clause;
    return {
      type: 'on',
      table: onClause.table,
      conditions: conditionsWithoutDeleted(onClause.conditions).concat(whereNotDeleted)
    };
  }
  return clause;
}
function queryWithoutDeleted(query) {
  var {
    where: whereConditions
  } = query;
  var newQuery = (0, _extends2.default)({}, query, {
    where: conditionsWithoutDeleted(whereConditions).concat(whereNotDeleted)
  });
  if ('production' !== process.env.NODE_ENV) {
    (0, _deepFreeze.default)(newQuery);
  }
  return newQuery;
}