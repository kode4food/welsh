/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
var objectToString = Object.prototype.toString;
exports.TryError = { reason: null };
/* istanbul ignore next */
if (!Array.isArray) {
    // TypeScript would prefer the polyfill
    Array.isArray = function (arg) {
        return arg && objectToString.call(arg) === '[object Array]';
    };
}
/* istanbul ignore next */
exports.bindThis = (function () {
    if (Function.prototype.bind) {
        return function (func, thisVal) {
            return func.bind(thisVal);
        };
    }
    return function (func, thisVal) {
        return function () {
            return func.apply(thisVal, arguments);
        };
    };
}());
function getThenFunction(value) {
    var valueType = typeof value;
    if (valueType !== 'object' && valueType !== 'function') {
        return null;
    }
    if (value === null) {
        return null;
    }
    var then = value.then;
    if (typeof then !== 'function') {
        return null;
    }
    return exports.bindThis(then, value);
}
exports.getThenFunction = getThenFunction;
function tryCall(func, arg1, arg2) {
    try {
        return func(arg1, arg2);
    }
    catch (err) {
        exports.TryError.reason = err;
        return exports.TryError;
    }
}
exports.tryCall = tryCall;
