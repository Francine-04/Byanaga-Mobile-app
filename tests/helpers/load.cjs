const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

// Load the real Expo ES modules with explicit external-service substitutes.
function createLoader(mocks = {}, globals = {}) {
  const cache = new Map();
  function load(filename) {
    const resolved = path.resolve(__dirname, '../..', filename);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    if (resolved.endsWith('.json') || resolved.endsWith('.geojson')) return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    const module = { exports: {} };
    cache.set(resolved, module);
    const { code } = babel.transformFileSync(resolved, {
      babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    const requireModule = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (!id.startsWith('.')) throw new Error(`Unexpected external module: ${id}`);
      let target = path.resolve(path.dirname(resolved), id);
      if (!path.extname(target)) target += '.js';
      return load(target);
    };
    vm.runInNewContext(code, { module, exports: module.exports, require: requireModule, console, Date, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, ...globals }, { filename: resolved });
    return module.exports;
  }
  return load;
}
module.exports = { createLoader, plain: (value) => JSON.parse(JSON.stringify(value)) };
