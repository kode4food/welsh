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
  import tryCatch = Helpers.tryCatch;
  import getThenFunction = Helpers.getThenFunction;

  export type Resolver = (result?: any) => void;
  export type Rejecter = (reason?: any) => void;
  export type Finalizer = () => void;
  export type Executor = (resolve: Resolver, reject: Rejecter) => void;
  export type NodeCallback = (err: any, result?: any) => void;

  export interface Thenable {
    then(onFulfilled?: Resolver, onRejected?: Rejecter): Thenable;
  }

  export class WelshBase implements Thenable {
    then(onFulfilled, onRejected): WelshBase {
      throw new Error("Not implemented");
    }

    catch(onRejected?: Rejecter): WelshBase {
      return this.then(undefined, onRejected);
    }

    finally(onFinally?: Finalizer): WelshBase {
      return this.then(wrappedFulfilled, wrappedRejected);

      function wrappedFulfilled(result) {
        tryCatch(onFinally);
        return result;
      }

      function wrappedRejected(reason) {
        tryCatch(onFinally);
        throw reason;
      }
    }

    toNode(callback: NodeCallback): Thenable {
      return this.then(wrappedFulfilled, wrappedRejected);

      function wrappedFulfilled(result) {
        try {
          callback(null, result);
        }
        finally {
          return result;
        }
      }

      function wrappedRejected(reason) {
        try {
          callback(reason);
        }
        finally {
          throw reason;
        }
      }
    }

    toPromise(): WelshBase {
      return convertUsing(this, Welsh.Promise);
    }

    toDeferred(): WelshBase {
      return convertUsing(this, Welsh.Deferred);
    }
  }

  function convertUsing(deferred, Constructor) {
    return new Constructor(function (resolve, reject) {
      var then = getThenFunction(deferred);
      then(wrappedResolve, wrappedReject);

      function wrappedResolve(result) {
        resolve(result);
        return result;
      }

      function wrappedReject(reason) {
        reject(reason);
        throw reason;
      }
    });
  }
}
