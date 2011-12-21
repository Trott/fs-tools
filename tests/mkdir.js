var FsTools = require('../')
var Fs = require('fs')
var Path = require('path')
var ok  = require('assert').ok
var equal  = require('assert').equal

require('vows').describe('mkdir_p')
.addBatch({
  'works:': {
    topic: function () {
      FsTools.mkdir('sandbox/A/B/ C/', '0711', this.callback)
    },
    'creates A/B/ C/': function (err, result) {
      ok(!err)
      ok(Fs.statSync('sandbox/A/B/ C/').isDirectory())
    },
    'with correct permissions': function (err, result) {
      ok(!err)
      equal(Fs.statSync('sandbox/A/B/ C/').mode.toString(8).slice(-4), '0711')
    },
  },
  'honors user permissions:': {
    topic: function () {
      FsTools.mkdir('/etc/foo-meta-fs', '0111', this.callback)
    },
    'can\'t create under /etc': function (err, result) {
      ok(err)
      equal(err.code, 'EACCES')
    },
  },
})
.export(module)
