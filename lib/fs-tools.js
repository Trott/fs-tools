/**
 *  FsTools
 *
 *  Collection of FS related tools, that stdlib lack of.
 **/


'use strict';


// stdlib
var fs = require('fs'),
    path_join = require('path').join,
    path_exists = require('path').exists,
    path_normalize = require('path').normalize,
    dirname = require('path').dirname;


// 3rd-party
var Promise = require('simple-promise'),
    _ = require('underscore');


// INTERNAL HELPERS
////////////////////////////////////////////////////////////////////////////////


//  walk_flat(path, iterator, callback) -> void
//  - path (String): Path to iterate through
//  - iterator (Function): Will be fired on each element within `path`
//  - callback (Function): Will be fired once all files were processed
//
//  Walks through given `path` and calls `iterator(path, stats, callback)` for
//  each foun entry (regardless to it's type) and waits for all `callback`s
//  (passed to iterator) to be fired. After all callbacks were fired, fires
//  `callback` (given to walk_flat itself).
//
//  NOTICE: It walks through single dimension of file system - it won't go into
//          found sub-directories. See `walk_recursive` for this puprpose.
//
//  Example:
//
//    walk_flat('/home/nodeca', function (path, stats, callback) {
//      if ('/home/nodeca/secrets.yml' === path) {
//        callback(Error("There is secrets file."));
//        return;
//      }
//
//      if ('/home/nodeca/xxx' === path && stats.isDirectory()) {
//        callback(Error("Path contains xxx directory."));
//        return;
//      }
//
//      callback();
//    }, function (err) {
//      if (err) console.error(err);
//      console.log('Done');
//    });
var walk_flat = function walk_flat(path, iterator, callback) {
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

      fs.lstat(path, function (err, stats) {
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


//  walk_recursive(path, iterator, callback) -> void
//
//  Proxies call to `walk_flat`, but wraps `iterator` so that it will
//  recursively go deeper inside each found directoy instead of calling
//  iterator on it.
var walk_recursive = function walk_recursive(path, iterator, callback) {
  // walk through given path
  walk_flat(path, function (path, stats, callback) {
    // go deeper inside
    if (stats.isDirectory()) {
      walk_recursive(path, iterator, callback);
      return;
    }

    // call iterator if not directory
    iterator(path, stats, callback);
  }, callback);
};


// chown that silencly ignored when we are not root
var chown = (0 === process.getuid())
          ? (function (path, uid, gid, callback) { callback(); })
          : fs.chown;


// copies src to dst
var copy = function copy(src, dst, callback) {
  var ifd, ofd;

  // create streams
  ifd = fs.createReadStream(src, {bufferSize: 64 * 1024}).on('error', callback);
  ofd = fs.createWriteStream(dst).on('error', callback).on('close', callback);

  // pipe src to dst
  ifd.pipe(ofd);
};


// real cp_a worker
var _cp_a = function _cp_a(src, dst, stats, callback) {
  var mode = stats.mode.toString(8).slice(-4);

  // *** file

  if (stats.isFile()) {
    copy(src, dst, function (err) {
      if (err) {
        callback(err);
        return;
      }

      // chmod file
      fs.chmod(dst, mode, function (err) {
        if (err) {
          callback(err);
          return;
        }

        // chown file
        chown(dst, stats.uid, stats.gid, callback);
      });
    });
    return;
  }

  // *** symbolic link

  if (stats.isSymbolicLink()) {
    // get where symlink points to
    fs.readlink(src, function (err, linkpath) {
      if (err) {
        callback(err);
        return;
      }

      // create symlink
      fs.symlink(linkpath, dst, function (err) {
        if (err) {
          callback(err);
          return;
        }

        // chown symlink
        chown(dst, stats.uid, stats.gid, callback);
      });
    });
    return;
  }

  // *** directory

  if (stats.isDirectory()) {
    fs.mkdir(dst, mode, function (err) {
      if (err) {
        callback(err);
        return;
      }

      chown(dst, stats.uid, stats.gid, function (err) {
        if (err) {
          callback(err);
          return;
        }

        walk_flat(src, function (sub_src, sub_stats, callback) {
          _cp_a(sub_src, dst + sub_src.replace(src, ''), sub_stats, callback);
        }, callback);
      });
    });
    return;
  }

  // *** unsupported src

  callback(new Error("Unsupported type of the source"));
}


// PUBLIC API
////////////////////////////////////////////////////////////////////////////////


/**
 *  FsTools.walk(path, pattern, iterator[, callback]) -> void
 *  FsTools.walk(path, iterator[, callback]) -> void
 *
 *  Walks throught all files withing `path` (including sub-dirs) and calls
 *  `iterator` on each found file (or block device etc.) matching `pattern`.
 *  If no `pattern` was given - will fire call `iterator` for every single
 *  path found. After all iterations will call `callback` (if it was specified)
 *  with passing `error` as first arguemtn if there was an error.
 *
 *  ##### Iterator
 *
 *  All iterations are running within promise. So `callback` given to the `walk`
 *  will fire only after all `iterator` callbacks willnotify they finished their
 *  work:
 *
 *      var iterator = function (path, stats, callback) {
 *        // ... do something
 *        if (err) {
 *          // ... if error occured we can "stop" walker
 *          callback(err);
 *          return;
 *        }
 *        // ... if everything is good and finished notify walker we're done
 *        callback();
 *      };
 *
 *  Iterator is called with following arguments:
 *
 *  - `path` (String): Full path of the found element (e.g. `/foo/bar.txt`)
 *  - `stats` (fs.Stats): Stats object of found path
 *  - `callback` (Function): Callback function to call after path processing
 *
 *
 *  ##### Example
 *
 *      fstools.walk('/home/nodeca', function (path, stats, callback) {
 *        if (stats.isBlockDevice()) {
 *          callback(Error("WTF? Block devices are not expetcted in my room"));
 *          return;
 *        }
 *
 *        if (stats.isSocket()) {
 *          console.log("Finally I found my socket");
 *        }
 *
 *        callback();
 *      }, function (err) {
 *        if (err) {
 *          // shit happens!
 *          console.error(err);
 *          process.exit(1);
 *        }
 *
 *        console.log("Hooray! We're done!");
 *      });
 *
 *
 *  ##### Example (using pattern matching)
 *
 *      fstools.walk('/home/nodeca', '\.yml$', function (path, stats, callback) {
 *        fs.readFile(path, 'utf-8', funtion (err, str) {
 *          if (err) {
 *            callback(err);
 *            return;
 *          }
 *
 *          console.log(str);
 *          callback();
 *        });
 *      }, function (err) {
 *        if (err) {
 *          console.error(err);
 *        }
 *
 *        console.log('Done!');
 *      });
 **/
var walk = exports.walk = function walk(path, pattern, iterator, callback) {
  path = path_normalize(path);
  var match; // function that tells whenever iterator need to be called or not

  if (_.isFunction(pattern)) {
    // Scenario: FileWalker(path, iterator[, callback])
    callback = iterator;
    iterator = pattern;
    match = function () { return true; };
  } else {
    // Scenario: FileWalker(path, pattern, iterator[, callback])
    pattern = new RegExp(pattern);
    match = function (path) { return pattern.test(path); };
  }

  if (!_.isFunction(callback)) {
    // Scenario: FileWalker(path, pattern, iterator)
    //       or: FileWalker(path, iterator)
    callback = function () {};
  }

  // start walking
  walk_recursive(path, function(path, stats, callback) {
    // call iterator on 
    if (match(path)) {
      iterator(path, stats, callback);
      return;
    }

    callback();
  }, callback);
};


/**
 *  FsTools.rm_rf(path, callback) -> void
 *  - path (String): Path to remove
 *  - callback (Function): Fired after path was removed
 *
 *  Removes given `path`. If it was a directory will remove it recursively,
 *  similar to UNIX' `rm -rf <path>`. After all will fire `callback(err)` with
 *  an error if there were any.
 *
 *  If given `path` was file - will proxy call to `fs.unlink`.
 *
 *
 *  ##### Example
 *
 *      fstools.rm_rf('/home/nodeca/trash', function (err) {
 *        if (err) {
 *          console.log("U can't touch that");
 *          console.err(err);
 *          process.exit(1);
 *        } else {
 *          console.log("It's Hammer time");
 *          process.exit(0);
 *        }
 *      });
 **/
var rm_rf = exports.rm_rf = function rm_rf(path, callback) {
  path = path_normalize(path);
  fs.stat(path, function (err, stats) {
    if (err) {
      // file/dir not exists - no need to do anything
      if ('ENOENT' === err.code) {
        callback(null);
        return;
      }

      // unknown error - can't continue
      callback(err);
      return;
    }

    if (!stats.isDirectory()) {
      fs.unlink(path, callback);
      return;
    }

    walk_flat(path, function (path, stats, next) {
      if (stats.isDirectory()) {
        rm_rf(path, function (err) {
          if (err) {
            next(err);
            return;
          }

          fs.rmdir(path, next);
        });
        return;
      }

      fs.unlink(path, next);
    }, function() {
      fs.rmdir(path, callback);
    });
  });
};


/**
 *  FsTools.mkdir_p(path, callback) -> void
 *  - path (String): Path to create
 *  - callback (Function): Fired after path was created
 *
 *  Creates given path, creating parents recursively if needed.
 *  Similar to UNIX' `mkdir -p <path>`. After all will fire `callback(err)` with
 *  an error if there were any.
 *
 *
 *  ##### Example
 *
 *      fstools.mkdir_p('/home/nodeca/media/xxx', function (err) {
 *        if (err) {
 *          console.log("Can't' create directory");
 *          console.err(err);
 *          process.exit(1);
 *        } else {
 *          console.log("We can now store some romantic movies here");
 *          process.exit(0);
 *        }
 *      });
 **/
var mkdir_p = exports.mkdir_p = function mkdir_p(path, callback) {
  path = path_normalize(path);
  path_exists(path, function (exists) {
    var parent;

    if (exists) {
      callback(null);
      return;
    }

    parent = dirname(path);

    mkdir_p(parent, function (err) {
      if (err) {
        callback(err);
        return;
      }

      fs.mkdir(path, '0755', function (err) {
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


/** alias of: cp, deprecated
 *  FsTools.cp(src, dst, callback) -> void
 *
 *  Use .cp() instead.
 **/
exports.copy = cp;


/**
 *  FsTools.cp(src, dst, callback) -> void
 *  - src (String): Source file
 *  - dst (String): Destination file
 *  - callback (Function): Fired after path has been copied
 *
 *  Copies `src` to `dst`, creates directory for given `dst` with
 *  [[FsTools.mkdir_p]] if needed. Fires `callback(err)` upon
 *  completion.
 *
 *  ##### Example
 *
 *      var src = '/home/nodeca/secrets.yml',
 *          dst = '/home/nodeca/very/deep/secrets/main.yml';
 *
 *      fstools.cp(src, dst, function (err) {
 *        if (err) {
 *          console.log("Failed copy " + src + " into " + dst);
 *          console.err(err);
 *          process.exit(1);
 *        } else {
 *          console.log("Done!");
 *          process.exit(0);
 *        }
 *      });
 **/
var cp = exports.cp = function cp(src, dst, callback) {
  src = path_normalize(src);
  dst = path_normalize(dst);
  mkdir_p(dirname(dst), function(err) {
    if (err) { callback(err); return; }
    copy(src, dst, callback);
  });
};


/**
 *  FsTools.cp_a(src, dst, callback) -> void
 *  - src (String): Source file/directory
 *  - dst (String): Destination file/directory
 *  - callback (Function): Fired after path has been copied
 *
 *  Mimicks UNIX "cp -a".
 *
 *  Supports:
 *    - symlinks
 *    - files
 *    - directories
 **/
var cp_a = exports.cp_a = function cp_a(src, dst, callback) {
  src = path_normalize(src);
  dst = path_normalize(dst);
  fs.lstat(src, function (err, stats) {
    _cp_a(src, dst, stats, callback);
  });
};

////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
