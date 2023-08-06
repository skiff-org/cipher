"use strict";

exports.__esModule = true;
exports.default = subscribeToCount;
exports.experimentalDisableObserveCountThrottling = experimentalDisableObserveCountThrottling;
var _rx = require("../../utils/rx");
var _common = require("../../utils/common");
var _Result = require("../../utils/fp/Result");
var isThrottlingDisabled = false;
function experimentalDisableObserveCountThrottling() {
  isThrottlingDisabled = true;
}

// Produces an observable version of a query count by re-querying the database
// when any change occurs in any of the relevant Stores.
//
// TODO: Potential optimizations:
// - increment/decrement counter using matchers on insert/delete

function observeCountThrottled(query) {
  var {
    collection: collection
  } = query;
  return collection.database.withChangesForTables(query.allTables).pipe((0, _rx.throttleTime)(250),
  // Note: this has a bug, but we'll delete it anyway
  (0, _rx.switchMap)(function () {
    return (0, _Result.toPromise)(function (callback) {
      return collection._fetchCount(query, callback);
    });
  }), (0, _rx.distinctUntilChanged)());
}
function subscribeToCount(query, isThrottled, subscriber) {
  if (isThrottled && !isThrottlingDisabled) {
    var observable = observeCountThrottled(query);
    var subscription = observable.subscribe(subscriber);
    return function () {
      return subscription.unsubscribe();
    };
  }
  var {
    collection: collection
  } = query;
  var unsubscribed = false;
  var previousCount = -1;
  var observeCountFetch = function () {
    collection._fetchCount(query, function (result) {
      if (result.error) {
        (0, _common.logError)(result.error.toString());
        return;
      }
      var count = result.value;
      var shouldEmit = count !== previousCount && !unsubscribed;
      previousCount = count;
      shouldEmit && subscriber(count);
    });
  };
  var unsubscribe = collection.database.experimentalSubscribe(query.allTables, observeCountFetch, {
    name: 'subscribeToCount',
    query: query,
    subscriber: subscriber
  });
  observeCountFetch();
  return function () {
    unsubscribed = true;
    unsubscribe();
  };
}