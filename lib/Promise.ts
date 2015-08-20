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

  type PendingHandler = [Common, Resolve, Reject];
  type PendingHandlers = PendingHandler | PendingHandler[];

  function noOp() {}

  export class Promise extends Common {
    private _branched: boolean;
    private _pendingHandlers: PendingHandlers;

    constructor(executor: Executor) {
      super(executor);

      if ( executor === noOp ) {
        return;
      }
      else if ( typeof executor !== 'function' ) {
        this.reject(new Error("Promise requires an Executor Function"));
        return;
      }

      this.doResolve(executor);
    }

    public resolve(result?: Result): void {
      if ( this._state ) {
        return;
      }
      if ( this === result ) {
        this.reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
        return;
      }
      var then = tryCall(getThenFunction, result);
      if ( then === TryError ) {
        this.reject(then.reason);
        return;
      }
      else if ( then ) {
        this.doResolve(then);
        return;
      }
      this._state = State.Fulfilled;
      this._result = result;
      GlobalScheduler.queue(this.notifyPending, this);
    }

    public reject(reason?: Reason): void {
      if ( this._state ) {
        return;
      }
      this._state = State.Rejected;
      this._result = reason;
      GlobalScheduler.queue(this.notifyPending, this);
    }

    private doResolve(executor: Executor): void {
      var self = this;
      var done: boolean;

      var tryResult = tryCall(executor, onFulfilled, onRejected);
      if ( tryResult === TryError ) {
        if ( done ) {
          return;
        }
        this.reject(tryResult.reason);
      }

      function onFulfilled(result?: Result): void {
        if ( done ) {
          return;
        }
        done = true;
        self.resolve(result);
      }

      function onRejected(reason?: Reason): void {
        if ( done ) {
          return;
        }
        done = true;
        self.reject(reason);
      }
    }

    public then(onFulfilled?: Fulfilled, onRejected?: Rejected): Promise {
      var promise = new Promise(noOp);
      this.addPending(promise, onFulfilled, onRejected);
      return promise;
    }

    protected addPending(target: Promise, onFulfilled: Resolve,
                         onRejected: Reject): void {
      var pending: PendingHandler = [target, onFulfilled, onRejected];

      if ( this._state ) {
        GlobalScheduler.queue(this.settlePending, this, pending);
        return;
      }

      var pendingHandlers: PendingHandlers = this._pendingHandlers;
      if ( !pendingHandlers ) {
        this._pendingHandlers = pending;
        return;
      }

      if ( !this._branched ) {
        this._pendingHandlers = [<PendingHandler>pendingHandlers, pending];
        this._branched = true;
        return;
      }

      pendingHandlers[pendingHandlers.length] = pending;
    }

    protected settlePending(pending: any[]): void {
      var state = this._state;
      var target = pending[0];
      var callback = pending[state];
      if ( state === State.Fulfilled ) {
        target.resolvePending(this._result, callback);
      }
      else {
        target.rejectPending(this._result, callback);
      }
    }

    protected resolvePending(result?: Result, onFulfilled?: Fulfilled): void {
      if ( typeof onFulfilled !== 'function' ) {
        this.resolve(result);
        return;
      }
      var tryResult = tryCall(onFulfilled, result);
      if ( tryResult === TryError ) {
        this.reject(tryResult.reason);
      }
      else {
        this.resolve(tryResult);
      }
    }

    protected rejectPending(reason?: Reason, onRejected?: Rejected): void {
      if ( typeof onRejected !== 'function' ) {
        this.reject(reason);
        return;
      }
      var tryResult = tryCall(onRejected, reason);
      if ( tryResult === TryError ) {
        this.reject(tryResult.reason);
      }
      else {
        this.resolve(tryResult);
      }
    }

    private notifyPending(): void {
      var pendingHandlers = this._pendingHandlers;
      if ( !pendingHandlers ) {
        return;
      }
      if ( this._branched ) {
        for ( var i = 0, len = pendingHandlers.length; i < len; i++ ) {
          this.settlePending((<PendingHandler[]>pendingHandlers)[i]);
          pendingHandlers[i] = undefined;
        }
      }
      else {
        this.settlePending(<PendingHandler>pendingHandlers);
      }
      this._pendingHandlers = null;
      this._branched = false;
    }
  }
}
