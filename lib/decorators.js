/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var welshPromise = require('./promise');
var helpers = require('./helpers');
var tryCatch = helpers.tryCatch;

function decorateInterface(promise) {
  promise.catch = createCatch;
  promise.finally = createFinally;
  promise.toNode = createToNode;
  return promise;

  function createCatch(onRejected) {
    return promise.then(undefined, onRejected);
  }

  function createToNode(callback) {
    return promise.then(wrappedFulfilled, wrappedRejected);

    function wrappedFulfilled(result) {
      try {
        callback(null, result);
      } finally {
        return result;
      }
    }

    function wrappedRejected(reason) {
      try {
        callback(reason);
      }
      finally {
        throw reason;
      }
    }
  }

  function createFinally(onFinally) {
    return welshPromise.createWelshPromise(function (resolve, reject) {
      promise.then(wrappedFulfilled, wrappedRejected);

      function wrappedFulfilled(result) {
        tryCatch(onFinally);
        resolve(result);
      }

      function wrappedRejected(reason) {
        tryCatch(onFinally);
        reject(reason);
      }
    });
  }
}

function decorateExportedFunction(name, deferredGenerator) {
  function createResolved(result) {
    return deferredGenerator(function (resolve) {
      resolve(result);
    });
  }

  function createRejected(reason) {
    return deferredGenerator(function (resolve, reject) {
      reject(reason);
    });
  }

  deferredGenerator[name] = deferredGenerator;
  deferredGenerator.resolve = createResolved;
  deferredGenerator.reject = createRejected;

  return deferredGenerator;
}

exports.decorateInterface = decorateInterface;
exports.decorateExportedFunction = decorateExportedFunction;
