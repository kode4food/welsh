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
        Common.prototype.done = function (onFulfilled, onRejected) {
            throw new Error("Not implemented");
        };
        Common.prototype.then = function (onFulfilled, onRejected) {
            throw new Error("Not implemented");
        };
        Common.prototype.catch = function (onRejected) {
            return this.then(undefined, onRejected);
        };
        Common.prototype.finally = function (onFinally) {
            return this.then(onFulfilled, onRejected);
            function onFulfilled(result) {
                try {
                    onFinally();
                }
                finally {
                    return result;
                }
            }
            function onRejected(reason) {
                try {
                    onFinally();
                }
                finally {
                    throw reason;
                }
            }
        };
        Common.prototype.toNode = function (callback) {
            return this.then(onFulfilled, onRejected);
            function onFulfilled(result) {
                try {
                    callback(null, result);
                }
                finally {
                    return result;
                }
            }
            function onRejected(reason) {
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
            this._head = 0;
            this._tail = 0;
        }
        Scheduler.prototype.queue = function (callback, target, arg) {
            var _this = this;
            var tail = this._tail;
            this[tail] = callback;
            this[tail + 1] = target;
            this[tail + 2] = arg;
            this._tail = tail + 3;
            if (!this._isFlushing) {
                this._isFlushing = true;
                nextTick(function () { _this.flushQueue(); });
            }
        };
        Scheduler.prototype.collapseQueue = function () {
            var head = this._head;
            var tail = this._tail;
            for (var i = 0, len = tail - head; i < len; i++) {
                this[i] = this[head + i];
            }
            while (i < tail) {
                this[i++] = undefined;
            }
            this._head = 0;
            this._tail = len;
        };
        Scheduler.prototype.flushQueue = function () {
            while (this._head < this._tail) {
                var head = this._head;
                var callback = this[head];
                var target = this[head + 1];
                var arg = this[head + 2];
                this._head = head + 3;
                if (this._tail > this._capacity) {
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
    function noOp() { }
    var Promise = (function (_super) {
        __extends(Promise, _super);
        function Promise(executor) {
            _super.call(this, executor);
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
            try {
                var then = getThenFunction(result);
                if (then) {
                    this.doResolve(then);
                    return;
                }
                this._state = Welsh.State.Fulfilled;
                this._result = result;
                Welsh.GlobalScheduler.queue(this.notifyPending, this);
            }
            catch (err) {
                this.reject(err);
            }
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
            try {
                executor(onFulfilled, onRejected);
            }
            catch (err) {
                if (done) {
                    return;
                }
                this.reject(err);
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
            this.done(wrapFulfilled, wrapRejected);
            return promise;
            function wrapFulfilled(result) {
                if (typeof onFulfilled !== 'function') {
                    promise.resolve(result);
                    return;
                }
                try {
                    promise.resolve(onFulfilled(result));
                }
                catch (err) {
                    promise.reject(err);
                }
            }
            function wrapRejected(reason) {
                if (typeof onRejected !== 'function') {
                    promise.reject(reason);
                    return;
                }
                try {
                    promise.resolve(onRejected(reason));
                }
                catch (err) {
                    promise.reject(err);
                }
            }
        };
        Promise.prototype.done = function (onFulfilled, onRejected) {
            var state = this._state;
            if (state) {
                var callback;
                if (state === Welsh.State.Fulfilled) {
                    callback = onFulfilled;
                }
                else {
                    callback = onRejected;
                }
                Welsh.GlobalScheduler.queue(callback, null, this._result);
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
            var settledResult = this._result;
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
/// <reference path="./Scheduler.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var Deferred = (function (_super) {
        __extends(Deferred, _super);
        function Deferred(executor) {
            var _this = this;
            _super.call(this, executor);
            this._pendingHandlers = [];
            this._pendingIndex = 0;
            if (typeof executor !== 'function') {
                this.reject(new Error("Deferred requires an Executor Function"));
                return;
            }
            try {
                executor(function (result) { _this.resolve(result); }, function (reason) { _this.reject(reason); });
            }
            catch (err) {
                this.reject(err);
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
            if (this._pendingHandlers.length > 0) {
                this._running = true;
                Welsh.GlobalScheduler.queue(this.proceed, this);
            }
        };
        Deferred.prototype.then = function (onFulfilled, onRejected) {
            var pendingHandlers = this._pendingHandlers;
            pendingHandlers[pendingHandlers.length] = [
                undefined, onFulfilled, onRejected
            ];
            if (this._state && !this._running) {
                this._running = true;
                Welsh.GlobalScheduler.queue(this.proceed, this);
            }
            return this;
        };
        Deferred.prototype.done = function (onFulfilled, onRejected) {
            this.then(wrapFulfilled, wrapRejected);
            function wrapFulfilled(result) {
                if (typeof onFulfilled !== 'function') {
                    return result;
                }
                try {
                    onFulfilled(result);
                }
                catch (err) {
                    Welsh.GlobalScheduler.queue(function () { throw err; });
                    return result;
                }
            }
            function wrapRejected(reason) {
                if (typeof onRejected !== 'function') {
                    throw reason;
                }
                try {
                    onRejected(reason);
                }
                catch (err) {
                    Welsh.GlobalScheduler.queue(function () { throw err; });
                    throw reason;
                }
            }
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
                if (pendingIndex >= pendingHandlers.length) {
                    break;
                }
                var callback = pendingHandlers[pendingIndex++][state];
                if (typeof callback === 'function') {
                    try {
                        this._result = result = callback(result);
                        this._state = state = Welsh.State.Fulfilled;
                    }
                    catch (reason) {
                        this._result = result = reason;
                        this._state = state = Welsh.State.Rejected;
                    }
                }
            } while (true);
            this._pendingHandlers = [];
            this._pendingIndex = 0;
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
