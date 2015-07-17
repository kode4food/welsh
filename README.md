# Welsh (Promises, but not really)

Welsh is a lightweight Promise-like library.  In reality it works more like Twisted's Deferreds, but whatever.  Fuck, it might even be Promises A+ compatible, but I'm too lazy to check.  What do you expect?  I wrote it on the train this morning!

Here's how you use it:

```javascript
var welsh = require('welsh');

var p = welsh(function (result) {
  return 'Hello, ' + result + '!';
}).then(function (result) {
  console.log(result);
});

p.resolve("Bill");
```

Of course, the Functions in your chain can also return Welsh Promises.  You can also call reject() and do the whole onFulfilled, onRejected thing when you add functions to the chain.  Just check the code in `test/*.js` to see what I mean.

Maybe in the next version, I'll even Browserify it, but not sure why I should.

But seriously, don't treat this as a compliant Promises implementation.  I didn't even read the spec.

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
