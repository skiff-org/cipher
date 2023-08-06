"use strict";

exports.__esModule = true;
exports.hasUnsyncedChanges = hasUnsyncedChanges;
exports.synchronize = synchronize;
// TODO: JSDoc'ify this
/**
 * Synchronizes database with a remote server
 *
 * See docs for more details
 */
function synchronize(args) {
  return new Promise(function ($return, $error) {
    var synchronizeImpl;
    var $Try_1_Post = function () {
      try {
        return $return();
      } catch ($boundEx) {
        return $error($boundEx);
      }
    };
    var $Try_1_Catch = function (error) {
      try {
        args.log && (args.log.error = error);
        throw error;
      } catch ($boundEx) {
        return $error($boundEx);
      }
    };
    try {
      synchronizeImpl = require('./impl/synchronize').default;
      return Promise.resolve(synchronizeImpl(args)).then(function () {
        try {
          return $Try_1_Post();
        } catch ($boundEx) {
          return $Try_1_Catch($boundEx);
        }
      }, $Try_1_Catch);
    } catch (error) {
      $Try_1_Catch(error)
    }
  });
}

/**
 * Returns `true` if database has any unsynced changes.
 *
 * Use this to check if you can safely log out (delete the database)
 */
function hasUnsyncedChanges({
  database: database
}) {
  return require('./impl').hasUnsyncedChanges(database);
}