"use strict";

var createWelshPromise = require('../lib/promise');

module.exports = {
  deferred: function () {
    var promise = createWelshPromise();
    promise.promise = promise;
    return promise;
  }
};
