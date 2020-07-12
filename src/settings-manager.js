import jsonfile from 'jsonfile';
import path from 'path'
import process from 'process'

export default class SettingsManager {
  constructor() {
    this.itsPersistPath = path.join(path.dirname(process.argv[1]), 'cnvrg_settings.json');
    this.itsSettings = {
      'settings' : {},
      'locked': false
    };
    if (!this.load()) {
      this._persist();
    }
  }
  lock() {
    this.itsSettings.locked = true;
    this._persist();
  }
  isLocked() {
    return this.itsSettings.locked;
  }
  read(key) {
    return this._copy(this._access(this._parsePath(key)));
  }
  async write(key, value) {
    if (this.itsSettings.locked) {
      throw new Error(`Cannot write setting ${key}: Settings are locked`);
    }
    const path = this._parsePath(key);
    const name = path.pop();
    const parent = this._access(path, isNaN(name));
    parent[name] = this._copy(value);
    return this._persist();
  }
  async push(key, value) {
    if (this.itsSettings.locked) {
      throw new Error(`Cannot push to setting ${key}: Settings are locked`);
    }
    const path = this._parsePath(key);
    const array = this._access(path, false);
    if (!Array.isArray(array)) {
      throw new Error(`Cannot push to ${key}: Not a list`);
    }
    array.push(this._copy(value));
    return this._persist();
  }
  load() {
    const settings = jsonfile.readFileSync(this.itsPersistPath, { throws: false });
    if (settings === null) {
      return false;
    }
    this.itsSettings = settings;
    return true;
  }

  _access(path, preferObject = true) {
    const worklist = path.slice();
    let current = this.itsSettings.settings;
    while (worklist.length > 0) {
      const item = worklist.shift();
      if (current[item] === undefined) {
        if ((worklist.length === 0 && preferObject) || (worklist.length > 0 && isNaN(worklist[0]))) {
          current[item] = {};
        } else {
          current[item] = [];
        }
      }
      current = current[item];
    }
    return current;
  }
  _copy(value) {
    return JSON.parse(JSON.stringify(value));
  }
  _parsePath(key) {
    return key.split('.');
  }
  async _persist() {
    return new Promise((resolve, reject) => {
      jsonfile.writeFile(this.itsPersistPath, this.itsSettings, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}