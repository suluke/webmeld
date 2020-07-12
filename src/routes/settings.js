import express from 'express';

function validateKey(key) {
  if (key.indexOf('directories.') !== 0) {
    return false;
  }
  return true;
}

export default function Settings() {
  const router = express.Router();
  router.get('/', function(req, res) {
    res.render('settings', { settings: req.app.locals.settings, baseUrl: req.baseUrl });
  });
  router.post('/', function(req, res) {
    if (!req.app.locals.settings.isLocked()) {
      for (let key of Object.keys(req.body)) {
        if (!validateKey(key)) {
          console.log(`Unknown option: ${key}. SKIPPING`);
          continue;
        }
        req.app.locals.settings.write(key, req.body[key]);
      }
    } else {
      // TODO return 503
    }
    res.redirect('.');
  });
  router.post('/lock', function(req, res) {
    req.app.locals.settings.lock();
    res.redirect('..')
  });
  router.post('/reload', function(req, res) {
    req.app.locals.settings.load();
    res.redirect('..')
  });
  return router;
};
