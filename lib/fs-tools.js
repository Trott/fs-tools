var FileWalker = require('./fs-tools/walker');

/**
 *  FsTools.walk(path, pattern, callback) -> FsTools.FileWalker
 *  FsTools.walk(path, callback) -> FsTools.FileWalker
 *  FsTools.walk(path, pattern) -> FsTools.FileWalker
 *  FsTools.walk(path) -> FsTools.FileWalker
 **/
exports.walk = function walk(path, pattern, callback) {
  return new FileWalker(path, pattern, callback);
};


////////////////////////////////////////////////////////////////////////////////
// vim:ts=2:sw=2
////////////////////////////////////////////////////////////////////////////////
