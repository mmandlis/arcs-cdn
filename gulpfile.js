// @license
// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

const gulp = require('gulp');

const paths = {
  build: './v0.0.4',
};

const sources = {
  cdn: [
    'worker-entry-cdn.js',
    'ArcsLib.js'
  ],
};

let pack = async (files) => {
  try {
    const webpack = require('webpack');

    let node = {
      fs: 'empty',
      mkdirp: 'empty',
      minimist: 'empty',
    };

    for (let file of files) {
      await new Promise((resolve, reject) => {
        webpack({
          entry: `./source/${file}`,
          output: {
            filename: `./${paths.build}/${file}`,
          },
          node,
          devtool: 'sourcemap',
        }, (err, stats) => {
          if (err) {
            reject(err);
          }
          console.log(stats.toString({colors: true, verbose: true}));
          resolve();
        });
      });
    }

  } catch(x) {
    // in case of emergency, break glass .. then stay calm and carry on watching
    console.log(x);
  }
};

gulp.task('build', async function() {
  await pack(sources.cdn);
});

gulp.task('default', ['build']);

