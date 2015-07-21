(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
"use strict";
window.welsh = require('./index');

},{"./index":2}],2:[function(require,module,exports){
"use strict";

exports.deferred = require('./lib/deferred');
exports.promise = require('./lib/promise');

},{"./lib/deferred":4,"./lib/promise":5}],3:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

/* istanbul ignore next */
var nextTick = typeof setImmediate === 'function' ? setImmediate : setTimeout;

function createCallQueue() {
  var queuedCalls = [];
  return queueCall;

  function queueCall(callback, callArgs) {
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

exports.createCallQueue = createCallQueue;

},{}],4:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var fulfilled = 1;
var rejected = 2;

var createCallQueue = require('./callQueue').createCallQueue;

function createWelshDeferred(executor) {
  var state, head, tail, pendingResult, running;
  var queueCall = createCallQueue();

  var welshInterface = {
    cancel: cancel,
    then: appendThen,
    catch: appendCatch,
    resolve: resolve,
    reject: reject
  };

  if ( typeof executor === 'function' ) {
    try {
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
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
    return start(fulfilled, result);
  }

  function reject(reason) {
    return start(rejected, reason);
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
    if ( isDeferred(result) ) {
      result.then(fulfilledLinker, rejectedLinker);
      return;
    }

    do {
      var callback = head[state];
      head = head.next || (tail = null);
      if ( !callback ) {
        continue;
      }

      try {
        result = callback(result);
        state = fulfilled;
      }
      catch ( reason ) {
        result = reason;
        state = rejected;
      }
      if ( isDeferred(result) ) {
        result.then(fulfilledLinker, rejectedLinker);
        return;
      }
    }
    while ( head );
    pendingResult = result;
    running = false;
  }

  function fulfilledLinker(result) {
    queueCall(function () {
      state = fulfilled;
      queueResult(result);
    });
    return result;
  }

  function rejectedLinker(result) {
    queueCall(function () {
      state = rejected;
      queueResult(result);
    });
    throw result;
  }

  function isDeferred(value) {
    return typeof value === 'object' && value !== null &&
           typeof value.then === 'function';
  }
}

module.exports = createWelshDeferred.deferred = createWelshDeferred;

},{"./callQueue":3}],5:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var createCallQueue = require('./callQueue').createCallQueue;

var fulfilledState = 1;
var rejectedState = 2;

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isFunction(value) {
  return typeof value === 'function';
}

function getThenFunction(value) {
  if ( (isObject(value) || isFunction(value)) && isFunction(value.then) ) {
    return value.then.bind(value);
  }
  return null;
}

function createWelshPromise(executor) {
  var state, settledResult, pending = [];
  var queueCall = createCallQueue();

  var welshInterface = {
    resolve: resolve,
    reject: reject,
    then: createThen,
    catch: createCatch
  };

  if ( isFunction(executor) ) {
    try {
      doResolve(executor, resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  return welshInterface;

  function resolve(result) {
    if ( state ) { return; }
    if ( welshInterface === result ) {
      reject(new TypeError("Um, yeah, you can't do that"));
      return;
    }
    try {
      var then = getThenFunction(result);
      if ( then ) {
        doResolve(then, resolve, reject);
        return;
      }
      state = fulfilledState;
      settledResult = result;
      queueCall(notifyPending);
    }
    catch ( err ) {
      reject(err);
    }
  }

  function reject(reason) {
    if ( state ) { return; }
    state = rejectedState;
    settledResult = reason;
    queueCall(notifyPending);
  }

  function doResolve(executor, onFulfilled, onRejected) {
    var done;
    try {
      executor(wrappedResolve, wrappedReject);
    }
    catch ( err ) {
      if ( done ) { return; }
      onRejected(err);
    }

    function wrappedResolve(result) {
      if ( done ) { return; }
      done = true;
      onFulfilled(result);
    }

    function wrappedReject(reason) {
      if ( done ) { return; }
      done = true;
      onRejected(reason);
    }
  }

  function createCatch(onRejected) {
    return createThen(undefined, onRejected);
  }

  function addPending(onFulfilled, onRejected) {
    if ( !state ) {
      pending.push([undefined, onFulfilled, onRejected]);
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
        try {
          if ( !isFunction(onFulfilled) ) {
            resolve(result);
            return;
          }
          resolve(onFulfilled(result));
        }
        catch ( err ) {
          reject(err);
        }
      }

      function rejectedHandler(reason) {
        try {
          if ( !isFunction(onRejected) ) {
            reject(reason);
            return;
          }
          resolve(onRejected(reason));
        }
        catch ( err ) {
          reject(err);
        }
      }
    }
  }
}

function resolved(result) {
  return createWelshPromise(function (resolve) {
    resolve(result);
  });
}

function rejected(reason) {
  return createWelshPromise(function (resolve, reject) {
    reject(reason);
  });
}

createWelshPromise.promise = createWelshPromise;
createWelshPromise.resolved = resolved;
createWelshPromise.rejected = rejectedState;

module.exports = createWelshPromise;

},{"./callQueue":3}]},{},[1]);
