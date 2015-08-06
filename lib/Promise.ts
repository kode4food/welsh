/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
/// <reference path="./Queue.ts"/>

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
  import queueCall = Queue.queueCall;

  export class Promise extends Common {
    private _state: State;
    private _settledResult: ResultOrReason;
    private _branched: boolean;
    private _pendingHandlers: any;

    constructor(executor: Executor) {
      super(executor);

      if ( typeof executor !== 'function' ) {
        this.reject(new Error("Promise requires an Executor Function"));
        return;
      }
      this.doResolve(executor);
    }

    protected resolve(result?: Result) {
      if ( this._state ) {
        return;
      }
      if ( this === result ) {
        this.reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
        return;
      }
      try {
        var then = getThenFunction(result);
        if ( then ) {
          this.doResolve(then);
          return;
        }
        this._state = State.fulfilledState;
        this._settledResult = result;
        queueCall(() => { this.notifyPending(); });
      }
      catch ( err ) {
        this.reject(err);
      }
    }

    protected reject(reason?: Reason) {
      if ( this._state ) {
        return;
      }
      this._state = State.rejectedState;
      this._settledResult = reason;
      queueCall(() => { this.notifyPending(); });
    }

    private doResolve(executor: Executor) {
      var self = this;
      var done: boolean;

      try {
        executor(wrappedResolve, wrappedReject);
      }
      catch ( err ) {
        if ( done ) {
          return;
        }
        this.reject(err);
      }

      function wrappedResolve(result?: Result) {
        if ( done ) {
          return;
        }
        done = true;
        self.resolve(result);
      }

      function wrappedReject(reason?: Reason) {
        if ( done ) {
          return;
        }
        done = true;
        self.reject(reason);
      }
    }

    public then(onFulfilled?: Resolver, onRejected?: Rejecter): Promise {
      var resolve: Resolver;
      var reject: Rejecter;
      this.addPending(fulfilledHandler, rejectedHandler);
      return new Promise(function (_resolve, _reject) {
        resolve = _resolve;
        reject = _reject;
      });

      function fulfilledHandler(result?: Result) {
        if ( typeof onFulfilled !== 'function' ) {
          resolve(result);
          return;
        }
        try {
          resolve(onFulfilled(result));
        }
        catch ( err ) {
          reject(err);
        }
      }

      function rejectedHandler(reason?: Reason) {
        if ( typeof onRejected !== 'function' ) {
          reject(reason);
          return;
        }
        try {
          resolve(onRejected(reason));
        }
        catch ( err ) {
          reject(err);
        }
      }
    }

    private addPending(onFulfilled?: Resolver, onRejected?: Rejecter) {
      var state = this._state;
      if ( state ) {
        var callback: Function;
        if ( state === State.fulfilledState ) {
          callback = onFulfilled;
        }
        else {
          callback = onRejected;
        }

        queueCall(() => { callback(this._settledResult); });
        return;
      }

      var item = [undefined, onFulfilled, onRejected];

      var pendingHandlers = this._pendingHandlers;
      if ( !pendingHandlers ) {
        this._pendingHandlers = item;
        return;
      }

      if ( !this._branched ) {
        this._pendingHandlers = [<Function[]>pendingHandlers, item];
        this._branched = true;
        return;
      }

      pendingHandlers[pendingHandlers.length] = item;
    }

    private notifyPending() {
      var pendingHandlers = this._pendingHandlers;
      if ( !pendingHandlers ) {
        return;
      }
      var state = this._state;
      var settledResult = this._settledResult;
      if ( this._branched ) {
        for ( var i = 0, len = pendingHandlers.length; i < len; i++ ) {
          pendingHandlers[i][state](settledResult);
        }
      }
      else {
        pendingHandlers[state](settledResult);
      }
      this._pendingHandlers = null;
      this._branched = false;
    }
  }
}
