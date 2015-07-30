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

var createDecoratedPromise = decorateGenerator(require('./promise'));
var createDecoratedDeferred = decorateGenerator(require('./deferred'));

function decorateGenerator(deferredGenerator) {
  decoratedGenerator.resolve = createResolve;
  decoratedGenerator.reject = createReject;
  decoratedGenerator.race = createRace;
  decoratedGenerator.all = createAll;
  decoratedGenerator.fromNode = createFromNode;
  decoratedGenerator.lazy = createLazy;
  return decoratedGenerator;

  function decoratedGenerator(executor) {
    var deferred = deferredGenerator(executor, decoratedGenerator);
    return decorateDeferred(deferred);
  }

  function createResolve(result) {
    return decoratedGenerator(function (resolve) {
      resolve(result);
    });
  }

  function createReject(reason) {
    return decoratedGenerator(function (resolve, reject) {
      reject(reason);
    });
  }

  function createRace() {
    var args = extractArrayArguments.apply(null, arguments);

    return decoratedGenerator(function (resolve, reject) {
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

    return decoratedGenerator(function (resolve, reject) {
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
      return decoratedGenerator(function (resolve, reject) {
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
    var resolve, reject, called;

    if ( typeof executor !== 'function' ) {
      return decoratedGenerator();
    }

    var deferred = decoratedGenerator(function (_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });

    var originalThen = deferred.then;
    deferred.then = function (onFulfilled, onRejected) {
      if ( !called ) {
        deferred.then = originalThen;
        called = true;
        executor(resolve, reject);
      }
      return originalThen(onFulfilled, onRejected);
    };

    return deferred;
  }

  function decorateDeferred(deferred) {
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
      return convertUsing(deferred, createDecoratedPromise);
    }

    function createToDeferred() {
      return convertUsing(deferred, createDecoratedDeferred);
    }
  }

  function convertUsing(deferred, decoratedGenerator) {
    return decoratedGenerator(function (resolve, reject) {
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
}

exports.createDecoratedPromise = createDecoratedPromise;
exports.createDecoratedDeferred = createDecoratedDeferred;
