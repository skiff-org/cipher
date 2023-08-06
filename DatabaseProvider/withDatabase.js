"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = withDatabase;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _react = _interopRequireDefault(require("react"));
var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));
var _DatabaseContext = require("./DatabaseContext");
// HoC to inject the database into the props of consumers
function withDatabase(Component) {
  return (0, _hoistNonReactStatics.default)(function (props) {
    return /*#__PURE__*/_react.default.createElement(_DatabaseContext.DatabaseConsumer, null, function (database) {
      return /*#__PURE__*/_react.default.createElement(Component, (0, _extends2.default)({}, props, {
        database: database
      }));
    });
  }, Component);
}