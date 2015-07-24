/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var helpers = require('../lib/helpers');

describe("Welsh Helper tryCatch", function () {
  it("should allow Try block", function (done) {
    expect(function () {
      helpers.tryCatch();
    }).to.not.throw();
    done();
  });

  it("should allow no Catch block", function (done) {
    expect(function () {
      helpers.tryCatch(function () {
        throw "BOOM!";
      });
    }).to.not.throw();
    done();
  });

  it("should allow Catch blocks", function (done) {
    helpers.tryCatch(function () {
      throw "hello";
    }, function (err) {
      expect(err).to.equal("hello");
      done();
    });
  });

  it("should deal with returns correctly", function (done) {
    var result = helpers.tryCatch(function () {
      return 'hello';
    });
    expect(result).to.equal('hello');

    result = helpers.tryCatch(function () {
      throw "BOOM!";
    }, function ( err ) {
      expect(err).to.equal("BOOM!");
      return 'but saved!';
    });
    expect(result).to.equal('but saved!');
    done();
  });
});
