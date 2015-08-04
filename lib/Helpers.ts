/// <reference path="../typings/node/node.d.ts"/>

/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

module Welsh.Helpers {
  var slice = Array.prototype.slice;

  /* istanbul ignore next */
  var isArray = (function () {
    if (Array.isArray) {
      return Array.isArray;
    }
    var toString = Object.prototype.toString;
    return function _isArray(obj) {
      return obj && toString.call(obj) === '[object Array]';
    };
  }());

  /* istanbul ignore next */
  var bindThis = (function () {
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

  export function getThenFunction(value) {
    if (!value) {
      return null;
    }
    var valueType = typeof value;
    if (valueType !== 'object' && valueType !== 'function') {
      return null;
    }
    var then = value.then;
    if (typeof then !== 'function') {
      return null;
    }
    return bindThis(then, value);
  }

  export function tryCatch(tryBlock:Function, catchBlock?:Function) {
    if (typeof tryBlock !== 'function') {
      return;
    }
    try {
      return tryBlock();
    }
    catch (err) {
      if (typeof catchBlock === 'function') {
        return catchBlock(err);
      }
    }
  }

  export function extractArrayArguments() {
    if (arguments.length === 1 && isArray(arguments[0])) {
      return slice.call(arguments[0]);
    }
    else {
      return slice.call(arguments);
    }
  }
}
