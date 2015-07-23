/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

function decorateInterface(promise) {
  promise.catch = createCatch;
  promise.done = createDone;
  return promise;

  function createCatch(onRejected) {
    return promise.then(undefined, onRejected);
  }

  function createDone(onFulfilled, onRejected) {
    return promise.then(wrappedFulfilled, wrappedRejected);

    function wrappedFulfilled(result) {
      try {
        /* istanbul ignore else */
        if ( typeof onFulfilled === 'function' ) {
          onFulfilled(result);
        }
      } catch ( err ) {
        /* no-op */
      }
      return result;
    }

    function wrappedRejected(reason) {
      try {
        /* istanbul ignore else */
        if ( typeof onRejected === 'function' ) {
          onRejected(reason);
        }
      } catch ( err ) {
        /* no-op */
      }
      throw reason;
    }
  }
}

function createCommonExports(name, generatorFunc) {
  function resolved(result) {
    return generatorFunc(function (resolve) {
      resolve(result);
    });
  }

  function rejected(reason) {
    return generatorFunc(function (resolve, reject) {
      reject(reason);
    });
  }

  generatorFunc[name] = generatorFunc;
  generatorFunc.resolved = resolved;
  generatorFunc.rejected = rejected;

  return generatorFunc;
}

exports.decorateInterface = decorateInterface;
exports.createCommonExports = createCommonExports;
