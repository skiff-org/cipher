"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _makeDecorator = _interopRequireDefault(require("../../utils/common/makeDecorator"));
var _logError = _interopRequireDefault(require("../../utils/common/logError"));
var _invariant = _interopRequireDefault(require("../../utils/common/invariant"));
var Q = _interopRequireWildcard(require("../../QueryDescription"));
function _getRequireWildcardCache(nodeInterop) { if ("function" !== typeof WeakMap) return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (null === obj || "object" !== typeof obj && "function" !== typeof obj) { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if ("default" !== key && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
// Defines a model property that queries records that *belong_to* this model
// Pass name of the table with desired records. (The model defining a @children property must
// have a has_many association defined with this table)
//
// Example: a Task has_many Comments, so it may define:
//   @children('comment') comments: Query<Comment>
var children = (0, _makeDecorator.default)(function (childTable) {
  return function () {
    return {
      get: function get() {
        // $FlowFixMe
        var that = this;
        // Use cached Query if possible
        that._childrenQueryCache = that._childrenQueryCache || {};
        var cachedQuery = that._childrenQueryCache[childTable];
        if (cachedQuery) {
          return cachedQuery;
        }

        // Cache new Query
        var model = that.asModel;
        var childCollection = model.collections.get(childTable);
        var association = model.constructor.associations[childTable];
        (0, _invariant.default)(association && 'has_many' === association.type, "@children decorator used for a table that's not has_many");
        var query = childCollection.query(Q.where(association.foreignKey, model.id));
        that._childrenQueryCache[childTable] = query;
        return query;
      },
      set: function set() {
        (0, _logError.default)('Setter called on a @children-marked property');
      }
    };
  };
});
var _default = children;
exports.default = _default;