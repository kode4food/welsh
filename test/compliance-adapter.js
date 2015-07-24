"use strict";

var welshPromise = require('../lib/promise');

module.exports = {
  deferred: function () {
    var promise = welshPromise.createWelshPromise();
    promise.promise = promise;
    return promise;
  }
};
