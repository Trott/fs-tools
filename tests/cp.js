'use strict';
var assert = require('assert');
var cp = require('../').cp;
cp('cp.js', 'cp1.js', function(err) {
  assert.ok(err == null);
});
cp('cp.js', 'tmp/cp1.js', function(err) {
  assert.ok(err == null);
});
cp('cp2.js', 'cp1.js', function(err) {
  assert.ok(err != null && err.code === 'ENOENT');
});
cp('cp.js', '/root/cp.js', function(err) {
  assert.ok(err != null && err.code === 'EACCES');
});
