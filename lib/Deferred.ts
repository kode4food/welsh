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

namespace Welsh {
  import getThenFunction = Helpers.getThenFunction;

  var fulfilledState = 1;
  var rejectedState = 2;

  export class Deferred extends Common {
    constructor(executor: Executor) {
      super(executor);

      var self = this;

      var state, running, pendingResult;
      var pendingHandlers = [];
      var pendingIndex = 0;

      this.then = appendThen;

      if (typeof executor !== 'function') {
        reject(new Error("Deferred requires an Executor Function"));
        return;
      }

      try {
        executor(resolve, reject);
      }
      catch (err) {
        reject(err);
      }

      function resolve(result) {
        start(fulfilledState, result);
      }

      function reject(reason) {
        start(rejectedState, reason);
      }

      function start(newState, result) {
        if (state) {
          return;
        }
        state = newState;
        proceed(result);
      }

      function appendThen(onFulfilled, onRejected) {
        pendingHandlers[pendingHandlers.length] = [
          undefined, onFulfilled, onRejected
        ];

        if (state && !running) {
          proceed(pendingResult);
        }
        return self;
      }

      function proceed(result) {
        running = true;
        do {
          var then = getThenFunction(result);
          if (then) {
            then(fulfilledLinker, rejectedLinker);
            return;
          }

          if (pendingIndex >= pendingHandlers.length) {
            break;
          }

          var callback = pendingHandlers[pendingIndex++][state];
          if (typeof callback === 'function') {
            try {
              result = callback(result);
              state = fulfilledState;
            }
            catch (reason) {
              result = reason;
              state = rejectedState;
            }
          }
        }
        while (true);
        pendingResult = result;
        pendingHandlers = [];
        pendingIndex = 0;
        running = false;
      }

      function fulfilledLinker(result) {
        state = fulfilledState;
        proceed(result);
        return result;
      }

      function rejectedLinker(reason) {
        state = rejectedState;
        proceed(reason);
        throw reason;
      }
    }
  }
}
