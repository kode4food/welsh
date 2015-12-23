/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist');

function noOp() {}

describe("Welsh 'any()' Implementation", function () {
  it("should probably work", function (done) {
    var p1 = new welsh.Promise(noOp);
    var p2 = new welsh.Promise(noOp);
    var d1 = new welsh.Deferred(noOp);
    var d2 = new welsh.Deferred(noOp);

    d2.then(function (result) {
      return result + ' modified';
    });

    var any = welsh.Promise.any([p1, p2, d1, d2]);
    any.then(function (result) {
      expect(result).to.contain('d2 resolved modified');
      done();
    });

    setTimeout(function () { d2.resolve('d2 resolved'); }, Math.random() * 99);
  });

  it("should explode with an empty set", function (done) {
    welsh.Promise.any([]).catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("1 Result(s) can never be fulfilled");
      done();
    });
  });

  it("should handle garbage", function (done) {
    welsh.Promise.resolve(37).any().catch(function (reason) {
      expect(reason).to.be.an('Error');
      expect(reason.message).to.equal("Result containing a Collection is required");
      done();
    });
  });
});
