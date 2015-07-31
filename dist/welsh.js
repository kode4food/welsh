(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
"use strict";
window.welsh = require('./index');

},{"./index":2}],2:[function(require,module,exports){
"use strict";
module.exports = require('./lib');


},{"./lib":6}],3:[function(require,module,exports){
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

},{"./deferred":4,"./helpers":5,"./promise":7}],4:[function(require,module,exports){
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

var fulfilledState = 1;
var rejectedState = 2;
var canceledState = 3;

function createWelshDeferred(executor /*, createDeferred */) {
  var welshInterface, state, head, tail, pendingResult, running;

  if ( typeof executor === 'function' ) {
    try {
      welshInterface = {
        then: appendThen,
        cancel: cancel
      };
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  else {
    welshInterface = {
      resolve: resolve,
      reject: reject,
      then: appendThen,
      cancel: cancel
    };
  }

  return welshInterface;

  function start(newState, result) {
    if ( state ) {
      return;
    }
    state = newState;
    queueResult(result);
    return welshInterface;
  }

  function resolve(result) {
    return start(fulfilledState, result);
  }

  function reject(reason) {
    return start(rejectedState, reason);
  }

  function queueResult(result) {
    if ( head ) {
      proceed(result);
    }
    else {
      pendingResult = result;
      running = false;
    }
  }

  function appendThen(onFulfilled, onRejected) {
    if ( typeof onFulfilled !== 'function' ) {
      onFulfilled = undefined;
    }
    if ( typeof onRejected !== 'function' ) {
      onRejected = undefined;
    }

    var item = { 1: onFulfilled, 2: onRejected };
    if ( !tail ) {
      head = tail = item;
    }
    else {
      tail = tail.next = item;
    }

    if ( state && !running ) {
      proceed(pendingResult);
    }

    return welshInterface;
  }

  function cancel() {
    head = null;
    state = canceledState;
    return welshInterface;
  }

  function proceed(result) {
    running = true;
    do {
      var then = getThenFunction(result);
      if ( then ) {
        then(fulfilledLinker, rejectedLinker);
        return;
      }

      var callback = head[state];
      head = head.next || (tail = null);
      if ( !callback ) {
        continue;
      }

      try {
        result = callback(result);
        state = fulfilledState;
      }
      catch ( reason ) {
        result = reason;
        state = rejectedState;
      }
    }
    while ( head );
    pendingResult = result;
    running = false;
  }

  function fulfilledLinker(result) {
    state = fulfilledState;
    queueResult(result);
    return result;
  }

  function rejectedLinker(reason) {
    state = rejectedState;
    queueResult(reason);
    throw reason;
  }
}

module.exports = createWelshDeferred;

},{"./helpers":5}],5:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var slice = Array.prototype.slice;

/* istanbul ignore next */
var isArray = (function () {
  if ( Array.isArray ) {
    return Array.isArray;
  }
  var toString = Object.prototype.toString;
  return function _isArray(obj) {
    return obj && toString.call(obj) === '[object Array]';
  };
}());

/* istanbul ignore next */
var queueCall = (function () {
  if ( typeof setImmediate === 'function' ) {
    return setImmediate;
  }
  if ( typeof window === 'object' &&
       typeof window.requestAnimationFrame === 'function' ) {
    return window.requestAnimationFrame;
  }
  if ( typeof setTimeout === 'function' ) {
    return setTimeout;
  }
  throw new Error("And I should schedule Promises how?");
}());

/* istanbul ignore next */
var bindThis = (function () {
  if ( Function.prototype.bind ) {
    return function (func, thisVal) {
      return func.bind(thisVal);
    };
  }

  return function (func, thisVal) {
    return function() {
      return func.apply(thisVal, arguments);
    };
  };
}());

function getThenFunction(value) {
  if ( !value ) {
    return null;
  }
  var valueType = typeof value;
  if ( valueType !== 'object' && valueType !== 'function' ) {
    return null;
  }
  var then = value.then;
  if ( typeof then !== 'function' ) {
    return null;
  }
  return bindThis(then, value);
}

function tryCatch(tryBlock, catchBlock) {
  if ( typeof tryBlock !== 'function' ) {
    return;
  }
  try {
    return tryBlock();
  }
  catch ( err ) {
    if ( typeof catchBlock === 'function' ) {
      return catchBlock(err);
    }
  }
}

function extractArrayArguments() {
  if ( arguments.length === 1 && isArray(arguments[0]) ) {
    return slice.call(arguments[0]);
  }
  else {
    return slice.call(arguments);
  }
}

exports.isArray = isArray;
exports.queueCall = queueCall;
exports.getThenFunction = getThenFunction;
exports.tryCatch = tryCatch;
exports.extractArrayArguments = extractArrayArguments;

},{}],6:[function(require,module,exports){
"use strict";
var decorated = require('./decorated');
exports.promise = decorated.createDecoratedPromise;
exports.deferred = decorated.createDecoratedDeferred;

},{"./decorated":3}],7:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var queueCall = helpers.queueCall;
var getThenFunction = helpers.getThenFunction;

