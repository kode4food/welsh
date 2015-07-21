/* global describe, it *//* jshint -W030 */

"use strict";

return;

var compliance = require('promises-aplus-tests');
var adapter = require('./compliance-adapter');

describe("Promises/A+ Tests", function () {
  compliance.mocha(adapter);
});
