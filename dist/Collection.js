/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
var Helpers_1 = require('./Helpers');
function process(instance, processor) {
    var Constructor = instance.constructor;
    return new Constructor(function (resolve, reject) {
        instance.done(function (result) {
            if (!Array.isArray(result)) {
                reject(new TypeError("Result containing a Collection is required"));
                return;
            }
            processor(result.slice(), resolve, reject);
        }, reject);
    });
}
function createRace(instance) {
    return process(instance, function (array, resolve, reject) {
        if (array.length === 0) {
            reject(new Error("Array provided to race() is empty"));
            return;
        }
        for (var i = 0, len = array.length; i < len; i++) {
            var value = array[i];
            var then = Helpers_1.getThenFunction(value);
            if (then) {
                then(resolve, reject);
                continue;
            }
            resolve(value);
        }
    });
}
exports.createRace = createRace;
function createAll(instance) {
    return process(instance, function (array, resolve, reject) {
        var waitingFor = array.length;
        for (var i = 0, len = waitingFor; i < len; i++) {
            var then = Helpers_1.getThenFunction(array[i]);
            if (then) {
                resolveThenAtIndex(then, i);
                continue;
            }
            waitingFor--;
        }
        if (waitingFor === 0) {
            resolve(array);
        }
        function resolveThenAtIndex(then, index) {
            then(onFulfilled, onRejected);
            function onFulfilled(result) {
                array[index] = result;
                if (--waitingFor === 0) {
                    resolve(array);
                }
                return result;
            }
            function onRejected(reason) {
                reject(reason);
                throw reason;
            }
        }
    });
}
exports.createAll = createAll;
function createAny(instance) {
    return createSome(instance, 1).then(function (array) {
        return array[0];
    });
}
exports.createAny = createAny;
function createSome(instance, count) {
    return process(instance, function (array, resolve, reject) {
        var results = [];
        var waitingFor = array.length;
        if (typeof count !== 'number' || count < 0) {
            reject(new Error("Can't wait for " + count + " Results"));
            return;
        }
        if (count === 0) {
            resolve([]);
            return;
        }
        if (waitingFor <= count) {
            reject(new Error(count + " Result(s) can never be fulfilled"));
            return;
        }
        for (var i = 0, len = waitingFor; i < len; i++) {
            var value = array[i];
            var then = Helpers_1.getThenFunction(value);
            if (then) {
                then(onFulfilled, onRejected);
                continue;
            }
            provideResult(value);
        }
        function onFulfilled(result) {
            provideResult(result);
            return result;
        }
        function onRejected(reason) {
            decrementWaiting();
            throw reason;
        }
        function provideResult(result) {
            /* istanbul ignore next: guard */
            if (count === 0) {
                return;
            }
            results[results.length] = result;
            if (--count === 0) {
                resolve(results);
                waitingFor = 0;
                return;
            }
            decrementWaiting();
        }
        function decrementWaiting() {
            /* istanbul ignore next: guard */
            if (waitingFor === 0) {
                return;
            }
            waitingFor -= 1;
            checkWaitingAgainstCount();
        }
        function checkWaitingAgainstCount() {
            if (waitingFor >= count) {
                return;
            }
            reject(new Error(count + " Result(s) can never be fulfilled"));
            count = 0;
            waitingFor = 0;
        }
    });
}
exports.createSome = createSome;
