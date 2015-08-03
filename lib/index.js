"use strict";

// Decorate the WelshBase prototype
require('./convert');

var WelshPromise = require('./promise');
var WelshDeferred = require('./deferred');

// Decorate the Deferred generator functions
var constructor = require('./constructor');
exports.Promise = constructor.decorateConstructor(WelshPromise);
exports.Deferred = constructor.decorateConstructor(WelshDeferred);
