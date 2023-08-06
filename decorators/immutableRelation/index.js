"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _relation = _interopRequireDefault(require("../relation"));
// Defines a model property that fetches a record with a specific ID
// The property defined must be *immutable*, i.e. the relation ID must never change
// Returns an immutable Relation object. See watermelondb/Relation for more information
//
// If the property *can* change, use `relation` instead
//
// You can only assign a value inside a `collection.create()` or `collection.prepareCreate()` block
//
// relationIdColumn - name of the column with record ID
// relationTable - name of the table containing desired recods
//
// Example: a Comment has an author (and an author can never change), so it may define:
//   @immutableRelation('team_member', 'author_id') author: Relation<TeamMember>
var immutableRelation = function (relationTable, relationIdColumn) {
  return (0, _relation.default)(relationTable, relationIdColumn, {
    isImmutable: true
  });
};
var _default = immutableRelation;
exports.default = _default;