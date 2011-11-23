'use strict';


var assert = require('assert');
var fs = require('fs');
var rm_rf = require('../').rm_rf;
var cp_a = require('../').cp_a;

var src = __dirname + '/data/src/foo';
var dst = __dirname + '/data/dst/foo';


rm_rf(dst, function (err) {
  if (err) {
    console.error(err.stack || err.message || err.toString());
    return;
  }

  cp_a(src, dst, function (err) {
    if (err) {
      console.error(err.stack || err.message || err.toString());
    }

    assert.ok(null === err);
    assert.equal(fs.statSync(src).mode.toString(8).slice(-4),
                  fs.statSync(dst).mode.toString(8).slice(-4));
    assert.equal(fs.statSync(src + '/bar').mode.toString(8).slice(-4),
                 fs.statSync(dst + '/bar').mode.toString(8).slice(-4));
  });
});
