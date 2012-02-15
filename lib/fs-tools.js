/**
 *  FsTools
 *
 *  Collection of FS related tools, that stdlib lack of.
 **/


'use strict';


// stdlib
var fs = require('fs');
var path_join = require('path').join;
var path_exists = require('path').exists;
var path_normalize = require('path').normalize;
var dirname = require('path').dirname;


// 3rd-party
var async = require('async');
var _ = require('underscore');


// epxorts: walk, mkdir, copy, remove
var fstools = module.exports = {};


// INTERNAL HELPERS
////////////////////////////////////////////////////////////////////////////////


//  walk_flat(path, iterator, callback) -> void
//  - path (String): Path to iterate through
//  - iterator (Function): Will be fired on each element within `path`
//  - callback (Function): Will be fired once all files were processed
//
//  Walks through given `path` and calls `iterator(path, callback)` for
//  each found entry (regardless to it's type) and waits for all `callback`s
//  (passed to iterator) to be fired. After all callbacks were fired, fires
//  `callback` (given to walk_flat itself).
//
//  NOTICE: It walks through single dimension of file system - it won't go into
//          found sub-directories. See `walk_recursive` for this puprpose.
//
//  Example:
//
//    walk_flat('/home/nodeca', function (path, callback) {
//      if ('/home/nodeca/secrets.yml' === path) {
//        callback(Error("There is secrets file."));
//        return;
//      }
//
//      if ('/home/nodeca/xxx' === path) {
//        callback(Error("Path contains some porno?"));
//        return;
//      }
//
//      callback();
//    }, function (err) {
//      if (err) console.error(err);
//      console.log('Done');
//    });
function walk_flat(path, iterator, callback) {
  fs.readdir(path, function (err, files) {
    if (err) {
      if (err && 'ENOENT' === err.code) {
        callback(null);
        return;
      }

      callback(err);
      return;
    }

    async.forEach(files, function (file, next) {
      iterator(path_join(path, file), next);
    }, callback);
  });
}


function copy_file(src, dst, callback) {
  var ifd, ofd;

  // create streams
  ifd = fs.createReadStream(src, {bufferSize: 64 * 1024}).on('error', callback);
  ofd = fs.createWriteStream(dst).on('error', callback).on('close', callback);

  // pipe src to dst
  ifd.pipe(ofd);
}


// PUBLIC API
////////////////////////////////////////////////////////////////////////////////


