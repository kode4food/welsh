(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
"use strict";
window.welsh = require('./index');

},{"./index":2}],2:[function(require,module,exports){
"use strict";

exports.deferred = require('./lib/deferred');
exports.promise = require('./lib/promise');

},{"./lib/deferred":4,"./lib/promise":6}],3:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

function createCommonExports(name, generatorFunc) {
  function resolved(result) {
    return generatorFunc(function (resolve) {
      resolve(result);
    });
  }

  function rejected(reason) {
    return generatorFunc(function (resolve, reject) {
      reject(reason);
    });
  }

  generatorFunc[name] = generatorFunc;
  generatorFunc.resolved = resolved;
  generatorFunc.rejected = rejected;

  return generatorFunc;
}

exports.createCommonExports = createCommonExports;

},{}],4:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var createCommonExports = require('./api').createCommonExports;

var helpers = require('./helpers');
var createCallQueue = helpers.createCallQueue;
var getThenFunction = helpers.getThenFunction;

var fulfilledState = 1;
var rejectedState = 2;

function createWelshDeferred(executor) {
  var welshInterface, state, head, tail, pendingResult, running;
  var queueCall = createCallQueue();

  if ( typeof executor === 'function' ) {
    try {
      welshInterface = {
        then: appendThen,
        catch: appendCatch,
        cancel: cancel
      };
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  else {
    welshInterface = {
      resolve: resolve,
      reject: reject,
      then: appendThen,
      catch: appendCatch,
      cancel: cancel
    };
  }

  return welshInterface;

  function start(newState, result) {
    if ( state ) {
      throw new Error("You can't welsh on this promise!");
    }
    state = newState;
    queueResult(result);
    return welshInterface;
  }

  function appendCatch(onRejected) {
    return appendThen(undefined, onRejected);
  }

  function resolve(result) {
    return start(fulfilledState, result);
  }

  function reject(reason) {
    return start(rejectedState, reason);
  }

  function queueResult(result) {
    if ( head ) {
      proceed(result);
    }
    else {
      pendingResult = result;
      running = false;
    }
  }

  function appendThen(onFulfilled, onRejected) {
    if ( typeof onFulfilled !== 'function' ) {
      onFulfilled = undefined;
    }
    if ( typeof onRejected !== 'function' ) {
      onRejected = undefined;
    }

    var item = { 1: onFulfilled, 2: onRejected };
    if ( !tail ) {
      head = tail = item;
    }
    else {
      tail = tail.next = item;
    }

    if ( state && !running ) {
      proceed(pendingResult);
    }

    return welshInterface;
  }

  function cancel() {
    head = null;
    return welshInterface;
  }

  function proceed(result) {
    running = true;
    do {
      var then = getThenFunction(result);
      if ( then ) {
        then(fulfilledLinker, rejectedLinker);
        return;
      }

      var callback = head[state];
      head = head.next || (tail = null);
      if ( !callback ) {
        continue;
      }

      try {
        result = callback(result);
        state = fulfilledState;
      }
      catch ( reason ) {
        result = reason;
        state = rejectedState;
      }
    }
    while ( head );
    pendingResult = result;
    running = false;
  }

  function fulfilledLinker(result) {
    queueCall(function () {
      state = fulfilledState;
      queueResult(result);
    });
    return result;
  }

  function rejectedLinker(result) {
    queueCall(function () {
      state = rejectedState;
      queueResult(result);
    });
    throw result;
  }
}

module.exports = createCommonExports('deferred', createWelshDeferred);

},{"./api":3,"./helpers":5}],5:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

/* istanbul ignore next */
var _process = typeof process !== 'undefined' ? process : {};
/* istanbul ignore next */
var _setImmediate = typeof setImmediate === 'function' ? setImmediate : null;
/* istanbul ignore next */
var nextTick = _process.nextTick || _setImmediate || setTimeout;

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

},{}],6:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var createCommonExports = require('./api').createCommonExports;

var helpers = require('./helpers');
var createCallQueue = helpers.createCallQueue;
var getThenFunction = helpers.getThenFunction;

var fulfilledState = 1;
var rejectedState = 2;

function createWelshPromise(executor) {
  var welshInterface, state, settledResult, pending = [];
  var queueCall = createCallQueue();

  if ( typeof executor === 'function' ) {
    welshInterface = {
      then: createThen,
      catch: createCatch
    };
    doResolve(executor);
  }
  else {
    welshInterface = {
      resolve: resolve,
      reject: reject,
      then: createThen,
      catch: createCatch
    };
  }

  return welshInterface;

  function resolve(result) {
    if ( state ) {
      return welshInterface;
    }
    if ( welshInterface === result ) {
      reject(new TypeError("Um, yeah, you can't do that"));
      return welshInterface;
    }
    try {
      var then = getThenFunction(result);
      if ( then ) {
        doResolve(then);
        return welshInterface;
      }
      state = fulfilledState;
      settledResult = result;
      queueCall(notifyPending);
    }
    catch ( err ) {
      reject(err);
    }
    return welshInterface;
  }

  function reject(reason) {
    if ( state ) {
      return welshInterface;
    }
    state = rejectedState;
    settledResult = reason;
    queueCall(notifyPending);
    return welshInterface;
  }

  function doResolve(executor) {
    var done;
    try {
      executor(wrappedResolve, wrappedReject);
    }
    catch ( err ) {
      if ( done ) { return; }
      reject(err);
    }

    function wrappedResolve(result) {
      if ( done ) { return; }
      done = true;
      resolve(result);
    }

    function wrappedReject(reason) {
      if ( done ) { return; }
      done = true;
      reject(reason);
    }
  }

  function createCatch(onRejected) {
    return createThen(undefined, onRejected);
  }

  function addPending(onFulfilled, onRejected) {
    if ( !state ) {
      pending.push({ 1: onFulfilled, 2: onRejected });
      return;
    }
    queueCall(function () {
      (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
    });
  }

  function notifyPending() {
    for ( var i = 0, len = pending.length; i < len; i++ ) {
      pending[i][state](settledResult);
    }
    pending = null;
  }

  function createThen(onFulfilled, onRejected) {
    return createWelshPromise(thenResolver);

    function thenResolver(resolve, reject) {
      addPending(fulfilledHandler, rejectedHandler);

      function fulfilledHandler(result) {
        if ( typeof onFulfilled !== 'function' ) {
          resolve(result);
          return;
        }
        try {
          resolve(onFulfilled(result));
        }
        catch ( err ) {
          reject(err);
        }
      }

      function rejectedHandler(reason) {
        if ( typeof onRejected !== 'function' ) {
          reject(reason);
          return;
        }
        try {
          resolve(onRejected(reason));
        }
        catch ( err ) {
          reject(err);
        }
      }
    }
  }
}

module.exports = createCommonExports('promise', createWelshPromise);

},{"./api":3,"./helpers":5}]},{},[1]);
