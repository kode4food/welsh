/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../lib');

describe("Welsh Conversions", function () {
  it("should allow a Promise to produce a Deferred", function (done) {
    var p = new welsh.Promise();
    var d = p.toDeferred();
    var e = d.then(function (result) {
      expect(result).to.equal('hello');
      done();
    });

    expect(d).to.not.equal(p);
    expect(d).to.equal(e);
    p.resolve('hello');
  });

  it("should allow a Deferred to produce a Promise", function (done) {
    var d = new welsh.Deferred();
    var p = d.toPromise();
    p.then(undefined, function (reason) {
      expect(reason).to.equal('not transformed');
      done();
    });
    d.then(undefined, function (reason) {
      expect(reason).to.equal('not transformed');
      return 'transformed';
    }).then(function (result) {
      expect(result).to.equal('transformed');
    });
    d.reject('not transformed');
  });
});
