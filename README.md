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
var promise = require('welsh').promise;

promise(function (resolve, reject) {
  resolve("Bill");
}).then(function (result) {
  return 'Hello, ' + result + '!';
}).then(function (result) {
  console.log(result);
});
```

while this will create a Deferred:

```javascript
var deferred = require('welsh').deferred;

deferred(function (resolve, reject) {
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
return deferred(function (resolve, reject) {
  resolve("Bill");
}).then(function (result) {
  return 'Hello, ' + result + '!';
}).then(function (result) {
  console.log(result);
}).toPromise();
```

In short, use a Deferred if you want to build a fast, isolated, and synchronous dispatch chain that still honors asynchronous 'Thenable' results.  Use a Promise when you need to create multiple branches of intermediate results or you need to pass the Promise into code that you don't control.

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
