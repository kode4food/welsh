/// <reference path="./Helpers.ts"/>
/// <reference path="./WelshBase.ts"/>
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

  var fulfilledState = 1;
  var rejectedState = 2;

  export class Promise extends WelshBase {
    constructor(executor) {
      super();

      var state, settledResult, branched, pendingHandlers;
      var self = this;

      this.then = createThen;

      if (typeof executor !== 'function') {
        reject(new Error("Promise requires an Executor Function"));
        return;
      }
      doResolve(executor);

      function resolve(result) {
        if (state) {
          return;
        }
        if (self === result) {
          reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
          return;
        }
        try {
          var then = getThenFunction(result);
          if (then) {
            doResolve(then);
            return;
          }
          state = fulfilledState;
          settledResult = result;
          queueCall(notifyPending);
        }
        catch (err) {
          reject(err);
        }
      }

      function reject(reason) {
        if (state) {
          return;
        }
        state = rejectedState;
        settledResult = reason;
        queueCall(notifyPending);
      }

      function doResolve(executor) {
        var done;
        try {
          executor(wrappedResolve, wrappedReject);
        }
        catch (err) {
          if (done) {
            return;
          }
          reject(err);
        }

        function wrappedResolve(result) {
          if (done) {
            return;
          }
          done = true;
          resolve(result);
        }

        function wrappedReject(reason) {
          if (done) {
            return;
          }
          done = true;
          reject(reason);
        }
      }

      function createThen(onFulfilled, onRejected) {
        var resolve, reject;
        addPending(fulfilledHandler, rejectedHandler);
        return new Promise(function (_resolve, _reject) {
          resolve = _resolve;
          reject = _reject;
        });

        function fulfilledHandler(result) {
          if (typeof onFulfilled !== 'function') {
            resolve(result);
            return;
          }
          try {
            resolve(onFulfilled(result));
          }
          catch (err) {
            reject(err);
          }
        }

        function rejectedHandler(reason) {
          if (typeof onRejected !== 'function') {
            reject(reason);
            return;
          }
          try {
            resolve(onRejected(reason));
          }
          catch (err) {
            reject(err);
          }
        }
      }

      function addPending(onFulfilled, onRejected) {
        if (state) {
          queueCall(function () {
            (state === fulfilledState ? onFulfilled : onRejected)(settledResult);
          });
          return;
        }

        var item = [undefined, onFulfilled, onRejected];
        if (!pendingHandlers) {
          pendingHandlers = item;
          return;
        }

        if (!branched) {
          pendingHandlers = [pendingHandlers, item];
          branched = true;
          return;
        }

        pendingHandlers[pendingHandlers.length] = item;
      }

      function notifyPending() {
        if (!pendingHandlers) {
          return;
        }
        if (branched) {
          for (var i = 0, len = pendingHandlers.length; i < len; i++) {
            pendingHandlers[i][state](settledResult);
          }
        }
        else {
          pendingHandlers[state](settledResult);
        }
        pendingHandlers = null;
        branched = false;
      }
    }
  }
}
