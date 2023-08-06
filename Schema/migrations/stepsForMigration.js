"use strict";

exports.__esModule = true;
exports.stepsForMigration = stepsForMigration;
var _fp = require("../../utils/fp");
function stepsForMigration({
  migrations: schemaMigrations,
  fromVersion: fromVersion,
  toVersion: toVersion
}) {
  var {
    sortedMigrations: sortedMigrations,
    minVersion: minVersion,
    maxVersion: maxVersion
  } = schemaMigrations;

  // see if migrations in this range are available
  if (fromVersion < minVersion || toVersion > maxVersion) {
    return null;
  }

  // return steps
  var matchingMigrations = sortedMigrations.filter(function ({
    toVersion: version
  }) {
    return version > fromVersion && version <= toVersion;
  });
  var allSteps = (0, _fp.unnest)(matchingMigrations.map(function (migration) {
    return migration.steps;
  }));
  return allSteps;
}