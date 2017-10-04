/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

let Arcs = {
  //version: '0.2',
  Arc: require(`../../../arcs/runtime/arc.js`),
  Manifest: require("../../../arcs/runtime/manifest.js"),
  BrowserLoader: require(`./browser-cdn-loader.js`),
  SlotComposer: require(`../../../arcs/runtime/slot-composer.js`),
  Planner: require(`../../../arcs/runtime/planner.js`),
  Type: require('../../../arcs/runtime/type.js')
};

window.Arcs = Arcs;
