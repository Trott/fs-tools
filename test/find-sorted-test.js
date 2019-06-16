'use strict';


var FsTools = require('../');
var Helper  = require('./helper');

var test = require('tape');

var SANDBOX = Helper.SANDBOX_DIR + '/find-sorted';

test('found files in directory', function (t) {
  t.plan(2);
  FsTools.findSorted(SANDBOX, function (err, files) {
    t.ok(!err, 'Has no errors');

    files = files.map(function (f) { return f.replace(SANDBOX, ''); });

    t.deepEqual(files, [
      '/file',
      '/foo/bar/baz/file',
      '/foo/bar/baz/link',
      '/foo/bar/file',
      '/foo/bar/link',
      '/foo/file',
      '/foo/link',
      '/link'
    ]);
  });
});
