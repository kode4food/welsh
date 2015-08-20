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
  import getThenFunction = Helpers.getThenFunction;

  type Processor = (array: any[], resolve: Resolve, reject: Reject) => void;

  function process(instance: Common, processor: Processor): Common {
    var Constructor = <CommonConstructable>instance.constructor;
    return new Constructor(function (resolve, reject) {
      instance.done(function (result?: Result) {
        if ( !Array.isArray(result) ) {
          reject(new TypeError("Result containing a Collection is required"));
          return;
        }
        processor(result.slice(), resolve, reject);
      }, reject);
    })
  }

  export function createRace(instance: Common): Common {
    return process(instance, function (array, resolve, reject) {
      if ( array.length === 0 ) {
        reject(new Error("Array provided to race() is empty"));
        return;
      }
      for ( var i = 0, len = array.length; i < len; i++ ) {
        var value = array[i];
        var then = getThenFunction(value);
        if ( then ) {
          then(resolve, reject);
          continue;
        }
        resolve(value);
      }
    });
  }

  export function createAll(instance: Common): Common {
    return process(instance, function (array, resolve, reject) {
      var waitingFor = array.length;

      for ( var i = 0, len = waitingFor; i < len; i++ ) {
        var then = getThenFunction(array[i]);
        if ( then ) {
          resolveThenAtIndex(then, i);
          continue;
        }
        waitingFor--;
      }

      if ( waitingFor === 0 ) {
        resolve(array);
      }

      function resolveThenAtIndex(then: Function, index: number) {
        then(onFulfilled, onRejected);

        function onFulfilled(result?: Result): Result {
          array[index] = result;
          if ( --waitingFor === 0 ) {
            resolve(array);
          }
          return result;
        }

        function onRejected(reason?: Reason): Result {
          reject(reason);
          throw reason;
        }
      }
    });
  }

  export function createAny(instance: Common): Common {
    return createSome(instance, 1).then(function (array) {
      return array[0];
    });
  }

  export function createSome(instance: Common, count?: number): Common {
    return process(instance, function (array, resolve, reject) {
      var results:Result[] = [];
      var waitingFor = array.length;
      if ( typeof count !== 'number' || count < 0 ) {
        reject(new Error(`Can't wait for ${count} Results`));
        return;
      }

      if ( count > waitingFor ) {
        reject(new Error(`${count} Result(s) can never be fulfilled`));
        return;
      }

      if ( count === 0 ) {
        resolve([]);
        return;
      }

      for ( var i = 0, len = waitingFor; i < len; i++ ) {
        var value = array[i];
        var then = getThenFunction(value);
        if ( then ) {
          then(onFulfilled, onRejected);
          continue;
        }
        provideResult(value);
      }

      function onFulfilled(result?: Result): Result {
        provideResult(result);
        return result;
      }

      function onRejected(reason?: Reason): Result {
        decrementWaiting();
        throw reason;
      }

      function provideResult(result: Result) {
        if ( count === 0 ) {
          return;
        }
        results[results.length] = result;
        if ( --count === 0 ) {
          resolve(results);
          waitingFor = 0;
          return;
        }
        decrementWaiting();
      }

      function decrementWaiting() {
        if ( waitingFor === 0 ) {
          return;
        }
        if ( --waitingFor === 0 && count > 0 ) {
          reject(new Error(`${count} Result(s) not fulfilled`));
        }
      }
    });
  }
}
