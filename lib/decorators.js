/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var tryCatch = helpers.tryCatch;

function decorateInterface(deferred) {
  deferred['catch'] = createCatch;
  deferred['finally'] = createFinally;
  deferred.toNode = createToNode;
  return deferred;

  function createCatch(onRejected) {
    return deferred.then(undefined, onRejected);
  }

  function createToNode(callback) {
    return deferred.then(wrappedFulfilled, wrappedRejected);

    function wrappedFulfilled(result) {
      try {
        callback(null, result);
      }
      finally {
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
    return deferred.then(wrappedFulfilled, wrappedRejected);

    function wrappedFulfilled(result) {
      tryCatch(onFinally);
      return result;
    }

    function wrappedRejected(reason) {
      tryCatch(onFinally);
      throw reason;
    }
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

  function createRace(values) {
    return deferredGenerator(function (resolve, reject) {
      for ( var i = 0, len = values.length; i < len; i++ ) {
        values[i].then(resolve, reject);
      }
    });
  }

  deferredGenerator[name] = deferredGenerator;
  deferredGenerator.resolve = createResolved;
  deferredGenerator.reject = createRejected;
  deferredGenerator.race = createRace;

  return deferredGenerator;
}

exports.decorateInterface = decorateInterface;
exports.decorateExportedFunction = decorateExportedFunction;
