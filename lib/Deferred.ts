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

  export class Deferred extends Common {
    constructor(executor: Executor) {
      super(executor);

      var self = this;

      var state: State;
      var running: boolean;
      var pendingResult: any;
      var pendingHandlers: Function[][] = [];
      var pendingIndex = 0;

      this.then = appendThen;

      if ( typeof executor !== 'function' ) {
        reject(new Error("Deferred requires an Executor Function"));
        return;
      }

      try {
        executor(resolve, reject);
      }
      catch ( err ) {
        reject(err);
      }

      function resolve(result) {
        start(State.fulfilledState, result);
      }

      function reject(reason) {
        start(State.rejectedState, reason);
      }

      function start(newState: State, result) {
        if ( state ) {
          return;
        }
        state = newState;
        proceed(result);
      }

      function appendThen(onFulfilled?: Resolver, onRejected?: Rejecter) {
        pendingHandlers[pendingHandlers.length] = [
          undefined, onFulfilled, onRejected
        ];

        if ( state && !running ) {
          proceed(pendingResult);
        }
        return self;
      }

      function proceed(result? :any) {
        running = true;
        do {
          var then = getThenFunction(result);
          if ( then ) {
            then(fulfilledLinker, rejectedLinker);
            return;
          }

          if ( pendingIndex >= pendingHandlers.length ) {
            break;
          }

          var callback = pendingHandlers[pendingIndex++][state];
          if ( typeof callback === 'function' ) {
            try {
              result = callback(result);
              state = State.fulfilledState;
            }
            catch ( reason ) {
              result = reason;
              state = State.rejectedState;
            }
          }
        }
        while ( true );
        pendingResult = result;
        pendingHandlers = [];
        pendingIndex = 0;
        running = false;
      }

      function fulfilledLinker(result) {
        state = State.fulfilledState;
        proceed(result);
        return result;
      }

      function rejectedLinker(reason) {
        state = State.rejectedState;
        proceed(reason);
        throw reason;
      }
    }
  }
}
