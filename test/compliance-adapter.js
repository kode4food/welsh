"use strict";

var welsh = require('../dist');

module.exports = {
  deferred: function () {
    var result = {};
    result.promise = new welsh.Promise(function (resolve, reject) {
      result.resolve = resolve;
      result.reject = reject;
    });
    return result;
  }
};
