/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

function noOp() {}

describe("Welsh 'some()' Implementation", function () {
  it("should support args with promises and deferreds", function (done) {
    var p1 = new welsh.Promise(noOp);
    var p2 = new welsh.Promise(noOp);
    var d1 = welsh.Deferred.reject("d1 immediately rejected");
    var d2 = new welsh.Deferred(noOp);

    d2.then(function (result) {
      return result + ' modified';
    });

    var some = welsh.Promise.some(['hello', p1, p2, d1, d2, 37], 4);
    some.then(function (arr) {
      expect(arr.length).to.equal(4);
      expect(arr).to.contain('hello');
      expect(arr).to.contain(37);
      expect(arr).to.contain('p1 resolved');
      expect(arr).to.contain('d2 resolved modified');
      done();
    });

    setTimeout(function () { p1.resolve('p1 resolved'); }, Math.random() * 99);
    setTimeout(function () { d2.resolve('d2 resolved'); }, Math.random() * 99);
  });

  it("should explode if we expect too much", function (done) {
    var some = welsh.Promise.some(['hello', 37], 4);
    some.catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("4 Result(s) can never be fulfilled");
      done();
    });
  });

  it("should explode if we give it a bad numeric count", function (done) {
    welsh.Promise.some([], -1).catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("Can't wait for -1 Results");
      done();
    });
  });

  it("should explode if we give it a bad count", function (done) {
    welsh.Promise.some([], 'boom').catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("Can't wait for boom Results");
      done();
    });
  });

  it("should give us nothing if we expect nothing", function (done) {
    welsh.Promise.some([37, 'hello', 'what?'], 0).then(function (arr) {
      expect(arr.length).to.equal(0);
      done();
    });
  });

  it("should explode with an empty set", function (done) {
    welsh.Promise.some([], 1).catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("1 Result(s) can never be fulfilled");
      done();
    });
  });

  it("should handle garbage", function (done) {
    welsh.Promise.resolve(37).some().catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("Result containing a Collection is required");
      done();
    });
  });

  it("should deal properly with rejection", function (done) {
    var p1 = new welsh.Promise(noOp);
    var p2 = new welsh.Promise(noOp);
    var d1 = new welsh.Deferred(noOp);
    var d2 = welsh.Deferred.reject('d2 rejected');

    var some = welsh.Promise.some(['hello', p1, p2, d1, d2, 37], 5);
    some.catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("3 Result(s) can never be fulfilled");
      done();
    });

    /* istanbul ignore next */
    function rejectP1() { p1.reject('p1 rejected'); }
    /* istanbul ignore next */
    function rejectP2() { p2.reject('p2 rejected'); }

    setTimeout(rejectP1, Math.random() * 99);
    setTimeout(rejectP2, Math.random() * 99);
  });
});
