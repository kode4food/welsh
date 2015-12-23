/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
/* istanbul ignore next */
exports.nextTick = (function () {
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
        this._capacity = 16 * 2;
        this._isFlushing = false;
        this._queueIndex = 0;
        this._queueLength = 0;
    }
    Scheduler.prototype.queue = function (callback, target) {
        var _this = this;
        var queueLength = this._queueLength;
        this[queueLength] = callback;
        this[queueLength + 1] = target;
        this._queueLength = queueLength + 2;
        if (!this._isFlushing) {
            this._isFlushing = true;
            exports.nextTick(function () { _this.flushQueue(); });
        }
    };
    Scheduler.prototype.collapseQueue = function () {
        var queueIndex = this._queueIndex;
        var queueLength = this._queueLength;
        var i = 0;
        var len = queueLength - queueIndex;
        for (; i < len; i++) {
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
            this._queueIndex = queueIndex + 2;
            if (this._queueLength > this._capacity) {
                this.collapseQueue();
            }
            callback.call(target);
        }
        this._isFlushing = false;
    };
    return Scheduler;
})();
exports.Scheduler = Scheduler;
exports.GlobalScheduler = new Scheduler();
