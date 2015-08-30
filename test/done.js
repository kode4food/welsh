/* global describe, it *//* jshint -W030 */

"use strict";

var domain = require('domain');
var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

function noOp() {}

describe("Welsh 'done()' Implementation", function () {
  var nonFunction = { name: 'for coverage' };

  it("should work with results in Promises", function (done) {
    var p1 = new welsh.Promise(noOp);

    p1.done(function (result) {
      expect(result).to.equal('hello');
      return 'not hello';
    }, nonFunction).then(function (result) {
      expect(result).to.equal('hello');
      done();
    });

    p1.resolve('hello');
  });

  it("should work with reasons in Promises", function (done) {
    var p1 = new welsh.Promise(noOp);

    p1.done(nonFunction, function (reason) {
      expect(reason).to.equal('oh noes!');
      return 'should not work';
    }).catch(function (reason) {
      expect(reason).to.equal('oh noes!');
      done()
    });

    p1.reject('oh noes!');
  });

  it("should work with results in Deferreds", function (done) {
    var d1 = new welsh.Deferred(noOp);

    d1.done(function (result) {
      expect(result).to.equal('hello');
      return 'not hello';
    }, nonFunction).then(function (result) {
      expect(result).to.equal('hello');
      return 'new hello';
    }).done(nonFunction).done(function (result) {
      expect(result).to.equal('new hello');
      done();
    });

    d1.resolve('hello');
  });

  it("should work with reasons in Deferreds", function (done) {
    var d1 = new welsh.Deferred(noOp);

    d1.done(nonFunction, function (reason) {
      expect(reason).to.equal('oh noes!');
      return 'should not work';
    }).catch(function (reason) {
      expect(reason).to.equal('oh noes!');
      throw 'new noes!';
    }).done(
      nonFunction, nonFunction
    ).catch(function (reason) {
      expect(reason).to.equal('new noes!');
      done();
    });

    d1.reject('oh noes!');
  });

  it("should throw Errors on nextTick", function (done) {
    var d = domain.create();
    d.run(function() {
      tryResolve();

      function tryResolve() {
        d.once('error', function (reason) {
          expect(reason).to.be.an('Error');
          expect(reason.message).to.equal("uncaught in resolve");
          tryReject();
        });

        var p1 = welsh.Promise.resolve('p1 resolved!');
        p1.done(function (result) {
          expect(result).to.equal('p1 resolved!');
          throw new Error("uncaught in resolve");
        });
      }

      function tryReject() {
        d.once('error', function (reason) {
          expect(reason).to.be.an('Error');
          expect(reason.message).to.equal("uncaught in reject");
          done();
        });

        var p1 = welsh.Promise.reject('p1 rejected!');
        p1.done(null, function (reason) {
          expect(reason).to.equal('p1 rejected!');
          throw new Error("uncaught in reject");
        });
      }
    });
  });
});
