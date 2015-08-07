# Welsh (Promises and Deferreds)<a href="http://promises-aplus.github.com/promises-spec"><img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png" align="right" alt="Promises/A+ logo" /></a>
[![Build Status](https://travis-ci.org/kode4food/welsh.png)](https://travis-ci.org/kode4food/welsh)

Welsh is a lightweight Promises library that supports [A+ Promises](https://promisesaplus.com/) and Deferreds à la [Twisted](https://twistedmatrix.com/documents/current/core/howto/defer.html).

Here's how you use it.  First, npm install it:

```bash
npm install welsh --save
```

or install it using Bower with:

```bash
bower install welsh --save
```

Then, write code.  This will create a Promise:

```javascript
var welsh = require('welsh');

new welsh.Promise(function (resolve, reject) {
  resolve("Bill");
}).then(function (result) {
  return 'Hello, ' + result + '!';
}).then(function (result) {
  console.log(result);
});
```

while this will create a Deferred:

```javascript
var welsh = require('welsh');

new welsh.Deferred(function (resolve, reject) {
  resolve("Bill");
}).then(function (result) {
  return 'Hello, ' + result + '!';
}).then(function (result) {
  console.log(result);
});
```

Yeah, the code is basically identical.  That's the point!

## Promises versus Deferreds
The main differences between Promises and Deferreds revolve around internal state and mutability.

Promises are completely independent and, once fulfilled, immutable.  Each call to a Promise's `then()` method will produce a brand new Promise instance that depends on its parent's eventually fulfilled value.

On the other hand, calling a Deferred's `then()` method will add callbacks to the internal dispatch chain of the Deferred and return the same instance.  Also, the internal state of a Deferred will mutate as it transitions between steps of the chain.

## Here's Where It Gets Interesting
Promises operate under the assumption that they'll be passed around to different parts of your code, that the chains will branch, and that the code they're calling will always result in an asynchronous result.

But what are you doing most of the time with Promises?  You're usually creating a long, single-statement chain of `then()` calls that transform intermediate results, often synchronously.  As a result, you've now inherited a significant amount of unnecessary overhead.  So what is the solution?  Deferreds!

Start off with a Deferred when you need close to bare-metal performance, and then generate a promise using `toPromise()` when you need to pass the result around. You can even use `toDeferred()` to convert a Promise back to a Deferred.

```javascript
return new welsh.Deferred(function (resolve, reject) {
  resolve("Bill");
}).then(function (result) {
  return 'Hello, ' + result + '!';
}).then(function (result) {
  console.log(result);
}).toPromise();
```

In short, use a Deferred if you want to build a fast, isolated, and synchronous dispatch chain that still honors asynchronous 'Thenable' results.  Use a Promise when you need to create multiple branches of intermediate results or you need to pass the Promise into code that you don't control.

## The Welsh API
Two identical interfaces are exposed.  They are the `Promise` and the `Deferred` constructors.  They are used to create a Promise or a Deferred, respectively.  Each constructor accepts a required executor callback that is invoked synchronously and can be used to resolve or reject the promise or deferred that invoked it.

```javascript
var welsh = require('welsh');

new welsh.Promise(function (resolve, reject) {
  // call resolve(result) or reject(reason) somewhere.
  // the one that is called first will win
});

new welsh.Deferred(function (resolve, reject) {
  // call resolve(result) or reject(reason) somewhere.
  // the one that is called first will win
});
```

The Promise or Deferred that is returned will be an Object that contains several Function properties.  Most of these should be familiar.  They are:

`isPending()` - Returns whether or not the Promise or Deferred is currently in a pending state.

`isSettled()` - Returns whether or not the Promise or Deferred is in a settled (non-pending) state.

`isFulfilled()` - Returns whether or not the Promise or Deferred is in a resolved (non-rejected) state.

`isRejected()` - Returns whether or not the Promise or Deferred is in a rejected state.

`resolve(result?:any)` - Resolves the Promise or Deferred with the specified result.

`reject(reason?:any)` - Rejects the Promise or Deferred with the specified reason.

`getResult()` - Returns the Result of the Promise or Deferred if it has been fulfilled.  If it has not been fulfilled, an uncaught Error is thrown.

`getReason()` - Returns the reason that the Promise or Deferred has been rejected, if it has been rejected.  If it has not been rejected, an uncaught Error is thrown.

`then(onFulfilled?:Function, onRejected?:Function)` - In the case of a Promise, creates a Promise whose value depends on its parent. In the case of a Deferred, adds an onFulfilled and/or onRejected handler to the dispatch chain.

`catch(onRejected?:Function)` - Same as 'then' except that only an `onRejected` callback is provided.

`finally(onFinally?:Function)` - Will call the onFinally callback when the parent Promise or Deferred is either fulfilled or rejected.  Will not interrupt or modify further processing.

`toNode(nodeCallback?:Function)` - Returns a Promise or Deferred that performs a Node-style Callback.  Will not interrupt or modify further processing.

`toPromise()` - Converts the current Promise or Deferred into a new Promise (mostly useful for Deferreds).

`toDeferred()` - Converts the current Promise or Deferred into a new Deferred.

For example:

```javascript
welsh.Promise.reject('I reject you!').catch(function (reason) {
  console.log(reason);
}).finally(function () {
  console.log("all done!");
});
```

The `welsh.Promise` and `welsh.Deferred` interfaces also expose some additional capabilities in the form of helper and utility functions:

`resolve(result)` - Creates and returns an immediately resolved Promise or Deferred.

`reject(reason)` - Creates and returns an immediately rejected Promise or Deferred.

`all(...promises)` - Creates a new Promise or Deferred whose eventually fulfilled value will be an Array containing the fulfilled results of each provided Promise or Deferred.

`race(...promises)` - Creates a new Promise or Deferred whose eventually fulfilled value will be whichever provided Promise or Deferred is resolved first.

`lazy(executor:Function)` - Constructs a 'lazy' Promise or Deferred where the Executor callback is not invoked until the first `then()`, `catch()`, or `finally()` is provided.

`fromNode(nodeFunc:Function)` - Converts a Node-style Function that accepts a callback to one that instead returns a Promise or Deferred.

For example:

```javascript
var p1 = new welsh.Promise(function () { });
var p2 = new welsh.Promise(function () { });
var d1 = new welsh.Deferred(function (resolve) { resolve('D1 Wins!'); });

welsh.Promise.race(p1, p2, d1).then(function (result) {
  console.log(result);
});
```

## License (MIT License)
Copyright (c) 2015 Thomas S. Bradford

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
