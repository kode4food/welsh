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
        var slice = Array.prototype.slice;
        var isArray = (function () {
            if (Array.isArray) {
                return Array.isArray;
            }
            var toString = Object.prototype.toString;
            return function _isArray(obj) {
                return obj && toString.call(obj) === '[object Array]';
            };
        }());
        var bindThis = (function () {
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
            return bindThis(then, value);
        }
        Helpers.getThenFunction = getThenFunction;
        function tryCatch(tryBlock, catchBlock) {
            if (typeof tryBlock !== 'function') {
                return;
            }
            try {
                return tryBlock();
            }
            catch (err) {
                if (typeof catchBlock === 'function') {
                    return catchBlock(err);
                }
            }
        }
        Helpers.tryCatch = tryCatch;
        function extractArrayArguments() {
            if (arguments.length === 1 && isArray(arguments[0])) {
                return slice.call(arguments[0]);
            }
            else {
                return slice.call(arguments);
            }
        }
        Helpers.extractArrayArguments = extractArrayArguments;
    })(Helpers = Welsh.Helpers || (Welsh.Helpers = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var tryCatch = Welsh.Helpers.tryCatch;
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var WelshBase = (function () {
        function WelshBase() {
        }
        WelshBase.prototype.then = function (onFulfilled, onRejected) {
            throw new Error("Not implemented");
        };
        WelshBase.prototype.catch = function (onRejected) {
            return this.then(undefined, onRejected);
        };
        WelshBase.prototype.finally = function (onFinally) {
            return this.then(wrappedFulfilled, wrappedRejected);
            function wrappedFulfilled(result) {
                tryCatch(onFinally);
                return result;
            }
            function wrappedRejected(reason) {
                tryCatch(onFinally);
                throw reason;
            }
        };
        WelshBase.prototype.toNode = function (callback) {
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
        WelshBase.prototype.toPromise = function () {
            return convertUsing(this, Welsh.Promise);
        };
        WelshBase.prototype.toDeferred = function () {
            return convertUsing(this, Welsh.Deferred);
        };
        return WelshBase;
    })();
    Welsh.WelshBase = WelshBase;
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
/// <reference path="./WelshBase.ts"/>
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
    var fulfilledState = 1;
    var rejectedState = 2;
    var Promise = (function (_super) {
        __extends(Promise, _super);
        function Promise(executor) {
            _super.call(this);
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
        return Promise;
    })(Welsh.WelshBase);
    Welsh.Promise = Promise;
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./WelshBase.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var fulfilledState = 1;
    var rejectedState = 2;
    var Deferred = (function (_super) {
        __extends(Deferred, _super);
        function Deferred(executor) {
            _super.call(this);
            var self = this;
            var state, running, pendingResult;
            var pendingHandlers = [];
            var pendingIndex = 0;
            this.then = appendThen;
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
                start(fulfilledState, result);
            }
            function reject(reason) {
                start(rejectedState, reason);
            }
            function start(newState, result) {
                if (state) {
                    return;
                }
                state = newState;
                proceed(result);
            }
            function appendThen(onFulfilled, onRejected) {
                pendingHandlers[pendingHandlers.length] = [
                    undefined, onFulfilled, onRejected
                ];
                if (state && !running) {
                    proceed(pendingResult);
                }
                return self;
            }
            function proceed(result) {
                running = true;
                do {
                    var then = getThenFunction(result);
                    if (then) {
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
                            state = fulfilledState;
                        }
                        catch (reason) {
                            result = reason;
                            state = rejectedState;
                        }
                    }
                } while (true);
                pendingResult = result;
                pendingHandlers = [];
                pendingIndex = 0;
                running = false;
            }
            function fulfilledLinker(result) {
                state = fulfilledState;
                proceed(result);
                return result;
            }
            function rejectedLinker(reason) {
                state = rejectedState;
                proceed(reason);
                throw reason;
            }
        }
        return Deferred;
    })(Welsh.WelshBase);
    Welsh.Deferred = Deferred;
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
    var Constructor;
    (function (Constructor_1) {
        var getThenFunction = Welsh.Helpers.getThenFunction;
        var extractArrayArguments = Welsh.Helpers.extractArrayArguments;
        var slice = Array.prototype.slice;
        function decorateConstructor(Constructor) {
            Constructor.resolve = createResolve;
            Constructor.reject = createReject;
            Constructor.race = createRace;
            Constructor.all = createAll;
            Constructor.fromNode = createFromNode;
            Constructor.lazy = createLazy;
            return Constructor;
            function createResolve(result) {
                return new Constructor(function (resolve) {
                    resolve(result);
                });
            }
            function createReject(reason) {
                return new Constructor(function (resolve, reject) {
                    reject(reason);
                });
            }
            function createRace() {
                var args = extractArrayArguments.apply(null, arguments);
                return new Constructor(function (resolve, reject) {
                    try {
                        for (var i = 0, len = args.length; i < len; i++) {
                            var value = args[i];
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
            }
            function createAll() {
                var args = extractArrayArguments.apply(null, arguments);
                return new Constructor(function (resolve, reject) {
                    var waitingFor = args.length;
                    for (var i = 0, len = waitingFor; i < len; i++) {
                        var then = getThenFunction(args[i]);
                        if (then) {
                            resolveThenAtIndex(then, i);
                            continue;
                        }
                        waitingFor--;
                    }
                    if (!waitingFor) {
                        resolve(args);
                    }
                    function resolveThenAtIndex(then, index) {
                        then(wrappedResolve, wrappedReject);
                        function wrappedResolve(result) {
                            args[index] = result;
                            if (!--waitingFor) {
                                resolve(args);
                            }
                            return result;
                        }
                        function wrappedReject(reason) {
                            reject(reason);
                            throw reason;
                        }
                    }
                });
            }
            function createFromNode(nodeFunction) {
                return nodeWrapper;
                function nodeWrapper() {
                    var wrapperArguments = arguments;
                    return new Constructor(function (resolve, reject) {
                        nodeFunction.apply(null, slice.call(wrapperArguments).concat(callback));
                        function callback(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve(slice.call(arguments, 1));
                        }
                    });
                }
            }
            function createLazy(executor) {
                var resolve, reject, called;
                var deferred = new Constructor(function (_resolve, _reject) {
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
            }
        }
        Constructor_1.decorateConstructor = decorateConstructor;
    })(Constructor = Welsh.Constructor || (Welsh.Constructor = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Promise.ts"/>
/// <reference path="./Deferred.ts"/>
/// <reference path="./Constructor.ts"/>
"use strict";
var Welsh;
(function (Welsh) {
    Welsh.Constructor.decorateConstructor(Welsh.Promise);
    Welsh.Constructor.decorateConstructor(Welsh.Deferred);
})(Welsh || (Welsh = {}));
/// <reference path="./typings/node/node.d.ts"/>
/// <reference path="./lib/index"/>
"use strict";
module.exports = Welsh;
