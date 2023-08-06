"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = exports.Provider = exports.DatabaseConsumer = void 0;
var _react = _interopRequireDefault(require("react"));
var DatabaseContext = _react.default.createContext();
var {
  Provider: Provider,
  Consumer: Consumer
} = DatabaseContext;
exports.DatabaseConsumer = Consumer;
exports.Provider = Provider;
var _default = DatabaseContext;
exports.default = _default;