/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var createWelshPromise = require('../lib/promise');

describe("Welsh Promises", function () {
  it("should work", function (done) {
    createWelshPromise(function (resolve, reject) {
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
        var another = createWelshPromise();
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
    var p = createWelshPromise();

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
    var p = createWelshPromise();
    p.resolve('hello');
    p.then(function (result) {
      expect(result).to.equal('hello');
      return result + ' there';
    }).finally(function () {
      done();
    });
  });

  it("should not allow 'done' to mutate", function (done) {
    var p = createWelshPromise();
    p.resolve('hello');
    p.then(function (result) {
      expect(result).to.equal('hello');
      return result + ' there';
    }).finally(function () {
      return 'should not happen';
    }).then(function (result) {
      expect(result).to.equal('hello there');
      throw 'boom!';
    }).catch(function (reason) {
      expect(reason).to.equal('boom!');
      throw reason + ' go the dynamite';
    }).finally().catch(function (result) {
      expect(result).to.equal("boom! go the dynamite");
      done();
    });
  });

  it("should not explode if you re-resolve", function (done) {
    var p = createWelshPromise();
    p.resolve('hello');
    expect(function () {
      p.resolve('uh-oh!');
    }).to.not.throw(Error);
    done();
  });

  it("should be able to continue", function (done) {
    var p = createWelshPromise();

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
    var r, p = createWelshPromise();

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

  it("should allow immediately resolved promises", function (done) {
    createWelshPromise.resolve("IT IS RESOLVED!").then(function (result) {
      expect(result).to.equal("IT IS RESOLVED!");
      done();
    });
  });

  it("should allow immediately rejected promises", function (done) {
    createWelshPromise.reject("IT IS REJECTED!").catch(function (result) {
      expect(result).to.equal("IT IS REJECTED!");
      done();
    });
  });
});
