'use strict';


var FsTools = require('../');
var Helper = require('./helper');
var Fs = require('fs');

var test = require('tape');

var SANDBOX = Helper.SANDBOX_DIR + '/mkdir';

test('when destination can be created', function (t) {
  t.plan(3);
  var path = SANDBOX + '/test';

  FsTools.mkdir(path, '0711', function (err) {
    t.ok(!err, 'Has no errror');

    var stats = Fs.statSync(path);

    t.ok(stats.isDirectory());
    t.equal(stats.mode.toString(8).slice(-4), '0711');
  });
});

test('when can not create directory, due to permissions of parent', function (t) {
  t.plan(2);
  FsTools.mkdir('/FOOBAR-FS-TOOLS', function(err) {
    t.ok(err instanceof Error);
    t.equal(err.code, 'EACCES');
  });
});
