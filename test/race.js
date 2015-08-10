/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

describe("Welsh 'race()' Implementation", function () {
  it("should probably work", function (done) {
    var p1_resolve, p1 = new welsh.Promise(function (resolve) { p1_resolve = resolve; });
    var p2_resolve, p2 = new welsh.Promise(function (resolve) { p2_resolve = resolve; });
    var d1_resolve, d1 = new welsh.Deferred(function (resolve) { d1_resolve = resolve; });
    var d2_resolve, d2 = new welsh.Deferred(function (resolve) { d2_resolve = resolve; });

    var race = welsh.Promise.race([p1, p2, d1, d2]);
    race.then(function (result) {
      expect(result).to.equal('d1 resolved');
      done();
    });

    setTimeout(function () { p1_resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2_resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2_resolve('d2 resolved'); }, Math.random() * 99);
    d1_resolve('d1 resolved');
  });

  it("should allow non-promises to kick ass in the race", function (done) {
    var p1_resolve, p1 = new welsh.Promise(function (resolve) { p1_resolve = resolve; });
    var p2_resolve, p2 = new welsh.Promise(function (resolve) { p2_resolve = resolve; });
    var d1_resolve, d1 = new welsh.Deferred(function (resolve) { d1_resolve = resolve; });
    var d2_resolve, d2 = new welsh.Deferred(function (resolve) { d2_resolve = resolve; });

    var race = welsh.Deferred.race([p1, p2, d1, d2, 37]);
    race.then(function (result) {
      expect(result).to.equal(37);
    });

    setTimeout(function () { p1_resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2_resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2_resolve('d2 resolved'); }, Math.random() * 99);
    d1_resolve('d1 resolved');

    setTimeout(done, 120);
  });
});