/**
 *  FsTools.walk(path, pattern, iterator, callback) -> void
 *  FsTools.walk(path, iterator, callback) -> void
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
fstools.walk = function (path, pattern, iterator, callback) {
  var match;

  if (!callback) {
    pattern  = null;
    iterator = arguments[1];
    callback = arguments[2];
  }

  if (!pattern) {
    match = function () { return true; };
  } else if (_.isFunction(pattern) && !_.isRegExp(pattern)) {
    match = pattern;
  } else {
    pattern = new RegExp(pattern);
    match = function (path) { return pattern.test(path); };
  }

  walk_flat(path_normalize(path), function (path, next) {
    fs.lstat(path, function (err, stats) {
      if (err) {
        next(err);
        return;
      }

      if (stats.isDirectory()) {
        fstools.walk(path, pattern, iterator, next);
        return;
      }

      if (match(path)) {
        iterator(path, stats, next);
        return;
      }

      next();
    });
  }, callback);
};


/**
 *  FsTools.remove(path, callback) -> void
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
 *      fstools.remove('/home/nodeca/trash', function (err) {
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
fstools.remove = function (path, callback) {
  path = path_normalize(path);
  fs.lstat(path, function (err, stats) {
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

    async.series([
      async.apply(walk_flat, path, fstools.remove),
      async.apply(fs.rmdir, path)
    ], function (err, results) {
      callback(err);
    });
  });
};


/**
 *  FsTools.mkdir(path, mode, callback) -> void
 *  FsTools.mkdir(path, callback) -> void
 *  - path (String): Path to create
 *  - mode (String|Number): Permission mode of new directory. See stdlib
 *    fs.mkdir for details. Default: '0755'.
 *  - callback (Function): Fired after path was created
 *
 *  Creates given path, creating parents recursively if needed.
 *  Similar to UNIX' `mkdir -pf <path>`. After all will fire `callback(err)` with
 *  an error if there were any.
 *
 *
 *  ##### Example
 *
 *      fstools.mkdir('/home/nodeca/media/xxx', function (err) {
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
fstools.mkdir = function (path, mode, callback) {
  if (undefined === callback && _.isFunction(mode)) {
    callback = mode;
    mode = '0755';
  }

  path = path_normalize(path);
  path_exists(path, function (exists) {
    var parent;

    if (exists) {
      callback(null);
      return;
    }

    parent = dirname(path);
    fstools.mkdir(parent, mode, function (err) {
      if (err) {
        callback(err);
        return;
      }

      fs.mkdir(path, mode, function (err) {
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


/**
 *  FsTools.copy(src, dst, callback) -> void
 *  - src (String): Source file
 *  - dst (String): Destination file
 *  - callback (Function): Fired after path has been copied
 *
 *  Copies `src` to `dst`, creates directory for given `dst` with
 *  [[FsTools.mkdir]] if needed. Fires `callback(err)` upon
 *  completion.
 *
 *  ##### Example
 *
 *      var src = '/home/nodeca/secrets.yml',
 *          dst = '/home/nodeca/very/deep/secrets/main.yml';
 *
 *      fstools.copy(src, dst, function (err) {
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
fstools.copy = function (src, dst, callback) {
  src = path_normalize(src);
  dst = path_normalize(dst);

  // sad but true - people make mistakes...
  if (src === dst) {
    callback(null);
    return;
  }

  fs.lstat(src, function (err, stats) {
    if (err) {
      callback(err);
      return;
    }

    fstools.mkdir(dirname(dst), function (err) {
      var chmod, done;

      if (err) {
        callback(err);
        return;
      }

      // chmod dst
      chmod = async.apply(fs.chmod, dst, stats.mode.toString(8).slice(-4));

      // reject async.series' results
      done = function (err/*, results */) { callback(err); };

      // *** file
      if (stats.isFile()) {
        async.series([async.apply(copy_file, src, dst), chmod], done);
        return;
      }

      // *** symbolic link
      if (stats.isSymbolicLink()) {
        async.waterfall([
          function (next) {
            path_exists(dst, function (exists) {
              if (exists) {
                fstools.remove(dst, next);
                return;
              }

              next();
            });
          },
          async.apply(fs.readlink, src),
          function (linkpath, next) {
            fs.symlink(linkpath, dst, next);
          },
          chmod
        ], done);
        return;
      }

      // *** directory
      if (stats.isDirectory()) {
        async.series([
          function (next) {
            fs.mkdir(dst, '0755', function (err) {
              if (err && 'EEXIST' === err.code) {
                next(null);
                return;
              }

              next(err);
            });
          },
          async.apply(walk_flat, src, function (path, next) {
            fstools.copy(path, dst + path.replace(src, ''), next);
          }),
          chmod
        ], done);
        return;
      }

      // *** unsupported src
      callback(new Error("Unsupported type of the source"));
    });
  });
};




/**
 *  FsTools.stats(thing, callback) -> void
 *  - thing (String): file or directory to calculate stats for 
 *  - callback (Function): Fired after the stats have been calculated
 *
 *  Calculates the stats of a file or directory. Fires `callback(err,stats)` upon
 *  completion.
 *
 *  ##### Example
 *
 *      var dir = '/home/nodeca/';
 *
 *      fstools.stats(dir, function (err,stats) {
 *        if (err) {
 *          console.log("Failed calculate the stats for dir",dir);
 *          console.err(err);
 *          process.exit(1);
 *        } else {
 *          console.log("The size of the directory is",stats.size);
 *          console.log("The number of files for the directory is ",stats.files);
 *          console.log("The number of dirs for the directory is ",stats.dirs);
 *          console.log("The number of special files for the directory is ",stats.special);
 *          process.exit(0);
 *        }
 *      });
 **/
fstools.stats=function(thing,complete){
  var cstats = { 
    size:0,
    files:0,
    dirs:0,
    special:0
  };
  fs.stat(thing,function(err,stats){
    if(err)
      return complete(err);
    if(stats.isFile()){
      cstats.size=stats.size;
      cstats.files++;
      return complete(null,cstats);
    } else if(stats.isDirectory()){
      var lastPath=null;
      fstools.walk(thing, function (path, stats, callback) {
        var currentPath = dirname(path);
        if(currentPath!=lastPath){
          cstats.dirs++;
          lastPath = currentPath;
        }
        cstats.size+=stats.size;
        if(stats.isFile()) cstats.files++;
        else cstats.special++;
        callback();
      }, function (err) {
        if (err) {
          return complete(err);
        }
        complete(null,cstats);  
      });
    } else {
      cstats.size=stats.size;
      cstats.special++;
      return complete(null,cstats); 
    }
  });
}

