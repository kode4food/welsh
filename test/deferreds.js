/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

describe("Welsh Deferreds", function () {
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
      return new welsh.Deferred(function (resolveOuter) {
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

  it("should handle exceptions", function (done) {
    var p = welsh.Deferred.reject("an error!");

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

  it("should handle returned Deferreds that reject", function (done) {
    var p = welsh.Deferred.reject("an error!");

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
  });

  it("should accept values before 'then'", function (done) {
    var p = welsh.Deferred.resolve('hello');
    p.then(function (result) {
      expect(result).to.equal('hello');
      done();
    });
  });

  it("should not re-enter if you re-resolve", function (done) {
    var resolve;
    var count = 0;
    var p = new welsh.Deferred(function (_resolve) {
      resolve = _resolve;
    });

    p.then(function (result) {
      expect(++count).to.equal(1);
      expect(result).to.equal('hello');

      setTimeout(function () {
        expect(function () {
          resolve('uh-oh!');
        }).to.not.throw();

        p.then(function(result) {
          expect(result).to.equal('hello there');
          done();
        });
      }, 100);

      return result + ' there';
    });

    resolve('hello');
  });

  it("should be able to continue", function (done) {
    var resolve;
    var p = new welsh.Deferred(function (_resolve) {
      resolve = _resolve;
    });

    p.then(function (result) {
      expect(result).to.equal('Bob');
      return "Hello, " + result + "!";
    });

    resolve('Bob');
    p.then(function (result) {
      expect(result).to.equal('Hello, Bob!');
      return result + ' ***';
    });

    p.then(function (result) {
      expect(result).to.equal('Hello, Bob! ***');
      done();
    });
  });

  it("should allow re-entrant 'then'", function (done) {
    var resolve;
    var r, p = new welsh.Deferred(function (_resolve) {
      resolve = _resolve;
    });

    p.then(function (result) {
      expect(result).to.equal('Bill');
      p.then(function (result) {
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
      p.then(function (result) {
        expect(result).to.equal("Hello, Bill! How are you? I'm fine!");
        done();
      });
    }, 100);
  });

  it("should reject if the executor explodes", function (done) {
    new welsh.Deferred(function (resolve, reject) {
      throw "EXPLODED!";
    }).catch(function (reason) {
      expect(reason).to.equal("EXPLODED!");
      done();
    });
  });

  it("should require an executor function", function (done) {
    new welsh.Deferred().catch(function (reason) {
      expect(reason).to.be.an.instanceof(Error);
      expect(reason.message).to.contain("requires an Executor Function");
      done();
    });
  });
});
