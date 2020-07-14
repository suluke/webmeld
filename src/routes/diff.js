import express from 'express';
import fs, { read } from 'fs';
import path from 'path';
import process from 'process'
import util from 'util';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

class DirectoryEntry {
  constructor(name) {
    this.itsName = name;
    this.itsExistsIn = [];
  }
  addExistsIn(dir) {
    this.itsExistsIn.push(dir);
  }
}

class FileEntry {
  constructor(name) {
    this.itsName = name;
    this.itsExistsIn = [];
  }
  addExistsIn(dir) {
    this.itsExistsIn.push(dir);
  }
}

export default function Diff() {
  const router = express.Router();
  router.get(['/', '/diff', '/diff/*'], async function(req, res) {
    const dirs = req.app.locals.settings.read('directories');
    if (dirs === null || dirs.length < 2) {
      res.redirect('/settings');
    } else {
      const contents = {
        directories: {},
        files: {}
      };
      const pathparam = req.path === '/' ? '' : req.path.substring(5);
      console.log(pathparam);
      let mainPath = path.resolve(path.join(dirs[0], pathparam));
      if (mainPath.indexOf(dirs[0]) !== 0) {
        // TODO make this an error?
        mainPath = dirs[0];
      }
      const pathStat = await stat(mainPath);
      if (pathStat.isDirectory()) {
        for (let dir of dirs) {
          const dirpath = path.resolve(path.join(dir, pathparam));
          if (dirpath.indexOf(path.resolve(dir)) !== 0) {
            // TODO make this an error?
            continue;
          }
          const dircontent = await readdir(dirpath, { withFileTypes: true });
          //console.log(dircontent);
          for (let entry of dircontent) {
            if (entry.isDirectory()) {
              if (!contents.directories[entry.name]) {
                contents.directories[entry.name] = new DirectoryEntry(entry.name);
              }
              contents.directories[entry.name].addExistsIn(dir);
            } else {
              if (!contents.files[entry.name]) {
                contents.files[entry.name] = new FileEntry(entry.name);
              }
              contents.files[entry.name].addExistsIn(dir);
            }
          }
        }
        res.render('diff-dir', { baseDirs: dirs, contents, path: (req.path === '/' ? '/diff' : req.path), baseUrl: req.baseUrl });
      } else {
        const contents = [];
        for (let dir of dirs) {
          const filepath = path.resolve(path.join(dir, pathparam));
          if (filepath.indexOf(path.resolve(dir)) !== 0) {
            // TODO make this an error?
            continue;
          }
          const content = await readFile(filepath);
          contents.push(content);
        }
        res.render('diff-file', { baseDirs: dirs, contents, fileExt: path.extname(pathparam).substring(1), path: (req.path === '/' ? '/diff' : req.path), baseUrl: req.baseUrl });
      }
    }
  });
  router.get('/static/diff.min.js', function(req, res) {
    res.sendFile(path.join(path.dirname(process.argv[1]), 'node_modules', 'diff', 'dist', 'diff.min.js'));
  });
  router.get('/static/highlight.min.js', function(req, res) {
    res.sendFile(path.join(path.dirname(process.argv[1]), 'node_modules', '@highlightjs', 'cdn-assets', 'highlight.min.js'));
  });
  router.get('/static/highlight/default.css', function(req, res) {
    res.sendFile(path.join(path.dirname(process.argv[1]), 'node_modules', '@highlightjs', 'cdn-assets', 'styles', 'default.min.css'));
  });
  return router;
};
