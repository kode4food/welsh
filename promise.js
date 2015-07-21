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
      reject(err);
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
      state = rejectedState;
      settledResult = err;
      nextTick(notifyThenables);
    }
  }

  function resolvePromise(promise) {
    var done;
    try {
      var then = promise.then;
      if ( findInArray(parentThens, then) ) {
        reject(new TypeError("Um, yeah, you can't do that"));
        return;
      }
      promise.then(wrappedResolve, wrappedReject);
    }
    catch ( err ) {
      reject(err);
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
      reject(reason);
    }
  }

  function fulfillWith(value) {
    state = fulfilledState;
    settledResult = value;
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

module.exports = welsh.promise = welsh;
