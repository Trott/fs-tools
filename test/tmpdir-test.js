'use strict';


var FsTools = require('../');

var test = require('tape');

test('returns different string each time', function (t) {
  t.plan(3);
  var a = FsTools.tmpdir();
  var b = FsTools.tmpdir();
  t.equal(typeof a, 'string');
  t.equal(typeof b, 'string');
  t.notEqual(a, b);
});

test('throws an error with invalid template', function (t) {
  t.plan(1);
  t.throws(function () { FsTools.tmprdir('/foo'); });
});
  
test('with valid template', function (t) {
  t.plan(2);
  var result = FsTools.tmpdir('/XXXXXXXXX-XXXX');
  t.equal(result.length, 15);
  t.ok(/^\/.{9}-XXXX$/.test(result));
});
