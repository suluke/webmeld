import SettingsManager from './settings-manager.js'
import SettingsRoute from './routes/settings.js'
import DiffRoute from './routes/diff.js'

import bodyParser from 'body-parser';
import express from 'express';

export default function WebMeld() {
  const server = express();
  server.use(bodyParser.urlencoded({ extended: false }));
  server.locals.settings = new SettingsManager();
  server.set('view engine', 'pug');
  server.set('views', 'src/routes');
  server.use('/settings', SettingsRoute());
  server.use('/', DiffRoute());
  return server;
};
