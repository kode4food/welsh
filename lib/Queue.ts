/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh.Queue {
  var _isFlushing: boolean = false;
  var _queue: Function[] = [];

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

  export function queueCall(callback: Function) {
    _queue[_queue.length] = callback;
    if ( !_isFlushing ) {
      nextTick(performCalls);
    }
  }

  function performCalls() {
    _isFlushing = true;
    for ( var i = 0; i < _queue.length; i++ ) {
      _queue[i]();
    }
    _isFlushing = false;
    _queue = [];
  }
}
