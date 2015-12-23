/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */
"use strict";
var Helpers_1 = require('./Helpers');
function resolvePath(instance, path) {
    var Constructor = instance.constructor;
    return new Constructor(function (resolve, reject) {
        var target = instance;
        var idx = 0;
        continueResolving();
        function continueResolving() {
            while (idx < path.length) {
                var then = Helpers_1.getThenFunction(target);
                if (then) {
                    then.call(target, fulfillTarget, reject);
                    return;
                }
                target = target[path[idx++]];
                if (target === null || target === undefined) {
                    var pathString = path.slice(0, idx).join('/');
                    reject(new Error("Property path not found: " + pathString));
                    return;
                }
            }
            resolve(target);
        }
        function fulfillTarget(result) {
            target = result;
            continueResolving();
            return result;
        }
    });
}
exports.resolvePath = resolvePath;
