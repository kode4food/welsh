/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it) 
 */
 
"use strict";

var stateIndexes = [undefined, 0, 1];
var resolved = 1;
var rejected = 2;

/* istanbul ignore next */
var nodeProcess = typeof process !== 'undefined' ? process : {};

/* istanbul ignore next */
var nextTick = nodeProcess.nextTick || setImmediate || setTimeout;

function welsh(onResolved, onRejected) {
  var state, head, tail, stateIndex, pendingResult;

  if ( onResolved || onRejected ) {
    appendThen(onResolved, onRejected);
  }

  var welshInterface = {
    then: appendThen,
    catch: function (onRejected) { return appendThen(undefined, onRejected); },
    resolve: function (result) { return setState(resolved, result); },
    reject: function (error) { return setState(rejected, error); }
  };

  return welshInterface;

  function setState(newState, result) {
    if ( state ) {
      throw new Error("You can't welsh on this promise!");
    }
    state = newState;
    stateIndex = stateIndexes[state];
    queueResult(result);
    return welshInterface;
  }

  function queueResult(result) {
    if ( head ) {
      proceed(result);
    }
    else {
      pendingResult = result;
    }
  }

  function appendThen(onResolved, onRejected) {
    if ( typeof onResolved !== 'function' ) {
      onResolved = undefined;
    }
    if ( typeof onRejected !== 'function' ) {
      onRejected = undefined;
    }

    var item = { value: [onResolved, onRejected] };
  	if ( !tail ) {
  		head = tail = item;
  	}
    else {
      tail = tail.next = item;
    }

    if ( state ) {
      proceed(pendingResult);
    }
    return welshInterface;
  }

  function proceed(result) {
    if ( isPromise(result) ) {
      result.then(thenLinker, thenLinker);
      return;
    }

    do {
      var callback = head.value[stateIndex];
      head = head.next || (tail = null);
      if ( callback ) {
        result = callback(result);
        if ( isPromise(result) ) {
          result.then(thenLinker, thenLinker);
          return;
        }
      }
    }
    while ( head );
    pendingResult = result;
  }

  function thenLinker(result) {
    nextTick(function () {
      queueResult(result);
    });
    return result;
  }

  function isPromise(value) {
    return typeof value === 'object' && value !== null &&
           typeof value.then === 'function';
  }
}

module.exports = welsh;
