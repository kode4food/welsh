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

    if ( typeof executor !== 'function' ) {
      return new Constructor();
    }

    var deferred = new Constructor(function (_resolve, _reject) {
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

exports.decorateConstructor = decorateConstructor;

},{"./helpers":7}],5:[function(require,module,exports){
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

var WelshPromise = require('./promise');
var WelshDeferred = require('./deferred');

function decoratePrototype(prototype) {
  prototype.toPromise = function () {
    return convertUsing(this, WelshPromise);
  };

  prototype.toDeferred = function () {
    return convertUsing(this, WelshDeferred);
  };
}

function convertUsing(deferred, Constructor) {
  return new Constructor(function (resolve, reject) {
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

exports.decoratePrototype = decoratePrototype;

},{"./deferred":6,"./helpers":7,"./promise":9}],6:[function(require,module,exports){
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

WelshDeferred.prototype = new WelshBase();

function WelshDeferred(executor) {
  var self = this;

  var state, running, pendingResult;
  var pendingHandlers = [];
  var pendingIndex = 0;

  this.then = appendThen;
  this.cancel = cancel;

  if ( typeof executor === 'function' ) {
    try {
      executor(resolve, reject);
    }
    catch ( err ) {
      reject(err);
    }
  }
  else {
    this.resolve = resolve;
    this.reject = reject;
  }

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
    return self;
  }

  function appendThen(onFulfilled, onRejected) {
    pendingHandlers[pendingHandlers.length] = [
      undefined, onFulfilled, onRejected
    ];

    if ( state && !running ) {
      proceed(pendingResult);
    }

    return self;
  }

  function cancel() {
    pendingHandlers = [];
    pendingIndex = 0;
    running = false;
    state = canceledState;
    return self;
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

module.exports = WelshDeferred;

},{"./base":3,"./helpers":7}],7:[function(require,module,exports){
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
require('./convert').decoratePrototype(WelshBase.prototype);

// Decorate the Deferred generator functions
var constructor = require('./constructor');
exports.Promise = constructor.decorateConstructor(require('./promise'));
exports.Deferred = constructor.decorateConstructor(require('./deferred'));

},{"./base":3,"./constructor":4,"./convert":5,"./deferred":6,"./promise":9}],9:[function(require,module,exports){
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

WelshPromise.prototype = new WelshBase();

function WelshPromise(executor) {
  var state, settledResult, branched, pendingHandlers;
  var self = this;

  this.then = createThen;

  if ( typeof executor === 'function' ) {
    doResolve(executor);
  }
  else {
    this.resolve = resolve;
    this.reject = reject;
  }

  function resolve(result) {
    if ( state ) {
      return;
    }
    if ( self === result ) {
      reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
      return;
    }
    try {
      var then = getThenFunction(result);
      if ( then ) {
        doResolve(then);
        return;
      }
      state = fulfilledState;
      settledResult = result;
      queueCall(notifyPending);
    }
    catch ( err ) {
      reject(err);
    }
  }

  function reject(reason) {
    if ( state ) {
      return;
    }
    state = rejectedState;
    settledResult = reason;
    queueCall(notifyPending);
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
    return new WelshPromise(thenResolver);

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
    if ( state ) {
      queueCall(function () {
        (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
      });
      return;
    }

    var item = [undefined, onFulfilled, onRejected];
    if ( !pendingHandlers ) {
      pendingHandlers = item;
      return;
    }

    if ( !branched ) {
      pendingHandlers = [pendingHandlers, item];
      branched = true;
      return;
    }

    pendingHandlers[pendingHandlers.length] = item;
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

module.exports = WelshPromise;

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
