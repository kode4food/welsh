/// <reference path="../typings/tsd.d.ts" />

/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

import { getThenFunction, tryCall, TryError } from './Helpers';
import { GlobalScheduler } from './Scheduler';

import {
  default as Common, Result, Reason, ResultOrReason, FulfilledOrRejected,
  State, Executor, Fulfilled, Rejected
} from './Common';

class PendingHandler {
  constructor(public onFulfilled: Fulfilled, public onRejected: Rejected) {}
}

type PendingHandlers = PendingHandler[];

export default class Deferred extends Common {
  private _running: boolean;
  private _pendingHandlers: PendingHandlers = [];
  private _pendingIndex: number = 0;
  private _pendingLength: number = 0;

  constructor(executor: Executor) {
    super(executor);

    if ( typeof executor !== 'function' ) {
      this.reject(new Error("Deferred requires an Executor Function"));
      return;
    }

    let tryResult = tryCall(
      executor,
      (result?: Result) => this.resolve(result),
      (reason?: Reason) => this.reject(reason)
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

  public then(onFulfilled?: Fulfilled, onRejected?: Rejected): Deferred {
    let pending = new PendingHandler(onFulfilled, onRejected);
    this._pendingHandlers[this._pendingLength++] = pending;

    if ( this._state && !this._running ) {
      this._running = true;
      GlobalScheduler.queue(this.proceed, this);
    }
    return this;
  }

  private startWith(newState: State, result?: ResultOrReason): void {
    if ( this._state ) {
      return;
    }
    this._state = newState;
    this._result = result;
    if ( this._pendingLength ) {
      this._running = true;
      GlobalScheduler.queue(this.proceed, this);
    }
  }

  private proceed(): void {
    let pendingHandlers = this._pendingHandlers;
    let pendingIndex = this._pendingIndex;
    let result = this._result;
    let state = this._state;
    let self = this;

    do {
      let then = getThenFunction(result);
      if ( then ) {
        this._pendingIndex = pendingIndex;
        this._state = State.Resolving;
        then(fulfilledLinker, rejectedLinker);
        return;
      }

      if ( pendingIndex >= this._pendingLength ) {
        break;
      }

      let pending: PendingHandler = pendingHandlers[pendingIndex++];
      let callback: FulfilledOrRejected;
      if ( state === State.Fulfilled ) {
        callback = pending.onFulfilled;
      }
      else {
        callback = pending.onRejected;
      }
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
    this._pendingIndex = 0;
    this._pendingLength = 0;
    this._pendingHandlers = [];
    this._running = false;

    function fulfilledLinker(linkedResult?: Result): Result {
      self.continueWith(State.Fulfilled, linkedResult);
      return linkedResult;
    }

    function rejectedLinker(linkedReason?: Reason): Result {
      self.continueWith(State.Rejected, linkedReason);
      throw linkedReason;
    }
  }

  private continueWith(newState: State, result?: ResultOrReason): void {
    this._state = newState;
    this._result = result;
    GlobalScheduler.queue(this.proceed, this);
  }
}
