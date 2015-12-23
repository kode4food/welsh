/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

const objectToString = Object.prototype.toString;

interface ErrorInterface {
  reason: any;
}

export const TryError: ErrorInterface = { reason: null };

/* istanbul ignore next */
if ( !Array.isArray ) {
  // TypeScript would prefer the polyfill
  Array.isArray = function (arg: any): arg is any[] {
    return arg && objectToString.call(arg) === '[object Array]';
  };
}

/* istanbul ignore next */
export const bindThis = (function () {
  if ( Function.prototype.bind ) {
    return function (func: Function, thisVal: Object) {
      return func.bind(thisVal);
    };
  }

  return function (func: Function, thisVal: Object) {
    return function () {
      return func.apply(thisVal, arguments);
    };
  };
}());

export function getThenFunction(value?: any) {
  let valueType = typeof value;
  if ( valueType !== 'object' && valueType !== 'function' ) {
    return null;
  }
  if ( value === null ) {
    return null;
  }
  let then = value.then;
  if ( typeof then !== 'function' ) {
    return null;
  }
  return bindThis(then, value);
}

export function tryCall(func: Function, arg1?: any, arg2?: any): any {
  try {
    return func(arg1, arg2);
  }
  catch ( err ) {
    TryError.reason = err;
    return TryError;
  }
}
