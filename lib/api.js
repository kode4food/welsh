/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

function createCommonExports(name, generatorFunc) {
  function resolved(result) {
    return generatorFunc(function (resolve) {
      resolve(result);
    });
  }

  function rejected(reason) {
    return generatorFunc(function (resolve, reject) {
      reject(reason);
    });
  }

  generatorFunc[name] = generatorFunc;
  generatorFunc.resolved = resolved;
  generatorFunc.rejected = rejected;

  return generatorFunc;
}

exports.createCommonExports = createCommonExports;
