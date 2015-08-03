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

var WelshPromise = require('./promise');
var WelshDeferred = require('./deferred');

function decoratePrototype(prototype) {
  prototype.toPromise = function () {
    return convertUsing(this, WelshPromise);
  };

  prototype.toDeferred = function () {
    return convertUsing(this, WelshDeferred);
  };
}

function convertUsing(deferred, Constructor) {
  return new Constructor(function (resolve, reject) {
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

exports.decoratePrototype = decoratePrototype;