import express from 'express';

export default function Settings() {
  const router = express.Router();
  router.get('/', function(req, res) {
    res.render('settings', { settings: req.app.locals.settings });
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
