"use strict";
var decorated = require('./decorated');
exports.promise = decorated.createDecoratedPromise;
exports.deferred = decorated.createDecoratedDeferred;
