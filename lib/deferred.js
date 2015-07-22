/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var createCallQueue = helpers.createCallQueue;
var getThenFunction = helpers.getThenFunction;

var fulfilled = 1;
var rejected = 2;

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
        state = fulfilled;
      }
      catch ( reason ) {
        result = reason;
        state = rejected;
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
}

module.exports = createWelshDeferred;
