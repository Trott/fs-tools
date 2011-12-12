'use strict';


var Assert = require('assert');
var FsTools = require('../lib/fs-tools');
var Helper = require('./helper');
var exec = require('child_process').exec;


require('vows').describe('FsTools').addBatch({
  'copy()': {
    topic: function () {
      var self = this;
      Helper.createSandbox('copy', function (err, src) {
        if (err) {
          self.callback(err);
          return;
        }

        FsTools.copy(src, src + '-dst', function (err) {
          if (err) {
            self.callback(err);
            return;
          }

          exec('cd ' + src + ' && -R -p .', function (err, src_out) {
            if (err) {
              self.callback(err);
              return;
            }

            exec('cd ' + src + '-dst && -R -p .', function (err, dst_out) {
              if (err) {
                self.callback(err);
                return;
              }

              self.callback(null, src_out, dst_out);
            });
          });
        });
      });
    },

    'should make an exact copy': function (err, src, dst) {
      Assert.equal(src, dst);
    }
  }
}).export(module);
