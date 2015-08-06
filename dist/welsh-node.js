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
    })(Helpers = Welsh.Helpers || (Welsh.Helpers = {}));
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
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
    var slice = Array.prototype.slice;
    var tryCatch = Welsh.Helpers.tryCatch;
    var getThenFunction = Welsh.Helpers.getThenFunction;
    (function (State) {
        State[State["fulfilledState"] = 1] = "fulfilledState";
        State[State["rejectedState"] = 2] = "rejectedState";
    })(Welsh.State || (Welsh.State = {}));
    var State = Welsh.State;
    var Common = (function () {
        function Common(executor) {
            // no-op
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
                tryCatch(onFinally);
                return result;
            }
            function wrappedRejected(reason) {
                tryCatch(onFinally);
                throw reason;
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
            var Constructor = this;
            return nodeWrapper;
            function nodeWrapper() {
                var wrapperArguments = arguments;
                return new Constructor(function (resolve, reject) {
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
            var resolve, reject, called;
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
            var state;
            var settledResult;
            var branched;
            var pendingHandlers;
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
                    state = Welsh.State.fulfilledState;
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
                state = Welsh.State.rejectedState;
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
                    var callback;
                    if (state === Welsh.State.fulfilledState) {
                        callback = onFulfilled;
                    }
                    else {
                        callback = onRejected;
                    }
                    queueCall(function () {
                        callback(settledResult);
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
    })(Welsh.Common);
    Welsh.Promise = Promise;
})(Welsh || (Welsh = {}));
/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>
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
    var getThenFunction = Welsh.Helpers.getThenFunction;
    var Deferred = (function (_super) {
        __extends(Deferred, _super);
        function Deferred(executor) {
            _super.call(this, executor);
            var self = this;
            var state;
            var running;
            var pendingResult;
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
                start(Welsh.State.fulfilledState, result);
            }
            function reject(reason) {
                start(Welsh.State.rejectedState, reason);
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
                            state = Welsh.State.fulfilledState;
                        }
                        catch (reason) {
                            result = reason;
                            state = Welsh.State.rejectedState;
                        }
                    }
                } while (true);
                pendingResult = result;
                pendingHandlers = [];
                pendingIndex = 0;
                running = false;
            }
            function fulfilledLinker(result) {
                state = Welsh.State.fulfilledState;
                proceed(result);
                return result;
            }
            function rejectedLinker(reason) {
                state = Welsh.State.rejectedState;
                proceed(reason);
                throw reason;
            }
        }
        return Deferred;
    })(Welsh.Common);
    Welsh.Deferred = Deferred;
})(Welsh || (Welsh = {}));
/// <reference path="./Promise.ts"/>
/// <reference path="./Deferred.ts"/>
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
/// <reference path="./typings/node/node.d.ts"/>
/// <reference path="./lib/index"/>
"use strict";
module.exports = Welsh;
