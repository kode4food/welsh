/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../index');

describe("Lazy Executors", function () {
  it("should probably work", function (done) {
    var mutated = false;

    var p = welsh.promise.lazy(function (resolve) {
      expect(mutated).to.be.false;
      setTimeout(function () {
        mutated = true;
        resolve();
      }, 50);
    });

    expect(mutated).to.be.false;
    setTimeout(function () {
      expect(mutated).to.be.false;
      p.then(); // this wakes it up
      setTimeout(function () {
        expect(mutated).to.be.true;
        done();
      }, 100);
    }, 10);
  });
});
