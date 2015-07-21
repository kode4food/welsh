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
