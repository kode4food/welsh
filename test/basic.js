/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var welsh = require('../index');

describe("Welsh", function () {
  it("should work", function (done) {
    var p = welsh(function (result) {
      expect(result).to.equal('bill');
      return 'hello ' + result;
    }).then(function (result) {
      expect(result).to.equal('hello bill');
      return '"---' + result + '---"';
    }).then(function (result) {
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

    p.resolve('bill');
  });

  it("should handle exceptions", function (done) {
    var p = welsh().catch(function (err) {
      expect(err).to.equal("an error!");
      throw 'totally ' + err;
    }).then(/* istanbul ignore next */ function () {
      // shouldn't be called
      expect(true).to.equal(false);
    }).catch(function (err) {
      expect(err).to.equal("totally an error!");
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
    var p = welsh(function (result) {
      expect(result).to.equal('Bob');
      return "Hello, " + result + "!";
    });
    
    p.resolve('Bob');
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
    var p = welsh();
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
    
    p.resolve('Bill');
    p.then(function (result) {
      expect(result).to.equal("Hello, Bill! How are you? I'm fine!");
      done();
    });
  });
});
