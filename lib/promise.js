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

var fulfilledState = 1;
var rejectedState = 2;

function createWelshPromise(executor) {
  var state, settledResult, pending = [];
  var queueCall = createCallQueue();

  var welshInterface = {
    resolve: resolve,
    reject: reject,
    then: createThen,
    catch: createCatch
  };

  if ( typeof executor === 'function' ) {
    doResolve(executor);
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
        doResolve(then);
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
createWelshPromise.rejected = rejected;

module.exports = createWelshPromise;