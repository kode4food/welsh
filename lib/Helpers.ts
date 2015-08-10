/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh.Helpers {
  var objectToString = Object.prototype.toString;

  // TypeScript would prefer the polyfill
  if ( !Array.isArray ) {
    Array.isArray = function (obj: Object): boolean {
      return obj && objectToString.call(obj) === '[object Array]';
    };
  }

  export var bindThis = (function () {
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
    if ( !value ) {
      return null;
    }
    var valueType = typeof value;
    if ( valueType !== 'object' && valueType !== 'function' ) {
      return null;
    }
    var then = value.then;
    if ( typeof then !== 'function' ) {
      return null;
    }
    return bindThis(then, value);
  }
}
