import jsonfile from 'jsonfile';
import path from 'path'
import process from 'process'

export default class SettingsManager {
  constructor() {
    this.itsPersistPath = path.join(path.dirname(process.argv[1]), 'webmeld_settings.json');
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
  read(key, type = null) {
    return this._copy(this._access(this._parsePath(key), type));
  }
  async write(key, value) {
    if (this.itsSettings.locked) {
      throw new Error(`Cannot write setting ${key}: Settings are locked`);
    }
    const path = this._parsePath(key);
    const name = path.pop();
    const parent = this._access(path, isNaN(name)? Object : Array);
    parent[name] = this._copy(value);
    return this._persist();
  }
  async push(key, value) {
    if (this.itsSettings.locked) {
      throw new Error(`Cannot push to setting ${key}: Settings are locked`);
    }
    const path = this._parsePath(key);
    const array = this._access(path, Array);
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

  _access(path, type = Object) {
    const worklist = path.slice();
    let current = this.itsSettings.settings;
    while (worklist.length > 0) {
      const item = worklist.shift();
      if (current[item] === undefined) {
        if (type === null)
          return null;
        if (worklist.length === 0) {
          current[item] = type === null ? null : new type();
        } else if (isNaN(worklist[0])) {
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
      jsonfile.writeFile(this.itsPersistPath, this.itsSettings, { spaces: 2 }, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
