"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _common = require("../../../utils/common");
var Q = _interopRequireWildcard(require("../../../QueryDescription"));
var _encodeValue = _interopRequireDefault(require("../encodeValue"));
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/* eslint-disable no-use-before-define */
function mapJoin(array, mapper, joiner) {
  // NOTE: DO NOT try to optimize this by concatenating strings together. In non-JIT JSC,
  // concatenating strings is extremely slow (5000ms vs 120ms on 65K sample)
  return array.map(mapper).join(joiner);
}
var encodeValues = function (values) {
  return "(".concat(mapJoin(values, _encodeValue.default, ', '), ")");
};
var getComparisonRight = function (table, comparisonRight) {
  if (comparisonRight.values) {
    return encodeValues(comparisonRight.values);
  } else if (comparisonRight.column) {
    return "\"".concat(table, "\".\"").concat(comparisonRight.column, "\"");
  }
  return 'undefined' !== typeof comparisonRight.value ? (0, _encodeValue.default)(comparisonRight.value) : 'null';
};

// Note: it's necessary to use `is` / `is not` for NULL comparisons to work correctly
// See: https://sqlite.org/lang_expr.html
var operators = {
  eq: 'is',
  notEq: 'is not',
  gt: '>',
  gte: '>=',
  weakGt: '>',
  // For non-column comparison case
  lt: '<',
  lte: '<=',
  oneOf: 'in',
  notIn: 'not in',
  between: 'between',
  like: 'like',
  notLike: 'not like',
  ftsMatch: 'match'
};
var encodeComparison = function (table, comparison) {
  var {
    operator: operator
  } = comparison;
  if ('between' === operator) {
    var {
      right: right
    } = comparison;
    return right.values ? "between ".concat((0, _encodeValue.default)(right.values[0]), " and ").concat((0, _encodeValue.default)(right.values[1])) : '';
  }
  return "".concat(operators[operator], " ").concat(getComparisonRight(table, comparison.right));
};
var encodeWhere = function (table, associations) {
  return function (where) {
    switch (where.type) {
      case 'and':
        return "(".concat(encodeAndOr(associations, 'and', table, where.conditions), ")");
      case 'or':
        return "(".concat(encodeAndOr(associations, 'or', table, where.conditions), ")");
      case 'where':
        return encodeWhereCondition(associations, table, where.left, where.comparison);
      case 'on':
        if ('production' !== process.env.NODE_ENV) {
          (0, _common.invariant)(associations.some(function ({
            to: to
          }) {
            return to === where.table;
          }), 'To nest Q.on inside Q.and/Q.or you must explicitly declare Q.experimentalJoinTables at the beginning of the query');
        }
        return "(".concat(encodeAndOr(associations, 'and', where.table, where.conditions), ")");
      case 'sql':
        return where.expr;
      default:
        throw new Error("Unknown clause ".concat(where.type));
    }
  };
};
var encodeWhereCondition = function (associations, table, left, comparison) {
  var {
    operator: operator
  } = comparison;
  // if right operand is a value, we can use simple comparison
  // if a column, we must check for `not null > null`
  if ('weakGt' === operator && comparison.right.column) {
    return encodeWhere(table, associations)(Q.or(
    // $FlowFixMe
    Q.where(left, Q.gt(Q.column(comparison.right.column))), Q.and(Q.where(left, Q.notEq(null)), Q.where(comparison.right.column, null))));
  } else if ('includes' === operator) {
    return "instr(\"".concat(table, "\".\"").concat(left, "\", ").concat(getComparisonRight(table, comparison.right), ")");
  } else if ('ftsMatch' === operator) {
    var srcTable = "\"".concat(table, "\"");
    var ftsTable = "\"_fts_".concat(table, "\"");
    var rowid = '"rowid"';
    var ftsColumn = "\"".concat(left, "\"");
    var matchValue = getComparisonRight(table, comparison.right);
    var ftsTableColumn = table === left ? "".concat(ftsTable) : "".concat(ftsTable, ".").concat(ftsColumn);
    // first we remove the quotes from the escaped string
    var formattedMatchValue = matchValue.substr(1, matchValue.length - 2);
    // than we split the string in to words by spaces to prepare for fts query
    var splittedMatchValue = formattedMatchValue.split(' ');
    // than we wrap each word with double quotes and join them with spaces
    var formattedSplittedMatchValue = splittedMatchValue.map(function (value) {
      return "\"".concat(value, "\"");
    }).join(' ');
    // all info about sqlite fts query can be found here: https://www.sqlite.org/fts5.html#full_text_query_syntax
    return "".concat(srcTable, ".").concat(rowid, " in (") + "select ".concat(ftsTable, ".").concat(rowid, " from ").concat(ftsTable, " ") + "where ".concat(ftsTableColumn, " match '").concat(formattedSplittedMatchValue, "'") + ")";
  }
  return "\"".concat(table, "\".\"").concat(left, "\" ").concat(encodeComparison(table, comparison));
};
var encodeAndOr = function (associations, op, table, conditions) {
  if (conditions.length) {
    return mapJoin(conditions, encodeWhere(table, associations), " ".concat(op, " "));
  }
  return '';
};
var andJoiner = ' and ';
var encodeConditions = function (table, description, associations) {
  var clauses = mapJoin(description.where, encodeWhere(table, associations), andJoiner);
  return clauses.length ? " where ".concat(clauses) : '';
};

