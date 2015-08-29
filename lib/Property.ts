/// <reference path="./Helpers.ts"/>
/// <reference path="./Common.ts"/>

/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

namespace Welsh.Property {
  import getThenFunction = Helpers.getThenFunction;

  export function resolvePath(instance: Common, path: PathIndex[]): Common {
    var Constructor = <CommonConstructable>instance.constructor;
    return new Constructor(function (resolve, reject) {
      var target: any = instance;
      var idx = 0;
      resolveNext();

      function resolveNext(): void {
        var then = getThenFunction(target);
        if ( then ) {
          then.call(target, fulfillTarget, reject);
          return;
        }

        if ( idx >= path.length ) {
          resolve(target);
          return;
        }

        target = target[path[idx++]];
        if ( target === null || target === undefined ) {
          var pathString = path.slice(0, idx).join('/');
          reject(new Error("Property path not found: " + pathString));
          return;
        }

        resolveNext();
      }

      function fulfillTarget(result?: Result) {
        target = result;
        resolveNext();
        return result;
      }
    });
  }
}
