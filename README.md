[![Build Status](https://travis-ci.org/kode4food/welsh.png)](https://travis-ci.org/kode4food/welsh)<a href="http://promises-aplus.github.com/promises-spec">
    <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
         align="right" alt="Promises/A+ logo" />
</a>

# Welsh (Promises, but not really)

Welsh is a lightweight Promises library that supports [A+ Promises](https://promisesaplus.com/) and Deferreds à la [Twisted](https://twistedmatrix.com/documents/current/core/howto/defer.html).

The main difference between a Deferred and a Promise is that calling a Deferred's `then` method will modify the internal dispatch chain of the original Deferred and return the same instance, whereas `then` against a Promise will produce a completely independent Promise instance.  Use a Promise when you want isolation, use a Deferred when you don't care.

Here's how you use it.  First, npm install it:

```bash
npm install welsh --save
```

Then, write code:

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

Of course, the Functions in your chain can also return Welsh Deferreds.  You can also call reject() and do the whole onFulfilled, onRejected thing when you add functions to the chain.  Just check the code in `test/*.js` to see what I mean.

If you want to create a Promise, you migth do:

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

Yeah, the code is basically identical.  That's the point!

You can also install the library with Bower using `bower install welsh`.  Though honestly, I haven't tested it and don't plan to.  I'd love pull requests though!

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
