/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

/* istanbul ignore next */
var _setImmediate = typeof setImmediate === 'function' ? setImmediate : null;
/* istanbul ignore next */
var nextTick = _setImmediate || setTimeout;

var bindThis;
/* istanbul ignore else */
if ( Function.prototype.bind ) {
  bindThis = function (func, thisVal) {
    return func.bind(thisVal);
  };
}
else {
  bindThis = function(func, thisVal) {
    return function() {
      return func.apply(thisVal, arguments);
    };
  };
}

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

exports.getThenFunction = getThenFunction;
exports.createCallQueue = createCallQueue;
