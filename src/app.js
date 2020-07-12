import SettingsManager from './settings-manager.js'
import SettingsRoute from './routes/settings.js'

import express from 'express';

export default function Cnvrg() {
  const server = express();
  server.locals.settings = new SettingsManager();
  server.set('view engine', 'pug');
  server.set('views', 'src/routes');
  server.use('/settings', SettingsRoute());
  server.get('/', function(req, res) {
    res.redirect('/settings');
  });
  return server;
};