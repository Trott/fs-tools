'use strict';


var FsTools = require('../');
var Helper = require('./helper');
var Fs = require('fs');

var test = require('tape');

var SANDBOX = Helper.SANDBOX_DIR + '/remove-sync';

test('removing single file', function (t) {
  t.plan(3);
  FsTools.removeSync(SANDBOX + '/foo/bar/baz/file');
  t.ok(!Fs.existsSync(SANDBOX + '/foo/bar/baz/file'));
  t.ok(Fs.existsSync(SANDBOX + '/foo/bar/baz'));
  t.ok(Fs.existsSync(SANDBOX));
});

test('removing symbolic link', function (t) {
  t.plan(3);
  FsTools.removeSync(SANDBOX + '/foo/bar/baz/link');
  t.ok(!Fs.existsSync(SANDBOX + '/foo/bar/baz/link'));
  t.ok(Fs.existsSync(SANDBOX + '/foo/bar/baz'));
  t.ok(Fs.existsSync(SANDBOX));
});

test('removing directory', function (t) {
  t.plan(1);
  FsTools.removeSync(SANDBOX);
  t.ok(!Fs.existsSync(SANDBOX));
});
