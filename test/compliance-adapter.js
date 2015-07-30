"use strict";

var welsh = require('../lib');

module.exports = {
  deferred: function () {
    var promise = welsh.promise();
    promise.promise = promise;
    return promise;
  }
};
