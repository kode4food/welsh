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
  import tryCall = Helpers.tryCall;
  import TryError = Helpers.TryError;

  interface PendingHandlers {
    [index: number]: FulfilledOrRejected[];
  }

  function noOp() {}

  export class Deferred extends Common {
    private _running: boolean;
    private _pendingHandlers: PendingHandlers = {};
    private _head: number = 0;
    private _tail: number = 0;

    constructor(executor: Executor) {
      super(executor);

      if ( typeof executor !== 'function' ) {
        this.reject(new Error("Deferred requires an Executor Function"));
        return;
      }

      var tryResult = tryCall(
        executor,
        (result?: Result) => { this.resolve(result); },
        (reason?: Reason) => { this.reject(reason); }
      );

      if ( tryResult === TryError ) {
        this.reject(tryResult.reason);
      }
    }

    public resolve(result?: Result): void {
      this.startWith(State.Fulfilled, result);
    }

    public reject(reason?: Reason): void {
      this.startWith(State.Rejected, reason);
    }

    private startWith(newState: State, result?: ResultOrReason): void {
      if ( this._state ) {
        return;
      }
      this._state = newState;
      this._result = result;
      if ( this._tail > this._head ) {
        this._running = true;
        GlobalScheduler.queue(this.proceed, this);
      }
    }

    public then(onFulfilled?: Fulfilled, onRejected?: Rejected): Deferred {
      this._pendingHandlers[this._tail++] = [
        noOp, onFulfilled, onRejected
      ];

      if ( this._state && !this._running ) {
        this._running = true;
        GlobalScheduler.queue(this.proceed, this);
      }
      return this;
    }

    private proceed(): void {
      var pendingHandlers = this._pendingHandlers;
      var head = this._head;
      var result = this._result;
      var state = this._state;

      do {
        var then = getThenFunction(result);
        if ( then ) {
          this._head = head;
          this._state = State.Resolving;
          var self = this;
          then(fulfilledLinker, rejectedLinker);
          return;
        }

        if ( head >= this._tail ) {
          break;
        }

        var callback = pendingHandlers[head++][state];
        if ( typeof callback === 'function' ) {
          result = tryCall(callback, result);
          if ( result === TryError ) {
            this._result = result = result.reason;
            this._state = state = State.Rejected;
          }
          else {
            this._result = result;
            this._state = state = State.Fulfilled;
          }
        }
      }
      while ( true );
      this._head = 0;
      this._tail = 0;
      this._pendingHandlers = {};
      this._running = false;

      function fulfilledLinker(result?: Result): Result {
        self.continueWith(State.Fulfilled, result);
        return result;
      }

      function rejectedLinker(reason?: Reason): Result {
        self.continueWith(State.Rejected, reason);
        throw reason;
      }
    }

    private continueWith(newState: State, result?: ResultOrReason): void {
      this._state = newState;
      this._result = result;
      GlobalScheduler.queue(this.proceed, this);
    }
  }
}
