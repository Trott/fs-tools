'use strict';


var Assert = require('assert');
var FsTools = require('../lib/fs-tools');
var Helper = require('./helper');
var Path = require('path');


require('vows').describe('FsTools').addBatch({
  'remove()': {
    topic: function () {
      var self = this;
      Helper.createSandbox('remove', function (err, src) {
        if (err) {
          self.callback(err);
          return;
        }

        FsTools.remove(src, function (err) {
          if (err) {
            self.callback(err);
            return;
          }

          process.nextTick(function () {
            self.callback(null, Path.existsSync(src));
          });
        });
      });
    },

    'should remove all': function (err, exists) {
      Assert.isFalse(exists);
    }
  }
}).export(module);
