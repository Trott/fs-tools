'use strict';


var FsTools = require('../');
var Helper = require('./helper');
var Fs = require('fs');

var test = require('tape');

var SANDBOX = Helper.SANDBOX_DIR + '/copy';

test('copying foo to fuu', function (t) {
  t.plan(10);
  var dst = SANDBOX + '/fuu';
  FsTools.copy(SANDBOX + '/foo', dst, function (err) {
    t.ok(!err, 'Has no error');
    t.ok(Fs.statSync(dst).isDirectory());
    t.ok(Fs.statSync(dst + '/bar/baz/file').isFile());
    t.ok(Fs.lstatSync(dst + '/bar/baz/link').isSymbolicLink());
    t.ok(Fs.statSync(dst + '/bar/baz/link').isDirectory());
    var find = 'command gfind ' + SANDBOX + ' -mindepth 1 -printf %y || ' +
            'command find ' + SANDBOX + ' -mindepth 1 -printf %y';

    require('child_process').exec(find, function (err, stdout) {
      t.ok(!err, 'Has no error');
      t.equal(stdout.length, 20);
      t.equal(stdout.match(/f/g).length, 7);
      t.equal(stdout.match(/d/g).length, 6);
      t.equal(stdout.match(/l/g).length, 7);
    });
  });
});


test('When copying to existing file/dir', function (t) {
  t.plan(4);
  FsTools.copy(SANDBOX + '/fuu/bar', SANDBOX + '/foo', function (err) {
    var dst, src, result, expected, message;

    dst       = SANDBOX + '/foo/file';
    src       = SANDBOX + '/fuu/bar/file';
    result    = Fs.readFileSync(dst, 'utf8');
    expected  = Fs.readFileSync(src, 'utf8');
    message   = 'Expected file `' + dst + '` to be same as `' + src + '`.';

    t.ok(!err, 'Has no error');
    t.equal(result, expected, message);
    t.ok(Fs.existsSync(SANDBOX + '/foo/baz'));
    t.ok(Fs.statSync(SANDBOX + '/foo/baz').isDirectory());
  });
});
