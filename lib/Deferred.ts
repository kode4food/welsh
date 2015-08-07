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
    private _running: boolean;
    private _pendingResult: ResultOrReason;
    private _pendingHandlers: Function[][] = [];
    private _pendingIndex = 0;

    constructor(executor: Executor) {
      super(executor);

      var self = this;
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

      function resolve(result?: Result) {
        self.start(State.Fulfilled, result);
      }

      function reject(reason?: Reason) {
        self.start(State.Rejected, reason);
      }
    }

    private start(newState: State, result?: ResultOrReason) {
      if ( this._state ) {
        return;
      }
      this._state = newState;
      this.proceed(result);
    }

    public then(onFulfilled?: Resolver, onRejected?: Rejecter): Deferred {
      var pendingHandlers = this._pendingHandlers;
      pendingHandlers[pendingHandlers.length] = [
        undefined, onFulfilled, onRejected
      ];

      if ( this._state && !this._running ) {
        this.proceed(this._pendingResult);
      }
      return this;
    }

    private proceed(result?: ResultOrReason) {
      this._running = true;
      var pendingHandlers = this._pendingHandlers;
      var pendingIndex = this._pendingIndex;
      var state = this._state;

      do {
        var then = getThenFunction(result);
        if ( then ) {
          this._pendingIndex = pendingIndex;
          this._state = state;
          var self = this;
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
            state = State.Fulfilled;
          }
          catch ( reason ) {
            result = reason;
            state = State.Rejected;
          }
        }
      }
      while ( true );
      this._pendingResult = result;
      this._pendingHandlers = [];
      this._pendingIndex = 0;
      this._state = state;
      this._running = false;

      function fulfilledLinker(result?: Result) {
        self._state = State.Fulfilled;
        self.proceed(result);
        return result;
      }

      function rejectedLinker(reason?: Reason) {
        self._state = State.Rejected;
        self.proceed(reason);
        throw reason;
      }
    }
  }
}
