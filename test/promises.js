/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

describe("Welsh Promises", function () {
  it("should work", function (done) {
    new welsh.Promise(function (resolve, reject) {
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
          resolveOuter(new welsh.Promise(function (resolveInner) {
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

  it("should handle exceptions", function (done) {
    var p = welsh.Promise.reject("an error!");

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
  });

  it("should accept values before 'then'", function (done) {
    var p = welsh.Promise.resolve("hello");
    p.then(function (result) {
      expect(result).to.equal('hello');
      return result + ' there';
    }).finally(function () {
      done();
    });
  });

  it("should not allow 'done' to mutate", function (done) {
    var p = welsh.Promise.resolve("hello");
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
    var resolve;
    new welsh.Promise(function (_resolve) {
      resolve = _resolve;
      resolve("hello");
    });

    expect(function () {
      resolve('uh-oh!');
    }).to.not.throw(Error);
    done();
  });

  it("should be able to continue", function (done) {
    var resolve;
    var p = new welsh.Promise(function (_resolve) {
      resolve = _resolve;
    });

    var q = p.then(function (result) {
      expect(result).to.equal('Bob');
      return "Hello, " + result + "!";
    });

    resolve('Bob');
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
    var r, resolve;
    var p = new welsh.Promise(function (_resolve) {
      resolve = _resolve;
    });
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

    resolve('Bill');
    setTimeout(function () {
      r.then(function (result) {
        expect(result).to.equal("Hello, Bill! How are you? I'm fine!");
        done();
      });
    }, 100);
  });

  it("should allow immediately resolved promises", function (done) {
    welsh.Promise.resolve("IT IS RESOLVED!").then(function (result) {
      expect(result).to.equal("IT IS RESOLVED!");
      done();
    });
  });

  it("should allow immediately rejected promises", function (done) {
    welsh.Promise.reject("IT IS REJECTED!").catch(function (result) {
      expect(result).to.equal("IT IS REJECTED!");
      done();
    });
  });

  it("should require an executor function", function (done) {
    new welsh.Promise().catch(function (reason) {
      expect(reason).to.be.an.instanceof(Error);
      expect(reason.message).to.contain("requires an Executor Function");
      done();
    });
  });
});
