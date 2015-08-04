/// <reference path="../typings/node/node.d.ts"/>
/// <reference path="./Promise.ts"/>
/// <reference path="./Deferred.ts"/>
/// <reference path="./Constructor.ts"/>

/*
 * Welsh (Promises, but not really)
 * Licensed under the MIT License
 * see LICENSE.md
 *
 * @author Thomas S. Bradford (kode4food.it)
 */

"use strict";

module Welsh {
  export import helpers = Helpers;

  // Decorate the Deferred Constructors
  Constructor.decorateConstructor(Promise);
  Constructor.decorateConstructor(Deferred);
}
