/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh {
  var nextTick = (function () {
    if ( typeof setImmediate === 'function' ) {
      return setImmediate;
    }
    if ( typeof window === 'object' &&
      typeof window.requestAnimationFrame === 'function' ) {
      return window.requestAnimationFrame;
    }
    if ( typeof setTimeout === 'function' ) {
      return setTimeout;
    }
    throw new Error("And I should schedule Promises how?");
  }());

  export class Scheduler {
    [index: number]: any;
    private _capacity: number = 16 * 2;
    private _isFlushing: boolean = false;
    private _queueIndex: number = 0;
    private _queueLength: number = 0;

    public queue(callback: Function, target?: Object): void {
      var queueLength = this._queueLength;
      this[queueLength] = callback;
      this[queueLength + 1] = target;
      this._queueLength = queueLength + 2;
      if ( !this._isFlushing ) {
        this._isFlushing = true;
        nextTick(() => { this.flushQueue() });
      }
    }

    private collapseQueue(): void {
      var queueIndex = this._queueIndex;
      var queueLength = this._queueLength;
      for ( var i = 0, len = queueLength - queueIndex; i < len; i++ ) {
        this[i] = this[queueIndex + i];
      }
      while ( i < queueLength ) {
        this[i++] = undefined;
      }
      this._queueIndex = 0;
      this._queueLength = len;
    }

    private flushQueue(): void {
      while ( this._queueIndex < this._queueLength ) {
        var queueIndex = this._queueIndex;
        var callback = this[queueIndex];
        var target = this[queueIndex + 1];
        this._queueIndex = queueIndex + 2;

        if ( this._queueLength > this._capacity ) {
          this.collapseQueue();
        }

        callback.call(target);
      }
      this._isFlushing = false;
    }
  }

  export var GlobalScheduler = new Scheduler();
}
