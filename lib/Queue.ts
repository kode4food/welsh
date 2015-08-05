/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh.Queue {
  var queue = [];

  /* istanbul ignore next */
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

  export function queueCall(callback) {
    if (!queue.length) {
      nextTick(performCalls);
    }
    queue[queue.length] = callback;
  }

  function performCalls() {
    for (var i = 0; i < queue.length; i++) {
      queue[i]();
    }
    queue = [];
  }
}
