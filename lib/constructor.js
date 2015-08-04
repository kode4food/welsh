/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var getThenFunction = helpers.getThenFunction;
var extractArrayArguments = helpers.extractArrayArguments;

var slice = Array.prototype.slice;

function decorateConstructor(Constructor) {
  Constructor.resolve = createResolve;
  Constructor.reject = createReject;
  Constructor.race = createRace;
  Constructor.all = createAll;
  Constructor.fromNode = createFromNode;
  Constructor.lazy = createLazy;
  return Constructor;

  function createResolve(result) {
    return new Constructor(function (resolve) {
      resolve(result);
    });
  }

  function createReject(reason) {
    return new Constructor(function (resolve, reject) {
      reject(reason);
    });
  }

  function createRace() {
    var args = extractArrayArguments.apply(null, arguments);

    return new Constructor(function (resolve, reject) {
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

    return new Constructor(function (resolve, reject) {
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
      return new Constructor(function (resolve, reject) {
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

    var deferred = new Constructor(function (_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });

    var originalThen = getThenFunction(deferred);
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
}

exports.decorateConstructor = decorateConstructor;
