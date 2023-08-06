"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _Collection = _interopRequireDefault(require("../../Collection"));
var _common = require("../../utils/common");
var CollectionMap = /*#__PURE__*/function () {
  function CollectionMap(db, modelClasses) {
    var _this = this;
    this.map = Object.create(null);
    modelClasses.forEach(function (modelClass) {
      var {
        table: table
      } = modelClass;
      if ('production' !== process.env.NODE_ENV) {
        // TODO: move these checks to Collection?
        (0, _common.invariant)('string' === typeof table, "Model class ".concat(modelClass.name, " passed to Database constructor is missing \"static table = 'table_name'\""));
        (0, _common.invariant)(db.schema.tables[table], "Model class ".concat(modelClass.name, " has static table defined that is missing in schema known by this database"));
      }
      _this.map[table] = new _Collection.default(db, modelClass);
    });
    Object.freeze(this.map);
  }
  var _proto = CollectionMap.prototype;
  _proto.get = function get(tableName) {
    return this.map[tableName] || null;
  };
  return CollectionMap;
}();
exports.default = CollectionMap;