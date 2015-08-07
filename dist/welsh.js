(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global window */
"use strict";
window.welsh = require('./dist/welsh-node');

},{"./dist/welsh-node":2}],2:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
var Welsh;
(function (Welsh) {
    var Helpers;
    (function (Helpers) {
        Helpers.bindThis = (function () {
            if (Function.prototype.bind) {
                return function (func, thisVal) {
                    return func.bind(thisVal);
                };
            }
            return function (func, thisVal) {
                return function () {
                    return func.apply(thisVal, arguments);
                };
            };
        }());
        function getThenFunction(value) {
            if (!value) {
                return null;
            }
            var valueType = typeof value;
            if (valueType !== 'object' && valueType !== 'function') {
                return null;
            }
            var then = value.then;
            if (typeof then !== 'function') {
                return null;
            }
            return Helpers.bindThis(then, value);
        }
        Helpers.getThenFunction = getThenFunction;
    })(Helpers = Welsh.Helpers || (Welsh.Helpers = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var slice = Array.prototype.slice;
    var getThenFunction = Welsh.Helpers.getThenFunction;
    (function (State) {
        State[State["Fulfilled"] = 1] = "Fulfilled";
        State[State["Rejected"] = 2] = "Rejected";
    })(Welsh.State || (Welsh.State = {}));
    var State = Welsh.State;
    var Common = (function () {
        function Common(executor) {
        }
        Common.prototype.then = function (onFulfilled, onRejected) {
            throw new Error("Not implemented");
        };
        Common.prototype.catch = function (onRejected) {
            return this.then(undefined, onRejected);
        };
        Common.prototype.finally = function (onFinally) {
            return this.then(wrappedFulfilled, wrappedRejected);
            function wrappedFulfilled(result) {
                try {
                    onFinally();
                }
                finally {
                    return result;
                }
            }
            function wrappedRejected(reason) {
                try {
                    onFinally();
                }
                finally {
                    throw reason;
                }
            }
        };
        Common.prototype.toNode = function (callback) {
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
        };
        Common.prototype.toPromise = function () {
            return convertUsing(this, Welsh.Promise);
        };
        Common.prototype.toDeferred = function () {
            return convertUsing(this, Welsh.Deferred);
        };
        Common.resolve = function (result) {
            return new this(function (resolve) {
                resolve(result);
            });
        };
        Common.reject = function (reason) {
            return new this(function (resolve, reject) {
                reject(reason);
            });
        };
        Common.race = function () {
            var thenables = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                thenables[_i - 0] = arguments[_i];
            }
            return new this(function (resolve, reject) {
                try {
                    for (var i = 0, len = thenables.length; i < len; i++) {
                        var value = thenables[i];
                        var then = getThenFunction(value);
                        if (then) {
                            then(resolve, reject);
                            continue;
                        }
                        resolve(value);
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        };
        Common.all = function () {
            var thenables = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                thenables[_i - 0] = arguments[_i];
            }
            return new this(function (resolve, reject) {
                var waitingFor = thenables.length;
                for (var i = 0, len = waitingFor; i < len; i++) {
                    var then = getThenFunction(thenables[i]);
                    if (then) {
                        resolveThenAtIndex(then, i);
                        continue;
                    }
                    waitingFor--;
                }
                if (!waitingFor) {
                    resolve(thenables);
                }
                function resolveThenAtIndex(then, index) {
                    then(wrappedResolve, wrappedReject);
                    function wrappedResolve(result) {
                        thenables[index] = result;
                        if (!--waitingFor) {
                            resolve(thenables);
                        }
                        return result;
                    }
                    function wrappedReject(reason) {
                        reject(reason);
                        throw reason;
                    }
                }
            });
        };
        Common.fromNode = function (nodeFunction) {
            var constructor = this;
            return nodeWrapper;
            function nodeWrapper() {
                var wrapperArguments = arguments;
                return new constructor(function (resolve, reject) {
                    var args = slice.call(wrapperArguments).concat(callback);
                    nodeFunction.apply(null, args);
                    function callback(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(slice.call(arguments, 1));
                    }
                });
            }
        };
        Common.lazy = function (executor) {
            var resolve;
            var reject;
            var called;
            var deferred = new this(function (_resolve, _reject) {
                resolve = _resolve;
                reject = _reject;
            });
            var originalThen = getThenFunction(deferred);
            deferred.then = function (onFulfilled, onRejected) {
                if (!called) {
                    deferred.then = originalThen;
                    called = true;
                    executor(resolve, reject);
                }
                return originalThen(onFulfilled, onRejected);
            };
            return deferred;
        };
        return Common;
    })();
    Welsh.Common = Common;
    function convertUsing(deferred, constructor) {
        return new constructor(function (resolve, reject) {
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
})(Welsh || (Welsh = {}));
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
var Welsh;
(function (Welsh) {
    var Queue;
    (function (Queue) {
        var queue = [];
        var nextTick = (function () {
            if (typeof setImmediate === 'function') {
                return setImmediate;
            }
            if (typeof window === 'object' &&
                typeof window.requestAnimationFrame === 'function') {
                return window.requestAnimationFrame;
            }
            if (typeof setTimeout === 'function') {
                return setTimeout;
            }
            throw new Error("And I should schedule Promises how?");
        }());
        function queueCall(callback) {
            if (!queue.length) {
                nextTick(performCalls);
            }
            queue[queue.length] = callback;
        }
        Queue.queueCall = queueCall;
        function performCalls() {
            for (var i = 0; i < queue.length; i++) {
                queue[i]();
            }
            queue = [];
        }
    })(Queue = Welsh.Queue || (Welsh.Queue = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
/// <reference path="./Queue.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Welsh;
(function (Welsh) {
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var queueCall = Welsh.Queue.queueCall;
    var Promise = (function (_super) {
        __extends(Promise, _super);
        function Promise(executor) {
            _super.call(this, executor);
            if (typeof executor !== 'function') {
                this.reject(new Error("Promise requires an Executor Function"));
                return;
            }
            this.doResolve(executor);
        }
        Promise.prototype.resolve = function (result) {
            var _this = this;
            if (this._state) {
                return;
            }
            if (this === result) {
                this.reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
                return;
            }
            try {
                var then = getThenFunction(result);
                if (then) {
                    this.doResolve(then);
                    return;
                }
                this._state = Welsh.State.Fulfilled;
                this._settledResult = result;
                queueCall(function () { _this.notifyPending(); });
            }
            catch (err) {
                this.reject(err);
            }
        };
        Promise.prototype.reject = function (reason) {
            var _this = this;
            if (this._state) {
                return;
            }
            this._state = Welsh.State.Rejected;
            this._settledResult = reason;
            queueCall(function () { _this.notifyPending(); });
        };
        Promise.prototype.doResolve = function (executor) {
            var self = this;
            var done;
            try {
                executor(wrappedResolve, wrappedReject);
            }
            catch (err) {
                if (done) {
                    return;
                }
                this.reject(err);
            }
            function wrappedResolve(result) {
                if (done) {
                    return;
                }
                done = true;
                self.resolve(result);
            }
            function wrappedReject(reason) {
                if (done) {
                    return;
                }
                done = true;
                self.reject(reason);
            }
        };
        Promise.prototype.then = function (onFulfilled, onRejected) {
            var resolve;
            var reject;
            this.addPending(fulfilledHandler, rejectedHandler);
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
        };
        Promise.prototype.addPending = function (onFulfilled, onRejected) {
            var _this = this;
            var state = this._state;
            if (state) {
                var callback;
                if (state === Welsh.State.Fulfilled) {
                    callback = onFulfilled;
                }
                else {
                    callback = onRejected;
                }
                queueCall(function () { callback(_this._settledResult); });
                return;
            }
            var item = [undefined, onFulfilled, onRejected];
            var pendingHandlers = this._pendingHandlers;
            if (!pendingHandlers) {
                this._pendingHandlers = item;
                return;
            }
            if (!this._branched) {
                this._pendingHandlers = [pendingHandlers, item];
                this._branched = true;
                return;
            }
            pendingHandlers[pendingHandlers.length] = item;
        };
        Promise.prototype.notifyPending = function () {
            var pendingHandlers = this._pendingHandlers;
            if (!pendingHandlers) {
                return;
            }
            var state = this._state;
            var settledResult = this._settledResult;
            if (this._branched) {
                for (var i = 0, len = pendingHandlers.length; i < len; i++) {
                    pendingHandlers[i][state](settledResult);
                }
            }
            else {
                pendingHandlers[state](settledResult);
            }
            this._pendingHandlers = null;
            this._branched = false;
        };
        return Promise;
    })(Welsh.Common);
    Welsh.Promise = Promise;
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var Deferred = (function (_super) {
        __extends(Deferred, _super);
        function Deferred(executor) {
            _super.call(this, executor);
            this._pendingHandlers = [];
            this._pendingIndex = 0;
            var self = this;
            if (typeof executor !== 'function') {
                reject(new Error("Deferred requires an Executor Function"));
                return;
            }
            try {
                executor(resolve, reject);
            }
            catch (err) {
                reject(err);
            }
            function resolve(result) {
                self.start(Welsh.State.Fulfilled, result);
            }
            function reject(reason) {
                self.start(Welsh.State.Rejected, reason);
            }
        }
        Deferred.prototype.start = function (newState, result) {
            if (this._state) {
                return;
            }
            this._state = newState;
            this.proceed(result);
        };
        Deferred.prototype.then = function (onFulfilled, onRejected) {
            var pendingHandlers = this._pendingHandlers;
            pendingHandlers[pendingHandlers.length] = [
                undefined, onFulfilled, onRejected
            ];
            if (this._state && !this._running) {
                this.proceed(this._pendingResult);
            }
            return this;
        };
        Deferred.prototype.proceed = function (result) {
            this._running = true;
            var pendingHandlers = this._pendingHandlers;
            var pendingIndex = this._pendingIndex;
            var state = this._state;
            do {
                var then = getThenFunction(result);
                if (then) {
                    this._pendingIndex = pendingIndex;
                    this._state = state;
                    var self = this;
                    then(fulfilledLinker, rejectedLinker);
                    return;
                }
                if (pendingIndex >= pendingHandlers.length) {
                    break;
                }
                var callback = pendingHandlers[pendingIndex++][state];
                if (typeof callback === 'function') {
                    try {
                        result = callback(result);
                        state = Welsh.State.Fulfilled;
                    }
                    catch (reason) {
                        result = reason;
                        state = Welsh.State.Rejected;
                    }
                }
            } while (true);
            this._pendingResult = result;
            this._pendingHandlers = [];
            this._pendingIndex = 0;
            this._state = state;
            this._running = false;
            function fulfilledLinker(result) {
                self._state = Welsh.State.Fulfilled;
                self.proceed(result);
                return result;
            }
            function rejectedLinker(reason) {
                self._state = Welsh.State.Rejected;
                self.proceed(reason);
                throw reason;
            }
        };
        return Deferred;
    })(Welsh.Common);
    Welsh.Deferred = Deferred;
})(Welsh || (Welsh = {}));
/// <reference path="./Promise.ts"/>
/// <reference path="./Deferred.ts"/>
"use strict";
/// <reference path="./typings/node/node.d.ts"/>
/// <reference path="./lib/Welsh.ts"/>
"use strict";
module.exports = Welsh;

},{}]},{},[1]);
