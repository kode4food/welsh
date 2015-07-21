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

module.exports = createWelshDeferred.deferred = createWelshDeferred;
