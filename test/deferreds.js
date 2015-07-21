/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../deferred');

describe("Welsh Deferreds", function () {
  it("should work", function (done) {
    welsh(function (resolve, reject) {
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
      var np = welsh();
      setTimeout(function () {
        var another = welsh();
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

  it("should handle exceptions", function (done) {
    var p = welsh();

    p.catch(function (err) {
      expect(err).to.equal("an error!");
      return 'totally ' + err;
    }).then(function (result) {
      expect(result).to.equal('totally an error!');
      throw 'it was ' + result;
    }).catch(function (err) {
      expect(err).to.equal("it was totally an error!");
      done();
    });

    p.reject("an error!");
  });

  it("should accept values before 'then'", function (done) {
    var p = welsh();
    p.resolve('hello');
    p.then(function (result) {
      expect(result).to.equal('hello');
      done();
    });
  });

  it("should explode if you re-resolve", function (done) {
    var p = welsh();
    p.resolve('hello');
    expect(function () {
      p.resolve('uh-oh!');
    }).to.throw(Error);
    done();
  });

  it("should be able to continue", function (done) {
    var p = welsh();

    var q = p.then(function (result) {
      expect(result).to.equal('Bob');
      return "Hello, " + result + "!";
    });

    p.resolve('Bob');
    var r = q.then(function (result) {
      expect(result).to.equal('Hello, Bob!');
      return result + ' ***';
    });

    r.then(function (result) {
      expect(result).to.equal('Hello, Bob! ***');
      done();
    });
  });

  it("should allow re-entrant 'then'", function (done) {
    var r, p = welsh();

    var q = p.then(function (result) {
      expect(result).to.equal('Bill');
      r = q.then(function (result) {
        expect(result).to.equal("Hello, Bill! How are you?");
        return result + " I'm fine!";
      });
      return 'Hello, ' + result + '!';
    }).then(function (result) {
      expect(result).to.equal("Hello, Bill!");
      return result + " How are you?";
    });

    p.resolve('Bill');
    setTimeout(function () {
      r.then(function (result) {
        expect(result).to.equal("Hello, Bill! How are you? I'm fine!");
        done();
      });
    }, 100);
  });

  it("should allow cancel", function (done) {
    var called = false;
    var p = welsh();
    p.then(function (result) {
      return 'hello, ' + result;
    }).then(function (result) {
      expect(result).to.equal('hello, bill');
      p.cancel();
    }).then(function () {
      called = true;
    });

    p.resolve('bill');
    setTimeout(function () {
      expect(called).to.be.false;
      done();
    }, 100);
  });
});
