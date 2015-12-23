/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

import {
  default as Common, State, Executor, Resolve, Reject, Result, Reason,
  Fulfilled, Rejected
} from './Common';

import { getThenFunction, tryCall, TryError } from './Helpers';
import { GlobalScheduler } from "./Scheduler";

type PendingHandler = [Promise, Resolve, Reject];
type PendingHandlers = PendingHandler | PendingHandler[];

/* istanbul ignore next */
function noOp() {}

export default class Promise extends Common {
  private _pendingHandlers: PendingHandlers;
  private _pendingLength: number = 0;

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
    let then = tryCall(getThenFunction, result);
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
    let self = this;
    let done: boolean;

    let tryResult = tryCall(executor, onFulfilled, onRejected);
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
    let promise = new Promise(noOp);
    this.addPending(promise, onFulfilled, onRejected);
    return promise;
  }

  protected addPending(target: Promise, onFulfilled: Resolve,
                       onRejected: Reject): void {
    let pending: PendingHandler = [target, onFulfilled, onRejected];

    if ( this._state ) {
      GlobalScheduler.queue(() => {
        this.settlePending(pending);
      });
      return;
    }

    let pendingLength = this._pendingLength;
    if ( pendingLength === 0 ) {
      this._pendingHandlers = pending;
      this._pendingLength = 1;
      return;
    }

    if ( this._pendingLength === 1 ) {
      let pendingHandler = <PendingHandler>this._pendingHandlers;
      this._pendingHandlers = [pendingHandler, pending];
      this._pendingLength = 2;
      return;
    }

    let pendingHandlers = <PendingHandler[]>this._pendingHandlers;
    pendingHandlers[this._pendingLength++] = pending;
  }

  protected settlePending(pending: PendingHandler): void {
    let promise = pending[0];
    if ( this._state === State.Fulfilled ) {
      promise.resolvePending(this._result, pending[1]);
    }
    else {
      promise.rejectPending(this._result, pending[2]);
    }
  }

  protected resolvePending(result?: Result, onFulfilled?: Fulfilled): void {
    if ( typeof onFulfilled !== 'function' ) {
      this.resolve(result);
      return;
    }
    let tryResult = tryCall(onFulfilled, result);
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
    let tryResult = tryCall(onRejected, reason);
    if ( tryResult === TryError ) {
      this.reject(tryResult.reason);
    }
    else {
      this.resolve(tryResult);
    }
  }

  private notifyPending(): void {
    let pendingLength = this._pendingLength;
    if ( pendingLength === 0 ) {
      return;
    }

    if ( pendingLength === 1 ) {
      this.settlePending(<PendingHandler>this._pendingHandlers);
      this._pendingLength = 0;
      this._pendingHandlers = undefined;
      return;
    }

    let pendingHandlers = <PendingHandler[]>this._pendingHandlers;
    for ( let i = 0, len = this._pendingLength; i < len; i++ ) {
      this.settlePending((<PendingHandler[]>pendingHandlers)[i]);
      pendingHandlers[i] = undefined;
    }
    this._pendingHandlers = undefined;
    this._pendingLength = 0;
  }
}
