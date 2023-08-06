"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = subscribeToQuery;
var _subscribeToQueryReloading = _interopRequireDefault(require("./subscribeToQueryReloading"));
var _subscribeToSimpleQuery = _interopRequireDefault(require("./subscribeToSimpleQuery"));
var _canEncode = _interopRequireDefault(require("./encodeMatcher/canEncode"));
function subscribeToQuery(query, subscriber) {
  return (0, _canEncode.default)(query.description) ? (0, _subscribeToSimpleQuery.default)(query, subscriber) : (0, _subscribeToQueryReloading.default)(query, subscriber);
}