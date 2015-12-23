/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

const slice = Array.prototype.slice;

import { getThenFunction, tryCall, TryError } from './Helpers';
import { resolvePath } from './Property';
import { createRace, createAll, createSome, createAny } from './Collection';
import { nextTick } from "./Scheduler";

export type Result = Thenable | any;
export type Reason = any;
export type ResultOrArray = Result | any[];
export type ResultOrReason = Result | Reason;
export type Resolve = (result?: Result) => void;
export type Reject = (reason?: Reason) => void;
export type Fulfilled = (result?: Result) => Result;
export type Rejected = (reason?: Reason) => Result;
export type FulfilledOrRejected = Fulfilled | Rejected;
export type Finalizer = () => void;
export type Executor = (resolve: Resolve, reject: Reject) => void;
export type NodeCallback = (err: any, arg?: any) => void;
export type PathIndex = String | Number | symbol | any;

export enum State {
  Fulfilled = 1,
  Rejected = 2,
  Resolving = 3
}

export interface Thenable {
  then(onFulfilled?: Fulfilled, onRejected?: Rejected): Thenable;
}

export interface CommonConstructable {
  new(executor: Executor): Common;
}

export default class Common implements Thenable {
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

  /* istanbul ignore next */
  public resolve(result?: Result): void {
    throw new Error("Not implemented");
  }

  /* istanbul ignore next */
  public reject(reason?: Reason): void {
    throw new Error("Not implemented");
  }

  /* istanbul ignore next */
  public then(onFulfilled?: Fulfilled, onRejected?: Rejected): Common {
    throw new Error("Not implemented");
  }

  public done(onFulfilled?: Resolve, onRejected?: Reject): Common {
    return this.then(wrapFulfilled, wrapRejected);

    function wrapFulfilled(result?: Result): Result {
      if ( typeof onFulfilled !== 'function' ) {
        return result;
      }
      let tryResult = tryCall(onFulfilled, result);
      if ( tryResult === TryError ) {
        let err = tryResult.reason;
        nextTick(() => {
          throw err;
        });
      }
      return result;
    }

    function wrapRejected(reason?: Reason): Result {
      if ( typeof onRejected !== 'function' ) {
        throw reason;
      }
      let tryResult = tryCall(onRejected, reason);
      if ( tryResult === TryError ) {
        let err = tryResult.reason;
        nextTick(() => {
          throw err;
        });
      }
      throw reason;
    }
  }

  public "catch"(onRejected?: Rejected): Common {
    return this.then(undefined, onRejected);
  }

  public "finally"(onFinally?: Finalizer): Common {
    return this.done(onFinally, onFinally);
  }

  public toNode(callback: NodeCallback): Common {
    return this.done(onFulfilled, onRejected);

    function onFulfilled(result?: Result): Result {
      callback(null, result);
    }

    function onRejected(reason?: Reason): Result {
      callback(reason);
    }
  }

  public toPromise(): Common {
    let Promise = require("./Promise").default;
    return convertUsing(this, Promise);
  }

  public toDeferred(): Common {
    let Deferred = require("./Deferred").default;
    return convertUsing(this, Deferred);
  }

  public path(path: PathIndex): Common {
    return resolvePath(this, path);
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
    let constructor = this;
    return nodeWrapper;

    function nodeWrapper() {
      let wrapperArguments = arguments;
      return new constructor(function (resolve, reject) {
        let args = slice.call(wrapperArguments).concat(callback);
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

  static path(resultOrArray: ResultOrArray, path: PathIndex[]): Common {
    return this.resolve(resultOrArray).path(path);
  }

  static race(resultOrArray: ResultOrArray): Common {
    return this.resolve(resultOrArray).race();
  }

  static all(resultOrArray: ResultOrArray): Common {
    return this.resolve(resultOrArray).all();
  }

  static some(resultOrArray: ResultOrArray, count: number): Common {
    return this.resolve(resultOrArray).some(count);
  }

  static any(resultOrArray: ResultOrArray): Common {
    return this.resolve(resultOrArray).any();
  }

  static lazy(executor: Executor): Common {
    let resolve: Resolve;
    let reject: Reject;
    let called: boolean;

    let deferred = new this(function (_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });

    let originalThen = getThenFunction(deferred);
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
  return new constructor(function (resolve: Resolve, reject: Reject) {
    let then = getThenFunction(deferred);
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
