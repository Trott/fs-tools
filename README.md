fs-tools
========

Provides some everyday needed tools to work with FS missing in standard library.
See [API Documentation][api-doc] for detailed info.


Implemented methods
-------------------

- [walk][]
- [rm_rf][]
- [mkdir_p][]
- [copy][]


Usage overview
--------------

### walk(path, pattern, iterator[, callback])

    fstools.walk('/home/nodeca', '\.yml$', function (path, stats, callback) {
      fs.readFile(path, 'utf-8', funtion (err, str) {
        if (err) {
          callback(err);
          return;
        }

        console.log(str);
        callback();
      });
    }, function (err) {
      if (err) {
        console.error(err);
      }

      console.log('Done!');
    });

### rm_rf(path, callback)

    fstools.rm_rf('/home/nodeca/trash', function (err) {
      if (err) {
        console.log("U can't touch that");
        console.err(err);
        process.exit(1);
      } else {
        console.log("It's Hammer time");
        process.exit(0);
      }
    });

### mkdir_p(path, callback)

    fstools.mkdir_p('/home/nodeca/media/xxx', function (err) {
      if (err) {
        console.log("Can't' create directory");
        console.err(err);
        process.exit(1);
      } else {
        console.log("We can now store some romantic movies here");
        process.exit(0);
      }
    });

### copy(src, dst, callback)

    var src = '/home/nodeca/secrets.yml',
        dst = '/home/nodeca/very/deep/secrets/main.yml';

    fstools.copy(src, dst, function (err) {
      if (err) {
        console.log("Failed copy " + src + " into " + dst);
        console.err(err);
        process.exit(1);
      } else {
        console.log("Fone!");
        process.exit(0);
      }
    });


[api-doc]:  http://nodeca.github.com/fs-tools/FsTools/index.html
[walk]:     http://nodeca.github.com/fs-tools/FsTools/walk/index.html
[rm_rf]:    http://nodeca.github.com/fs-tools/FsTools/mkdir_p/index.html
[mkdir_p]:  http://nodeca.github.com/fs-tools/FsTools/mkdir_p/index.html
[copy]:     http://nodeca.github.com/fs-tools/FsTools/copy/index.html
