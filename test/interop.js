/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../lib');

describe("Welsh Interop", function () {
  it("should work", function (done) {
    new welsh.Deferred(function (resolve, reject) {
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
      var np = new welsh.Promise();
      setTimeout(function () {
        var another = new welsh.Deferred();
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
    var p = new welsh.Promise();

    p.catch(function (err) {
      expect(err).to.equal("an error!");
      throw 'totally ' + err;
    }).catch(function (result) {
      expect(result).to.equal('totally an error!');
      var np = new welsh.Deferred();
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
