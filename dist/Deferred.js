/// <reference path="../typings/tsd.d.ts" />
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
var Helpers_1 = require('./Helpers');
var Scheduler_1 = require('./Scheduler');
var Common_1 = require('./Common');
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
        var tryResult = Helpers_1.tryCall(executor, function (result) { _this.resolve(result); }, function (reason) { _this.reject(reason); });
        if (tryResult === Helpers_1.TryError) {
            this.reject(tryResult.reason);
        }
    }
    Deferred.prototype.resolve = function (result) {
        this.startWith(Common_1.State.Fulfilled, result);
    };
    Deferred.prototype.reject = function (reason) {
        this.startWith(Common_1.State.Rejected, reason);
    };
    Deferred.prototype.startWith = function (newState, result) {
        if (this._state) {
            return;
        }
        this._state = newState;
        this._result = result;
        if (this._pendingLength) {
            this._running = true;
            Scheduler_1.GlobalScheduler.queue(this.proceed, this);
        }
    };
    Deferred.prototype.then = function (onFulfilled, onRejected) {
        var pending = new PendingHandler(onFulfilled, onRejected);
        this._pendingHandlers[this._pendingLength++] = pending;
        if (this._state && !this._running) {
            this._running = true;
            Scheduler_1.GlobalScheduler.queue(this.proceed, this);
        }
        return this;
    };
    Deferred.prototype.proceed = function () {
        var pendingHandlers = this._pendingHandlers;
        var pendingIndex = this._pendingIndex;
        var result = this._result;
        var state = this._state;
        var self = this;
        do {
            var then = Helpers_1.getThenFunction(result);
            if (then) {
                this._pendingIndex = pendingIndex;
                this._state = Common_1.State.Resolving;
                then(fulfilledLinker, rejectedLinker);
                return;
            }
            if (pendingIndex >= this._pendingLength) {
                break;
            }
            var pending = pendingHandlers[pendingIndex++];
            var callback = void 0;
            if (state === Common_1.State.Fulfilled) {
                callback = pending.onFulfilled;
            }
            else {
                callback = pending.onRejected;
            }
            if (typeof callback === 'function') {
                result = Helpers_1.tryCall(callback, result);
                if (result === Helpers_1.TryError) {
                    this._result = result = result.reason;
                    this._state = state = Common_1.State.Rejected;
                }
                else {
                    this._result = result;
                    this._state = state = Common_1.State.Fulfilled;
                }
            }
        } while (true);
        this._pendingIndex = 0;
        this._pendingLength = 0;
        this._pendingHandlers = [];
        this._running = false;
        function fulfilledLinker(result) {
            self.continueWith(Common_1.State.Fulfilled, result);
            return result;
        }
        function rejectedLinker(reason) {
            self.continueWith(Common_1.State.Rejected, reason);
            throw reason;
        }
    };
    Deferred.prototype.continueWith = function (newState, result) {
        this._state = newState;
        this._result = result;
        Scheduler_1.GlobalScheduler.queue(this.proceed, this);
    };
    return Deferred;
})(Common_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Deferred;
