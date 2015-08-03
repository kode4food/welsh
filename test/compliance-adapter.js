"use strict";

var welsh = require('../lib');

module.exports = {
  deferred: function () {
    var promise = new welsh.Promise();
    promise.promise = promise;
    return promise;
  }
};
