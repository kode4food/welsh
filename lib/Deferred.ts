/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
/// <reference path="./Scheduler.ts"/>

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
    private _pendingHandlers: Function[][] = [];
    private _pendingIndex = 0;

    constructor(executor: Executor) {
      super(executor);

      if ( typeof executor !== 'function' ) {
        this.reject(new Error("Deferred requires an Executor Function"));
        return;
      }

      try {
        executor(
          (result?: Result) => { this.resolve(result); },
          (reason?: Reason) => { this.reject(reason); }
        );
      }
      catch ( err ) {
        this.reject(err);
      }
    }

    public resolve(result?: Result): void {
      this.start(State.Fulfilled, result);
    }

    public reject(reason?: Reason): void {
      this.start(State.Rejected, reason);
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
        this.proceed(this._result);
      }
      return this;
    }

    public done(onFulfilled?: Resolver, onRejected?: Rejecter): void {
      this.then(wrapFulfilled, wrapRejected);

      function wrapFulfilled(result?: Result) {
        if ( typeof onFulfilled !== 'function' ) {
          return result;
        }
        try {
          onFulfilled(result);
        }
        catch (err) {
          GlobalScheduler.queue(() => { throw err; });
          return result;
        }
      }

      function wrapRejected(reason?: Reason) {
        if ( typeof onRejected !== 'function' ) {
          throw reason;
        }
        try {
          onRejected(reason);
        }
        catch (err) {
          GlobalScheduler.queue(() => { throw err; });
          throw reason;
        }
      }
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
          this._state = State.Resolving;
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
      this._result = result;
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
