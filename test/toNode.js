/* global describe, it *//* jshint -W030 */

"use strict";

var expect = require('chai').expect;
var createWelshDeferred = require('../lib/deferred').createWelshDeferred;
var createWelshPromise = require('../lib/promise').createWelshPromise;

describe("Welsh 'toCallback()' Implementation", function () {
  it("should probably work", function (done) {
    var waiting = 2;

    createWelshPromise.resolve('hello!').then(function (result) {
      expect(result).to.equal('hello!');
      return 'i say ' + result;
    }).toNode(resolvedCallback);

    createWelshPromise.resolve('hello!').then(function (result) {
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
