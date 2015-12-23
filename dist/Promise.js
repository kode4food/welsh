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
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Common_1 = require('./Common');
var Helpers_1 = require('./Helpers');
var Scheduler_1 = require("./Scheduler");
/* istanbul ignore next */
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
        var then = Helpers_1.tryCall(Helpers_1.getThenFunction, result);
        if (then === Helpers_1.TryError) {
            this.reject(then.reason);
            return;
        }
        else if (then) {
            this.doResolve(then);
            return;
        }
        this._state = Common_1.State.Fulfilled;
        this._result = result;
        Scheduler_1.GlobalScheduler.queue(this.notifyPending, this);
    };
    Promise.prototype.reject = function (reason) {
        if (this._state) {
            return;
        }
        this._state = Common_1.State.Rejected;
        this._result = reason;
        Scheduler_1.GlobalScheduler.queue(this.notifyPending, this);
    };
    Promise.prototype.doResolve = function (executor) {
        var self = this;
        var done;
        var tryResult = Helpers_1.tryCall(executor, onFulfilled, onRejected);
        if (tryResult === Helpers_1.TryError) {
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
        var _this = this;
        var pending = [target, onFulfilled, onRejected];
        if (this._state) {
            Scheduler_1.GlobalScheduler.queue(function () {
                _this.settlePending(pending);
            });
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
        if (this._state === Common_1.State.Fulfilled) {
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
        var tryResult = Helpers_1.tryCall(onFulfilled, result);
        if (tryResult === Helpers_1.TryError) {
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
        var tryResult = Helpers_1.tryCall(onRejected, reason);
        if (tryResult === Helpers_1.TryError) {
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
        this._pendingHandlers = undefined;
        this._pendingLength = 0;
    };
    return Promise;
})(Common_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Promise;
