/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../lib');

describe("Welsh 'race()' Implementation", function () {
  it("should probably work", function (done) {
    var p1 = new welsh.Promise();
    var p2 = new welsh.Promise();
    var d1 = new welsh.Deferred();
    var d2 = new welsh.Deferred();

    var race = welsh.Promise.race(p1, p2, d1, d2);
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
    var p1 = new welsh.Promise();
    var p2 = new welsh.Promise();
    var d1 = new welsh.Deferred();
    var d2 = new welsh.Deferred();

    var race = welsh.Deferred.race(p1, p2, d1, d2, 37);
    race.then(function (result) {
      expect(result).to.equal(37);
    });

    setTimeout(function () { p1.resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2.resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2.resolve('d2 resolved'); }, Math.random() * 99);
    d1.resolve('d1 resolved');

    setTimeout(done, 120);
  });
});
