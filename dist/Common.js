/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
var slice = Array.prototype.slice;
var Helpers_1 = require('./Helpers');
var Property_1 = require('./Property');
var Collection_1 = require('./Collection');
var Scheduler_1 = require("./Scheduler");
(function (State) {
    State[State["Fulfilled"] = 1] = "Fulfilled";
    State[State["Rejected"] = 2] = "Rejected";
    State[State["Resolving"] = 3] = "Resolving";
})(exports.State || (exports.State = {}));
var State = exports.State;
var Common = (function () {
    function Common(executor) {
        // no-op
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
    /* istanbul ignore next */
    Common.prototype.resolve = function (result) {
        throw new Error("Not implemented");
    };
    /* istanbul ignore next */
    Common.prototype.reject = function (reason) {
        throw new Error("Not implemented");
    };
    /* istanbul ignore next */
    Common.prototype.then = function (onFulfilled, onRejected) {
        throw new Error("Not implemented");
    };
    Common.prototype.done = function (onFulfilled, onRejected) {
        return this.then(wrapFulfilled, wrapRejected);
        function wrapFulfilled(result) {
            if (typeof onFulfilled !== 'function') {
                return result;
            }
            var tryResult = Helpers_1.tryCall(onFulfilled, result);
            if (tryResult === Helpers_1.TryError) {
                var err = tryResult.reason;
                Scheduler_1.nextTick(function () {
                    throw err;
                });
            }
            return result;
        }
        function wrapRejected(reason) {
            if (typeof onRejected !== 'function') {
                throw reason;
            }
            var tryResult = Helpers_1.tryCall(onRejected, reason);
            if (tryResult === Helpers_1.TryError) {
                var err = tryResult.reason;
                Scheduler_1.nextTick(function () {
                    throw err;
                });
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
        var Promise = require("./Promise").default;
        return convertUsing(this, Promise);
    };
    Common.prototype.toDeferred = function () {
        var Deferred = require("./Deferred").default;
        return convertUsing(this, Deferred);
    };
    Common.prototype.path = function (path) {
        return Property_1.resolvePath(this, path);
    };
    Common.prototype.race = function () {
        return Collection_1.createRace(this);
    };
    Common.prototype.all = function () {
        return Collection_1.createAll(this);
    };
    Common.prototype.some = function (count) {
        return Collection_1.createSome(this, count);
    };
    Common.prototype.any = function () {
        return Collection_1.createAny(this);
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
    Common.path = function (resultOrArray, path) {
        return this.resolve(resultOrArray).path(path);
    };
    Common.race = function (resultOrArray) {
        return this.resolve(resultOrArray).race();
    };
    Common.all = function (resultOrArray) {
        return this.resolve(resultOrArray).all();
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
        var originalThen = Helpers_1.getThenFunction(deferred);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Common;
function convertUsing(deferred, constructor) {
    return new constructor(function (resolve, reject) {
        var then = Helpers_1.getThenFunction(deferred);
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
