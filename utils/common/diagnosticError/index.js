"use strict";

exports.__esModule = true;
exports.default = diagnosticError;
exports.useCustomDiagnosticErrorFunction = useCustomDiagnosticErrorFunction;
var customDiagnosticErrorFunction = null;

// Use this to replace default diagnosticError function to inject your custom logic
// (e.g. only display errors in development, or log errors to external service)
function useCustomDiagnosticErrorFunction(diagnosticErrorFunction) {
  customDiagnosticErrorFunction = diagnosticErrorFunction;
}
function diagnosticError(errorMessage) {
  if (customDiagnosticErrorFunction) {
    return customDiagnosticErrorFunction(errorMessage);
  }
  var error = new Error(errorMessage);

  // hides `diagnosticError` from RN stack trace
  error.framesToPop = 1;
  error.name = 'Diagnostic error';
  return error;
}