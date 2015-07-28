/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var toString = Object.prototype.toString;
var slice = Array.prototype.slice;

var isArray = Array.isArray;
/* istanbul ignore if: won't happen in node */
if ( !isArray ) {
  isArray = function _isArray(obj) {
    return obj && toString.call(obj) === '[object Array]';
  };
}

/* istanbul ignore next */
var nextTick = (function () {
  if ( typeof setImmediate === 'function' ) {
    return setImmediate;
  }
  if ( typeof window === 'object' ) {
    if ( typeof window.requestAnimationFrame === 'function' ) {
      return window.requestAnimationFrame;
    }
  }
  if ( typeof setTimeout === 'function' ) {
    return setTimeout;
  }
  throw new Error("And I should schedule Promises how?");
}());

/* istanbul ignore next */
var bindThis = (function () {
  if ( Function.prototype.bind ) {
    return function (func, thisVal) {
      return func.bind(thisVal);
    };
  }

  return function (func, thisVal) {
    return function() {
      return func.apply(thisVal, arguments);
    };
  };
}());

function getThenFunction(value) {
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

function createCallQueue() {
  var queuedCalls = [];
  return queueCall;

  function queueCall(callback) {
    queuedCalls.push(callback);
    if ( queuedCalls.length > 1 ) {
      // nextTick has already been called
      return;
    }
    nextTick(performCalls);
  }

  function performCalls() {
    var callbacks = queuedCalls;
    queuedCalls = [];
    for ( var i = 0; i < callbacks.length; i++ ) {
      callbacks[i]();
    }
    if ( queuedCalls.length ) {
      nextTick(performCalls);
    }
  }
}

function tryCatch(tryBlock, catchBlock) {
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

function extractArrayArguments() {
  if ( arguments.length === 1 && isArray(arguments[0]) ) {
    return slice.call(arguments[0]);
  }
  else {
    return slice.call(arguments);
  }
}

exports.isArray = isArray;
exports.getThenFunction = getThenFunction;
exports.createCallQueue = createCallQueue;
exports.tryCatch = tryCatch;
exports.extractArrayArguments = extractArrayArguments;
