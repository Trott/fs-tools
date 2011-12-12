'use strict';


var exec = require('child_process').exec;
var Helper = module.exports = {};
var TMP_DIR = require('fs').realpathSync(__dirname + '/..') + '/tmp';


function runExecs(err, funcs, callback) {
  if (err || 0 === funcs.length) {
    callback(err);
    return;
  }

  exec(funcs.shift(), function (err) {
    runExecs(err, funcs, callback);
  });
}


Helper.createSandbox = function (name, cb) {
  var base = TMP_DIR + '/' + name;

  runExecs(null, [
    'rm -rf ' + base,
    'mkdir -p ' + base + '/foo/bar/baz',
    'touch ' + base + '/foo/bar/abc',
    'cd ' + base + '/foo && ln -s bar/baz baz'
  ], function (err) {
    cb(err, base);
  });
};
