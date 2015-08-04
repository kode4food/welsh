/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

describe("Welsh 'all()' Implementation", function () {
  it("should support args with promises and deferreds", function (done) {
    var p1_resolve, p1 = new welsh.Promise(function (resolve) { p1_resolve = resolve; });
    var p2_resolve, p2 = new welsh.Promise(function (resolve) { p2_resolve = resolve; });
    var d1_resolve, d1 = new welsh.Deferred(function (resolve) { d1_resolve = resolve; });
    var d2_resolve, d2 = new welsh.Deferred(function (resolve) { d2_resolve = resolve; });

    d2.then(function (result) {
      return result + ' modified';
    });

    var all = welsh.Promise.all('hello', p1, p2, d1, d2, 37);
    all.then(function (arr) {
      expect(arr.length).to.equal(6);
      expect(arr[0]).to.equal('hello');
      expect(arr[1]).to.equal('p1 resolved');
      expect(arr[2]).to.equal('p2 resolved');
      expect(arr[3]).to.equal('d1 resolved');
      expect(arr[4]).to.equal('d2 resolved modified');
      expect(arr[5]).to.equal(37);
      done();
    });

    setTimeout(function () { p1_resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2_resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d1_resolve('d1 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2_resolve('d2 resolved'); }, Math.random() * 99);
  });

  it("should support array with promises and deferreds", function (done) {
    var p1_resolve, p1 = new welsh.Promise(function (resolve) { p1_resolve = resolve; });
    var p2_resolve, p2 = new welsh.Promise(function (resolve) { p2_resolve = resolve; });
    var d1_resolve, d1 = new welsh.Deferred(function (resolve) { d1_resolve = resolve; });
    var d2_resolve, d2 = new welsh.Deferred(function (resolve) { d2_resolve = resolve; });
    d2.then(function (result) {
      return result + ' modified';
    });

    var all = welsh.Promise.all(['hello', p1, p2, d1, d2, 37]);
    all.then(function (arr) {
      expect(arr.length).to.equal(6);
      expect(arr[0]).to.equal('hello');
      expect(arr[1]).to.equal('p1 resolved');
      expect(arr[2]).to.equal('p2 resolved');
      expect(arr[3]).to.equal('d1 resolved');
      expect(arr[4]).to.equal('d2 resolved modified');
      expect(arr[5]).to.equal(37);
      done();
    });

    setTimeout(function () { p1_resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2_resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d1_resolve('d1 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2_resolve('d2 resolved'); }, Math.random() * 99);
  });

  it("should short-circuit on any rejection", function (done) {
    var p1_resolve, p1 = new welsh.Promise(function (resolve) { p1_resolve = resolve; });
    var p2_resolve, p2 = new welsh.Promise(function (resolve) { p2_resolve = resolve; });
    var d1_reject, d1 = new welsh.Deferred(function (resolve, reject) { d1_reject = reject; });
    var d2_resolve, d2 = new welsh.Deferred(function (resolve) { d2_resolve = resolve; });
    d2.then(function (result) {
      return result + ' modified';
    });

    var all = welsh.Promise.all(['hello', p1, p2, d1, d2, 37]);
    all.then(undefined, function (reason) {
      expect(reason).to.equal('d1 rejected');
      done();
    });

    setTimeout(function () { p1_resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { p2_resolve('p2 resolved'); }, Math.random() * 99);
    setTimeout(function () { d1_reject('d1 rejected'); }, Math.random() * 99);
    setTimeout(function () { d2_resolve('d2 resolved'); }, Math.random() * 99);
  });

  it("should handle empty set", function (done) {
    var all = welsh.Promise.all([]);
    all.then(function (result) {
      expect(result).is.array;
      expect(result).length.is(0);
      done();
    });
  });
});
