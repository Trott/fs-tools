'use strict';


// stdlib
var fs = require('fs'),
    path_join = require('path').join,
    dirname = require('path').dirname;


// 3rd-party
var Promise = require('simple-promise'),
    _ = require('underscore');


// walks through directory calling `iterator` on every entry and
// callback in the end
var walk_on = function walk_on(path, iterator, callback) {
  fs.readdir(path, function (err, files) {
    var all;

    if (err) {
      callback(err);
      return;
    }

    all = new Promise.Joint(callback);

    _(files).chain().map(function(file) {
      return path_join(path, file);
    }).each(function (path) {
      var promise = all.promise();

      fs.stat(path, function (err, stats) {
        if (err) {
          all.reject(err);
          return;
        }

        iterator(path, stats, function (err) {
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


var walk = function walk(path, pattern, iterator, callback) {
  var match, // function that tells whenever iterator need to be called or not
      walk_on_recursive; // recursive walker

  if (_.isFunction(pattern)) {
    // Scenario: FileWalker(path, iterator[, callback])
    callback = iterator;
    iterator = pattern;
    match = function () { return true; };
  } else {
    // Scenario: FileWalker(path, pattern, iterator[, callback])
    pattern = new RegExp(pattern);
    match = function (path) { return path.test(pattern); };
  }

  if (!_.isFunction(callback)) {
    // Scenario: FileWalker(path, pattern, iterator)
    //       or: FileWalker(path, iterator)
    callback = function () {};
  }

  // recursively walks through all files
  walk_on_recursive = function walk_on_recursive(path, callback) {
    // walk through given path
    walk_on(path, function (path, stats, callback) {
      // go deeper inside
      if (stats.isDirectory()) {
        walk_on_recursive(path, callback);
        return;
      }

      // fire iterator on matching files
      if (match(path)) {
        iterator(path, stats, callback);
        return;
      }

      // path neither directory nor matching file - skip
      callback();
    }, callback);
  };

  // start walking
  walk_on_recursive(path, callback);
};


var rm_rf = function rm_rf(path, callback) {
  walk_on(path, function (path, stats, callback) {
    if (stats.isDirectory()) {
      rm_rf(path, function (err) {
        if (err) {
          callback(err);
          return;
        }

        fs.rmdir(path, callback);
      });
      return;
    }

    fs.unlink(path, callback);
  }, callback);
};


var mkdir_p = function mkdir_p(path, callback) {
  path.exists(dir, function (exists) {
    var parent;

    if (exists) {
      callback(null);
      return;
    }

    parent = dirname(dir);

    mkdir_p(parent, function (err) {
      if (err) {
        callback(err);
        return;
      }

      fs.mkdir(dir, '0755', function (err) {
        // EEXIST is not error in our case
        // but a race condition :((
        if (err && 'EEXIST' === err.code) {
          callback(null);
          return;
        }

        // fallback to default behavior
        callback(err);
      });
    });
  });
};


var copy = function copy(src, dst, callback) {
  fs.readFile(src, function (err, buff) {
    if (err) {
      callback(err);
      return;
    }

    mkdir_p(dirname(dst), function (err) {
      if (err) {
        callback(err);
        return;
      }

      fs.writeFile(dst, buff, callback);
    });
  });
};


module.exports = {
  walk: walk,
  rm_rf: rm_rf,
  mkdir_p: mkdir_p,
  copy: copy
};
////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
