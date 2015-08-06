"use strict";

var path = require('path');

var gulp = require('gulp');
var tsd = require('gulp-tsd');
var typescript = require('gulp-typescript');
var mocha = require('gulp-mocha');

var source = require('vinyl-source-stream');
var inject = require('gulp-inject-string');
var minify = require('gulp-esmangle');
var rename = require('gulp-rename');
var browserify = require('browserify');

var pkg = require('./package.json');

var testDir = './test';
var tsFiles = ['index.ts', 'lib/**/*.ts'];
var testFiles = [testDir + '/*.js'];
var browserSourceFile = "./browserify.js";
var browserTargetDir = "./dist/";
var browserTargetFile = "welsh.js";

var preamble = [
  "/*!", pkg.name, "v"+pkg.version, "|",
  "(c)", new Date().getFullYear(), pkg.author, "*/\n"
].join(' ');

var tsProject = typescript.createProject('tsconfig.json');

var mochaConfig = {
};

var browserifyConfig = {
  detectGlobals: false
};

var minifyConfig = {
  legacy: false
};

gulp.task('test', ['compile'], function (done) {
  gulp.src(testFiles).pipe(mocha(mochaConfig)).on('end', done);
});

gulp.task('tsd', function (callback) {
  tsd({
    command: 'reinstall',
    config: './tsd.json'
  }, callback);
});

gulp.task('compile', ['tsd'], function() {
  var tsResult = tsProject.src().pipe(typescript(tsProject));
  return tsResult.js.pipe(gulp.dest('.'));
});

gulp.task('browserify', ['compile'], function (done) {
  browserify(browserSourceFile, browserifyConfig)
    .bundle()
    .pipe(source(browserTargetFile))
    .pipe(gulp.dest(browserTargetDir))
    .on('end', done);
});

gulp.task('minify', ['browserify'], function (done) {
  gulp.src(path.resolve(browserTargetDir, browserTargetFile))
      .pipe(minify(minifyConfig))
      .pipe(inject.prepend(preamble))
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest(browserTargetDir))
      .on('end', done);
});

gulp.task('watch', ['compile'], function () {
  gulp.watch(tsFiles, ['compile']);
});

gulp.task('build', ['minify']);
gulp.task('default', ['build']);
