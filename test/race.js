/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

function noOp() {}

describe("Welsh 'race()' Implementation", function () {
  it("should probably work", function (done) {
    var p1 = new welsh.Promise(noOp);
    var p2 = new welsh.Promise(noOp);
    var d1 = new welsh.Deferred(noOp);
    var d2 = new welsh.Deferred(noOp);

    var race = welsh.Promise.race([p1, p2, d1, d2]);
    race.then(function (result) {
      expect(result).to.equal('d1 resolved');
      done();
    });

    setTimeout(function () { p1.resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2.resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2.resolve('d2 resolved'); }, Math.random() * 99);
    d1.resolve('d1 resolved');
  });

  it("should allow non-promises to kick ass in the race", function (done) {
    var p1 = new welsh.Promise(noOp);
    var p2 = new welsh.Promise(noOp);
    var d1 = new welsh.Deferred(noOp);
    var d2 = new welsh.Deferred(noOp);

    var race = welsh.Deferred.race([p1, p2, d1, d2, 37]);
    race.then(function (result) {
      expect(result).to.equal(37);
    });

    setTimeout(function () { p1.resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2.resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2.resolve('d2 resolved'); }, Math.random() * 99);
    d1.resolve('d1 resolved');

    setTimeout(done, 120);
  });

  it("should handle empty set", function (done) {
    welsh.Promise.race([]).catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("Array provided to race() is empty");
      done();
    });
  });

  it("should handle garbage", function (done) {
    welsh.Promise.resolve(37).race().catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("Result containing a Collection is required");
      done();
    });
  });
});
