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
        var objectToString = Object.prototype.toString;
        Helpers.TryError = { reason: null };
        if (!Array.isArray) {
            Array.isArray = function (obj) {
                return obj && objectToString.call(obj) === '[object Array]';
            };
        }
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
        function tryCall(func, arg1, arg2) {
            try {
                return func(arg1, arg2);
            }
            catch (err) {
                Helpers.TryError.reason = err;
                return Helpers.TryError;
            }
        }
        Helpers.tryCall = tryCall;
    })(Helpers = Welsh.Helpers || (Welsh.Helpers = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var Collection;
    (function (Collection) {
        var getThenFunction = Welsh.Helpers.getThenFunction;
        function process(instance, processor) {
            var Constructor = instance.constructor;
            return new Constructor(function (resolve, reject) {
                instance.done(function (result) {
                    if (!Array.isArray(result)) {
                        reject(new TypeError("Result containing a Collection is required"));
                        return;
                    }
                    processor(result.slice(), resolve, reject);
                }, reject);
            });
        }
        function createRace(instance) {
            return process(instance, function (array, resolve, reject) {
                if (array.length === 0) {
                    reject(new Error("Array provided to race() is empty"));
                    return;
                }
                for (var i = 0, len = array.length; i < len; i++) {
                    var value = array[i];
                    var then = getThenFunction(value);
                    if (then) {
                        then(resolve, reject);
                        continue;
                    }
                    resolve(value);
                }
            });
        }
        Collection.createRace = createRace;
        function createAll(instance) {
            return process(instance, function (array, resolve, reject) {
                var waitingFor = array.length;
                for (var i = 0, len = waitingFor; i < len; i++) {
                    var then = getThenFunction(array[i]);
                    if (then) {
                        resolveThenAtIndex(then, i);
                        continue;
                    }
                    waitingFor--;
                }
                if (waitingFor === 0) {
                    resolve(array);
                }
                function resolveThenAtIndex(then, index) {
                    then(onFulfilled, onRejected);
                    function onFulfilled(result) {
                        array[index] = result;
                        if (--waitingFor === 0) {
                            resolve(array);
                        }
                        return result;
                    }
                    function onRejected(reason) {
                        reject(reason);
                        throw reason;
                    }
                }
            });
        }
        Collection.createAll = createAll;
        function createAny(instance) {
            return createSome(instance, 1).then(function (array) {
                return array[0];
            });
        }
        Collection.createAny = createAny;
        function createSome(instance, count) {
            return process(instance, function (array, resolve, reject) {
                var results = [];
                var waitingFor = array.length;
                if (typeof count !== 'number' || count < 0) {
                    reject(new Error("Can't wait for " + count + " Results"));
                    return;
                }
                if (count > waitingFor) {
                    reject(new Error(count + " Result(s) can never be fulfilled"));
                    return;
                }
                if (count === 0) {
                    resolve([]);
                    return;
                }
                for (var i = 0, len = waitingFor; i < len; i++) {
                    var value = array[i];
                    var then = getThenFunction(value);
                    if (then) {
                        then(onFulfilled, onRejected);
                        continue;
                    }
                    provideResult(value);
                }
                function onFulfilled(result) {
                    provideResult(result);
                    return result;
                }
                function onRejected(reason) {
                    decrementWaiting();
                    throw reason;
                }
                function provideResult(result) {
                    if (count === 0) {
                        return;
                    }
                    results[results.length] = result;
                    if (--count === 0) {
                        resolve(results);
                        waitingFor = 0;
                        return;
                    }
                    decrementWaiting();
                }
                function decrementWaiting() {
                    if (waitingFor === 0) {
                        return;
                    }
                    if (--waitingFor === 0 && count > 0) {
                        reject(new Error(count + " Result(s) not fulfilled"));
                    }
                }
            });
        }
        Collection.createSome = createSome;
    })(Collection = Welsh.Collection || (Welsh.Collection = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Collection.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var slice = Array.prototype.slice;
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var tryCall = Welsh.Helpers.tryCall;
    var TryError = Welsh.Helpers.TryError;
    var createRace = Welsh.Collection.createRace;
    var createAll = Welsh.Collection.createAll;
    var createSome = Welsh.Collection.createSome;
    var createAny = Welsh.Collection.createAny;
    (function (State) {
        State[State["Fulfilled"] = 1] = "Fulfilled";
        State[State["Rejected"] = 2] = "Rejected";
        State[State["Resolving"] = 3] = "Resolving";
    })(Welsh.State || (Welsh.State = {}));
    var State = Welsh.State;
    var Common = (function () {
        function Common(executor) {
        }
        Common.prototype.isPending = function () {
            return !(this._state && this._state !== State.Resolving);
        };
        Common.prototype.isSettled = function () {
            return !!(this._state && this._state !== State.Resolving);
        };
        Common.prototype.isFulfilled = function () {
            return this._state === State.Fulfilled;
        };
        Common.prototype.isRejected = function () {
            return this._state === State.Rejected;
        };
        Common.prototype.getResult = function () {
            if (this._state === State.Fulfilled) {
                return this._result;
            }
            throw new Error("Can't retrieve result if not fulfilled");
        };
        Common.prototype.getReason = function () {
            if (this._state === State.Rejected) {
                return this._result;
            }
            throw new Error("Can't retrieve reason if not rejected");
        };
        Common.prototype.resolve = function (result) {
            throw new Error("Not implemented");
        };
        Common.prototype.reject = function (reason) {
            throw new Error("Not implemented");
        };
        Common.prototype.then = function (onFulfilled, onRejected) {
            throw new Error("Not implemented");
        };
        Common.prototype.done = function (onFulfilled, onRejected) {
            return this.then(wrapFulfilled, wrapRejected);
            function wrapFulfilled(result) {
                if (typeof onFulfilled !== 'function') {
                    return result;
                }
                var tryResult = tryCall(onFulfilled, result);
                if (tryResult === TryError) {
                    var err = tryResult.reason;
                    Welsh.GlobalScheduler.queue(function () { throw err; });
                }
                return result;
            }
            function wrapRejected(reason) {
                if (typeof onRejected !== 'function') {
                    throw reason;
                }
                var tryResult = tryCall(onRejected, reason);
                if (tryResult === TryError) {
                    var err = tryResult.reason;
                    Welsh.GlobalScheduler.queue(function () { throw err; });
                }
                throw reason;
            }
        };
        Common.prototype["catch"] = function (onRejected) {
            return this.then(undefined, onRejected);
        };
        Common.prototype["finally"] = function (onFinally) {
            return this.done(onFinally, onFinally);
        };
        Common.prototype.toNode = function (callback) {
            return this.done(onFulfilled, onRejected);
            function onFulfilled(result) {
                callback(null, result);
            }
            function onRejected(reason) {
                callback(reason);
            }
        };
        Common.prototype.toPromise = function () {
            return convertUsing(this, Welsh.Promise);
        };
        Common.prototype.toDeferred = function () {
            return convertUsing(this, Welsh.Deferred);
        };
        Common.prototype.race = function () {
            return createRace(this);
        };
        Common.prototype.all = function () {
            return createAll(this);
        };
        Common.prototype.some = function (count) {
            return createSome(this, count);
        };
        Common.prototype.any = function () {
            return createAny(this);
        };
        Common.resolve = function (result) {
            if (result instanceof this) {
                return result;
            }
            return new this(function (resolve) {
                resolve(result);
            });
        };
        Common.reject = function (reason) {
            return new this(function (resolve, reject) {
                reject(reason);
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
        Common.all = function (resultOrArray) {
            return this.resolve(resultOrArray).all();
        };
        Common.race = function (resultOrArray) {
            return this.resolve(resultOrArray).race();
        };
        Common.some = function (resultOrArray, count) {
            return this.resolve(resultOrArray).some(count);
        };
        Common.any = function (resultOrArray) {
            return this.resolve(resultOrArray).any();
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
            then(onFulfilled, onRejected);
            function onFulfilled(result) {
                resolve(result);
                return result;
            }
            function onRejected(reason) {
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
    var Scheduler = (function () {
        function Scheduler() {
            this._capacity = 16 * 3;
            this._isFlushing = false;
            this._queueIndex = 0;
            this._queueLength = 0;
        }
        Scheduler.prototype.queue = function (callback, target, arg) {
            var _this = this;
            var queueLength = this._queueLength;
            this[queueLength] = callback;
            this[queueLength + 1] = target;
            this[queueLength + 2] = arg;
            this._queueLength = queueLength + 3;
            if (!this._isFlushing) {
                this._isFlushing = true;
                nextTick(function () { _this.flushQueue(); });
            }
        };
        Scheduler.prototype.collapseQueue = function () {
            var queueIndex = this._queueIndex;
            var queueLength = this._queueLength;
            for (var i = 0, len = queueLength - queueIndex; i < len; i++) {
                this[i] = this[queueIndex + i];
            }
            while (i < queueLength) {
                this[i++] = undefined;
            }
            this._queueIndex = 0;
            this._queueLength = len;
        };
        Scheduler.prototype.flushQueue = function () {
            while (this._queueIndex < this._queueLength) {
                var queueIndex = this._queueIndex;
                var callback = this[queueIndex];
                var target = this[queueIndex + 1];
                var arg = this[queueIndex + 2];
                this._queueIndex = queueIndex + 3;
                if (this._queueLength > this._capacity) {
                    this.collapseQueue();
                }
                callback.call(target, arg);
            }
            this._isFlushing = false;
        };
        return Scheduler;
    })();
    Welsh.Scheduler = Scheduler;
    Welsh.GlobalScheduler = new Scheduler();
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
/// <reference path="./Scheduler.ts"/>
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
    var tryCall = Welsh.Helpers.tryCall;
    var TryError = Welsh.Helpers.TryError;
    function noOp() { }
    var Promise = (function (_super) {
        __extends(Promise, _super);
        function Promise(executor) {
            _super.call(this, executor);
            this._pendingLength = 0;
            if (executor === noOp) {
                return;
            }
            else if (typeof executor !== 'function') {
                this.reject(new Error("Promise requires an Executor Function"));
                return;
            }
            this.doResolve(executor);
        }
        Promise.prototype.resolve = function (result) {
            if (this._state) {
                return;
            }
            if (this === result) {
                this.reject(new TypeError("Um, yeah, a Promise can't resolve itself"));
                return;
            }
            var then = tryCall(getThenFunction, result);
            if (then === TryError) {
                this.reject(then.reason);
                return;
            }
            else if (then) {
                this.doResolve(then);
                return;
            }
            this._state = Welsh.State.Fulfilled;
            this._result = result;
            Welsh.GlobalScheduler.queue(this.notifyPending, this);
        };
        Promise.prototype.reject = function (reason) {
            if (this._state) {
                return;
            }
            this._state = Welsh.State.Rejected;
            this._result = reason;
            Welsh.GlobalScheduler.queue(this.notifyPending, this);
        };
        Promise.prototype.doResolve = function (executor) {
            var self = this;
            var done;
            var tryResult = tryCall(executor, onFulfilled, onRejected);
            if (tryResult === TryError) {
                if (done) {
                    return;
                }
                this.reject(tryResult.reason);
            }
            function onFulfilled(result) {
                if (done) {
                    return;
                }
                done = true;
                self.resolve(result);
            }
            function onRejected(reason) {
                if (done) {
                    return;
                }
                done = true;
                self.reject(reason);
            }
        };
        Promise.prototype.then = function (onFulfilled, onRejected) {
            var promise = new Promise(noOp);
            this.addPending(promise, onFulfilled, onRejected);
            return promise;
        };
        Promise.prototype.addPending = function (target, onFulfilled, onRejected) {
            var pending = [target, onFulfilled, onRejected];
            if (this._state) {
                Welsh.GlobalScheduler.queue(this.settlePending, this, pending);
                return;
            }
            var pendingLength = this._pendingLength;
            if (pendingLength === 0) {
                this._pendingHandlers = pending;
                this._pendingLength = 1;
                return;
            }
            if (this._pendingLength === 1) {
                var pendingHandler = this._pendingHandlers;
                this._pendingHandlers = [pendingHandler, pending];
                this._pendingLength = 2;
                return;
            }
            var pendingHandlers = this._pendingHandlers;
            pendingHandlers[this._pendingLength++] = pending;
        };
        Promise.prototype.settlePending = function (pending) {
            var promise = pending[0];
            if (this._state === Welsh.State.Fulfilled) {
                promise.resolvePending(this._result, pending[1]);
            }
            else {
                promise.rejectPending(this._result, pending[2]);
            }
        };
        Promise.prototype.resolvePending = function (result, onFulfilled) {
            if (typeof onFulfilled !== 'function') {
                this.resolve(result);
                return;
            }
            var tryResult = tryCall(onFulfilled, result);
            if (tryResult === TryError) {
                this.reject(tryResult.reason);
            }
            else {
                this.resolve(tryResult);
            }
        };
        Promise.prototype.rejectPending = function (reason, onRejected) {
            if (typeof onRejected !== 'function') {
                this.reject(reason);
                return;
            }
            var tryResult = tryCall(onRejected, reason);
            if (tryResult === TryError) {
                this.reject(tryResult.reason);
            }
            else {
                this.resolve(tryResult);
            }
        };
        Promise.prototype.notifyPending = function () {
            var pendingLength = this._pendingLength;
            if (pendingLength === 0) {
                return;
            }
            if (pendingLength === 1) {
                this.settlePending(this._pendingHandlers);
                this._pendingLength = 0;
                this._pendingHandlers = undefined;
                return;
            }
            var pendingHandlers = this._pendingHandlers;
            for (var i = 0, len = this._pendingLength; i < len; i++) {
                this.settlePending(pendingHandlers[i]);
                pendingHandlers[i] = undefined;
            }
            this._pendingHandlers = null;
            this._pendingLength = 0;
        };
        return Promise;
    })(Welsh.Common);
    Welsh.Promise = Promise;
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
/// <reference path="./Scheduler.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var tryCall = Welsh.Helpers.tryCall;
    var TryError = Welsh.Helpers.TryError;
    var PendingHandler = (function () {
        function PendingHandler(onFulfilled, onRejected) {
            this.onFulfilled = onFulfilled;
            this.onRejected = onRejected;
        }
        return PendingHandler;
    })();
    var Deferred = (function (_super) {
        __extends(Deferred, _super);
        function Deferred(executor) {
            var _this = this;
            _super.call(this, executor);
            this._pendingHandlers = [];
            this._pendingIndex = 0;
            this._pendingLength = 0;
            if (typeof executor !== 'function') {
                this.reject(new Error("Deferred requires an Executor Function"));
                return;
            }
            var tryResult = tryCall(executor, function (result) { _this.resolve(result); }, function (reason) { _this.reject(reason); });
            if (tryResult === TryError) {
                this.reject(tryResult.reason);
            }
        }
        Deferred.prototype.resolve = function (result) {
            this.startWith(Welsh.State.Fulfilled, result);
        };
        Deferred.prototype.reject = function (reason) {
            this.startWith(Welsh.State.Rejected, reason);
        };
        Deferred.prototype.startWith = function (newState, result) {
            if (this._state) {
                return;
            }
            this._state = newState;
            this._result = result;
            if (this._pendingLength) {
                this._running = true;
                Welsh.GlobalScheduler.queue(this.proceed, this);
            }
        };
        Deferred.prototype.then = function (onFulfilled, onRejected) {
            var pending = new PendingHandler(onFulfilled, onRejected);
            this._pendingHandlers[this._pendingLength++] = pending;
            if (this._state && !this._running) {
                this._running = true;
                Welsh.GlobalScheduler.queue(this.proceed, this);
            }
            return this;
        };
        Deferred.prototype.proceed = function () {
            var pendingHandlers = this._pendingHandlers;
            var pendingIndex = this._pendingIndex;
            var result = this._result;
            var state = this._state;
            do {
                var then = getThenFunction(result);
                if (then) {
                    this._pendingIndex = pendingIndex;
                    this._state = Welsh.State.Resolving;
                    var self = this;
                    then(fulfilledLinker, rejectedLinker);
                    return;
                }
                if (pendingIndex >= this._pendingLength) {
                    break;
                }
                var pending = pendingHandlers[pendingIndex++];
                var callback;
                if (state === Welsh.State.Fulfilled) {
                    callback = pending.onFulfilled;
                }
                else {
                    callback = pending.onRejected;
                }
                if (typeof callback === 'function') {
                    result = tryCall(callback, result);
                    if (result === TryError) {
                        this._result = result = result.reason;
                        this._state = state = Welsh.State.Rejected;
                    }
                    else {
                        this._result = result;
                        this._state = state = Welsh.State.Fulfilled;
                    }
                }
            } while (true);
            this._pendingIndex = 0;
            this._pendingLength = 0;
            this._pendingHandlers = [];
            this._running = false;
            function fulfilledLinker(result) {
                self.continueWith(Welsh.State.Fulfilled, result);
                return result;
            }
            function rejectedLinker(reason) {
                self.continueWith(Welsh.State.Rejected, reason);
                throw reason;
            }
        };
        Deferred.prototype.continueWith = function (newState, result) {
            this._state = newState;
            this._result = result;
            Welsh.GlobalScheduler.queue(this.proceed, this);
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
