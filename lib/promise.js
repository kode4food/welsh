/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var queueCall = helpers.queueCall;
var getThenFunction = helpers.getThenFunction;

var fulfilledState = 1;
var rejectedState = 2;

function createWelshPromise(executor, createPromise) {
  var welshInterface, state, settledResult, head, tail;

  if ( typeof executor === 'function' ) {
    welshInterface = {
      then: createThen
    };
    doResolve(executor);
  }
  else {
    welshInterface = {
      resolve: resolve,
      reject: reject,
      then: createThen
    };
  }

  return welshInterface;

  function resolve(result) {
    if ( state ) {
      return welshInterface;
    }
    if ( welshInterface === result ) {
      reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
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

  function createThen(onFulfilled, onRejected) {
    return createPromise(thenResolver);

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

  function addPending(onFulfilled, onRejected) {
    if ( !state ) {
      var item = { 1: onFulfilled, 2: onRejected };
      if ( !tail ) {
        head = tail = item;
      }
      else {
        tail = tail.next = item;
      }
      return;
    }
    queueCall(function () {
      (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
    });
  }

  function notifyPending() {
    while ( head ) {
      head[state](settledResult);
      head = head.next || (tail = null);
    }
  }
}

module.exports = createWelshPromise;
