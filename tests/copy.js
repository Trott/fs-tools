var FsTools = require('../')
var Fs = require('fs')
var Path = require('path')
var ok  = require('assert').ok
var equal  = require('assert').equal

require('vows').describe('copy')
.addBatch({
  'copyying foo to fuu:': {
    topic: function () {
      FsTools.copy('sandbox/foo', 'sandbox/fuu', this.callback)
    },
    'creates directory fuu': function (err) {
      ok(!err)
      ok(Fs.statSync('sandbox/fuu').isDirectory())
    },
    'creates file fuu/bar/baz/file': function (err) {
      ok(!err)
      ok(Fs.statSync('sandbox/fuu/bar/baz/file').isFile())
    },
    'creates symlink fuu/bar/baz/link': function (err) {
      ok(!err)
      ok(Fs.lstatSync('sandbox/fuu/bar/baz/link').isSymbolicLink())
    },
    'creates symlink fuu/bar/baz/link pointing to directory': function (err) {
      ok(!err)
      ok(Fs.statSync('sandbox/fuu/bar/baz/link').isDirectory())
    },
    'counters:': {
      topic: function () {
        var next = this.callback
        var r = {
          total: 0,
          count: 0,
          dirs: 0,
          syms: 0,
        }
        FsTools.walk('sandbox', function (path, stat, cb) {
          r.total++
          if (path.match(/ile$/)) {
            r.count++
          }
          if (stat.isSymbolicLink()) {
            r.syms++
          }
          cb()
        }, function(err) {
          next(err, r)
        })
      },
      ' are doubled': function (err, result) {
        ok(!err)
        // N.B. walk don't report directories
        equal(result.total, 14)
        equal(result.count, 7)
        // N.B. walk don't report directories
        equal(result.dirs, 0)
        equal(result.syms, 7)
      },
    },
  },
})
.export(module)
