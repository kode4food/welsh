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

function isPromise(value) {
  return (isObject(value) || isFunction(value)) && isFunction(value.then);
}

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isFunction(value) {
  return typeof value === 'function';
}

function createWelshPromise(executor) {
  var state, settledResult, handlers = [];
  var queueCall = createCallQueue();

  var welshInterface = {
    resolve: resolve,
    reject: reject,
    then: createThen,
    catch: createCatch
  };

  if ( isFunction(executor) ) {
    try {
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  return welshInterface;

  function resolve(result) {
    if ( state ) {
      return;
    }
    if ( welshInterface === result ) {
      reject(new TypeError("Um, yeah, you can't do that"));
      return;
    }
    try {
      if ( isPromise(result) ) {
        resolvePromise(result);
        return;
      }
      state = fulfilledState;
      settledResult = result;
      queueCall(notifyHandlers);
    }
    catch ( err ) {
      reject(err);
    }
  }
  
  function reject(reason) {
    if ( state ) {
      return;
    }
    state = rejectedState;
    settledResult = reason;
    queueCall(notifyHandlers);
  }

  function resolvePromise(promise) {
    var done;
    try {
      promise.then(wrappedResolve, wrappedReject);
    }
    catch ( err ) {
      if ( done ) {
        return;
      }
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

  function createCatch(onRejected) {
    return createThen(undefined, onRejected);
  }

  function addHandler(onFulfilled, onRejected) {
    if ( !state ) {
      handlers.push([undefined, onFulfilled, onRejected]);
      return;
    }
    queueCall(function () {
      (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
    });
  }
  
  function notifyHandlers() {
    for ( var i = 0, len = handlers.length; i < len; i++ ) {
      handlers[i][state](settledResult);
    }
    handlers = null;
  }

  function createThen(onFulfilled, onRejected) {
    return createWelshPromise(thenResolver);
    
    function thenResolver(resolve, reject) {
      addHandler(fulfilledHandler, rejectedHandler);
      
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
