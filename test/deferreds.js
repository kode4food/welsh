/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../lib');

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
      var np = new welsh.Deferred();
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

  it("should handle exceptions", function (done) {
    var p = new welsh.Deferred();

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

  it("should handle returned Deferreds that reject", function (done) {
    var p = new welsh.Deferred();

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

  it("should accept values before 'then'", function (done) {
    var p = new welsh.Deferred();
    p.resolve('hello');
    p.then(function (result) {
      expect(result).to.equal('hello');
      done();
    });
  });

  it("should not re-enter if you re-resolve", function (done) {
    var count = 0;
    var p = new welsh.Deferred().then(function (result) {
      expect(++count).to.equal(1);
      expect(result).to.equal('hello');

      setTimeout(function () {
        expect(function () {
          p.resolve('uh-oh!');
        }).to.not.throw();

        p.then(function(result) {
          expect(result).to.equal('hello there');
          done();
        });
      }, 100);

      return result + ' there';
    });

    p.resolve('hello');
  });

  it("should be able to continue", function (done) {
    var p = new welsh.Deferred();

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
    var r, p = new welsh.Deferred();

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
    var p = new welsh.Deferred();
    p.then(function (result) {
      return 'hello, ' + result;
    }).then(function (result) {
      expect(result).to.equal('hello, bill');
      p.cancel();
    }).then(markCalled);

    /* istanbul ignore next */
    function markCalled() {
      called = true;
    }
    p.resolve('bill');
    setTimeout(function () {
      expect(called).to.be.false;
      done();
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
});
