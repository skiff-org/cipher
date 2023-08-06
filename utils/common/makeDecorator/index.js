"use strict";

exports.__esModule = true;
exports.default = makeDecorator;
// Converts a function with signature `(args) => (target, key, descriptor)` to a decorator
// that works both when called `@decorator foo` and with arguments, like `@decorator(arg) foo`
function makeDecorator(decorator) {
  return function (...args) {
    // Decorator called with an argument, JS expects a decorator function
    if (3 > args.length) {
      return decorator.apply(void 0, args);
    }

    // Decorator called without an argument, JS expects a descriptor object
    return decorator().apply(void 0, args);
  };
}