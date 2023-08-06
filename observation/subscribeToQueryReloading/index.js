"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = subscribeToQueryReloading;
var _common = require("../../utils/common");
var _identicalArrays = _interopRequireDefault(require("../../utils/fp/identicalArrays"));
// Produces an observable version of a query by re-querying the database
// when any change occurs in any of the relevant Stores.
// This is inefficient for simple queries, but necessary for complex queries
function subscribeToQueryReloading(query, subscriber,
// Emits `false` when query fetch begins + always emits even if no change - internal trick needed
// by observeWithColumns
shouldEmitStatus = false) {
  var {
    collection: collection
  } = query;
  var previousRecords = null;
  var unsubscribed = false;
  function reloadingObserverFetch() {
    if (shouldEmitStatus) {
      unsubscribed || subscriber(false);
    }
    collection._fetchQuery(query, function (result) {
      if (result.error) {
        (0, _common.logError)(result.error.toString());
        return;
      }
      var records = result.value;
      var shouldEmit = !unsubscribed && (shouldEmitStatus || !previousRecords || !(0, _identicalArrays.default)(records, previousRecords));
      previousRecords = records;
      shouldEmit && subscriber(records);
    });
  }
  var unsubscribe = collection.database.experimentalSubscribe(query.allTables, reloadingObserverFetch, {
    name: 'subscribeToQueryReloading observation',
    query: query,
    subscriber: subscriber
  });
  reloadingObserverFetch();
  return function () {
    unsubscribed = true;
    unsubscribe();
  };
}