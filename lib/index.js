"use strict";

// Load and decorate the WelshBase constructor
var WelshBase = require('./base');
require('./convert').decoratePrototype(WelshBase.prototype);

// Decorate the Deferred generator functions
var constructor = require('./constructor');
exports.Promise = constructor.decorateConstructor(require('./promise'));
exports.Deferred = constructor.decorateConstructor(require('./deferred'));
