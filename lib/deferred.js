/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var getThenFunction = helpers.getThenFunction;

var WelshBase = require('./base');

var fulfilledState = 1;
var rejectedState = 2;
var canceledState = 3;

function createWelshDeferred(executor) {
  var state, running, pendingResult;
  var pendingHandlers = [];
  var pendingIndex = 0;

  var welshInterface = new WelshBase();
  welshInterface.then = appendThen;
  welshInterface.cancel = cancel;

  if ( typeof executor === 'function' ) {
    try {
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  else {
    welshInterface.resolve = resolve;
    welshInterface.reject = reject;
  }

  return welshInterface;

  function resolve(result) {
    return start(fulfilledState, result);
  }

  function reject(reason) {
    return start(rejectedState, reason);
  }

  function start(newState, result) {
    if ( state ) {
      return;
    }
    state = newState;
    proceed(result);
    return welshInterface;
  }

  function appendThen(onFulfilled, onRejected) {
    pendingHandlers[pendingHandlers.length] = [
      undefined, onFulfilled, onRejected
    ];

    if ( state && !running ) {
      proceed(pendingResult);
    }

    return welshInterface;
  }

  function cancel() {
    pendingHandlers = [];
    pendingIndex = 0;
    running = false;
    state = canceledState;
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

      if ( pendingIndex >= pendingHandlers.length ) {
        break;
      }

      var callback = pendingHandlers[pendingIndex++][state];
      if ( typeof callback === 'function' ) {
        try {
          result = callback(result);
          state = fulfilledState;
        }
        catch ( reason ) {
          result = reason;
          state = rejectedState;
        }
      }
    }
    while ( true );
    pendingResult = result;
    pendingHandlers = [];
    pendingIndex = 0;
    running = false;
  }

  function fulfilledLinker(result) {
    state = fulfilledState;
    proceed(result);
    return result;
  }

  function rejectedLinker(reason) {
    state = rejectedState;
    proceed(reason);
    throw reason;
  }
}

module.exports = createWelshDeferred;
