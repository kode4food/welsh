"use strict";

var welsh = require('../lib/promise');

module.exports = {
  deferred: function () {
    var promise = welsh();
    promise.promise = promise;
    return promise;
  }
};
