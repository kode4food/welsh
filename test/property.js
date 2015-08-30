/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

/* istanbul ignore next */
function noOp() {}

describe("Welsh 'path()' Implementation", function () {
  it("should probably work", function (done) {
    var p1 = welsh.Promise.resolve('promise1');
    var p2 = welsh.Promise.resolve('promise2');
    var p3 = welsh.Promise.resolve('promise3');

    var tree = {
      name: 'hello',
      arr: [p1, 1, p2, 2, p3, { name: 'hello', p1: p1 }],
      p1: p1,
      p2: p2,
      obj: {
        p1: p1, n1: 1, p2: p2, n2: 2, p3: p3,
        sub: { name: 'hello', p1: p1 }
      }
    };
    var treePromise = welsh.Promise.resolve(tree);

    welsh.Promise.path(tree, ['name']).then(function (result) {
      expect(result).to.equal('hello');
      return welsh.Promise.path(tree, ['p1']);
    }).then(function (result) {
      expect(result).to.equal('promise1');
      return treePromise.path(['arr', 1]);
    }).then(function (result) {
      expect(result).to.equal(1);
      return treePromise.path(['arr', 0]);
    }).then(function (result) {
      expect(result).to.equal('promise1');
      return treePromise.path(['arr', 5, 'name']);
    }).then(function (result) {
      expect(result).to.equal('hello');
      return treePromise.path(['arr', 5, 'p1']);
    }).then(function (result) {
      expect(result).to.equal('promise1');
      return treePromise.path(['obj', 'n2']);
    }).then(function (result) {
      expect(result).to.equal(2);
      return treePromise.path(['obj', 'p2']);
    }).then(function (result) {
      expect(result).to.equal('promise2');
      return treePromise.path(['obj', 'sub', 'p1']);
    }).then(function (result) {
      expect(result).to.equal('promise1');
      return treePromise.path(['obj', 'sub', 'name']);
    }).then(function (result) {
      expect(result).to.equal('hello');
      return welsh.Promise.path(tree, ['sploder']);
    }).catch(function (reason) {
      expect(reason).to.be.an.instanceof(Error);
      expect(reason.message).to.equal("Property path not found: sploder");
      return treePromise.path(['arr', 99]);
    }).catch(function (reason) {
      expect(reason).to.be.an.instanceof(Error);
      expect(reason.message).to.equal("Property path not found: arr/99");
      return treePromise.path(['obj', 'sub', 'missing', 'moreso']);
    }).catch(function (reason) {
      expect(reason).to.be.an.instanceof(Error);
      expect(reason.message).to.equal("Property path not found: obj/sub/missing");
      done();
    })
  });
});
