"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.rawFieldEquals = exports.notLike = exports.like = exports.default = void 0;
var _likeToRegexp = _interopRequireDefault(require("../../utils/fp/likeToRegexp"));
/* eslint-disable eqeqeq */
var between = function (left, [lower, upper]) {
  return left >= lower && left <= upper;
};
var rawFieldEquals = function (left, right) {
  return left == right;
};
exports.rawFieldEquals = rawFieldEquals;
var rawFieldNotEquals = function (left, right) {
  return !(left == right);
};
var noNullComparisons = function (operator) {
  return function (left, right) {
    // return false if any operand is null/undefined
    if (null == left || null == right) {
      return false;
    }
    return operator(left, right);
  };
};

// Same as `a > b`, but `5 > undefined` is also true
var weakGt = function (left, right) {
  return left > right || null != left && null == right;
};
var handleLikeValue = function (v, defaultV) {
  return 'string' === typeof v ? v : defaultV;
};
var like = function (left, right) {
  var leftV = handleLikeValue(left, '');
  return (0, _likeToRegexp.default)(right).test(leftV);
};
exports.like = like;
var notLike = function (left, right) {
  // Mimic SQLite behaviour
  if (null === left) {
    return false;
  }
  var leftV = handleLikeValue(left, '');
  return !(0, _likeToRegexp.default)(right).test(leftV);
};
exports.notLike = notLike;
var oneOf = function (value, values) {
  return values.includes(value);
};
var notOneOf = function (value, values) {
  return !values.includes(value);
};
var gt = function (a, b) {
  return a > b;
};
var gte = function (a, b) {
  return a >= b;
};
var lt = function (a, b) {
  return a < b;
};
var lte = function (a, b) {
  return a <= b;
};
var includes = function (a, b) {
  return 'string' === typeof a && a.includes(b);
};
var operators = {
  eq: rawFieldEquals,
  notEq: rawFieldNotEquals,
  gt: noNullComparisons(gt),
  gte: noNullComparisons(gte),
  weakGt: weakGt,
  lt: noNullComparisons(lt),
  lte: noNullComparisons(lte),
  oneOf: oneOf,
  notIn: noNullComparisons(notOneOf),
  between: between,
  like: like,
  notLike: notLike,
  includes: includes
};
var _default = operators;
exports.default = _default;