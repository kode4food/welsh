/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh.Helpers {
  var bindThis = (function () {
    if ( Function.prototype.bind ) {
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

  export function tryCatch(tryBlock: Function, catchBlock?: Function) {
    if ( typeof tryBlock !== 'function' ) {
      return;
    }
    try {
      return tryBlock();
    }
    catch ( err ) {
      if ( typeof catchBlock === 'function' ) {
        return catchBlock(err);
      }
    }
  }
}
