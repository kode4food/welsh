(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
"use strict";
window.welsh = require('./index');

},{"./index":3}],2:[function(require,module,exports){
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

/* istanbul ignore next */
var nodeProcess = typeof process !== 'undefined' ? process : {};

/* istanbul ignore next */
var nextTick = nodeProcess.nextTick || setTimeout;

function createWelshDeferred(executor) {
  var state, head, tail, pendingResult, running;

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
    nextTick(function () {
      state = fulfilled;
      queueResult(result);
    });
    return result;
  }

  function rejectedLinker(result) {
    nextTick(function () {
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

module.exports = createWelshDeferred.Deferred = createWelshDeferred;

},{}],3:[function(require,module,exports){
"use strict";

exports.deferred = require('./deferred');
exports.promise = require('./promise');

},{"./deferred":2,"./promise":4}],4:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var fulfilledState = 1;
var rejectedState = 2;
var methods = [undefined, 'resolve', 'reject'];

/* istanbul ignore next */
var nodeProcess = typeof process !== 'undefined' ? process : {};

/* istanbul ignore next */
var nextTick = nodeProcess.nextTick || setTimeout;

function isPromise(value) {
  return (isObject(value) || isFunction(value)) && isFunction(value.then);
}

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isFunction(value) {
  return typeof value === 'function';
}

function findInArray(arr, value) {
  for ( var i = arr.length; i--; ) {
    if ( arr[i] === value ) {
      return true;
    }
  }
  return false;
}

function resolveIdentity(result) {
  return result;
}

function rejectIdentity(reason) {
  throw reason;
}

function createWelshPromise(onFulfilled, onRejected, parentThens) {
  var state, head, tail, settledResult, notifying;
  parentThens = parentThens.concat(appendThen);

  return {
    resolve: resolve,
    reject: reject,
    then: appendThen,
    catch: appendCatch,
    finally: appendFinally
  };

  function resolve(result) {
    if ( state ) {
      return;
    }
    try {
      if ( isPromise(result) ) {
        resolvePromise(result);
        return;
      }
      fulfillWith(onFulfilled(result));
    }
    catch ( err ) {
      rejectWith(err);
    }
  }

  function reject(reason) {
    if ( state ) {
      return;
    }
    try {
      fulfillWith(onRejected(reason));
    }
    catch ( err ) {
      rejectWith(err);
    }
  }

  function resolvePromise(promise) {
    var done;
    try {
      var then = promise.then;
      if ( findInArray(parentThens, then) ) {
        rejectWith(new TypeError("Um, yeah, you can't do that"));
        return;
      }
      promise.then(wrappedResolve, wrappedReject);
    }
    catch ( err ) {
      rejectWith(err);
    }

    function wrappedResolve(result) {
      if ( done ) {
        return;
      }
      done = true;
      resolve(result);
    }

    function wrappedReject(reason) {
      if ( done ) {
        return;
      }
      done = true;
      if ( isPromise(reason) ) {
        resolve(reason);
        return;
      }
      reject(reason);
    }
  }

  function fulfillWith(value) {
    state = fulfilledState;
    settledResult = value;
    nextTick(notifyThenables);
  }

  function rejectWith(reason) {
    state = rejectedState;
    settledResult = reason;
    nextTick(notifyThenables);
  }

  function appendCatch(onRejected) {
    return appendThen(undefined, onRejected);
  }

  function appendFinally(onFinally) {
    return appendThen(onFinally, onFinally);
  }

  function appendThen(onFulfilled, onRejected) {
    if ( !isFunction(onFulfilled) ) {
      onFulfilled = resolveIdentity;
    }
    if ( !isFunction(onRejected) ) {
      onRejected = rejectIdentity;
    }
    var promise = createWelshPromise(onFulfilled, onRejected, parentThens);

    if ( !tail ) {
      head = tail = promise;
    }
    else {
      tail = tail.next = promise;
    }

    if ( state && !notifying ) {
      nextTick(notifyThenables);
    }

    return {
      then: promise.then, catch: promise.catch, finally: promise.finally
    };
  }

  function notifyThenables() {
    notifying = true;
    while ( head ) {
      var promise = head;
      try {
        promise[methods[state]](settledResult);
      }
      catch ( err ) {

      }
      head = head.next || (tail = null);
    }
    notifying = false;
  }
}

function welsh(executor) {
  var promise = createWelshPromise(resolveIdentity, rejectIdentity, []);
  if ( isFunction(executor) ) {
    try {
      executor(promise.resolve, promise.reject);
    }
    catch ( err ) {
      promise.reject(err);
    }
    return {
      then: promise.then, catch: promise.catch, finally: promise.finally
    };
  }
  return promise;
}

welsh.resolved = resolved;
welsh.rejected = rejectedState;

function resolved(result) {
  var promise = createWelshPromise(resolveIdentity, rejectIdentity, []);
  promise.resolve(result);
  return promise;
}

function rejected(reason) {
  var promise = createWelshPromise(resolveIdentity, rejectIdentity, []);
  promise.reject(reason);
  return promise;
}

module.exports = welsh.Promise = welsh;

},{}]},{},[1]);
