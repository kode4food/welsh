/// <reference path="./Helpers.ts"/>
/// <reference path="./Collection.ts"/>

/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh {
  var slice = Array.prototype.slice;

  import getThenFunction = Helpers.getThenFunction;
  import createRace = Collection.createRace;
  import createAll = Collection.createAll;
  import createSome = Collection.createSome;
  import createAny = Collection.createAny;

  export type Result = Thenable | any;
  export type Reason = any;
  export type ResultOrArray = Result | any[];
  export type ResultOrReason = Result | Reason;
  export type Resolver = (result?: Result) => void;
  export type Rejecter = (reason?: Reason) => void;
  export type Finalizer = () => void;
  export type Executor = (resolve: Resolver, reject: Rejecter) => void;
  export type NodeCallback = (err: any, arg?: any) => void;

  export enum State {
    Fulfilled = 1,
    Rejected = 2,
    Resolving = 3
  }

  export interface Thenable {
    then(onFulfilled?: Resolver, onRejected?: Rejecter): Thenable;
  }

  export interface CommonConstructable {
    new(executor: Executor): Common;
  }

  export class Common implements Thenable {
    protected _state: State;
    protected _result: ResultOrReason;

    constructor(executor: Executor) {
      // no-op
    }

    public isPending(): boolean {
      return !(this._state && this._state !== State.Resolving);
    }

    public isSettled(): boolean {
      return !!(this._state && this._state !== State.Resolving);
    }

    public isFulfilled(): boolean {
      return this._state === State.Fulfilled;
    }

    public isRejected(): boolean {
      return this._state === State.Rejected;
    }

    public getResult(): Result {
      if ( this._state === State.Fulfilled ) {
        return this._result;
      }
      throw new Error("Can't retrieve result if not fulfilled");
    }

    public getReason(): Reason {
      if ( this._state === State.Rejected ) {
        return this._result;
      }
      throw new Error("Can't retrieve reason if not rejected");
    }

    public resolve(result?: Result): void {
      throw new Error("Not implemented");
    }

    public reject(reason?: Reason): void {
      throw new Error("Not implemented");
    }

    public done(onFulfilled?: Resolver, onRejected?: Rejecter): void {
      throw new Error("Not implemented");
    }

    public then(onFulfilled?: Resolver, onRejected?: Rejecter): Common {
      throw new Error("Not implemented");
    }

    public catch(onRejected?: Rejecter): Common {
      return this.then(undefined, onRejected);
    }

    public finally(onFinally?: Finalizer): Common {
      return this.then(onFulfilled, onRejected);

      function onFulfilled(result?: Result): Result {
        try {
          onFinally();
        }
        finally {
          return result;
        }
      }

      function onRejected(reason?: Reason): Result {
        try {
          onFinally();
        }
        finally {
          throw reason;
        }
      }
    }

    public toNode(callback: NodeCallback): Common {
      return this.then(onFulfilled, onRejected);

      function onFulfilled(result?: Result): Result {
        try {
          callback(null, result);
        }
        finally {
          return result;
        }
      }

      function onRejected(reason?: Reason): Result {
        try {
          callback(reason);
        }
        finally {
          throw reason;
        }
      }
    }

    public toPromise(): Common {
      return convertUsing(this, Welsh.Promise);
    }

    public toDeferred(): Common {
      return convertUsing(this, Welsh.Deferred);
    }

    public race(): Common {
      return createRace(this);
    }

    public all(): Common {
      return createAll(this);
    }

    public some(count: number): Common {
      return createSome(this, count);
    }

    public any(): Common {
      return createAny(this);
    }

    static resolve(result?: Result): Common {
      if ( result instanceof this ) {
        return result;
      }
      return new this(function (resolve) {
        resolve(result);
      });
    }

    static reject(reason?: Reason): Common {
      return new this(function (resolve, reject) {
        reject(reason);
      });
    }

    static fromNode(nodeFunction: Function): Function {
      var constructor = this;
      return nodeWrapper;

      function nodeWrapper() {
        var wrapperArguments = arguments;
        return new constructor(function (resolve, reject) {
          var args = slice.call(wrapperArguments).concat(callback);
          nodeFunction.apply(null, args);

          function callback(err: any) {
            if ( err ) {
              reject(err);
              return;
            }
            resolve(slice.call(arguments, 1));
          }
        });
      }
    }

    static all(resultOrArray: ResultOrArray): Common {
      return this.resolve(resultOrArray).all();
    }

    static race(resultOrArray: ResultOrArray): Common {
      return this.resolve(resultOrArray).race();
    }

    static some(resultOrArray: ResultOrArray, count: number): Common {
      return this.resolve(resultOrArray).some(count);
    }

    static any(resultOrArray: ResultOrArray): Common {
      return this.resolve(resultOrArray).any();
    }

    static lazy(executor: Executor): Common {
      var resolve: Resolver;
      var reject: Rejecter;
      var called: boolean;

      var deferred = new this(function (_resolve, _reject) {
        resolve = _resolve;
        reject = _reject;
      });

      var originalThen = getThenFunction(deferred);
      deferred.then = function (onFulfilled, onRejected) {
        if ( !called ) {
          deferred.then = originalThen;
          called = true;
          executor(resolve, reject);
        }
        return originalThen(onFulfilled, onRejected);
      };

      return deferred;
    }
  }

  function convertUsing(deferred: Thenable, constructor: CommonConstructable) {
    return new constructor(function (resolve: Resolver, reject: Rejecter) {
      var then = getThenFunction(deferred);
      then(onFulfilled, onRejected);

      function onFulfilled(result?: Result): Result {
        resolve(result);
        return result;
      }

      function onRejected(reason?: Reason): Result {
        reject(reason);
        throw reason;
      }
    });
  }
}
