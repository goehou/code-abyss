'use strict';
const fs = require('fs');
const path = require('path');

const SKIP = ['__pycache__', '.pyc', '.pyo', '.egg-info', '.DS_Store', 'Thumbs.db', '.git'];

function shouldSkip(name) { return SKIP.some(p => name.includes(p)); }

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (shouldSkip(path.basename(src))) return;
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(f => {
      if (!shouldSkip(f)) copyRecursive(path.join(src, f), path.join(dest, f));
    });
  } else {
    if (shouldSkip(path.basename(src))) return;
    fs.copyFileSync(src, dest);
  }
}

function rmSafe(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function deepMergeNew(target, source, prefix, log) {
  for (const key of Object.keys(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
        log.push({ k: fullKey, a: 'new', v: '{}' });
      }
      deepMergeNew(target[key], source[key], fullKey, log);
    } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
      const added = source[key].filter(v => !target[key].includes(v));
      if (added.length > 0) {
        target[key] = [...target[key], ...added];
        log.push({ k: fullKey, a: 'add', v: `+${added.length}` });
      } else {
        log.push({ k: fullKey, a: 'keep', v: '完整' });
      }
    } else if (key in target) {
      log.push({ k: fullKey, a: 'keep', v: JSON.stringify(target[key]) });
    } else {
      target[key] = source[key];
      log.push({ k: fullKey, a: 'set', v: JSON.stringify(source[key]) });
    }
  }
  return target;
}

function printMergeLog(log, c) {
  log.forEach(({ k, a, v }) => {
    if (a === 'keep') console.log(`  ${c.d('·')} ${c.d(`${k} (保留: ${v})`)}`);
    else console.log(`  ${c.grn('+')} ${c.cyn(k)} = ${v}`);
  });
}

module.exports = { shouldSkip, copyRecursive, rmSafe, deepMergeNew, printMergeLog, SKIP };
