/* global describe, it *//* jshint -W030 */

"use strict";

var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var welsh = require('../index');

describe("Welsh 'toNode()' Implementation", function () {
  it("should probably work", function (done) {
    var waiting = 2;

    welsh.promise.resolve('hello!').then(function (result) {
      expect(result).to.equal('hello!');
      return 'i say ' + result;
    }).toNode(resolvedCallback);

    welsh.promise.resolve('hello!').then(function (result) {
      expect(result).to.equal('hello!');
      throw 'i say i broke!';
    }).toNode(rejectedCallback);

    function resolvedCallback(err, result) {
      expect(err).to.be.null;
      expect(result).to.equal('i say hello!');
      /* istanbul ignore next */
      if ( !--waiting ) {
        done();
      }
    }

    function rejectedCallback(err, result) {
      expect(result).to.be.undefined;
      expect(err).to.equal('i say i broke!');
      /* istanbul ignore next */
      if ( !--waiting ) {
        done();
      }
    }
  });
});

describe("Welsh 'fromNode()' Implementation", function () {
  it("should probably work with resolves", function (done) {
    var filename = path.join(__dirname, 'node.js');
    var readFilePromise = welsh.promise.fromNode(fs.readFile);
    readFilePromise(filename).then(function (result) {
      var str = result.toString();
      expect(/"use strict";/.test(str)).to.be.true;
      done();
    }, done);
  });

  it("should probably work with rejects", function (done) {
    var filename = path.join(__dirname, 'garbage.not.there');
    var readFilePromise = welsh.promise.fromNode(fs.readFile);
    readFilePromise(filename).catch(function (reason) {
      expect(reason).to.not.be.null;
      done();
    });
  });
});
