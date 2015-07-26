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
    return convertUsing(deferred, require('./promise').createWelshPromise);
  }

  function createToDeferred() {
    return convertUsing(deferred, require('./deferred').createWelshDeferred);
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

      if ( !waitingFor ) {
        resolve([]);
        return;
      }

      for ( var i = 0, len = args.length; i < len; i++ ) {
        indexResolver(i, args[i]);
      }

      function indexResolver(index, value) {
        try {
          var then = getThenFunction(value);
          if ( then ) {
            then(wrappedResolve, wrappedReject);
            return;
          }
          args[index] = value;
          if ( !--waitingFor ) {
            resolve(args);
          }
        }
        catch ( err ) {
          /* istanbul ignore next */
          reject(err);
        }

        function wrappedResolve(result) {
          indexResolver(index, result);
          return result;
        }

        function wrappedReject(reason) {
          reject(reason);
          throw reason;
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
