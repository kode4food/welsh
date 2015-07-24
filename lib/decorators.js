/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var welshPromise = require('./promise');

function decorateInterface(promise) {
  promise.catch = createCatch;
  promise.finally = createFinally;
  return promise;

  function createCatch(onRejected) {
    return promise.then(undefined, onRejected);
  }

  function createFinally(onFulfilled, onRejected) {
    return welshPromise.createWelshPromise(function (resolve, reject) {
      promise.then(wrappedFulfilled, wrappedRejected);

      function wrappedFulfilled(result) {
        resolve(result);
        try {
          /* istanbul ignore else */
          if ( typeof onFulfilled === 'function' ) {
            onFulfilled(result);
          }
        }
        catch (err) { /* no-op */ }
      }

      function wrappedRejected(reason) {
        reject(reason);
        try {
          /* istanbul ignore else */
          if ( typeof onRejected === 'function' ) {
            onRejected(reason);
          }
        }
        catch (err) { /* no-op */ }
      }
    });
  }
}

function decorateExportedFunction(name, deferredGenerator) {
  function resolved(result) {
    return deferredGenerator(function (resolve) {
      resolve(result);
    });
  }

  function rejected(reason) {
    return deferredGenerator(function (resolve, reject) {
      reject(reason);
    });
  }

  deferredGenerator[name] = deferredGenerator;
  deferredGenerator.resolved = resolved;
  deferredGenerator.rejected = rejected;

  return deferredGenerator;
}

exports.decorateInterface = decorateInterface;
exports.decorateExportedFunction = decorateExportedFunction;
