"use strict";

// Load and decorate the WelshBase constructor
var WelshBase = require('./base');
require('./convert').decoratePrototype(WelshBase.prototype);

// Decorate the Deferred generator functions
var constructor = require('./constructor');
var Promise = constructor.decorateConstructor(require('./promise'));
var Deferred = constructor.decorateConstructor(require('./deferred'));

// Export Stuff
exports.Promise = Promise;
exports.Deferred = Deferred;

exports.promise = function (executor) {
  return new Promise(executor);
};

exports.deferred = function (executor) {
  return new Deferred(executor);
};