// If query contains `on()` conditions on tables with which the primary table has a has-many
// relation, then we need to add `distinct` on the query to ensure there are no duplicates
var encodeMethod = function (table, countMode, needsDistinct) {
  if (countMode) {
    return needsDistinct ? "select count(distinct \"".concat(table, "\".\"id\") as \"count\" from \"").concat(table, "\"") : "select count(*) as \"count\" from \"".concat(table, "\"");
  }
  return needsDistinct ? "select distinct \"".concat(table, "\".* from \"").concat(table, "\"") : "select \"".concat(table, "\".* from \"").concat(table, "\"");
};
var encodeAssociation = function (description) {
  return function ({
    from: mainTable,
    to: joinedTable,
    info: association
  }) {
    // TODO: We have a problem here. For all of eternity, WatermelonDB Q.ons were encoded using JOIN
    // However, this precludes many legitimate use cases for Q.ons once you start nesting them
    // (e.g. get tasks where X or has a tag assignment that Y -- if there is no tag assignment, this will
    // fail to join)
    // LEFT JOIN needs to be used to address this… BUT technically that's a breaking change. I never
    // considered a possiblity of making a query like `Q.on(relation_id, x != 'bla')`. Before this would
    // only match if there IS a relation, but with LEFT JOIN it would also match if record does not have
    // this relation. I don't know if there are legitimate use cases where this would change anything
    // so I need more time to think about whether this breaking change is OK to make or if we need to
    // do something more clever/add option/whatever.
    // so for now, i'm making an extreeeeemelyyyy bad hack to make sure that there's no breaking change
    // for existing code and code with nested Q.ons probably works (with caveats)
    var usesOldJoinStyle = description.where.some(function (clause) {
      return 'on' === clause.type && clause.table === joinedTable;
    });
    var joinKeyword = usesOldJoinStyle ? ' join ' : ' left join ';
    var joinBeginning = "".concat(joinKeyword, "\"").concat(joinedTable, "\" on \"").concat(joinedTable, "\".");
    return 'belongs_to' === association.type ? "".concat(joinBeginning, "\"id\" = \"").concat(mainTable, "\".\"").concat(association.key, "\"") : "".concat(joinBeginning, "\"").concat(association.foreignKey, "\" = \"").concat(mainTable, "\".\"id\"");
  };
};
var encodeJoin = function (description, associations) {
  return associations.length ? associations.map(encodeAssociation(description)).join('') : '';
};
var encodeOrderBy = function (table, sortBys) {
  if (0 === sortBys.length) {
    return '';
  }
  var orderBys = sortBys.map(function (sortBy) {
    return "\"".concat(table, "\".\"").concat(sortBy.sortColumn, "\" ").concat(sortBy.sortOrder);
  }).join(', ');
  return " order by ".concat(orderBys);
};
var encodeLimitOffset = function (limit, offset) {
  if (!limit) {
    return '';
  }
  var optionalOffsetStmt = offset ? " offset ".concat(offset) : '';
  return " limit ".concat(limit).concat(optionalOffsetStmt);
};
var encodeQuery = function (query, countMode = false) {
  var {
    table: table,
    description: description,
    associations: associations
  } = query;

  // TODO: Test if encoding a `select x.id from x` query speeds up queryIds() calls
  if (description.sql) {
    var {
      sql: _sql,
      values: values
    } = description.sql;
    return [_sql, values];
  }
  var hasToManyJoins = associations.some(function ({
    info: info
  }) {
    return 'has_many' === info.type;
  });
  if ('production' !== process.env.NODE_ENV) {
    description.take && (0, _common.invariant)(!countMode, 'take/skip is not currently supported with counting. Please contribute to fix this!');
    (0, _common.invariant)(!description.lokiTransform, 'unsafeLokiTransform not supported with SQLite');
  }
  var sql = encodeMethod(table, countMode, hasToManyJoins) + encodeJoin(description, associations) + encodeConditions(table, description, associations) + encodeOrderBy(table, description.sortBy) + encodeLimitOffset(description.take, description.skip);
  return [sql, []];
};
var _default = encodeQuery;
exports.default = _default;