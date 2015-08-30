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
    var d = welsh.Deferred.reject("an error!");

    d.catch(function (err) {
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
    var d = welsh.Deferred.reject("an error!");

    d.catch(function (err) {
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
    var d = welsh.Deferred.resolve('hello');
    d.then(function (result) {
      expect(result).to.equal('hello');
      done();
    });
  });

  it("should not re-enter if you re-resolve", function (done) {
    var resolve;
    var count = 0;
    var d = new welsh.Deferred(function (_resolve) {
      resolve = _resolve;
    });

    d.then(function (result) {
      expect(++count).to.equal(1);
      expect(result).to.equal('hello');

      setTimeout(function () {
        expect(function () {
          resolve('uh-oh!');
        }).to.not.throw();

        d.then(function(result) {
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
    var d = new welsh.Deferred(function (_resolve) {
      resolve = _resolve;
    });

    d.then(function (result) {
      expect(result).to.equal('Bob');
      return "Hello, " + result + "!";
    });

    resolve('Bob');
    d.then(function (result) {
      expect(result).to.equal('Hello, Bob!');
      return result + ' ***';
    });

    d.then(function (result) {
      expect(result).to.equal('Hello, Bob! ***');
      done();
    });
  });

  it("should allow re-entrant 'then'", function (done) {
    var resolve;
    var d = new welsh.Deferred(function (_resolve) {
      resolve = _resolve;
    });

    d.then(function (result) {
      expect(result).to.equal('Bill');
      d.then(function (result) {
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
      d.then(function (result) {
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

  it("should allow state querying", function (done) {
    var d = welsh.Deferred.resolve('hello');
    expect(d.isSettled()).to.be.true;
    expect(d.isFulfilled()).to.be.true;
    expect(d.isRejected()).to.be.false;
    expect(d.isPending()).to.be.false;
    expect(d.getResult()).to.equal('hello');
    expect(function () { d.getReason(); }).to.throw("Can't retrieve reason if not rejected");

    d = welsh.Deferred.reject('rejected!');
    expect(d.isSettled()).to.be.true;
    expect(d.isFulfilled()).to.be.false;
    expect(d.isRejected()).to.be.true;
    expect(d.isPending()).to.be.false;
    expect(d.getReason()).to.equal('rejected!');
    expect(function () { d.getResult(); }).to.throw("Can't retrieve result if not fulfilled");

    d = new welsh.Deferred(function () {});
    expect(d.isSettled()).to.be.false;
    expect(d.isFulfilled()).to.be.false;
    expect(d.isRejected()).to.be.false;
    expect(d.isPending()).to.be.true;
    expect(function () { d.getResult(); }).to.throw("Can't retrieve result if not fulfilled");
    expect(function () { d.getReason(); }).to.throw("Can't retrieve reason if not rejected");

    done();
  });
});
