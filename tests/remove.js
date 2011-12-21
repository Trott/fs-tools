var FsTools = require('../')
var Fs = require('fs')
var Path = require('path')
var ok  = require('assert').ok
var equal  = require('assert').equal

require('vows').describe('remove')
.addBatch({
  'remove sandbox/foo/bar:': {
    topic: function () {
      FsTools.remove('sandbox/foo/bar', this.callback)
    },
    'purges part of sandbox': function (err) {
      ok(!err)
      ok(!Path.existsSync('sandbox/foo/bar'))
      ok(Path.existsSync('sandbox/foo/link'))
    },
    'remove sandbox:': {
      topic: function () {
        FsTools.remove('sandbox', this.callback)
      },
      'purges sandbox': function (err) {
        ok(!err)
        ok(!Path.existsSync('sandbox'))
      },
    },
  },
})
.export(module)
