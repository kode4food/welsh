"use strict";

var welsh = require('../lib');

module.exports = {
  deferred: function () {
    var resolve, reject;
    var promise = new welsh.Promise(function (_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });
    promise.resolve = resolve;
    promise.reject = reject;
    promise.promise = promise;
    return promise;
  }
};
