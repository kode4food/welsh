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
var extractArrayArguments = helpers.extractArrayArguments;

var slice = Array.prototype.slice;

var createWelshPromise, createWelshDeferred;

function decorateInterface(deferred) {
  deferred['catch'] = createCatch;
  deferred['finally'] = createFinally;
  deferred.toNode = createToNode;
  deferred.toPromise = createToPromise;
  deferred.toDeferred = createToDeferred;
  return deferred;

  function createCatch(onRejected) {
    return deferred.then(undefined, onRejected);
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

  function createToPromise() {
    /* istanbul ignore else */
    if ( !createWelshPromise ) {
      createWelshPromise = require('./promise').createWelshPromise;
    }
    return convertUsing(deferred, createWelshPromise);
  }

  function createToDeferred() {
    /* istanbul ignore else */
    if ( !createWelshDeferred ) {
      createWelshDeferred = require('./deferred').createWelshDeferred;
    }
    return convertUsing(deferred, createWelshDeferred);
  }
}

function convertUsing(deferred, deferredGenerator) {
  return deferredGenerator(function (resolve, reject) {
    var then = getThenFunction(deferred);
    then(wrappedResolve, wrappedReject);

    function wrappedResolve(result) {
      resolve(result);
      return result;
    }

    function wrappedReject(reason) {
      reject(reason);
      throw reason;
    }
  });
}

function decorateExportedFunction(name, deferredGenerator) {
  function createResolve(result) {
    return deferredGenerator(function (resolve) {
      resolve(result);
    });
  }

  function createReject(reason) {
    return deferredGenerator(function (resolve, reject) {
      reject(reason);
    });
  }

  function createRace() {
    var args = extractArrayArguments.apply(null, arguments);

    return deferredGenerator(function (resolve, reject) {
      try {
        for ( var i = 0, len = args.length; i < len; i++ ) {
          var value = args[i];
          var then = getThenFunction(value);
          if ( then ) {
            then(resolve, reject);
            continue;
          }
          resolve(value);
        }
      }
      catch ( err ) {
        /* istanbul ignore next */
        reject(err);
      }
    });
  }

  function createAll() {
    var args = extractArrayArguments.apply(null, arguments);

    return deferredGenerator(function (resolve, reject) {
      var waitingFor = args.length;

      for ( var i = 0, len = waitingFor; i < len; i++ ) {
        var then = getThenFunction(args[i]);
        if ( then ) {
          resolveThenAtIndex(then, i);
          continue;
        }
        waitingFor--;
      }

      if ( !waitingFor ) {
        resolve(args);
      }

      function resolveThenAtIndex(then, index) {
        then(wrappedResolve, wrappedReject);

        function wrappedResolve(result) {
          args[index] = result;
          if ( !--waitingFor ) {
            resolve(args);
          }
          return result;
        }

        function wrappedReject(reason) {
          reject(reason);
          throw reason;
        }
      }
    });
  }

  function createFromNode(nodeFunction) {
    return nodeWrapper;

    function nodeWrapper() {
      var wrapperArguments = arguments;
      return deferredGenerator(function (resolve, reject) {
        nodeFunction.apply(null, slice.call(wrapperArguments).concat(callback));

        function callback(err) {
          if ( err ) {
            reject(err);
            return;
          }
          resolve(slice.call(arguments, 1));
        }
      });
    }
  }

  function createLazy(executor) {
    var resolve, reject;

    var deferred = deferredGenerator(function (_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });

    var then = deferred.then;
    deferred.then = function (onFulfilled, onRejected) {
      if ( typeof executor === 'function' ) {
        executor(resolve, reject);
        executor = null;
      }
      return then(onFulfilled, onRejected);
    };

    return deferred;
  }

  deferredGenerator.resolve = createResolve;
  deferredGenerator.reject = createReject;
  deferredGenerator.race = createRace;
  deferredGenerator.all = createAll;
  deferredGenerator.fromNode = createFromNode;
  deferredGenerator.lazy = createLazy;

  return deferredGenerator;
}

exports.decorateInterface = decorateInterface;
exports.decorateExportedFunction = decorateExportedFunction;
