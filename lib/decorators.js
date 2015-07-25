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
var getThenFunction = helpers.getThenFunction;

var slice = Array.prototype.slice;

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

  function createAll() {
    var args;
    if ( arguments.length === 1 && isArray(arguments[0]) ) {
      args = slice.call(arguments[0]);
    }
    else {
      args = slice.call(arguments);
    }

    return deferredGenerator(function (resolve, reject) {
      var waitingFor = args.length;

      if ( !waitingFor ) {
        resolve([]);
        return;
      }

      for ( var i = 0; i < waitingFor; i++ ) {
        indexResolver(i, args[i]);
      }

      function indexResolver(index, value) {
        try {
          var then = getThenFunction(value);
          if ( then ) {
            then(function (result) { indexResolver(index, result) }, reject);
            return;
          }
          args[index] = value;
          if ( --waitingFor ) {
            resolve(args);
          }
        }
        catch ( err ) {
          reject(err);
        }
      }
    });
  }

  deferredGenerator[name] = deferredGenerator;
  deferredGenerator.resolve = createResolved;
  deferredGenerator.reject = createRejected;
  deferredGenerator.race = createRace;
  deferredGenerator.all = createAll;

  return deferredGenerator;
}

exports.decorateInterface = decorateInterface;
exports.decorateExportedFunction = decorateExportedFunction;
