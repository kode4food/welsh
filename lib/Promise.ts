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

  function noOp() {}

  export class Promise extends Common {
    private _branched: boolean;
    private _pendingHandlers: Function[] | Function[][];

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
        this._state = State.Fulfilled;
        this._result = result;
        queueCall(() => this.notifyPending());
      }
      catch ( err ) {
        this.reject(err);
      }
    }

    protected reject(reason?: Reason) {
      if ( this._state ) {
        return;
      }
      this._state = State.Rejected;
      this._result = reason;
      queueCall(() => this.notifyPending());
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
      var promise = new Promise(noOp);
      this.addPending(fulfilledHandler, rejectedHandler);
      return promise;

      function fulfilledHandler(result?: Result) {
        if ( typeof onFulfilled !== 'function' ) {
          promise.resolve(result);
          return;
        }
        try {
          promise.resolve(onFulfilled(result));
        }
        catch ( err ) {
          promise.reject(err);
        }
      }

      function rejectedHandler(reason?: Reason) {
        if ( typeof onRejected !== 'function' ) {
          promise.reject(reason);
          return;
        }
        try {
          promise.resolve(onRejected(reason));
        }
        catch ( err ) {
          promise.reject(err);
        }
      }
    }

    private addPending(onFulfilled?: Resolver, onRejected?: Rejecter) {
      var state = this._state;
      if ( state ) {
        var callback: Function;
        if ( state === State.Fulfilled ) {
          callback = onFulfilled;
        }
        else {
          callback = onRejected;
        }

        queueCall(() => callback(this._result));
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
      var settledResult = this._result;
      if ( this._branched ) {
        for ( var i = 0, len = pendingHandlers.length; i < len; i++ ) {
          (<Function[][]>pendingHandlers)[i][state](settledResult);
        }
      }
      else {
        (<Function[]>pendingHandlers)[state](settledResult);
      }
      this._pendingHandlers = null;
      this._branched = false;
    }
  }
}
