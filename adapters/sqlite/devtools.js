"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _Query = _interopRequireDefault(require("../../Query"));
var _encodeQuery = _interopRequireDefault(require("./encodeQuery"));
// $FlowFixMe
_Query.default.prototype._sql = function (count = false) {
  var query = this;
  var [sql] = (0, _encodeQuery.default)(query.serialize(), count);
  return sql;
};