var fulfilledState = 1;
var rejectedState = 2;

function createWelshPromise(executor, createPromise) {
  var welshInterface, state, settledResult, head, tail;

  if ( typeof executor === 'function' ) {
    welshInterface = {
      then: createThen
    };
    doResolve(executor);
  }
  else {
    welshInterface = {
      resolve: resolve,
      reject: reject,
      then: createThen
    };
  }

  return welshInterface;

  function resolve(result) {
    if ( state ) {
      return welshInterface;
    }
    if ( welshInterface === result ) {
      reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
      return welshInterface;
    }
    try {
      var then = getThenFunction(result);
      if ( then ) {
        doResolve(then);
        return welshInterface;
      }
      state = fulfilledState;
      settledResult = result;
      queueCall(notifyPending);
    }
    catch ( err ) {
      reject(err);
    }
    return welshInterface;
  }

  function reject(reason) {
    if ( state ) {
      return welshInterface;
    }
    state = rejectedState;
    settledResult = reason;
    queueCall(notifyPending);
    return welshInterface;
  }

  function doResolve(executor) {
    var done;
    try {
      executor(wrappedResolve, wrappedReject);
    }
    catch ( err ) {
      if ( done ) { return; }
      reject(err);
    }

    function wrappedResolve(result) {
      if ( done ) { return; }
      done = true;
      resolve(result);
    }

    function wrappedReject(reason) {
      if ( done ) { return; }
      done = true;
      reject(reason);
    }
  }

  function createThen(onFulfilled, onRejected) {
    return createPromise(thenResolver);

    function thenResolver(resolve, reject) {
      addPending(fulfilledHandler, rejectedHandler);

      function fulfilledHandler(result) {
        if ( typeof onFulfilled !== 'function' ) {
          resolve(result);
          return;
        }
        try {
          resolve(onFulfilled(result));
        }
        catch ( err ) {
          reject(err);
        }
      }

      function rejectedHandler(reason) {
        if ( typeof onRejected !== 'function' ) {
          reject(reason);
          return;
        }
        try {
          resolve(onRejected(reason));
        }
        catch ( err ) {
          reject(err);
        }
      }
    }
  }

  function addPending(onFulfilled, onRejected) {
    if ( !state ) {
      var item = { 1: onFulfilled, 2: onRejected };
      if ( !tail ) {
        head = tail = item;
      }
      else {
        tail = tail.next = item;
      }
      return;
    }
    queueCall(function () {
      (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
    });
  }

  function notifyPending() {
    while ( head ) {
      head[state](settledResult);
      head = head.next || (tail = null);
    }
  }
}

module.exports = createWelshPromise;

},{"./helpers":5}]},{},[1]);
