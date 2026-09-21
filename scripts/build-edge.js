#!/usr/bin/env node
'use strict';
// Empacota o servidor + frontend em um único módulo ES para rodar como Supabase Edge Function (Deno).
// Saída: supabase/functions/crm/bundle.js (dependências npm ficam externas e são injetadas pelo index.ts).
// Uso: npm run edge:build
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const deps = Object.keys(pkg.dependencies);
const builtins = ['crypto', 'fs', 'path', 'node:crypto', 'node:fs', 'node:path'];

// Arquivos do frontend embutidos como texto
const pub = path.join(root, 'public');
const files = {};
const walk = (dir, base = '') => { for (const f of fs.readdirSync(dir)) { const full = path.join(dir, f); const rel = `${base}/${f}`; if (fs.statSync(full).isDirectory()) { if (f !== 'demo' && f !== 'uploads') walk(full, rel); } else files[rel] = fs.readFileSync(full, 'utf8'); } };
walk(pub);
const migrations = fs.readdirSync(path.join(root, 'src', 'migrations')).filter((f) => f.endsWith('.sql')).sort().map((name) => ({ name, sql: fs.readFileSync(path.join(root, 'src', 'migrations', name), 'utf8') }));
const outDir = path.join(root, 'supabase', 'functions', 'crm');
fs.mkdirSync(outDir, { recursive: true });

const shims = {
  name: 'edge-shims',
  setup(build) {
    build.onResolve({ filter: /^\.\/static-embed$/ }, () => ({ path: 'static-embed', namespace: 'virtual' }));
    build.onLoad({ filter: /^static-embed$/, namespace: 'virtual' }, () => ({ contents: `module.exports = ${JSON.stringify(files)}; globalThis.__MIGRATIONS__ = ${JSON.stringify(migrations)};`, loader: 'js' }));
    build.onResolve({ filter: new RegExp(`^(${[...deps, ...builtins].join('|')})(/.*)?$`) }, (args) => ({ path: args.path.replace(/^node:/, ''), namespace: 'npm-dep' }));
    build.onLoad({ filter: /.*/, namespace: 'npm-dep' }, (args) => ({ contents: `module.exports = globalThis.__deps[${JSON.stringify(args.path)}];`, loader: 'js' }));
  },
};

esbuild.build({
  entryPoints: [path.join(root, 'src', 'edge-entry.js')],
  bundle: true, platform: 'node', format: 'esm', target: 'esnext',
  outfile: path.join(outDir, 'bundle.js'),
  plugins: [shims],
  logLevel: 'warning',
}).then(() => {
  const size = fs.statSync(path.join(outDir, 'bundle.js')).size;
  console.log(`Bundle gerado: supabase/functions/crm/bundle.js (${(size / 1024).toFixed(0)} KB). Dependências externas: ${deps.join(', ')}`);
}).catch((e) => { console.error(e); process.exit(1); });
