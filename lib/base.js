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

/* istanbul ignore next */
WelshBase.prototype.then = function (onFulfilled, onRejected) {
  throw new Error("Not Implemented");
};

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
