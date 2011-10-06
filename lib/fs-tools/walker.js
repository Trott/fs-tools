'use strict';


// stdlib
var fs = require('fs');


// 3rd-party
var Promise = require('simple-promise'),
    _ = require('underscore');


// when no patter was given to the FileWalker - match all files
var DEFAULT_MATCHER = function () { return true; };


// noop function
var DEFAULT_CALLBACK = function () {};


// default onFile/onDir callback
var DEFAULT_HANDLER = function (path, stats, callback) { callback(); };


/**
 *  new FileWalker(path, pattern, callback)
 *  new FileWalker(path, callback)
 *  new FileWalker(path, pattern)
 *  new FileWalker(path)
 **/
var FileWalker = module.exports = function FileWalker(path, pattern, callback) {
  var self = this, // self-reference
      on_file = DEFAULT_HANDLER, // fired on each file
      on_dir = DEFAULT_HANDLER, // fired on each directory
      walk_on, // file traversal
      matcher; // used to filter list of files


  if (!callback) {
    if (!_.isFunction(pattern)) {
      // Scenario: FileWalker(path, pattern) || FileWalker(path)
      callback = DEFAULT_CALLBACK;
    } else {
      // Scenario: FileWalker(path, callback)
      callback = pattern;
      pattern  = null;
    }
  }

  if (null === pattern) {
    // Scenario: FileWalker(path, callback) || FileWalker(path, null, callback)
    matcher = DEFAULT_MATCHER;
  } else {
    // Scenario: FileWalker(path, pattern) || FileWalker(path, patter, callback)
    pattern = new RegExp(pattern); // make sure we have precompiled regexp
    matcher = function (path) { return path.test(pattern); };
  }


  // Real FS traversal
  // "Walk on, walk on with hope in your heart..."
  walk_on = function walk_on(path, callback) {
    fs.readdir(path, function (err, files) {
      var all;

      if (err) {
        callback(err);
        return;
      }

      all = new Promise.Joint(callback);

      _(files).chain().map(function (file) {
        return path_join(path, file);
      }).select(match).each(function (path) {
        var promise = all.promise();

        fs.stat(path, function (err, stats) {
          if (err) {
            all.reject(err);
            return;
          }

          if (stats.isDirectory()) {
            on_dir(path, stats, function (err) {
              if (err) {
                all.reject(err);
                return;
              }

              walk_on(path, function (err) {
                if (err) {
                  all.reject(err);
                  return;
                }

                promise.resolve();
              });
            });
            return;
          }

          on_file(path, stats, function (err) {
            if (err) {
              all.reject(err);
              return;
            }

            promise.resolve();
          });
        });
      });

      all.wait();
    });
  };


  this.onFile = function onFile(callback) {
    on_file = callback;
    return this;
  };


  this.onDir = function onDir(callback) {
    on_dir = callback;
    return this;
  };


  // Alright boys and girls, have some fun!
  process.nextTick(function () {
    walk_on(path, callback);
  });
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
