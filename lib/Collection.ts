/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>

/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh.Collection {
  var slice = Array.prototype.slice;

  import getThenFunction = Helpers.getThenFunction;
  import isArray = Helpers.isArray;

  export function createRace(instance: Common): Common {
    var Constructor = <CommonConstructable>instance.constructor;
    return new Constructor(function (resolve, reject) {
      instance.done(function (result?: Result) {
        if ( !isArray(result) ) {
          throw new TypeError("race() requires a Collection");
        }
        for ( var i = 0, len = result.length; i < len; i++ ) {
          var value = result[i];
          var then = getThenFunction(value);
          if ( then ) {
            then(resolve, reject);
            continue;
          }
          resolve(value);
        }
      }, reject);
    });
  }

  export function createAll(instance: Common): Common {
    var Constructor = <CommonConstructable>instance.constructor;
    return new Constructor(function (resolve, reject) {
      instance.done(function (result?: Result) {
        if ( !isArray(result) ) {
          throw new TypeError("all() requires a Collection");
        }
        var thenables = slice.call(result);
        var waitingFor = thenables.length;

        for ( var i = 0, len = waitingFor; i < len; i++ ) {
          var then = getThenFunction(thenables[i]);
          if ( then ) {
            resolveThenAtIndex(then, i);
            continue;
          }
          waitingFor--;
        }

        if ( !waitingFor ) {
          resolve(thenables);
        }

        function resolveThenAtIndex(then: Function, index: number) {
          then(wrappedResolve, wrappedReject);

          function wrappedResolve(result?: Result) {
            thenables[index] = result;
            if ( !--waitingFor ) {
              resolve(thenables);
            }
            return result;
          }

          function wrappedReject(reason?: Reason) {
            reject(reason);
            throw reason;
          }
        }
      }, reject);
    });
  }
}
