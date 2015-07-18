"use strict";

var fs = require('fs');
var path = require('path');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var enforcer = require('gulp-istanbul-enforcer');
var plato = require('plato');

var source = require('vinyl-source-stream');
var inject = require('gulp-inject-string');
var minify = require('gulp-esmangle');
var rename = require('gulp-rename');
var browserify = require('browserify');

var pkg = require('./package.json');

var reportDir = './report';
var ignoreFiles = [
  '!dist/**/*', '!coverage/**/*', '!report/**/*', '!node_modules/**/*'
];
var sourceFiles = ['**/*.js'].concat(ignoreFiles);
var reportFiles = ['*.js', 'lib/**/*.js', 'test/**/*.js'];
var testFiles = ['test/*.js'];

var browserSourceFile = "./browserify.js";
var browserTargetDir = "./dist/";
var browserTargetFile = "welsh.js";

var preamble = [
  "/*!", pkg.name, "v"+pkg.version, "|",
  "(c)", new Date().getFullYear(), pkg.author, "*/\n"
].join(' ');

var mochaConfig = {
};

var platoConfig = {
  title: "Complexity: " + pkg.name,
  jshint: {
    options: JSON.parse(fs.readFileSync('./.jshintrc').toString())
  },
  recurse: true
};

var browserifyConfig = {
  detectGlobals: false  
};

var minifyConfig = {
  legacy: false
};

var enforcerConfig = {
  thresholds: {
    statements: 90,
    branches: 90,
    lines: 90,
    functions: 90
  },
  coverageDirectory: 'coverage',
  rootDirectory: ''
};

function createUnitTests() {
  return gulp.src(testFiles).pipe(mocha(mochaConfig));
}

gulp.task('lint', function (done) {
  gulp.src(sourceFiles)
      .pipe(jshint())
      .pipe(jshint.reporter('default'))
      .on('end', done);
});

gulp.task('test', function (done) {
  createUnitTests().on('end', done);
});

gulp.task('coverage', function (done) {
  gulp.src(sourceFiles)
      .pipe(istanbul())
      .pipe(istanbul.hookRequire())
      .on('finish', function () {
        createUnitTests().pipe(istanbul.writeReports()).on('end', done);
      });
});

gulp.task('enforce', ['lint', 'coverage'], function (done) {
  gulp.src('.')
      .pipe(enforcer(enforcerConfig))
      .on('end', done);
});

gulp.task('complexity', function (done) {
  plato.inspect(reportFiles, reportDir, platoConfig, function () {
    done();
  });
});

gulp.task('browserify', function (done) {
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

gulp.task('build', ['enforce', 'complexity', 'minify']);
gulp.task('default', ['build']);
