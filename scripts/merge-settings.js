#!/usr/bin/env node
// Idempotent, non-destructive merge of a settings/hook snippet into a settings.json.
//
// Usage:
//   node merge-settings.js --target <settings.json> --source <snippet.json>
//        [--var NAME=value ...] [--overwrite] [--dry-run]
//
// Rules:
//  - `_note` keys in the snippet are dropped.
//  - `<NAME>` placeholders in snippet strings are replaced from --var; any left unresolved -> exit 2.
//  - Objects merge recursively. Hook event arrays merge by matcher group, deduping hooks by `command`.
//    Other arrays are unioned (JSON equality), e.g. permissions.allow.
//  - Scalars: added if missing; if the target already has a different value it is KEPT and reported
//    as a conflict, unless --overwrite is passed.
//  - The target is backed up to <target>.bak-<timestamp> before any change. Missing target is created.
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = { vars: {}, overwrite: false, dry: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--target') opt.target = args[++i];
  else if (a === '--source') opt.source = args[++i];
  else if (a === '--var') { const [k, ...v] = args[++i].split('='); opt.vars[k] = v.join('='); }
  else if (a === '--overwrite') opt.overwrite = true;
  else if (a === '--dry-run') opt.dry = true;
  else { console.error(`Unknown argument: ${a}`); process.exit(1); }
}
if (!opt.target || !opt.source) {
  console.error('Usage: node merge-settings.js --target <file> --source <file> [--var K=V] [--overwrite] [--dry-run]');
  process.exit(1);
}

const unresolved = new Set();
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, val] of Object.entries(v)) if (k !== '_note') o[k] = clean(val);
    return o;
  }
  if (typeof v === 'string') {
    return v.replace(/<([A-Z][A-Z0-9_]*)>/g, (m, name) => {
      if (name in opt.vars) return opt.vars[name];
      unresolved.add(name);
      return m;
    });
  }
  return v;
}

const source = clean(JSON.parse(fs.readFileSync(opt.source, 'utf8')));
if (unresolved.size) {
  console.error(`Unresolved placeholders: ${[...unresolved].join(', ')}. Pass --var NAME=value.`);
  process.exit(2);
}

let target = {};
const exists = fs.existsSync(opt.target);
if (exists) {
  const raw = fs.readFileSync(opt.target, 'utf8').trim();
  if (raw) target = JSON.parse(raw);
}
const before = JSON.stringify(target);

const log = { added: [], skipped: [], conflicts: [] };
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mergeHookGroups(t, s, where) {
  for (const sg of s) {
    const tg = t.find((g) => g.matcher === sg.matcher);
    if (!tg) { t.push(sg); log.added.push(`${where} group (matcher=${sg.matcher ?? '*'})`); continue; }
    tg.hooks = tg.hooks || [];
    for (const sh of sg.hooks || []) {
      if (tg.hooks.some((h) => h.command === sh.command)) log.skipped.push(`${where}: ${String(sh.command).slice(0, 60)}`);
      else { tg.hooks.push(sh); log.added.push(`${where}: ${String(sh.command).slice(0, 60)}`); }
    }
  }
}

function merge(t, s, p) {
  for (const [k, sv] of Object.entries(s)) {
    const here = [...p, k];
    const label = here.join('.');
    if (!(k in t)) { t[k] = sv; log.added.push(label); continue; }
    const tv = t[k];
    if (isObj(tv) && isObj(sv)) merge(tv, sv, here);
    else if (Array.isArray(tv) && Array.isArray(sv)) {
      if (here[0] === 'hooks' && here.length === 2) mergeHookGroups(tv, sv, label);
      else for (const item of sv) {
        if (tv.some((x) => eq(x, item))) log.skipped.push(`${label}: ${JSON.stringify(item).slice(0, 50)}`);
        else { tv.push(item); log.added.push(`${label}: ${JSON.stringify(item).slice(0, 50)}`); }
      }
    } else if (eq(tv, sv)) log.skipped.push(label);
    else if (opt.overwrite) { t[k] = sv; log.added.push(`${label} (overwritten)`); }
    else log.conflicts.push(`${label}: kept ${JSON.stringify(tv)}, snippet wanted ${JSON.stringify(sv)}`);
  }
}
merge(target, source, []);

const changed = JSON.stringify(target) !== before;
if (changed && !opt.dry) {
  fs.mkdirSync(path.dirname(path.resolve(opt.target)), { recursive: true });
  if (exists) fs.copyFileSync(opt.target, `${opt.target}.bak-${Date.now()}`);
  fs.writeFileSync(opt.target, JSON.stringify(target, null, 2) + '\n');
}
console.log(JSON.stringify({ target: opt.target, dryRun: opt.dry, changed, ...log }, null, 2));
