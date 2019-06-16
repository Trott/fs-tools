'use strict';


var FsTools = require('../');
var Helper = require('./helper');

var test = require('tape');

var SANDBOX = Helper.SANDBOX_DIR + '/walk-sync';

test('walking through directory', function (t) {
  t.plan(3);
  var result = { total: 0, files: 0, symlinks: 0 };

  FsTools.walkSync(SANDBOX, function (path, stats) {
    result.total += 1;

    if (stats.isFile()) {
      result.files += 1;
    }

    if (stats.isSymbolicLink()) {
      result.symlinks += 1;
    }
  });

  t.equal(result.total, 8);
  t.equal(result.files, 4);
  t.equal(result.symlinks, 4);
});

test('walking through directory with pattern', function (t) {
  t.plan(1);
  var result = 0;

  FsTools.walkSync(SANDBOX, /file$/, function (/*path, stats */) {
    result += 1;
  });
  t.equal(result, 4);
});

test('walking through the directory that does not exists', function (t) {
  t.plan(1);
  var result = 0;

  FsTools.walkSync(SANDBOX + '/SHoUldNotExists', function (/*path, stats*/) {
    result += 1;
  });
  t.equal(result, 0);
});

test('walking through the file', function (t) {
  t.plan(3);
  var result = { total: 0, files: 0, symlinks: 0 };

  FsTools.walkSync(SANDBOX + '/file', function (path, stats) {
    result.total += 1;

    if (stats.isFile()) {
      result.files += 1;
    }

    if (stats.isSymbolicLink()) {
      result.symlinks += 1;
    }
  });

  t.equal(result.total, 1);
  t.equal(result.files, 1);
  t.equal(result.symlinks, 0);
});

test('walking through the file with pattern', function (t) {
  t.plan(1);
  var result = 0;

  FsTools.walkSync(SANDBOX + '/file', /link$/, function (/*path, stats*/) {
    result++;
  });

  t.equal(result, 0);
});
