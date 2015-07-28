/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../index');

describe("Lazy Executors", function () {
  it("should probably work with 'then'", function (done) {
    var mutated = 0;

    var p = welsh.promise.lazy(function (resolve) {
      expect(mutated).to.equal(0);
      setTimeout(function () {
        mutated++;
        resolve('hello');
      }, 50);
    });

    var oldThen = p.then;

    expect(mutated).to.equal(0);
    setTimeout(function () {
      expect(mutated).to.equal(0);
      p.then(); // this wakes it up
      setTimeout(function () {
        expect(mutated).to.equal(1);
        oldThen(function (result) {
          expect(mutated).to.equal(1);
          expect(result).to.equal('hello');
          done();
        });
      }, 100);
    }, 10);
  });

  it("should probably work with 'catch' as well", function (done) {
    var mutated = false;

    var p = welsh.deferred.lazy(function (resolve, reject) {
      expect(mutated).to.be.false;
      setTimeout(function () {
        mutated = true;
        reject();
      }, 50);
    });

    expect(mutated).to.be.false;
    setTimeout(function () {
      expect(mutated).to.be.false;
      p.catch(); // this wakes it up
      setTimeout(function () {
        expect(mutated).to.be.true;
        done();
      }, 100);
    }, 10);
  });

  it("should probably work without an executor", function (done) {
    var p = welsh.promise.lazy();
    p.then(function (result) {
      expect(result).to.equal('value');
      done();
    });

    setTimeout(function () {
      p.resolve('value');
    }, 100);
  });
});
