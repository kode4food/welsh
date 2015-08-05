/* global describe, it *//* jshint -W030 */

"use strict";

var fs = require('fs');
var expect = require('chai').expect;
var welsh = require('../dist/welsh-node');

describe("Welsh 'toNode()' Implementation", function () {
  it("should probably work", function (done) {
    var waiting = 2;

    welsh.Promise.resolve('hello!').then(function (result) {
      expect(result).to.equal('hello!');
      return 'i say ' + result;
    }).toNode(resolvedCallback);

    welsh.Promise.resolve('hello!').then(function (result) {
      expect(result).to.equal('hello!');
      throw 'i say i broke!';
    }).toNode(rejectedCallback);

    function resolvedCallback(err, result) {
      expect(err).to.be.null;
      expect(result).to.equal('i say hello!');
      if ( !--waiting ) {
        done();
      }
    }

    function rejectedCallback(err, result) {
      expect(result).to.be.undefined;
      expect(err).to.equal('i say i broke!');
      if ( !--waiting ) {
        done();
      }
    }
  });
});

describe("Welsh 'fromNode()' Implementation", function () {
  it("should probably work with resolves", function (done) {
    var readFilePromise = welsh.Promise.fromNode(fs.readFile);
    readFilePromise(__filename).then(function (result) {
      var str = result.toString();
      expect(/"use strict";/.test(str)).to.be.true;
      done();
    }, done);
  });

  it("should probably work with rejects", function (done) {
    var readFilePromise = welsh.Promise.fromNode(fs.readFile);
    readFilePromise('garbage.not.there').catch(function (reason) {
      expect(reason).to.not.be.null;
      done();
    });
  });
});
