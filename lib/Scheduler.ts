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
    private _capacity: number = 16 * 3;
    private _isFlushing: boolean = false;
    private _head: number = 0;
    private _tail: number = 0;

    public queue(callback: Function, target?: Object, arg?: any): void {
      var tail = this._tail;
      this[tail] = callback;
      this[tail + 1] = target;
      this[tail + 2] = arg;
      this._tail = tail + 3;
      if ( !this._isFlushing ) {
        this._isFlushing = true;
        nextTick(() => { this.performCalls() });
      }
    }

    private collapseQueue(): void {
      var head = this._head;
      for ( var i = 0, len = this._tail - head; i < len; i++ ) {
        this[i] = this[head + i];
        this[head + i] = undefined;
      }
      this._head = 0;
      this._tail = len;
    }

    private performCalls(): void {
      while ( this._head < this._tail ) {
        var head = this._head;
        var callback = this[head];
        var target = this[head + 1];
        var arg = this[head + 2];
        this._head = head + 3;

        if ( this._tail > this._capacity ) {
          this.collapseQueue();
        }

        callback.call(target, arg);
      }
      this._isFlushing = false;
    }
  }

  export var GlobalScheduler = new Scheduler();
}
