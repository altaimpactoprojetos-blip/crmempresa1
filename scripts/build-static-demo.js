#!/usr/bin/env node
'use strict';
// Gera a demonstração estática (GitHub Pages) em dist-demo/: a mesma interface, com a API simulada no navegador.
// Uso: npm run demo:build  (após npm run demo:export). Publique a pasta dist-demo/ em qualquer hospedagem estática.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const pub = path.join(root, 'public');
const out = path.join(root, 'dist-demo');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const copy = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); };
for (const dir of ['css', 'js', 'js/pages']) for (const f of fs.readdirSync(path.join(pub, dir))) { const s = path.join(pub, dir, f); if (fs.statSync(s).isFile()) copy(s, path.join(out, dir, f)); }
copy(path.join(pub, 'demo', 'demo-data.js'), path.join(out, 'js', 'demo-data.js'));
copy(path.join(pub, 'demo', 'demo-api.js'), path.join(out, 'js', 'demo-api.js'));
let html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
html = html.replace(/(href|src)="\//g, '$1="'); // caminhos relativos (funciona em subpastas como /crmempresa1/demo/)
html = html.replace('<script src="js/api.js"></script>', '<script src="js/demo-data.js"></script>\n  <script src="js/demo-api.js"></script>');
html = html.replace('<title>CRM de Atendimento</title>', '<title>CRM de Atendimento — demonstração</title>');
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Demonstração estática gerada em dist-demo/');
