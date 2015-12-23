/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist');

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
      return new welsh.Promise(function (resolveOuter) {
        setTimeout(function () {
          resolveOuter(new welsh.Deferred(function (resolveInner) {
            setTimeout(function () {
              resolveInner('***' + result + '***');
            }, 100);
          }));
        }, 100);
      });
    }).then(function (result) {
      expect(result).to.equal('***"---hello bill---"***');
      return '///' + result + '\\\\\\';
    }).then(function (result) {
      expect(result).to.equal('///***"---hello bill---"***\\\\\\');
      done();
    });
  });

  it("should handle returned Deferreds that reject", function (done) {
    var reject;
    var p = new welsh.Promise(function (_resolve, _reject) {
      reject = _reject;
    });

    p.catch(function (err) {
      expect(err).to.equal("an error!");
      throw 'totally ' + err;
    }).catch(function (result) {
      expect(result).to.equal('totally an error!');
      return new welsh.Deferred(function (resolve, reject) {
        setTimeout(function () {
          reject('it was ' + result);
        }, 100);
      });
    }).catch(function (err) {
      expect(err).to.equal("it was totally an error!");
      done();
    });

    reject("an error!");
  });
});
