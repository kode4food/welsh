(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
"use strict";
window.welsh = require('./index');

},{"./index":2}],2:[function(require,module,exports){
"use strict";
module.exports = require('./lib');


},{"./lib":8}],3:[function(require,module,exports){
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

function WelshBase() {}

WelshBase.prototype['catch'] = function (onRejected) {
  return this.then(undefined, onRejected);
};

WelshBase.prototype['finally'] = function (onFinally) {
  return this.then(wrappedFulfilled, wrappedRejected);

  function wrappedFulfilled(result) {
    tryCatch(onFinally);
    return result;
  }

  function wrappedRejected(reason) {
    tryCatch(onFinally);
    throw reason;
  }
};

WelshBase.prototype.toNode = function (callback) {
  return this.then(wrappedFulfilled, wrappedRejected);

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
};

module.exports = WelshBase;

},{"./helpers":7}],4:[function(require,module,exports){
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

var createWelshPromise = require('./promise');
var createWelshDeferred = require('./deferred');

function decorateWelshBase(WelshBase) {
  WelshBase.prototype.toPromise = function () {
    return convertUsing(this, createWelshPromise);
  };

  WelshBase.prototype.toDeferred = function () {
    return convertUsing(this, createWelshDeferred);
  };
}

function convertUsing(deferred, generator) {
  return generator(function (resolve, reject) {
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

exports.decorateWelshBase = decorateWelshBase;

},{"./deferred":5,"./helpers":7,"./promise":9}],5:[function(require,module,exports){
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

var WelshBase = require('./base');

var fulfilledState = 1;
var rejectedState = 2;
var canceledState = 3;

function createWelshDeferred(executor) {
  var state, running, pendingResult;
  var pendingHandlers = [];
  var pendingIndex = 0;

  var welshInterface = new WelshBase();
  welshInterface.then = appendThen;
  welshInterface.cancel = cancel;

  if ( typeof executor === 'function' ) {
    try {
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  else {
    welshInterface.resolve = resolve;
    welshInterface.reject = reject;
  }

  return welshInterface;

  function resolve(result) {
    return start(fulfilledState, result);
  }

  function reject(reason) {
    return start(rejectedState, reason);
  }

  function start(newState, result) {
    if ( state ) {
      return;
    }
    state = newState;
    proceed(result);
    return welshInterface;
  }

  function appendThen(onFulfilled, onRejected) {
    pendingHandlers[pendingHandlers.length] = [
      undefined, onFulfilled, onRejected
    ];

    if ( state && !running ) {
      proceed(pendingResult);
    }

    return welshInterface;
  }

  function cancel() {
    pendingHandlers = [];
    pendingIndex = 0;
    running = false;
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

      if ( pendingIndex >= pendingHandlers.length ) {
        break;
      }

      var callback = pendingHandlers[pendingIndex++][state];
      if ( typeof callback === 'function' ) {
        try {
          result = callback(result);
          state = fulfilledState;
        }
        catch ( reason ) {
          result = reason;
          state = rejectedState;
        }
      }
    }
    while ( true );
    pendingResult = result;
    pendingHandlers = [];
    pendingIndex = 0;
    running = false;
  }

  function fulfilledLinker(result) {
    state = fulfilledState;
    proceed(result);
    return result;
  }

  function rejectedLinker(reason) {
    state = rejectedState;
    proceed(reason);
    throw reason;
  }
}

module.exports = createWelshDeferred;

},{"./base":3,"./helpers":7}],6:[function(require,module,exports){
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

function decorateGenerator(deferredGenerator) {
  deferredGenerator.resolve = createResolve;
  deferredGenerator.reject = createReject;
  deferredGenerator.race = createRace;
  deferredGenerator.all = createAll;
  deferredGenerator.fromNode = createFromNode;
  deferredGenerator.lazy = createLazy;
  return deferredGenerator;

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
    var resolve, reject, called;

    if ( typeof executor !== 'function' ) {
      return deferredGenerator();
    }

    var deferred = deferredGenerator(function (_resolve, _reject) {
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
}

exports.decorateGenerator = decorateGenerator;

},{"./helpers":7}],7:[function(require,module,exports){
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
exports.getThenFunction = getThenFunction;
exports.tryCatch = tryCatch;
exports.extractArrayArguments = extractArrayArguments;

},{}],8:[function(require,module,exports){
"use strict";

// Load and decorate the WelshBase constructor
var WelshBase = require('./base');
require('./convert').decorateWelshBase(WelshBase);

// Decorate the Deferred generator functions
var generator = require('./generator');
exports.promise = generator.decorateGenerator(require('./promise'));
exports.deferred = generator.decorateGenerator(require('./deferred'));

},{"./base":3,"./convert":4,"./deferred":5,"./generator":6,"./promise":9}],9:[function(require,module,exports){
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

var queue = require('./queue');
var queueCall = queue.queueCall;

var WelshBase = require('./base');

var fulfilledState = 1;
var rejectedState = 2;

function createWelshPromise(executor) {
  var state, settledResult, branched, pendingHandlers;

  var welshInterface = new WelshBase();
  welshInterface.then = createThen;

  if ( typeof executor === 'function' ) {
    doResolve(executor);
  }
  else {
    welshInterface.resolve = resolve;
    welshInterface.reject = reject;
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
    return createWelshPromise(thenResolver);

    function thenResolver(resolve, reject) {
      addPending(typeof onFulfilled === 'function' ? fulfilledHandler : resolve,
                 typeof onRejected === 'function' ? rejectedHandler : reject);

      function fulfilledHandler(result) {
        try {
          resolve(onFulfilled(result));
        }
        catch ( err ) {
          reject(err);
        }
      }

      function rejectedHandler(reason) {
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
      var item = [undefined, onFulfilled, onRejected];

      if ( !pendingHandlers ) {
        pendingHandlers = item;
      }
      else if ( branched ) {
        pendingHandlers[pendingHandlers.length] = item;
      }
      else {
        pendingHandlers = [pendingHandlers, item];
        branched = true;
      }
      return;
    }
    queueCall(function () {
      (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
    });
  }

  function notifyPending() {
    if ( !pendingHandlers ) {
      return;
    }
    if ( branched ) {
      for ( var i = 0, len = pendingHandlers.length; i < len; i++ ) {
        pendingHandlers[i][state](settledResult);
      }
    }
    else {
      pendingHandlers[state](settledResult);
    }
    pendingHandlers = null;
    branched = false;
  }
}

module.exports = createWelshPromise;

},{"./base":3,"./helpers":7,"./queue":10}],10:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var queue = [];

/* istanbul ignore next */
var nextTick = (function () {
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

function queueCall(callback) {
  if ( !queue.length ) {
    nextTick(performCalls);
  }
  queue[queue.length] = callback;
}

function performCalls() {
  for ( var i = 0; i < queue.length; i++ ) {
    queue[i]();
  }
  queue = [];
}

exports.queueCall = queueCall;

},{}]},{},[1]);
