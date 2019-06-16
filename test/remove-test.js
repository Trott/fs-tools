'use strict';


var FsTools = require('../');
var Helper = require('./helper');
var Fs = require('fs');

var test = require('tape');

var SANDBOX = Helper.SANDBOX_DIR + '/remove';

test('removing single file', function (t) {
  t.plan(4);
  FsTools.remove(SANDBOX + '/foo/bar/baz/file', function (err) {
    t.ok(!err, 'Has no error');
    t.ok(!Fs.existsSync(SANDBOX + '/foo/bar/baz/file'));
    t.ok(Fs.existsSync(SANDBOX + '/foo/bar/baz'));
    t.ok(Fs.existsSync(SANDBOX));
  });
});

test('removing symbolic link', function (t) {
  t.plan(4);
  FsTools.remove(SANDBOX + '/foo/bar/baz/link', function (err) {
    t.ok(!err, 'Has no error');
    t.ok(!Fs.existsSync(SANDBOX + '/foo/bar/baz/link'));
    t.ok(Fs.existsSync(SANDBOX + '/foo/bar/baz'));
    t.ok(Fs.existsSync(SANDBOX));
  });
});

test('removing directory', function (t) {
  t.plan(2);
  FsTools.remove(SANDBOX, function (err) {
    t.ok(!err, 'Has no error');
    t.ok(!Fs.existsSync(SANDBOX));
  });
});
