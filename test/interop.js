/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var createWelshDeferred = require('../lib/deferred');
var createWelshPromise = require('../lib/promise');

describe("Welsh Interop", function () {
  it("should work", function (done) {
    createWelshDeferred(function (resolve, reject) {
      expect(resolve).to.be.a('function');
      expect(reject).to.be.a('function');
      resolve('bill');
    }).then(function (result) {
      expect(result).to.equal('bill');
      return 'hello ' + result;
    }).then(function (result) {
      expect(result).to.equal('hello bill');
      return '"---' + result + '---"';
    }).then(/* fall through */).then(function (result) {
      expect(result).to.equal('"---hello bill---"');
      var np = createWelshPromise();
      setTimeout(function () {
        var another = createWelshDeferred();
        np.resolve(another);
        setTimeout(function () {
          another.resolve('***' + result + '***');
        }, 100);
      }, 100);
      return np;
    }).then(function (result) {
      expect(result).to.equal('***"---hello bill---"***');
      return '///' + result + '\\\\\\';
    }).then(function (result) {
      expect(result).to.equal('///***"---hello bill---"***\\\\\\');
      done();
    });
  });

  it("should handle returned Deferreds that reject", function (done) {
    var p = createWelshPromise();

    p.catch(function (err) {
      expect(err).to.equal("an error!");
      throw 'totally ' + err;
    }).catch(function (result) {
      expect(result).to.equal('totally an error!');
      var np = createWelshDeferred();
      setTimeout(function () {
        np.reject('it was ' + result);
      }, 100);
      return np;
    }).catch(function (err) {
      expect(err).to.equal("it was totally an error!");
      done();
    });

    p.reject("an error!");
  });
});
