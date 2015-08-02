"use strict";

// Load and decorate the WelshBase constructor
var WelshBase = require('./base');
require('./convert').decorateWelshBase(WelshBase);

// Decorate the Deferred generator functions
var generator = require('./generator');
exports.promise = generator.decorateGenerator(require('./promise'));
exports.deferred = generator.decorateGenerator(require('./deferred'));
