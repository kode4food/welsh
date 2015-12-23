/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

import {
  default as Common, CommonConstructable, Result, PathIndex
} from "./Common";

import { getThenFunction } from './Helpers';

export function resolvePath(instance: Common, path: PathIndex[]): Common {
  let Constructor = <CommonConstructable>instance.constructor;
  return new Constructor(function (resolve, reject) {
    let target: any = instance;
    let idx = 0;
    continueResolving();

    function continueResolving(): void {
      while ( idx < path.length ) {
        let then = getThenFunction(target);
        if ( then ) {
          then.call(target, fulfillTarget, reject);
          return;
        }

        target = target[path[idx++]];
        if ( target === null || target === undefined ) {
          let pathString = path.slice(0, idx).join('/');
          reject(new Error("Property path not found: " + pathString));
          return;
        }
      }
      resolve(target);
    }

    function fulfillTarget(result?: Result) {
      target = result;
      continueResolving();
      return result;
    }
  });
}
