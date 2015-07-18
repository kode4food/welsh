(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global Window */
"use strict";
window.welsh = require('./index');

},{"./index":2}],2:[function(require,module,exports){
/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it) 
 */
 
"use strict";

var resolved = 1;
var rejected = 2;

/* istanbul ignore next */
var nodeProcess = typeof process !== 'undefined' ? process : {};

/* istanbul ignore next */
var nextTick = nodeProcess.nextTick || setTimeout;

function welsh(onResolved, onRejected) {
  var state, head, tail, pendingResult, running;

  if ( onResolved || onRejected ) {
    appendThen(onResolved, onRejected);
  }

  var welshInterface = {
    then: appendThen,
    catch: function (onRejected) { return appendThen(undefined, onRejected); },
    resolve: function (result) { return start(resolved, result); },
    reject: function (error) { return start(rejected, error); }
  };

  return welshInterface;

  function start(newState, result) {
    if ( state ) {
      throw new Error("You can't welsh on this promise!");
    }
    state = newState;
    queueResult(result);
    return welshInterface;
  }

  function queueResult(result) {
    if ( head ) {
      proceed(result);
    }
    else {
      pendingResult = result;
      running = false;
    }
  }

  function appendThen(onResolved, onRejected) {
    if ( typeof onResolved !== 'function' ) {
      onResolved = undefined;
    }
    if ( typeof onRejected !== 'function' ) {
      onRejected = undefined;
    }

    var item = { 1: onResolved, 2: onRejected };
    if ( !tail ) {
      head = tail = item;
    }
    else {
      tail = tail.next = item;
    }

    if ( state && !running ) {
      proceed(pendingResult);
    }
    return welshInterface;
  }

  function proceed(result) {
    running = true;
    if ( isPromise(result) ) {
      result.then(resolvedLinker, rejectedLinker);
      return;
    }

    do {
      var callback = head[state];
      head = head.next || (tail = null);
      if ( !callback ) {
        continue;
      }

      try {
        result = callback(result);
        state = resolved;
      }
      catch ( err ) {
        result = err;
        state = rejected;
      }
      if ( isPromise(result) ) {
        result.then(resolvedLinker, rejectedLinker);
        return;
      }
    }
    while ( head );
    pendingResult = result;
    running = false;
  }

  function resolvedLinker(result) {
    nextTick(function () {
      state = resolved;
      queueResult(result);
    });
    return result;      
  }
  
  function rejectedLinker(result) {
    nextTick(function () {
      state = rejected;
      queueResult(result);
    });
    throw result;      
  }
  
  function isPromise(value) {
    return typeof value === 'object' && value !== null &&
           typeof value.then === 'function';
  }
}

module.exports = welsh;

},{}]},{},[1]);
