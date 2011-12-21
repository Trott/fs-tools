var FsTools = require('../')
var Fs = require('fs')
var Path = require('path')
var ok  = require('assert').ok
var equal  = require('assert').equal

require('vows').describe('walk')
.addBatch({
  'is sane:': {
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
    'counts right all files': function (err, result) {
      ok(!err)
      equal(result.total, 8)
    },
    'counts right all *.js files': function (err, result) {
      ok(!err)
      equal(result.count, 4)
    },
    // N.B. walk don't report directories
    'counts right all directories': function (err, result) {
      ok(!err)
      equal(result.dirs, 0)
    },
    'counts right all symlinks': function (err, result) {
      ok(!err)
      equal(result.syms, 4)
    },
    'behaves like /bin/find': function (err, total) {
      ok('TODO')
    },
  },
})
.export(module)
