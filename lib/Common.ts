/// <reference path="./Helpers.ts"/>

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

  import tryCatch = Helpers.tryCatch;
  import getThenFunction = Helpers.getThenFunction;

  export type Result = Thenable | any;
  export type Reason = any;
  export type ResultOrReason = Result | Reason;
  export type Resolver = (result?: Result) => void;
  export type Rejecter = (reason?: Reason) => void;
  export type Finalizer = () => void;
  export type Executor = (resolve: Resolver, reject: Rejecter) => void;
  export type NodeCallback = (err: any, arg?: any) => void;

  export enum State {
    fulfilledState = 1,
    rejectedState = 2
  }

  export interface Thenable {
    then(onFulfilled?: Resolver, onRejected?: Rejecter): Thenable;
  }

  interface CommonConstructable {
    new(executor: Executor): Common;
  }

  export class Common implements Thenable {
    constructor(executor: Executor) {
      // no-op
    }

    then(onFulfilled?: Resolver, onRejected?: Rejecter): Common {
      throw new Error("Not implemented");
    }

    catch(onRejected?: Rejecter): Common {
      return this.then(undefined, onRejected);
    }

    finally(onFinally?: Finalizer): Common {
      return this.then(wrappedFulfilled, wrappedRejected);

      function wrappedFulfilled(result?: Result) {
        tryCatch(onFinally);
        return result;
      }

      function wrappedRejected(reason?: Reason) {
        tryCatch(onFinally);
        throw reason;
      }
    }

    toNode(callback: NodeCallback): Common {
      return this.then(wrappedFulfilled, wrappedRejected);

      function wrappedFulfilled(result?: Result) {
        try {
          callback(null, result);
        }
        finally {
          return result;
        }
      }

      function wrappedRejected(reason?: Reason) {
        try {
          callback(reason);
        }
        finally {
          throw reason;
        }
      }
    }

    toPromise(): Common {
      return convertUsing(this, Welsh.Promise);
    }

    toDeferred(): Common {
      return convertUsing(this, Welsh.Deferred);
    }

    static resolve(result?: Result): Common {
      return new this(function (resolve) {
        resolve(result);
      });
    }

    static reject(reason?: Reason): Common {
      return new this(function (resolve, reject) {
        reject(reason);
      });
    }

    static race(...thenables: Thenable[]): Common {
      return new this(function (resolve, reject) {
        try {
          for ( var i = 0, len = thenables.length; i < len; i++ ) {
            var value = thenables[i];
            var then = getThenFunction(value);
            if ( then ) {
              then(resolve, reject);
              continue;
            }
            resolve(value);
          }
        }
        catch ( err ) {
          reject(err);
        }
      });
    }

    static all(...thenables: Thenable[]): Common {
      return new this(function (resolve, reject) {
        var waitingFor = thenables.length;

        for ( var i = 0, len = waitingFor; i < len; i++ ) {
          var then = getThenFunction(thenables[i]);
          if ( then ) {
            resolveThenAtIndex(then, i);
            continue;
          }
          waitingFor--;
        }

        if ( !waitingFor ) {
          resolve(thenables);
        }

        function resolveThenAtIndex(then: Function, index: number) {
          then(wrappedResolve, wrappedReject);

          function wrappedResolve(result?: Result) {
            thenables[index] = result;
            if ( !--waitingFor ) {
              resolve(thenables);
            }
            return result;
          }

          function wrappedReject(reason?: Reason) {
            reject(reason);
            throw reason;
          }
        }
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
      then(wrappedResolve, wrappedReject);

      function wrappedResolve(result?: Result) {
        resolve(result);
        return result;
      }

      function wrappedReject(reason?: Reason) {
        reject(reason);
        throw reason;
      }
    });
  }
}
