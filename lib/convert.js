/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

var helpers = require('./helpers');
var getThenFunction = helpers.getThenFunction;

var createWelshPromise = require('./promise');
var createWelshDeferred = require('./deferred');

function decorateWelshBase(WelshBase) {
  WelshBase.prototype.toPromise = function () {
    return convertUsing(this, createWelshPromise);
  };

  WelshBase.prototype.toDeferred = function () {
    return convertUsing(this, createWelshDeferred);
  };
}

function convertUsing(deferred, generator) {
  return generator(function (resolve, reject) {
    var then = getThenFunction(deferred);
    then(wrappedResolve, wrappedReject);

    function wrappedResolve(result) {
      resolve(result);
      return result;
    }

    function wrappedReject(reason) {
      reject(reason);
      throw reason;
    }
  });
}

exports.decorateWelshBase = decorateWelshBase;
