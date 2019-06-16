'use strict';


var FsTools = require('../');
var Helper = require('./helper');
var Fs = require('fs');

var test = require('tape');


var SANDBOX = Helper.SANDBOX_DIR + '/mkdir-sync';

test('should create directory with requested permissions', function (t) {
  t.plan(3);
  var path = SANDBOX + '/test', stats, err;

  try {
    FsTools.mkdirSync(path, '0711');
    stats = Fs.statSync(path);
  } catch (_err) {
    err = _err;
  }

  t.ok(!err, 'There should be no error');
  t.ok(stats.isDirectory());
  t.equal(stats.mode.toString(8).slice(-4), '0711');
});

test('should raise error', function (t) {
  t.plan(3);
  var err;

  try {
    FsTools.mkdirSync('/FOOBAR-FS-TOOLS');
  } catch (_err) {
    err = _err;
  }

  t.ok(!!err, 'There should be an error');
  t.ok(err instanceof Error);
  t.equal(err.code, 'EACCES');
});
