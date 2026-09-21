var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// npm-dep:crypto
var require_crypto = __commonJS({
  "npm-dep:crypto"(exports, module) {
    module.exports = globalThis.__deps["crypto"];
  }
});

// virtual:static-embed
var require_static_embed = __commonJS({
  "virtual:static-embed"(exports, module) {
    module.exports = { "/css/app.css": '/* ==========================================================================\n   CRM de Atendimento \u2014 sistema visual\n   Paleta: branco, cinzas neutros, azul-marinho (estrutura) e uma cor principal (a\xE7\xF5es, configur\xE1vel).\n   Tipografia 14px base, t\xEDtulos proporcionais, \xEDcones de tra\xE7o \xFAnico, cantos moderados, sombras m\xEDnimas.\n   ========================================================================== */\n:root {\n  --primary: #2563eb; --primary-dark: #1d4ed8; --primary-soft: #e8eefc; --accent: #1e3a5f;\n  --navy: #142238; --navy-2: #1c2f4d; --navy-text: #b8c4d8; --navy-muted: #7d8ba3;\n  --bg: #f4f5f7; --surface: #ffffff; --surface-2: #f9fafb; --border: #e3e6ea; --border-2: #d3d8de;\n  --text: #1f2933; --text-2: #4b5563; --muted: #6b7280;\n  --danger: #c2410c; --danger-soft: #fdece4; --warning: #b45309; --warning-soft: #fdf3dc; --success: #15803d; --success-soft: #e5f4ea; --info: #1d4ed8; --info-soft: #e8eefc;\n  --radius: 6px; --radius-lg: 8px; --shadow: 0 1px 2px rgba(17,24,39,.06); --shadow-md: 0 6px 20px rgba(17,24,39,.10);\n  --sidebar-w: 224px; --sidebar-collapsed: 60px; --topbar-h: 52px;\n  --font: "Inter", "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;\n}\n* { box-sizing: border-box; }\nhtml, body { margin: 0; height: 100%; }\nbody { font-family: var(--font); font-size: 14px; color: var(--text); background: var(--bg); line-height: 1.45; -webkit-font-smoothing: antialiased; }\na { color: var(--primary); text-decoration: none; } a:hover { text-decoration: underline; }\nh1, h2, h3, h4 { margin: 0 0 .5rem; font-weight: 600; line-height: 1.3; color: var(--text); }\nh1 { font-size: 20px; } h2 { font-size: 16px; } h3 { font-size: 14px; } h4 { font-size: 13px; color: var(--text-2); }\np { margin: 0 0 .75rem; }\n[hidden] { display: none !important; }\nsvg.i { width: 16px; height: 16px; flex: none; vertical-align: -3px; }\n:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }\nbutton, input, select, textarea { font-family: inherit; }\n.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }\n\n/* utilit\xE1rios */\n.muted { color: var(--muted); } .small { font-size: 12.5px; } .xs { font-size: 11.5px; } .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; }\n.strong { font-weight: 600; } .nowrap { white-space: nowrap; } .right { text-align: right; } .center { text-align: center; }\n.trunc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; display: block; }\n.flex { display: flex; gap: .5rem; align-items: center; } .flex.wrap { flex-wrap: wrap; } .flex.between { justify-content: space-between; } .flex.end { justify-content: flex-end; } .flex.start { align-items: flex-start; } .grow { flex: 1; min-width: 0; }\n.stack > * + * { margin-top: .75rem; } .stack.tight > * + * { margin-top: .4rem; }\n.mt { margin-top: 1rem; } .mb { margin-bottom: 1rem; } .mt-s { margin-top: .5rem; } .mb-s { margin-bottom: .5rem; }\n.grid { display: grid; gap: .9rem; }\n.grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } .grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n.text-danger { color: var(--danger); } .text-warning { color: var(--warning); } .text-success { color: var(--success); }\n\n/* ---------- Layout ---------- */\n#app { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; }\n#app.collapsed { grid-template-columns: var(--sidebar-collapsed) 1fr; }\n.sidebar { background: var(--navy); color: var(--navy-text); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow: hidden; }\n.brand { display: flex; align-items: center; gap: .6rem; padding: .8rem .75rem; height: var(--topbar-h); border-bottom: 1px solid rgba(255,255,255,.08); color: #fff; font-weight: 600; font-size: 14px; white-space: nowrap; }\n.brand img { width: 30px; height: 30px; object-fit: contain; border-radius: 6px; background: #fff; padding: 2px; flex: none; }\n.brand .logo-fallback { width: 30px; height: 30px; border-radius: 6px; background: var(--primary); display: grid; place-items: center; font-weight: 700; color: #fff; font-size: 12px; flex: none; }\n.brand .name { overflow: hidden; white-space: normal; line-height: 1.15; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }\n.nav { padding: .5rem; display: flex; flex-direction: column; gap: 2px; flex: 1; }\n.nav a { display: flex; align-items: center; gap: .6rem; padding: .5rem .55rem; border-radius: var(--radius); color: var(--navy-text); font-weight: 500; white-space: nowrap; }\n.nav a:hover { background: var(--navy-2); text-decoration: none; color: #fff; }\n.nav a.active { background: rgba(255,255,255,.12); color: #fff; }\n.nav a .badge { margin-left: auto; }\n.nav svg { width: 18px; height: 18px; flex: none; }\n.sidebar-footer { padding: .6rem .75rem; border-top: 1px solid rgba(255,255,255,.08); font-size: 12.5px; white-space: nowrap; }\n.sidebar-footer .user { color: #fff; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }\n.sidebar-footer a { color: #9fb3d6; }\n.side-collapse { background: none; border: 0; color: var(--navy-muted); cursor: pointer; padding: .4rem; border-radius: var(--radius); display: inline-flex; margin-left: auto; }\n.side-collapse:hover { color: #fff; background: var(--navy-2); }\n#app.collapsed .brand .name, #app.collapsed .nav a span, #app.collapsed .sidebar-footer .meta, #app.collapsed .nav a .badge { display: none; }\n#app.collapsed .brand { justify-content: center; padding: .8rem .5rem; } #app.collapsed .side-collapse { margin: 0; }\n#app.collapsed .nav a { justify-content: center; padding: .55rem 0; }\n#app.collapsed .sidebar-footer { text-align: center; }\n.main { min-width: 0; display: flex; flex-direction: column; }\n.topbar { display: flex; align-items: center; gap: .75rem; padding: 0 1.25rem; height: var(--topbar-h); background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; }\n.topbar .search { flex: 1; max-width: 460px; position: relative; }\n.topbar .search input { width: 100%; padding-left: 2.1rem; height: 34px; }\n.topbar .search svg { position: absolute; left: .65rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--muted); }\n.search-results { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-md); margin-top: 4px; max-height: 360px; overflow: auto; z-index: 30; }\n.search-results a { display: block; padding: .5rem .75rem; border-bottom: 1px solid var(--border); color: var(--text); }\n.search-results a:hover { background: var(--surface-2); text-decoration: none; }\n.search-results .cat { padding: .3rem .75rem; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); background: var(--surface-2); }\n.content { padding: 1.1rem 1.25rem 2rem; flex: 1; min-width: 0; }\n.content.full { padding: 0; display: flex; flex-direction: column; }\n.page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }\n.page-header p { color: var(--muted); margin: 0; font-size: 13px; }\n.demo-pill { display: inline-flex; align-items: center; gap: .35rem; font-size: 11.5px; font-weight: 600; color: var(--warning); background: var(--warning-soft); border: 1px solid #f1d9a6; border-radius: 999px; padding: .15rem .55rem; white-space: nowrap; }\n.demo-pill .dot { background: var(--warning); }\n\n/* ---------- Cards ---------- */\n.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow); padding: 1rem 1.1rem; }\n.card.flush { padding: 0; overflow: hidden; } .card.flush > .card-title { padding: .75rem 1rem; border-bottom: 1px solid var(--border); margin: 0; }\n.card + .card { margin-top: .9rem; }\n.card-title { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-bottom: .6rem; }\n.card-title h3 { margin: 0; }\n.kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: .7rem .9rem; box-shadow: var(--shadow); display: block; color: inherit; min-width: 0; }\na.kpi:hover { text-decoration: none; border-color: var(--border-2); background: var(--surface-2); }\n.kpi .label { font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: .3rem; }\n.kpi .value { font-size: 22px; font-weight: 600; margin-top: .1rem; line-height: 1.2; }\n.kpi .sub { font-size: 12px; color: var(--muted); margin-top: .1rem; }\n.kpi.warn .value { color: var(--warning); } .kpi.danger .value { color: var(--danger); } .kpi.ok .value { color: var(--success); }\n.kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .7rem; }\n.help-icon { display: inline-flex; color: var(--muted); cursor: help; position: relative; }\n.help-icon svg { width: 14px; height: 14px; }\n.help-icon:hover::after, .help-icon:focus::after { content: attr(data-help); position: absolute; left: 0; top: 130%; z-index: 40; background: var(--navy); color: #fff; font-size: 12px; font-weight: 400; padding: .5rem .65rem; border-radius: var(--radius); width: 260px; white-space: normal; line-height: 1.4; box-shadow: var(--shadow-md); }\n\n/* ---------- Tabelas ---------- */\n.table-wrap { overflow: auto; max-width: 100%; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }\n.card > .table-wrap { border: 0; border-radius: 0; }\ntable { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }\nth, td { text-align: left; padding: .5rem .65rem; border-bottom: 1px solid var(--border); vertical-align: middle; }\nth { font-size: 11.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); font-weight: 600; background: var(--surface-2); position: sticky; top: 0; z-index: 1; white-space: nowrap; }\nth.sortable { cursor: pointer; user-select: none; } th.sortable:hover { color: var(--text); } th .sort-ind { font-size: 10px; margin-left: 2px; }\ntbody tr:hover { background: #f7f9fc; } tbody tr:last-child td { border-bottom: 0; }\ntr.clickable { cursor: pointer; }\ntd.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }\ntd .trunc { max-width: 260px; }\n.table-toolbar { display: flex; gap: .5rem; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: .6rem; }\n.col-picker { position: absolute; right: 0; top: 100%; z-index: 40; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-md); padding: .5rem .75rem; min-width: 200px; }\n.col-picker label { display: flex; gap: .4rem; align-items: center; font-weight: 500; font-size: 13px; padding: .2rem 0; margin: 0; }\n.empty { padding: 2rem 1rem; text-align: center; color: var(--muted); font-size: 13px; }\n.empty strong { display: block; color: var(--text); margin-bottom: .2rem; font-size: 14px; }\n.pagination { display: flex; gap: .4rem; justify-content: flex-end; align-items: center; margin-top: .6rem; font-size: 12.5px; flex-wrap: wrap; }\n.def-list { display: grid; grid-template-columns: 110px 1fr; gap: .25rem .6rem; font-size: 13px; }\n.def-list dt { color: var(--muted); margin: 0; } .def-list dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }\n\n/* ---------- Badges / chips ---------- */\n.badge { display: inline-flex; align-items: center; gap: .25rem; padding: .1rem .5rem; border-radius: 999px; font-size: 11.5px; font-weight: 600; background: #eceff3; color: #374151; white-space: nowrap; line-height: 1.5; }\n.badge.primary { background: var(--info-soft); color: var(--info); } .badge.success { background: var(--success-soft); color: var(--success); } .badge.warning { background: var(--warning-soft); color: var(--warning); }\n.badge.danger { background: var(--danger-soft); color: var(--danger); } .badge.info { background: #e6f1fb; color: #0b5394; } .badge.purple { background: #ece9f8; color: #4c3d8f; } .badge.dark { background: var(--navy); color: #fff; }\n.badge.outline { background: transparent; border: 1px solid var(--border-2); color: var(--text-2); font-weight: 500; }\n.tag { display: inline-block; background: #eef1f6; color: #3a4a66; padding: .05rem .45rem; border-radius: 4px; font-size: 11.5px; margin: 1px 2px 1px 0; }\n.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: #9ca3af; flex: none; }\n.dot.on { background: var(--success); } .dot.off { background: #9ca3af; } .dot.warn { background: var(--warning); } .dot.danger { background: var(--danger); }\n.chips { display: flex; gap: .35rem; flex-wrap: wrap; }\n.chip { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .7rem; border-radius: 999px; border: 1px solid var(--border-2); background: var(--surface); font-size: 12.5px; font-weight: 500; color: var(--text-2); cursor: pointer; white-space: nowrap; }\n.chip:hover { border-color: var(--primary); color: var(--primary); }\n.chip.active { background: var(--navy); border-color: var(--navy); color: #fff; }\n.chip .n { font-size: 11px; background: rgba(0,0,0,.08); border-radius: 999px; padding: 0 .4rem; }\n.chip.active .n { background: rgba(255,255,255,.2); }\n.avatar { width: 32px; height: 32px; border-radius: 50%; background: #dfe5ee; color: #34495e; display: inline-grid; place-items: center; font-weight: 600; font-size: 12px; flex: none; }\n.avatar.sm { width: 24px; height: 24px; font-size: 10px; }\n\n/* ---------- Formul\xE1rios ---------- */\nlabel { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-2); margin-bottom: .25rem; }\nlabel .req { color: var(--danger); }\ninput, select, textarea { width: 100%; padding: .42rem .6rem; border: 1px solid var(--border-2); border-radius: var(--radius); font: inherit; font-size: 13.5px; color: var(--text); background: #fff; min-height: 34px; }\ninput:focus, select:focus, textarea:focus { outline: 2px solid color-mix(in srgb, var(--primary) 30%, transparent); outline-offset: 0; border-color: var(--primary); }\ninput[type=checkbox], input[type=radio] { width: auto; min-height: 0; accent-color: var(--primary); }\ninput[type=color] { padding: 2px; }\ntextarea { min-height: 76px; resize: vertical; }\n.field { margin-bottom: .8rem; }\n.field .error { color: var(--danger); font-size: 12px; margin-top: .2rem; }\n.field.has-error input, .field.has-error select, .field.has-error textarea { border-color: var(--danger); }\n.field .hint { color: var(--muted); font-size: 12px; margin-top: .2rem; }\n.form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }\n.form-row.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n.check { display: flex; align-items: center; gap: .45rem; font-weight: 500; font-size: 13px; }\n.filters { display: flex; gap: .5rem; flex-wrap: wrap; align-items: end; margin-bottom: .8rem; }\n.filters .field { margin: 0; min-width: 140px; }\n.filters input, .filters select { min-height: 32px; padding: .3rem .55rem; }\n.inline-edit { border-color: transparent; background: transparent; padding: .2rem .35rem; min-height: 28px; width: 100%; }\n.inline-edit:hover { border-color: var(--border-2); background: #fff; }\n.inline-edit:focus { border-color: var(--primary); background: #fff; }\n.tag-input { display: flex; flex-wrap: wrap; gap: .25rem; }\n\n/* ---------- Bot\xF5es ---------- */\n.btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .42rem .8rem; min-height: 34px; border-radius: var(--radius); border: 1px solid transparent; background: var(--primary); color: #fff; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; white-space: nowrap; line-height: 1.2; }\n.btn:hover { background: var(--primary-dark); text-decoration: none; } .btn:disabled { opacity: .5; cursor: not-allowed; }\n.btn.secondary { background: #fff; color: var(--text); border-color: var(--border-2); } .btn.secondary:hover { background: var(--surface-2); }\n.btn.ghost { background: transparent; color: var(--text-2); border-color: transparent; } .btn.ghost:hover { background: #eceff3; color: var(--text); }\n.btn.link { background: transparent; color: var(--primary); padding: 0; min-height: 0; font-weight: 500; } .btn.link:hover { text-decoration: underline; }\n.btn.danger { background: var(--danger); } .btn.danger:hover { background: #9a3412; }\n.btn.danger.secondary { background: #fff; color: var(--danger); border-color: #f0c6b4; } .btn.danger.secondary:hover { background: var(--danger-soft); }\n.btn.success { background: var(--success); } .btn.success:hover { background: #166534; }\n.btn.navy { background: var(--navy); } .btn.navy:hover { background: var(--navy-2); }\n.btn.sm { padding: .25rem .6rem; min-height: 28px; font-size: 12.5px; }\n.btn.xs { padding: .1rem .45rem; min-height: 24px; font-size: 12px; font-weight: 500; }\n.btn svg { width: 15px; height: 15px; }\n.icon-btn { background: none; border: 1px solid transparent; cursor: pointer; padding: .35rem; border-radius: var(--radius); color: var(--muted); display: inline-flex; align-items: center; justify-content: center; min-width: 30px; min-height: 30px; }\n.icon-btn:hover { background: #eceff3; color: var(--text); }\n.icon-btn svg { width: 17px; height: 17px; }\n.btn-group { display: inline-flex; } .btn-group .btn:not(:first-child) { border-top-left-radius: 0; border-bottom-left-radius: 0; margin-left: -1px; } .btn-group .btn:not(:last-child) { border-top-right-radius: 0; border-bottom-right-radius: 0; }\n.seg { display: inline-flex; border: 1px solid var(--border-2); border-radius: var(--radius); overflow: hidden; background: #fff; }\n.seg button { background: none; border: 0; padding: .3rem .7rem; font: inherit; font-size: 12.5px; font-weight: 600; color: var(--text-2); cursor: pointer; display: inline-flex; align-items: center; gap: .3rem; }\n.seg button.active { background: var(--navy); color: #fff; }\n\n/* dropdown menu */\n.menu-wrap { position: relative; display: inline-block; }\n.menu { position: absolute; right: 0; top: calc(100% + 4px); z-index: 60; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-md); min-width: 200px; padding: .3rem; }\n.menu.left { right: auto; left: 0; }\n.menu button, .menu a { display: flex; align-items: center; gap: .5rem; width: 100%; text-align: left; background: none; border: 0; padding: .45rem .6rem; font: inherit; font-size: 13px; color: var(--text); cursor: pointer; border-radius: 4px; }\n.menu button:hover, .menu a:hover { background: var(--surface-2); text-decoration: none; }\n.menu button.danger { color: var(--danger); }\n.menu .sep { height: 1px; background: var(--border); margin: .3rem 0; }\n.menu .head { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); padding: .3rem .6rem; }\n\n/* ---------- Abas ---------- */\n.tabs { display: flex; gap: .1rem; border-bottom: 1px solid var(--border); margin-bottom: .9rem; flex-wrap: wrap; }\n.tabs button { background: none; border: none; padding: .55rem .8rem; font: inherit; font-size: 13.5px; font-weight: 600; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; display: inline-flex; align-items: center; gap: .35rem; }\n.tabs button.active { color: var(--navy); border-bottom-color: var(--primary); }\n.tabs button:hover { color: var(--text); }\n\n/* ---------- Modal / painel lateral ---------- */\n.modal-backdrop { position: fixed; inset: 0; background: rgba(20,34,56,.45); display: flex; align-items: flex-start; justify-content: center; padding: 4vh 1rem; z-index: 100; overflow: auto; }\n.modal { background: var(--surface); border-radius: var(--radius-lg); width: 100%; max-width: 620px; box-shadow: 0 20px 50px rgba(0,0,0,.2); }\n.modal.wide { max-width: 940px; } .modal.narrow { max-width: 440px; }\n.modal-header { display: flex; justify-content: space-between; align-items: center; padding: .8rem 1.1rem; border-bottom: 1px solid var(--border); }\n.modal-header h2 { margin: 0; font-size: 15px; }\n.modal-body { padding: 1.1rem; max-height: 72vh; overflow: auto; }\n.modal-footer { display: flex; justify-content: flex-end; gap: .5rem; padding: .75rem 1.1rem; border-top: 1px solid var(--border); background: var(--surface-2); border-radius: 0 0 var(--radius-lg) var(--radius-lg); flex-wrap: wrap; }\n.drawer-backdrop { position: fixed; inset: 0; background: rgba(20,34,56,.35); z-index: 100; display: flex; justify-content: flex-end; }\n.drawer { background: var(--surface); width: min(760px, 100%); height: 100%; display: flex; flex-direction: column; box-shadow: -8px 0 30px rgba(0,0,0,.15); animation: slidein-x .18s ease; }\n.drawer.narrow { width: min(520px, 100%); }\n.drawer-header { display: flex; align-items: center; gap: .6rem; padding: .7rem 1.1rem; border-bottom: 1px solid var(--border); }\n.drawer-header h2 { margin: 0; font-size: 15px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.drawer-body { flex: 1; overflow: auto; padding: 1rem 1.1rem; }\n.drawer-footer { padding: .7rem 1.1rem; border-top: 1px solid var(--border); display: flex; gap: .5rem; justify-content: flex-end; background: var(--surface-2); flex-wrap: wrap; }\n@keyframes slidein-x { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }\n.alert { padding: .6rem .8rem; border-radius: var(--radius); font-size: 13px; border: 1px solid; margin-bottom: .8rem; display: flex; gap: .5rem; align-items: flex-start; }\n.alert.warning { background: var(--warning-soft); border-color: #ecd9a8; color: var(--warning); } .alert.danger { background: var(--danger-soft); border-color: #f0c6b4; color: var(--danger); }\n.alert.info { background: var(--info-soft); border-color: #c7d6f7; color: #1e3a8a; } .alert.success { background: var(--success-soft); border-color: #bfe3cb; color: var(--success); }\n.alert.neutral { background: var(--surface-2); border-color: var(--border); color: var(--text-2); }\n\n/* ---------- Toasts ---------- */\n.toasts { position: fixed; right: 1rem; bottom: 1rem; display: flex; flex-direction: column; gap: .5rem; z-index: 200; }\n.toast { background: var(--navy); color: #fff; padding: .6rem .9rem; border-radius: var(--radius); box-shadow: var(--shadow-md); max-width: 380px; font-size: 13px; border-left: 3px solid var(--info); animation: slidein .2s ease; }\n.toast.success { border-left-color: #4ade80; } .toast.error { border-left-color: #fb923c; } .toast.warning { border-left-color: #fbbf24; }\n@keyframes slidein { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }\n\n/* ---------- Login ---------- */\n.auth-wrap { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }\n.auth-side { background: var(--navy); color: #fff; padding: 3rem; display: flex; flex-direction: column; justify-content: space-between; }\n.auth-side h2 { color: #fff; font-size: 22px; font-weight: 600; margin-bottom: .5rem; } .auth-side p { color: var(--navy-text); max-width: 42ch; }\n.auth-side ul { color: var(--navy-text); padding-left: 1.1rem; margin: 0; } .auth-side li { margin: .3rem 0; }\n.auth-form { display: grid; place-items: center; padding: 2rem 1rem; background: var(--bg); }\n.auth-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 2rem; width: 100%; max-width: 380px; box-shadow: var(--shadow); }\n.auth-card .brand { color: var(--text); border: none; padding: 0 0 1.25rem; height: auto; font-size: 16px; }\n.auth-card .brand img, .auth-card .brand .logo-fallback { width: 40px; height: 40px; }\n\n/* ---------- Linha do tempo ---------- */\n.timeline { list-style: none; margin: 0; padding: 0; }\n.timeline li { display: grid; grid-template-columns: 18px 1fr; gap: .5rem; padding: .5rem 0; border-bottom: 1px solid var(--border); }\n.timeline li:last-child { border-bottom: 0; }\n.timeline .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; margin: 7px auto 0; }\n.timeline li.note .tl-dot { background: var(--warning); } .timeline li.interaction .tl-dot { background: var(--primary); } .timeline li.system .tl-dot { background: #a5b0bf; }\n.timeline .tl-meta { font-size: 12px; color: var(--muted); }\n.timeline .tl-body { white-space: pre-wrap; word-break: break-word; font-size: 13px; }\n.timeline li.note .tl-body { background: var(--warning-soft); padding: .35rem .55rem; border-radius: 4px; }\n\n/* ---------- Central de conversas ---------- */\n.inbox { display: grid; grid-template-columns: 330px minmax(0, 1fr) 320px; height: calc(100vh - var(--topbar-h)); background: var(--surface); }\n.inbox.no-context { grid-template-columns: 330px minmax(0, 1fr); }\n.inbox > * { min-width: 0; min-height: 0; }\n.conv-list { border-right: 1px solid var(--border); display: flex; flex-direction: column; }\n.conv-list .head { padding: .6rem .75rem; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: .5rem; }\n.conv-list .head input { min-height: 32px; }\n.conv-list .items { flex: 1; overflow: auto; }\n.conv-item { display: grid; grid-template-columns: 34px 1fr auto; gap: .5rem .6rem; padding: .6rem .75rem; border-bottom: 1px solid var(--border); cursor: pointer; align-items: start; color: inherit; }\n.conv-item:hover { background: var(--surface-2); text-decoration: none; }\n.conv-item.active { background: var(--primary-soft); box-shadow: inset 3px 0 0 var(--primary); }\n.conv-item .name { font-weight: 600; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.conv-item .preview { color: var(--muted); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }\n.conv-item .preview.note-prev { color: var(--warning); }\n.conv-item .meta { display: flex; gap: .35rem; flex-wrap: wrap; align-items: center; margin-top: .3rem; font-size: 11.5px; color: var(--muted); grid-column: 2 / span 2; }\n.conv-item .time { font-size: 11.5px; color: var(--muted); white-space: nowrap; text-align: right; }\n.conv-item .unread { background: var(--primary); color: #fff; border-radius: 999px; font-size: 11px; font-weight: 600; min-width: 18px; height: 18px; display: inline-grid; place-items: center; padding: 0 5px; margin-top: 3px; margin-left: auto; }\n.conv-item .sla { font-weight: 600; } .conv-item .sla.late { color: var(--danger); } .conv-item .sla.soon { color: var(--warning); }\n.conv-item .ch { display: inline-flex; align-items: center; gap: .2rem; }\n.conv-main { display: flex; flex-direction: column; border-right: 1px solid var(--border); background: #f7f8fa; }\n.conv-head { background: var(--surface); border-bottom: 1px solid var(--border); padding: .55rem 1rem; display: flex; align-items: center; gap: .6rem; }\n.conv-head .who { flex: 1 1 0; min-width: 0; }\n.conv-head .who .name { font-weight: 600; font-size: 14.5px; } .conv-head .who .sub { font-size: 12px; color: var(--muted); display: flex; gap: .4rem; flex-wrap: wrap; align-items: center; }\n.conv-head .actions { display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; }\n.conv-body { flex: 1; overflow: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .5rem; }\n.msg { max-width: 72%; padding: .5rem .7rem; border-radius: 10px; font-size: 13.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; position: relative; }\n.msg .m-meta { font-size: 11px; color: var(--muted); margin-top: .25rem; display: flex; gap: .4rem; align-items: center; justify-content: flex-end; }\n.msg.in { align-self: flex-start; background: #fff; border: 1px solid var(--border); border-bottom-left-radius: 3px; }\n.msg.out { align-self: flex-end; background: var(--primary-soft); border: 1px solid #d3def7; border-bottom-right-radius: 3px; }\n.msg.note { align-self: stretch; max-width: 100%; background: var(--warning-soft); border: 1px dashed #e4c98a; border-radius: 6px; }\n.msg.note .m-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--warning); display: flex; align-items: center; gap: .3rem; margin-bottom: .2rem; }\n.msg.sys { align-self: center; max-width: 90%; background: transparent; color: var(--muted); font-size: 12px; text-align: center; padding: .15rem .5rem; }\n.msg .status { display: inline-flex; align-items: center; gap: .15rem; } .msg .status.read { color: var(--primary); } .msg .status.failed { color: var(--danger); }\n.msg .att a { display: inline-flex; align-items: center; gap: .3rem; font-size: 12.5px; margin-top: .3rem; padding: .25rem .5rem; background: rgba(0,0,0,.04); border-radius: 4px; }\n.day-sep { align-self: center; font-size: 11.5px; color: var(--muted); background: #e9ecf1; padding: .1rem .6rem; border-radius: 999px; margin: .3rem 0; }\n.composer { background: var(--surface); border-top: 1px solid var(--border); padding: .5rem .9rem .7rem; }\n.composer .mode { display: flex; gap: .2rem; margin-bottom: .4rem; align-items: center; }\n.composer .mode { flex-wrap: wrap; }\n.composer .mode button { background: none; border: 1px solid transparent; padding: .25rem .6rem; font: inherit; font-size: 12.5px; font-weight: 600; color: var(--muted); border-radius: 999px; cursor: pointer; display: inline-flex; gap: .3rem; align-items: center; white-space: nowrap; }\n.composer .mode button.active { background: var(--navy); color: #fff; }\n.composer .mode button.active.note { background: var(--warning); }\n.composer textarea { min-height: 64px; max-height: 220px; }\n.composer.note-mode textarea { background: var(--warning-soft); border-color: #e4c98a; }\n.composer .tools { display: flex; gap: .4rem; align-items: center; margin-top: .4rem; flex-wrap: wrap; }\n.composer .hint { font-size: 12px; color: var(--muted); flex: 1; min-width: 140px; }\n.composer .att-list { display: flex; gap: .3rem; flex-wrap: wrap; margin-top: .3rem; }\n.qr-pop { position: absolute; bottom: 100%; left: 0; z-index: 50; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-md); width: min(420px, 90vw); max-height: 280px; overflow: auto; margin-bottom: 6px; }\n.qr-pop button { display: block; width: 100%; text-align: left; background: none; border: 0; border-bottom: 1px solid var(--border); padding: .45rem .7rem; font: inherit; cursor: pointer; }\n.qr-pop button:hover { background: var(--surface-2); } .qr-pop .t { font-weight: 600; font-size: 13px; } .qr-pop .b { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.conv-context { display: flex; flex-direction: column; overflow: auto; background: var(--surface); }\n.ctx-sec { padding: .75rem .9rem; border-bottom: 1px solid var(--border); }\n.ctx-sec h4 { display: flex; justify-content: space-between; align-items: center; margin-bottom: .45rem; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }\n.ctx-sec .def-list { grid-template-columns: 84px 1fr; font-size: 12.5px; }\n.ctx-item { padding: .4rem .5rem; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: .35rem; font-size: 12.5px; background: var(--surface-2); }\n.ctx-item .t { font-weight: 600; display: flex; justify-content: space-between; gap: .4rem; align-items: center; }\n.conv-empty { display: grid; place-items: center; height: 100%; color: var(--muted); text-align: center; padding: 2rem; }\n.mobile-back { display: none; }\n\n/* ---------- Kanban ---------- */\n.kanban-wrap { overflow-x: auto; padding-bottom: .5rem; scrollbar-width: thin; }\n.kanban-wrap::-webkit-scrollbar { height: 10px; } .kanban-wrap::-webkit-scrollbar-thumb { background: #c4cad3; border-radius: 6px; } .kanban-wrap::-webkit-scrollbar-track { background: #eceff3; border-radius: 6px; }\n.kanban { display: grid; grid-auto-flow: column; grid-auto-columns: 272px; gap: .7rem; align-items: start; min-height: 60vh; }\n.kb-col { background: #eceff3; border-radius: var(--radius-lg); display: flex; flex-direction: column; max-height: calc(100vh - 220px); }\n.kb-col.over { outline: 2px dashed var(--primary); outline-offset: -2px; }\n.kb-head { padding: .55rem .7rem; border-bottom: 1px solid #dfe3e8; position: sticky; top: 0; background: #eceff3; border-radius: var(--radius-lg) var(--radius-lg) 0 0; z-index: 1; }\n.kb-head .t { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 13px; gap: .4rem; }\n.kb-head .t .n { font-weight: 500; color: var(--muted); font-size: 12px; }\n.kb-head .sum { font-size: 12px; color: var(--text-2); margin-top: .1rem; }\n.kb-head .bar { margin-top: .4rem; height: 3px; }\n.kb-cards { padding: .5rem; overflow-y: auto; flex: 1; }\n.kb-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: .55rem .65rem; margin-bottom: .45rem; cursor: pointer; box-shadow: var(--shadow); font-size: 12.5px; }\n.kb-card[draggable=true] { cursor: grab; } .kb-card:active { cursor: grabbing; } .kb-card:hover { border-color: var(--border-2); }\n.kb-card .cust { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.kb-card .title { color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.kb-card .row { display: flex; justify-content: space-between; gap: .4rem; margin-top: .25rem; color: var(--muted); align-items: center; }\n.kb-card .value { font-weight: 600; color: var(--text); }\n.kb-card .warn { color: var(--danger); font-weight: 600; } .kb-card .notask { color: var(--warning); font-weight: 600; }\n.kb-card.late { border-left: 3px solid var(--danger); } .kb-card.notask-b { border-left: 3px solid var(--warning); }\n\n/* ---------- Diversos ---------- */\n.bar { height: 8px; background: #e3e6ea; border-radius: 4px; overflow: hidden; } .bar > span { display: block; height: 100%; background: var(--primary); }\n.bar.success > span { background: var(--success); } .bar.warning > span { background: var(--warning); }\n.hbar-list .row { display: grid; grid-template-columns: 150px 1fr 44px; gap: .5rem; align-items: center; padding: .25rem 0; font-size: 13px; }\n.notif-panel { position: absolute; right: 1.25rem; top: calc(var(--topbar-h) + 4px); width: 360px; background: #fff; border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-md); z-index: 50; max-height: 70vh; overflow: auto; }\n.notif-panel .item { padding: .6rem .9rem; border-bottom: 1px solid var(--border); font-size: 13px; } .notif-panel .item.unread { background: var(--primary-soft); }\n.notif-btn { position: relative; } .notif-btn .count { position: absolute; top: -2px; right: -2px; background: var(--danger); color: #fff; font-size: 10px; border-radius: 999px; min-width: 16px; height: 16px; display: grid; place-items: center; padding: 0 4px; }\n.avail-toggle { display: flex; align-items: center; gap: .4rem; font-size: 12.5px; color: var(--text-2); margin: 0; font-weight: 500; cursor: pointer; }\ndetails summary { cursor: pointer; font-weight: 600; }\n.help { font-size: 12.5px; color: var(--text-2); border-left: 3px solid var(--border-2); padding-left: .7rem; margin: .5rem 0; }\npre.code { background: var(--navy); color: #e5e7eb; padding: .6rem .8rem; border-radius: var(--radius); font-size: 12.5px; overflow: auto; }\n.color-swatch { width: 40px; height: 34px; padding: 0; border-radius: var(--radius); }\n.logo-preview { width: 72px; height: 72px; object-fit: contain; border: 1px dashed var(--border-2); border-radius: var(--radius); padding: 4px; background: #fff; }\n.ql { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .6rem; }\n.ql a { display: block; padding: .7rem .8rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); font-weight: 600; }\n.ql a:hover { border-color: var(--primary); text-decoration: none; }\n.menu-toggle { display: none; }\n.status-line { display: flex; align-items: center; gap: .4rem; font-size: 13px; }\n.state-box { border: 1px solid var(--border); border-radius: var(--radius); padding: .6rem .8rem; background: var(--surface-2); font-size: 13px; }\n.state-box + .state-box { margin-top: .5rem; }\n.task-row { display: grid; grid-template-columns: auto 1fr auto; gap: .5rem; align-items: center; padding: .4rem 0; border-bottom: 1px solid var(--border); font-size: 13px; }\n.task-row:last-child { border-bottom: 0; }\n.task-row .t { font-weight: 500; } .task-row .s { font-size: 12px; color: var(--muted); }\n.task-row.done .t { text-decoration: line-through; color: var(--muted); }\n.rule-card { border: 1px solid var(--border); border-radius: var(--radius); padding: .7rem .9rem; background: var(--surface); }\n.rule-card + .rule-card { margin-top: .5rem; }\n.rule-card .flow { display: flex; gap: .4rem; align-items: center; flex-wrap: wrap; font-size: 12.5px; color: var(--text-2); margin-top: .3rem; }\n.rule-card .flow .step { background: var(--surface-2); border: 1px solid var(--border); border-radius: 4px; padding: .1rem .45rem; }\n.bottom-nav { display: none; }\n.print-only { display: none; }\n\n/* ---------- Responsivo ---------- */\n@media (max-width: 1280px) { .inbox { grid-template-columns: 300px minmax(0,1fr) 290px; } }\n@media (max-width: 1100px) {\n  .kpi-row, .grid.cols-4 { grid-template-columns: repeat(2, minmax(0,1fr)); } .grid.cols-3 { grid-template-columns: repeat(2, minmax(0,1fr)); }\n  .inbox { grid-template-columns: 280px minmax(0,1fr); } .inbox .conv-context { display: none; } .inbox.show-context .conv-context { display: flex; position: fixed; right: 0; top: var(--topbar-h); bottom: 0; width: min(360px, 100%); z-index: 30; box-shadow: -8px 0 30px rgba(0,0,0,.15); border-left: 1px solid var(--border); }\n}\n@media (max-width: 800px) {\n  #app, #app.collapsed { grid-template-columns: 1fr; }\n  .conv-head { flex-wrap: wrap; } .conv-head .who { flex-basis: 100%; order: 2; }\n  .sidebar { position: fixed; left: -260px; width: 240px; transition: left .2s; z-index: 90; } .sidebar.open { left: 0; }\n  #app.collapsed .brand .name, #app.collapsed .nav a span, #app.collapsed .sidebar-footer .meta, #app.collapsed .nav a .badge { display: initial; }\n  #app.collapsed .nav a { justify-content: flex-start; padding: .5rem .55rem; } .side-collapse { display: none; }\n  .menu-toggle { display: inline-flex; }\n  .content { padding: .9rem .9rem 5rem; } .topbar { padding: 0 .75rem; }\n  .grid.cols-2, .grid.cols-3, .grid.cols-4, .form-row, .form-row.cols-3 { grid-template-columns: 1fr; }\n  .kpi-row { grid-template-columns: repeat(2, minmax(0,1fr)); gap: .5rem; } .kpi { padding: .5rem .65rem; } .kpi .value { font-size: 18px; }\n  .notif-panel { right: .5rem; left: .5rem; width: auto; }\n  .auth-wrap { grid-template-columns: 1fr; } .auth-side { display: none; }\n  .inbox, .inbox.no-context { grid-template-columns: 1fr; height: calc(100vh - var(--topbar-h)); }\n  .inbox .conv-list, .inbox .conv-main, .inbox .conv-context { display: none; }\n  .inbox.m-list .conv-list { display: flex; } .inbox.m-conv .conv-main { display: flex; } .inbox.m-ctx .conv-context { display: flex; }\n  .mobile-back { display: inline-flex; }\n  .msg { max-width: 88%; }\n  .conv-head .actions .btn span.lbl { display: none; }\n  .bottom-nav { display: flex; position: fixed; left: 0; right: 0; bottom: 0; background: var(--surface); border-top: 1px solid var(--border); z-index: 80; justify-content: space-around; padding: .3rem 0 calc(.3rem + env(safe-area-inset-bottom)); }\n  .bottom-nav a { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10.5px; color: var(--muted); padding: .2rem .5rem; min-width: 56px; font-weight: 500; }\n  .bottom-nav a.active { color: var(--primary); } .bottom-nav a svg { width: 20px; height: 20px; }\n  .content.full { padding-bottom: 0; } .inbox { height: calc(100vh - var(--topbar-h) - 52px); }\n  .page-header .flex.wrap .btn span.lbl { display: none; }\n  .def-list { grid-template-columns: 90px 1fr; }\n  .drawer, .drawer.narrow { width: 100%; }\n  .kanban { grid-auto-columns: 84vw; }\n  .hbar-list .row { grid-template-columns: 100px 1fr 40px; }\n}\n@media print { .sidebar, .topbar, .btn, .filters, .bottom-nav { display: none !important; } #app { grid-template-columns: 1fr; } .print-only { display: block; } }\n', "/index.html": `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CRM de Atendimento</title>
  <link rel="stylesheet" href="css/app.css">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill="%23142238"/%3E%3Ctext x='16' y='22' font-size='16' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EC%3C/text%3E%3C/svg%3E">
</head>
<body>
  <div id="root"></div>
  <div class="toasts" id="toasts"></div>
  <script src="js/api.js"></script>
  <script src="js/ui.js"></script>
  <script src="js/pages/dashboard.js"></script>
  <script src="js/pages/customers.js"></script>
  <script src="js/pages/tickets.js"></script>
  <script src="js/pages/pipeline.js"></script>
  <script src="js/pages/tasks.js"></script>
  <script src="js/pages/reports.js"></script>
  <script src="js/pages/settings.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
`, "/js/api.js": "'use strict';\n// Camada de acesso \xE0 API. Todas as chamadas mut\xE1veis enviam o cabe\xE7alho de prote\xE7\xE3o X-Requested-With.\nclass ApiError extends Error {\n  constructor(status, data) { super((data && data.error) || 'Erro na requisi\xE7\xE3o.'); this.status = status; this.data = data || {}; }\n}\n\nasync function api(path, { method = 'GET', body, query } = {}) {\n  let url = (window.API_BASE || '') + '/api' + path;\n  if (query) {\n    const qs = new URLSearchParams();\n    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, v); });\n    const s = qs.toString(); if (s) url += (url.includes('?') ? '&' : '?') + s;\n  }\n  const res = await fetch(url, {\n    method, credentials: 'same-origin',\n    headers: { 'X-Requested-With': 'fetch', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },\n    body: body !== undefined ? JSON.stringify(body) : undefined,\n  });\n  let data = null;\n  const ct = res.headers.get('content-type') || '';\n  if (ct.includes('application/json')) data = await res.json(); else data = { raw: await res.text() };\n  if (!res.ok) {\n    if (res.status === 401 && window.CRM && CRM.onUnauthorized) CRM.onUnauthorized();\n    throw new ApiError(res.status, data);\n  }\n  return data;\n}\n\nwindow.api = api;\nwindow.ApiError = ApiError;\n", "/js/app.js": `'use strict';
// N\xFAcleo do aplicativo: autentica\xE7\xE3o, roteamento por hash, layout (navega\xE7\xE3o lateral recolh\xEDvel) e tempo real.
const CRM = window.CRM;
Object.assign(CRM, {
  user: null, settings: null, users: [], es: null, unread: 0, counts: {},
  isManager() { return this.user && (this.user.role === 'admin' || this.user.role === 'supervisor'); },
  isAdmin() { return this.user && this.user.role === 'admin'; },
});

const root = document.getElementById('root');

CRM.onUnauthorized = () => { if (CRM.user) { CRM.user = null; UI.toast('Sua sess\xE3o expirou. Fa\xE7a login novamente.', 'warning'); renderAuth(); } };

function applyBranding() {
  const s = CRM.settings || {};
  const p = s.primary_color || '#2563eb';
  document.documentElement.style.setProperty('--primary', p);
  document.documentElement.style.setProperty('--primary-dark', shade(p, -14));
  document.documentElement.style.setProperty('--primary-soft', mix(p, '#ffffff', 0.9));
  document.documentElement.style.setProperty('--accent', s.accent_color || '#1e3a5f');
  document.title = s.name ? \`\${s.name} \u2014 CRM\` : 'CRM';
}
function hexRgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function toHex(rgb) { return '#' + rgb.map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join(''); }
function shade(hex, pct) { return toHex(hexRgb(hex).map((c) => c + (pct / 100) * 255)); }
function mix(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return toHex(x.map((c, i) => c * (1 - t) + y[i] * t)); }
function brandHtml(cls = '') {
  const s = CRM.settings || {};
  const logo = s.logo_data ? \`<img src="\${UI.attr(s.logo_data)}" alt="">\` : \`<span class="logo-fallback">\${UI.esc(UI.initials(s.name || 'CRM'))}</span>\`;
  return \`<div class="brand \${cls}">\${logo}<span class="name">\${UI.esc(s.name || 'CRM')}</span></div>\`;
}

// ---------- Autentica\xE7\xE3o ----------
function renderAuth(view = 'login', param) {
  CRM.es && CRM.es.close(); CRM.es = null;
  let body;
  if (view === 'forgot') body = \`
    <h2>Recuperar senha</h2>
    <p class="muted small">Informe seu e-mail. Se estiver cadastrado, enviaremos um link para redefinir a senha.</p>
    <form id="authForm">\${UI.field('email', 'E-mail', UI.input('email', '', 'type="email" required autocomplete="email"'), { required: true })}
    <button class="btn" style="width:100%">Enviar instru\xE7\xF5es</button></form>
    <p class="mt small"><a href="#/login">Voltar ao login</a></p>\`;
  else if (view === 'reset') body = \`
    <h2>Nova senha</h2>
    <form id="authForm">\${UI.field('password', 'Nova senha', UI.input('password', '', 'type="password" required minlength="8" autocomplete="new-password"'), { required: true, hint: 'M\xEDnimo de 8 caracteres.' })}
    \${UI.field('confirm', 'Confirmar senha', UI.input('confirm', '', 'type="password" required autocomplete="new-password"'), { required: true })}
    <button class="btn" style="width:100%">Salvar nova senha</button></form>
    <p class="mt small"><a href="#/login">Voltar ao login</a></p>\`;
  else body = \`
    <h2>Entrar</h2>
    <form id="authForm">\${UI.field('email', 'E-mail', UI.input('email', '', 'type="email" required autocomplete="username"'), { required: true })}
    \${UI.field('password', 'Senha', UI.input('password', '', 'type="password" required autocomplete="current-password"'), { required: true })}
    <button class="btn" style="width:100%">Entrar</button></form>
    <p class="mt small"><a href="#/esqueci-senha">Esqueci minha senha</a></p>\`;
  const name = (CRM.settings && CRM.settings.name) || 'CRM';
  root.innerHTML = \`<div class="auth-wrap">
    <div class="auth-side"><div>\${brandHtml()}</div>
      <div><h2>Central de atendimento e vendas</h2><p>Conversas, clientes, oportunidades e pr\xF3ximos contatos em um s\xF3 lugar, para a equipe de atendimento da \${UI.esc(name)}.</p>
      <ul><li>Fila compartilhada com distribui\xE7\xE3o em rod\xEDzio</li><li>Hist\xF3rico completo por cliente</li><li>Funil comercial e tarefas de retorno</li><li>Indicadores de prazo e resultado</li></ul></div>
      <div class="small" style="color:var(--navy-muted)">Acesso restrito \xE0 equipe. Perfis: administrador, supervisor e atendente.</div></div>
    <div class="auth-form"><div class="auth-card">\${window.DEMO_STATIC ? '<div class="alert warning small"><span>Demonstra\xE7\xE3o naveg\xE1vel com dados fict\xEDcios. Entre com <strong>admin@demo.local</strong>, <strong>supervisor@demo.local</strong> ou <strong>bruno@demo.local</strong> e a senha <strong>Demo12345</strong>.</span></div>' : CRM.settings && CRM.settings.demo_mode ? '<div class="alert warning small">Ambiente de demonstra\xE7\xE3o com dados fict\xEDcios.</div>' : ''}\${body}</div></div></div>\`;
  const form = root.querySelector('#authForm');
  form.onsubmit = async (e) => {
    e.preventDefault(); const btn = form.querySelector('button'); btn.disabled = true;
    const d = UI.formData(form);
    try {
      if (view === 'login') { const r = await api('/auth/login', { method: 'POST', body: d }); CRM.user = r.user; if (/^#\\/(login|esqueci-senha|redefinir-senha)/.test(location.hash) || !location.hash) location.hash = '#/'; await boot(); }
      else if (view === 'forgot') { const r = await api('/auth/forgot-password', { method: 'POST', body: { email: d.email } }); UI.ok(r.message); if (!r.mail_configured) UI.toast('Envio de e-mail n\xE3o configurado neste servidor: pe\xE7a ao administrador um link de redefini\xE7\xE3o.', 'warning', 9000); }
      else { if (d.password !== d.confirm) { UI.showErrors(form, new ApiError(400, { fields: { confirm: 'As senhas n\xE3o coincidem.' } })); btn.disabled = false; return; }
        const r = await api('/auth/reset-password', { method: 'POST', body: { token: param, password: d.password } }); UI.ok(r.message); location.hash = '#/login'; }
    } catch (err) { UI.showErrors(form, err); } finally { btn.disabled = false; }
  };
}

// ---------- Layout ----------
const NAV = [
  ['#/', 'Painel', 'dashboard'], ['#/atendimentos', 'Conversas', 'inbox'], ['#/clientes', 'Clientes', 'customers'],
  ['#/funil', 'Funil', 'pipeline'], ['#/tarefas', 'Tarefas', 'tasks'], ['#/relatorios', 'Relat\xF3rios', 'reports'], ['#/configuracoes', 'Configura\xE7\xF5es', 'settings'],
];

function renderShell() {
  const collapsed = UI.store.get('sidebar.collapsed', false);
  root.innerHTML = \`<div id="app" class="\${collapsed ? 'collapsed' : ''}">
    <aside class="sidebar" id="sidebar">\${brandHtml().replace('</div>', \`<button class="side-collapse" id="sideCollapse" title="Recolher/expandir menu" aria-label="Recolher menu">\${UI.icons.sidebar}</button></div>\`)}
      <nav class="nav" id="nav" aria-label="Principal">\${NAV.map(([h, l, i]) => \`<a href="\${h}" data-nav="\${h}" title="\${l}">\${UI.icons[i]}<span>\${l}</span><span class="badge" data-nav-badge="\${h}" hidden></span></a>\`).join('')}</nav>
      <div class="sidebar-footer"><div class="user" title="\${UI.attr(CRM.user.name)}">\${UI.esc(CRM.user.name)}</div><div class="meta">\${UI.ROLE[CRM.user.role]} \xB7 <a href="#/perfil">Perfil</a> \xB7 <a href="#" id="logout">Sair</a></div></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn menu-toggle" id="menuToggle" aria-label="Menu">\${UI.icons.menu}</button>
        <div class="search">\${UI.icons.search}<input id="globalSearch" placeholder="Buscar cliente, protocolo, telefone\u2026" autocomplete="off" aria-label="Busca r\xE1pida"><div class="search-results" id="searchResults" hidden></div></div>
        <div class="grow"></div>
        \${window.DEMO_STATIC ? '<span class="demo-pill" id="demoPill" title="Demonstra\xE7\xE3o est\xE1tica: os dados s\xE3o fict\xEDcios e ficam salvos apenas neste navegador. Clique para restaurar os dados iniciais." style="cursor:pointer"><span class="dot"></span>Demonstra\xE7\xE3o</span>' : CRM.settings.demo_mode ? '<span class="demo-pill" title="Os dados exibidos s\xE3o fict\xEDcios. Desative em Configura\xE7\xF5es \u203A Empresa."><span class="dot"></span>Demonstra\xE7\xE3o</span>' : ''}
        \${CRM.user.role === 'atendente' ? \`<label class="avail-toggle" title="Dispon\xEDvel para receber atendimentos na distribui\xE7\xE3o autom\xE1tica"><span class="dot \${CRM.user.available ? 'on' : 'off'}" id="availDot"></span><input type="checkbox" id="availToggle" \${CRM.user.available ? 'checked' : ''}> Dispon\xEDvel</label>\` : ''}
        <button class="icon-btn notif-btn" id="notifBtn" aria-label="Notifica\xE7\xF5es">\${UI.icons.bell}<span class="count" id="notifCount" hidden></span></button>
      </header>
      <main class="content" id="content"></main>
      <nav class="bottom-nav" id="bottomNav" aria-label="Atalhos">\${[['#/', 'Painel', 'dashboard'], ['#/atendimentos?view=queue', 'Fila', 'inbox'], ['#/atendimentos?view=mine', 'Conversas', 'tickets'], ['#/clientes', 'Clientes', 'customers'], ['#/tarefas', 'Tarefas', 'tasks']].map(([h, l, i]) => \`<a href="\${h}" data-bnav="\${h.split('?')[0]}">\${UI.icons[i]}\${l}</a>\`).join('')}</nav>
    </div></div>\`;
  root.querySelector('#logout').onclick = async (e) => { e.preventDefault(); await api('/auth/logout', { method: 'POST' }); CRM.user = null; location.hash = '#/login'; renderAuth(); };
  root.querySelector('#menuToggle').onclick = () => root.querySelector('#sidebar').classList.toggle('open');
  root.querySelector('#nav').onclick = () => root.querySelector('#sidebar').classList.remove('open');
  root.querySelector('#sideCollapse').onclick = () => { const app = root.querySelector('#app'); app.classList.toggle('collapsed'); UI.store.set('sidebar.collapsed', app.classList.contains('collapsed')); };
  const av = root.querySelector('#availToggle');
  if (av) av.onchange = async () => { try { const r = await api('/auth/me/availability', { method: 'PUT', body: { available: av.checked } }); CRM.user.available = r.available; root.querySelector('#availDot').className = \`dot \${r.available ? 'on' : 'off'}\`; UI.ok(r.available ? 'Voc\xEA est\xE1 dispon\xEDvel para novos atendimentos.' : 'Voc\xEA est\xE1 indispon\xEDvel para distribui\xE7\xE3o autom\xE1tica.'); } catch (e) { UI.err(e); } };
  root.querySelector('#notifBtn').onclick = toggleNotifications;
  const dp = root.querySelector('#demoPill'); if (dp) dp.onclick = async () => { if (await UI.confirm('Restaurar os dados iniciais da demonstra\xE7\xE3o? As altera\xE7\xF5es feitas neste navegador ser\xE3o descartadas.', { okLabel: 'Restaurar' })) window.DEMO_RESET(); };
  setupSearch();
  refreshBadges();
  connectRealtime();
}

async function refreshBadges() {
  try {
    const [c, t, n] = await Promise.all([api('/tickets/counts'), api('/tasks', { query: { view: 'overdue', limit: 1 } }), api('/notifications')]);
    CRM.counts = c.counts;
    setBadge('#/atendimentos', c.counts.queue + (CRM.user.role === 'atendente' ? c.counts.mine_unanswered || 0 : 0) || c.counts.unanswered, c.counts.overdue ? 'danger' : 'warning');
    setBadge('#/tarefas', t.summary.overdue, 'danger');
    CRM.unread = n.unread; const el = root.querySelector('#notifCount'); if (el) { el.textContent = n.unread; el.hidden = !n.unread; }
  } catch (_) { /* silencioso */ }
}
function setBadge(nav, n, cls) { const el = root.querySelector(\`[data-nav-badge="\${nav}"]\`); if (!el) return; el.textContent = n; el.className = \`badge \${cls}\`; el.hidden = !n; }

async function toggleNotifications() {
  const existing = document.querySelector('.notif-panel'); if (existing) { existing.remove(); return; }
  const r = await api('/notifications');
  const panel = document.createElement('div'); panel.className = 'notif-panel';
  const alerts = [];
  if (r.alerts.overdue_tasks) alerts.push(\`<div class="item unread"><strong>\${UI.plural(r.alerts.overdue_tasks, 'tarefa atrasada', 'tarefas atrasadas')}</strong><br><a href="#/tarefas?view=overdue">Ver tarefas</a></div>\`);
  if (r.alerts.follow_ups_due) alerts.push(\`<div class="item unread"><strong>\${UI.plural(r.alerts.follow_ups_due, 'retorno pendente', 'retornos pendentes')} at\xE9 amanh\xE3</strong><br><a href="#/atendimentos?tabela=1&follow_up=pending">Ver atendimentos</a></div>\`);
  panel.innerHTML = \`<div class="flex between" style="padding:.55rem .9rem;border-bottom:1px solid var(--border)"><strong>Notifica\xE7\xF5es</strong><button class="btn ghost sm" id="readAll">Marcar todas como lidas</button></div>
    \${alerts.join('')}\${r.notifications.length ? r.notifications.map((n) => \`<div class="item \${n.read_at ? '' : 'unread'}"><div>\${UI.esc(n.title)}</div><div class="muted small">\${UI.esc(n.body || '')}</div><div class="small">\${n.link ? \`<a href="\${UI.attr(n.link)}">Abrir</a> \xB7 \` : ''}\${UI.relative(n.created_at)}</div></div>\`).join('') : (alerts.length ? '' : '<div class="item muted">Nenhuma notifica\xE7\xE3o.</div>')}\`;
  panel.querySelector('#readAll').onclick = async () => { await api('/notifications/read-all', { method: 'POST' }); panel.remove(); refreshBadges(); };
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(() => panel.remove(), 50); });
  root.querySelector('.main').appendChild(panel);
  setTimeout(() => document.addEventListener('click', function h(e) { if (!panel.contains(e.target) && !e.target.closest('#notifBtn')) { panel.remove(); document.removeEventListener('click', h); } }), 0);
}

function connectRealtime() {
  if (window.DEMO_STATIC) return; // demonstra\xE7\xE3o est\xE1tica: sem servidor de eventos
  if (CRM.es) CRM.es.close();
  const es = new EventSource((window.API_BASE || '') + '/api/notifications/stream'); CRM.es = es;
  const refresh = UI.debounce(() => { refreshBadges(); if (CRM.currentPage && CRM.currentPage.onRealtime) CRM.currentPage.onRealtime(); }, 400);
  es.addEventListener('tickets_changed', refresh);
  es.addEventListener('pipeline_changed', refresh);
  es.addEventListener('whatsapp_message', refresh);
  es.addEventListener('settings_changed', async () => { CRM.settings = (await api('/settings/public')).settings; applyBranding(); });
  es.addEventListener('notification', (e) => { const d = JSON.parse(e.data); UI.toast(\`\${d.title}\${d.body ? ': ' + d.body : ''}\`, 'info', 6000); refresh(); });
  es.onerror = () => { es.close(); setTimeout(() => { if (CRM.user) connectRealtime(); }, 5000); };
}

function setupSearch() {
  const input = root.querySelector('#globalSearch'), box = root.querySelector('#searchResults');
  const run = UI.debounce(async () => {
    const q = input.value.trim(); if (q.length < 2) { box.hidden = true; return; }
    try {
      const [c, t, o] = await Promise.all([api('/customers', { query: { q, limit: 5 } }), api('/tickets', { query: { q, limit: 5 } }), api('/opportunities', { query: { q, all_pipelines: 'true' } })]);
      const opps = o.opportunities.slice(0, 4);
      box.innerHTML = \`\${c.customers.length ? '<div class="cat">Clientes</div>' + c.customers.map((x) => \`<a href="#/clientes/\${x.id}"><strong>\${UI.esc(x.name)}</strong> <span class="muted small">\${UI.esc(UI.fmtPhone(x.phone))} \${UI.esc(x.company || '')}</span></a>\`).join('') : ''}
        \${t.tickets.length ? '<div class="cat">Atendimentos</div>' + t.tickets.map((x) => \`<a href="#/atendimentos/\${x.id}"><span class="mono">\${UI.esc(x.protocol)}</span> \${UI.esc(x.subject)} <span class="muted small">\u2014 \${UI.esc(x.customer_name)}</span></a>\`).join('') : ''}
        \${opps.length ? '<div class="cat">Oportunidades</div>' + opps.map((x) => \`<a href="#/funil/\${x.id}">\${UI.esc(x.title)} <span class="muted small">\u2014 \${UI.esc(x.customer_name)} \xB7 \${UI.fmtMoney(x.value)}</span></a>\`).join('') : ''}
        \${!c.customers.length && !t.tickets.length && !opps.length ? '<div class="cat">Nenhum resultado</div>' : ''}\`;
      box.hidden = false;
    } catch (_) { box.hidden = true; }
  }, 250);
  input.oninput = run;
  input.onkeydown = (e) => { if (e.key === 'Escape') { box.hidden = true; input.blur(); } if (e.key === 'Enter') { location.hash = \`#/clientes?q=\${encodeURIComponent(input.value.trim())}\`; box.hidden = true; } };
  box.onclick = () => { box.hidden = true; input.value = ''; };
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !e.target.closest('input, textarea, select') && !document.querySelector('.modal-backdrop, .drawer-backdrop')) { e.preventDefault(); input.focus(); } });
}

// ---------- Roteador ----------
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path, parts, query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

async function route() {
  const { parts, query } = parseHash();
  const p0 = parts[0] || '';
  if (!CRM.user) {
    if (p0 === 'esqueci-senha') return renderAuth('forgot');
    if (p0 === 'redefinir-senha' && parts[1]) return renderAuth('reset', parts[1]);
    return renderAuth('login');
  }
  if (p0 === 'login' || p0 === 'esqueci-senha' || p0 === 'redefinir-senha') { location.hash = '#/'; return; }
  if (!root.querySelector('#app')) renderShell();
  document.querySelectorAll('.modal-backdrop, .drawer-backdrop, .menu').forEach((m) => m.remove());
  const map = { '': 'dashboard', clientes: 'customers', atendimentos: 'tickets', funil: 'pipeline', tarefas: 'tasks', relatorios: 'reports', configuracoes: 'settings', perfil: 'profile' };
  const key = map[p0];
  root.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === \`#/\${p0}\`));
  root.querySelectorAll('[data-bnav]').forEach((a) => a.classList.toggle('active', a.dataset.bnav === \`#/\${p0}\`));
  const content = root.querySelector('#content');
  content.className = 'content';
  if (!key || !CRM.pages[key]) { content.innerHTML = UI.empty('P\xE1gina n\xE3o encontrada', 'Use o menu lateral para navegar.'); return; }
  CRM.currentPage = CRM.pages[key];
  content.innerHTML = '<p class="muted" style="padding:1rem">Carregando\u2026</p>';
  try { await CRM.pages[key].render(content, { id: parts[1] && /^\\d+$/.test(parts[1]) ? Number(parts[1]) : null, sub: parts[1], query }); }
  catch (err) { if (err.status === 401) return; content.innerHTML = \`<div class="alert danger" style="margin:1rem">\${UI.esc(err.message)}</div>\`; }
}

CRM.loadUsers = async () => { CRM.users = (await api('/users')).users; return CRM.users; };
CRM.userName = (id) => { const u = CRM.users.find((x) => x.id === id); return u ? u.name : ''; };
CRM.pageHeader = (title, subtitle, actions = '') => \`<div class="page-header"><div><h1>\${UI.esc(title)}</h1>\${subtitle ? \`<p>\${UI.esc(subtitle)}</p>\` : ''}</div><div class="flex wrap">\${actions}</div></div>\`;
CRM.settingsFull = async () => { if (!CRM._settingsFull) CRM._settingsFull = await api('/settings').catch(() => null); return CRM._settingsFull; };
CRM.invalidateSettings = () => { CRM._settingsFull = null; };

// P\xE1gina de perfil
CRM.pages.profile = {
  async render(el) {
    el.innerHTML = CRM.pageHeader('Meu perfil', \`\${CRM.user.name} \xB7 \${CRM.user.email}\`) + \`<div class="grid cols-2"><div class="card"><h3>Alterar senha</h3>
      <form id="pwForm">\${UI.field('current_password', 'Senha atual', UI.input('current_password', '', 'type="password" required autocomplete="current-password"'), { required: true })}
      \${UI.field('new_password', 'Nova senha', UI.input('new_password', '', 'type="password" required minlength="8" autocomplete="new-password"'), { required: true, hint: 'M\xEDnimo de 8 caracteres.' })}
      <button class="btn">Salvar</button></form></div>
      <div class="card"><h3>Sess\xE3o e prefer\xEAncias</h3><dl class="def-list"><dt>Perfil</dt><dd>\${UI.ROLE[CRM.user.role]}</dd><dt>Sess\xE3o</dt><dd>Expira automaticamente ap\xF3s o per\xEDodo configurado pelo administrador.</dd><dt>Atalhos</dt><dd><span class="mono">/</span> foca a busca \xB7 <span class="mono">Esc</span> fecha pain\xE9is \xB7 <span class="mono">Ctrl+Enter</span> envia na conversa</dd></dl>
      <button class="btn secondary sm mt" id="resetCols">Restaurar colunas padr\xE3o das tabelas</button></div></div>\`;
    el.querySelector('#pwForm').onsubmit = async (e) => { e.preventDefault(); try { const r = await api('/auth/me/password', { method: 'PUT', body: UI.formData(e.target) }); UI.ok(r.message); e.target.reset(); } catch (err) { UI.showErrors(e.target, err); } };
    el.querySelector('#resetCols').onclick = () => { Object.keys(localStorage).filter((k) => k.startsWith('crm.cols.')).forEach((k) => localStorage.removeItem(k)); UI.ok('Colunas restauradas.'); };
  },
};

async function boot() {
  try { CRM.settings = (await api('/settings/public')).settings; applyBranding(); } catch (_) { CRM.settings = {}; }
  if (!CRM.user) { try { CRM.user = (await api('/auth/me')).user; } catch (_) { CRM.user = null; } }
  if (CRM.user) { await CRM.loadUsers().catch(() => {}); root.innerHTML = ''; }
  route();
}
document.addEventListener('click', (e) => {
  if (e.target.closest('a, button, input, select, textarea, label')) return;
  const el = e.target.closest('[data-href]'); if (el) location.hash = el.dataset.href;
});
document.addEventListener('focusin', (e) => { if (e.target.matches('[data-select-all]')) e.target.select(); });
window.addEventListener('hashchange', route);
boot();
`, "/js/pages/customers.js": `'use strict';
CRM.pages.customers = {
  async render(el, { id, query }) {
    this.el = el;
    if (id) return this.detail(el, id);
    this.query = query; this.page = Number(query.page) || 1;
    const full = await CRM.settingsFull();
    this.sources = full ? full.settings.contact_sources : [];
    el.innerHTML = CRM.pageHeader('Clientes', 'Cadastro, hist\xF3rico e respons\xE1vel de cada cliente.',
      \`<button class="btn secondary" id="btnExport">\${UI.icons.download} <span class="lbl">Exportar</span></button>\${CRM.isManager() ? \`<button class="btn secondary" id="btnImport">\${UI.icons.upload} <span class="lbl">Importar CSV</span></button>\` : ''}<button class="btn" id="btnNew">\${UI.icons.plus} <span class="lbl">Novo cliente</span></button>\`) +
    \`<div class="card"><div id="savedBox" class="mb-s"></div><form class="filters" id="filters">
      <div class="field grow"><label>Busca</label><input name="q" value="\${UI.attr(query.q || '')}" placeholder="Nome, telefone, e-mail, empresa ou CPF/CNPJ"></div>
      <div class="field"><label>Origem</label>\${UI.select('source', [['', 'Todas'], ...this.sources.map((s) => [s, s])], query.source)}</div>
      <div class="field"><label>Respons\xE1vel</label>\${UI.select('owner_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.owner_id)}</div>
      <div class="field"><label>Etiqueta</label><input name="tag" value="\${UI.attr(query.tag || '')}" placeholder="ex.: vip"></div>
      <div class="field"><label>Situa\xE7\xE3o</label>\${UI.select('flag', [['', 'Todas'], ['pending_followup', 'Com retorno pendente'], ['no_open_ticket', 'Sem atendimento aberto']], query.pending_followup ? 'pending_followup' : query.no_open_ticket ? 'no_open_ticket' : '')}</div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/clientes">Limpar</a></form>
      <div id="list"></div></div>\`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const flag = d.flag; delete d.flag; if (flag) d[flag] = 'true'; location.hash = \`#/clientes?\${UI.qs(d)}\`; };
    el.querySelector('#btnNew').onclick = () => this.form();
    el.querySelector('#btnExport').onclick = () => UI.download('/customers/export.csv');
    const imp = el.querySelector('#btnImport'); if (imp) imp.onclick = () => this.importDialog();
    UI.savedFilters(el.querySelector('#savedBox'), { scope: 'customers', current: () => this.query, onApply: (p) => { location.hash = \`#/clientes?\${UI.qs(p)}\`; } });
    await this.list();
    if (query.novo) { history.replaceState(null, '', '#/clientes'); this.form(); }
  },

  async list() {
    const box = this.el.querySelector('#list'); if (!box) return;
    const q = { ...this.query, page: this.page, limit: 25 }; delete q.novo;
    const r = await api('/customers', { query: q });
    UI.table(box, { id: 'customers', rows: r.customers, total: r.total, page: r.page, limit: r.limit, sort: this.query.sort, dir: this.query.dir,
      columns: [
        { key: 'name', label: 'Nome', sortable: true, min: '180px', render: (c) => \`<span class="trunc strong" title="\${UI.attr(c.name)}">\${UI.esc(c.name)}</span>\${c.email ? \`<span class="trunc muted small" title="\${UI.attr(c.email)}">\${UI.esc(c.email)}</span>\` : ''}\` },
        { key: 'phone', label: 'Telefone', nowrap: true, render: (c) => UI.esc(UI.fmtPhone(c.phone)) },
        { key: 'company', label: 'Empresa', sortable: true, min: '140px', render: (c) => \`<span class="trunc" title="\${UI.attr(c.company || '')}">\${UI.esc(c.company || '\u2014')}</span>\` },
        { key: 'city', label: 'Cidade', sortable: true, nowrap: true, default: false, render: (c) => UI.esc(c.city || '\u2014') },
        { key: 'source', label: 'Origem', sortable: true, nowrap: true, render: (c) => UI.esc(c.source || '\u2014') },
        { key: 'tags', label: 'Etiquetas', render: (c) => UI.tags(c.tags) },
        { key: 'owner_name', label: 'Respons\xE1vel', sortable: true, nowrap: true, render: (c) => UI.esc(c.owner_name || '\u2014') },
        { key: 'open_tickets', label: 'Atend. abertos', sortable: true, align: 'right', render: (c) => c.open_tickets ? \`<span class="badge primary">\${c.open_tickets}</span>\` : '<span class="muted">0</span>' },
        { key: 'open_opportunities', label: 'Negocia\xE7\xF5es', align: 'right', default: false, render: (c) => c.open_opportunities || '<span class="muted">0</span>' },
        { key: 'last_contact_at', label: '\xDAltimo contato', nowrap: true, render: (c) => c.last_contact_at ? UI.fmtDateTime(c.last_contact_at) : '<span class="muted">\u2014</span>' },
        { key: 'next_follow_up', label: 'Retorno', sortable: true, nowrap: true, render: (c) => c.next_follow_up ? \`<span class="\${new Date(c.next_follow_up) < Date.now() ? 'text-danger strong' : ''}">\${UI.fmtDateTime(c.next_follow_up)}\${new Date(c.next_follow_up) < Date.now() ? ' \xB7 vencido' : ''}</span>\` : '' },
        { key: 'created_at', label: 'Cadastro', sortable: true, nowrap: true, default: false, render: (c) => UI.fmtDate(c.created_at) },
      ],
      onSort: (sort, dir) => { this.query.sort = sort; this.query.dir = dir; this.list(); }, onPage: (p) => { this.page = p; this.list(); },
      onRow: (c) => { location.hash = \`#/clientes/\${c.id}\`; },
      empty: UI.empty('Nenhum cliente encontrado', this.query.q ? 'Ajuste a busca ou os filtros.' : 'Cadastre o primeiro cliente pelo bot\xE3o acima ou importe um CSV.') });
  },

  form(c = null, onSaved) {
    const isEdit = Boolean(c);
    const canOwner = CRM.isManager() || !isEdit || c.owner_id === CRM.user.id || !c.owner_id;
    const m = UI.modal({ title: isEdit ? 'Editar cliente' : 'Novo cliente', body: \`<form id="custForm">
      <div id="dupBox"></div>
      <div class="form-row">\${UI.field('name', 'Nome', UI.input('name', c?.name, 'required maxlength="160"'), { required: true })}\${UI.field('company', 'Empresa', UI.input('company', c?.company, 'data-type="nullable"'))}</div>
      <div class="form-row">\${UI.field('phone', 'Telefone', UI.input('phone', c?.phone, 'data-type="nullable" placeholder="(11) 99999-9999" inputmode="tel"'))}\${UI.field('email', 'E-mail', UI.input('email', c?.email, 'type="email" data-type="nullable"'))}</div>
      <div class="form-row cols-3">\${UI.field('city', 'Cidade', UI.input('city', c?.city, 'data-type="nullable"'))}\${UI.field('document', 'CPF ou CNPJ', UI.input('document', c?.document, 'data-type="nullable"'), { hint: 'Opcional' })}
        \${UI.field('source', 'Origem do contato', UI.select('source', [['', '\u2014 Selecione \u2014'], ...(this.sources || []).map((s) => [s, s])], c?.source, 'data-type="nullable"'))}</div>
      <div class="form-row">\${UI.field('tags', 'Etiquetas', UI.input('tags', (c?.tags || []).join(', '), 'data-type="tags" placeholder="vip, revenda"'), { hint: 'Separe por v\xEDrgula' })}
        \${UI.field('owner_id', 'Respons\xE1vel', UI.select('owner_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), c ? c.owner_id : (CRM.user.role === 'atendente' ? CRM.user.id : ''), \`data-type="int" \${canOwner ? '' : 'disabled'}\`))}</div>
      \${UI.field('notes', 'Observa\xE7\xF5es', UI.textarea('notes', c?.notes, 'data-type="nullable"'))}
      \${isEdit ? \`<input type="hidden" name="version" value="\${c.version}" data-type="int">\` : ''}</form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="custForm">\${isEdit ? 'Salvar altera\xE7\xF5es' : 'Cadastrar'}</button>\` });
    const form = m.el.querySelector('#custForm');
    const checkDup = UI.debounce(async () => {
      const phone = form.phone.value, email = form.email.value; if (!phone && !email) { form.querySelector('#dupBox').innerHTML = ''; return; }
      const r = await api('/customers/check-duplicates', { query: { phone, email, exclude_id: c?.id } }).catch(() => ({ duplicates: [] }));
      form.querySelector('#dupBox').innerHTML = r.duplicates.length ? \`<div class="alert warning"><span>Poss\xEDvel duplicidade: \${r.duplicates.map((d) => \`<a href="#/clientes/\${d.id}">#\${d.id} \${UI.esc(d.name)}</a>\`).join(', ')}. Verifique antes de salvar.</span></div>\` : '';
    }, 400);
    form.phone.oninput = checkDup; form.email.oninput = checkDup;
    let force = false;
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form);
      try {
        const r = isEdit ? await api(\`/customers/\${c.id}\${force ? '?force=1' : ''}\`, { method: 'PUT', body: d }) : await api(\`/customers\${force ? '?force=1' : ''}\`, { method: 'POST', body: d });
        UI.ok(r.message); m.close(); if (onSaved) onSaved(r.customer); else location.hash = \`#/clientes/\${r.customer.id}\`;
        if (isEdit && location.hash === \`#/clientes/\${c.id}\`) this.detail(this.el, c.id);
      } catch (err) {
        if (err.status === 409 && err.data.can_force) {
          form.querySelector('#dupBox').innerHTML = \`<div class="alert warning"><span>\${UI.esc(err.message)} \${err.data.duplicates.map((x) => \`<a href="#/clientes/\${x.id}">#\${x.id} \${UI.esc(x.name)}</a>\`).join(', ')}.<br><button type="button" class="btn sm secondary mt-s" id="forceBtn">Salvar mesmo assim</button></span></div>\`;
          form.querySelector('#forceBtn').onclick = () => { force = true; form.requestSubmit(); };
        } else if (err.status === 409) { UI.err(err); } else UI.showErrors(form, err);
      }
    };
  },

  async detail(el, id) {
    const r = await api(\`/customers/\${id}\`);
    const c = r.customer; this.current = c;
    const wa = c.phone_digits ? UI.waLink(c.phone_digits) : null;
    const openT = r.tickets.find((t) => !['resolvido', 'cancelado'].includes(t.status));
    const pendingFollow = r.tickets.find((t) => t.follow_up_at && !['resolvido', 'cancelado'].includes(t.status));
    const openOpps = r.opportunities.filter((o) => o.stage_kind === 'open');
    el.innerHTML = \`<div class="page-header"><div class="flex"><a href="#/clientes" class="icon-btn" aria-label="Voltar">\${UI.icons.arrowLeft}</a>\${UI.avatar(c.name)}<div><h1 style="margin:0">\${UI.esc(c.name)}</h1><p>\${[c.company, c.city, c.source ? \`Origem: \${c.source}\` : '', c.owner_name ? \`Respons\xE1vel: \${c.owner_name}\` : ''].filter(Boolean).map(UI.esc).join(' \xB7 ')}</p></div></div>
      <div class="flex wrap">\${openT ? \`<a class="btn secondary" href="#/atendimentos/\${openT.id}">\${UI.icons.inbox} <span class="lbl">Abrir conversa</span></a>\` : \`<button class="btn secondary" id="btnTicket">\${UI.icons.inbox} <span class="lbl">Abrir atendimento</span></button>\`}<button class="btn secondary" id="btnOpp">\${UI.icons.pipeline} <span class="lbl">Nova oportunidade</span></button><button class="btn" id="btnEdit">\${UI.icons.edit} <span class="lbl">Editar</span></button>
      <div class="menu-wrap"><button class="icon-btn" id="moreBtn" aria-label="Mais a\xE7\xF5es">\${UI.icons.more}</button></div></div></div>
    \${r.duplicates.length ? \`<div class="alert warning"><span>Poss\xEDvel duplicidade com: \${r.duplicates.map((d) => \`<a href="#/clientes/\${d.id}">#\${d.id} \${UI.esc(d.name)}</a>\`).join(', ')}.</span></div>\` : ''}
    \${pendingFollow ? \`<div class="alert \${new Date(pendingFollow.follow_up_at) < Date.now() ? 'warning' : 'info'}"><span>Retorno \${new Date(pendingFollow.follow_up_at) < Date.now() ? 'vencido' : 'agendado'} em <strong>\${UI.fmtDateTime(pendingFollow.follow_up_at)}</strong> \u2014 atendimento <a href="#/atendimentos/\${pendingFollow.id}">\${UI.esc(pendingFollow.protocol)}</a>.</span></div>\` : ''}
    <div class="grid" style="grid-template-columns: 320px 1fr" id="custGrid">
      <div class="stack"><div class="card"><h3>Dados</h3>
        <dl class="def-list"><dt>Telefone</dt><dd>\${UI.esc(UI.fmtPhone(c.phone) || '\u2014')}</dd><dt>E-mail</dt><dd>\${UI.esc(c.email || '\u2014')}</dd>
          <dt>Empresa</dt><dd>\${UI.esc(c.company || '\u2014')}</dd><dt>Cidade</dt><dd>\${UI.esc(c.city || '\u2014')}</dd>
          <dt>CPF/CNPJ</dt><dd>\${UI.esc(c.document || '\u2014')}</dd><dt>Origem</dt><dd>\${UI.esc(c.source || '\u2014')}</dd>
          <dt>Respons\xE1vel</dt><dd>\${UI.esc(c.owner_name || '\u2014')}</dd><dt>Etiquetas</dt><dd>\${UI.tags(c.tags) || '\u2014'}</dd>
          <dt>Cadastro</dt><dd>\${UI.fmtDate(c.created_at)}</dd></dl>
        \${c.notes ? \`<h4 class="mt">Observa\xE7\xF5es</h4><p class="small" style="white-space:pre-wrap">\${UI.esc(c.notes)}</p>\` : ''}
        \${wa ? \`<p class="muted xs mt-s">\${UI.icons.external} <a href="\${wa}" target="_blank" rel="noopener">Abrir no WhatsApp</a> \xE9 um atalho externo; as mensagens s\xE3o sincronizadas apenas quando a integra\xE7\xE3o oficial est\xE1 conectada.</p>\` : ''}</div>
        <div class="card"><h3>Anota\xE7\xF5es internas</h3><form id="noteForm"><textarea name="body" placeholder="Anota\xE7\xE3o vis\xEDvel apenas para a equipe" required rows="2"></textarea><div class="right mt-s"><button class="btn sm">Adicionar</button></div></form>
          <ul class="timeline mt-s">\${r.notes.map((n) => \`<li class="note"><span class="tl-dot"></span><div><div class="tl-meta">\${UI.esc(n.user_name || '')} \xB7 \${UI.fmtDateTime(n.created_at)}</div><div class="tl-body">\${UI.esc(n.body)}</div></div></li>\`).join('') || '<li class="muted small">Nenhuma anota\xE7\xE3o.</li>'}</ul></div>
      </div>
      <div class="stack">
        <div class="card"><div class="card-title"><h3>Negocia\xE7\xF5es \${openOpps.length ? \`<span class="badge primary">\${openOpps.length} aberta(s)</span>\` : ''}</h3></div>
          \${r.opportunities.length ? \`<div class="table-wrap"><table><thead><tr><th>Oportunidade</th><th>Funil / etapa</th><th class="num">Valor</th><th>Respons\xE1vel</th><th>Pr\xF3xima a\xE7\xE3o</th><th>Previs\xE3o</th></tr></thead><tbody>\${r.opportunities.map((o) => \`<tr class="clickable" data-opp="\${o.id}"><td><span class="trunc" style="max-width:220px" title="\${UI.attr(o.title)}">\${UI.esc(o.title)}</span></td><td class="nowrap">\${UI.stageBadge(o.stage_name, o.stage_kind)}<span class="muted xs"> \${UI.esc(o.pipeline_name)}</span></td><td class="num nowrap">\${UI.fmtMoney(o.value)}</td><td class="nowrap">\${UI.esc(o.owner_name || '\u2014')}</td><td>\${o.stage_kind === 'open' ? (o.next_action ? \`\${UI.esc(o.next_action)}\${o.next_action_at ? \`<span class="muted small"> \xB7 \${UI.fmtDate(o.next_action_at)}</span>\` : ''}\` : '<span class="text-warning small">sem pr\xF3xima a\xE7\xE3o</span>') : (o.lost_reason ? \`<span class="muted small">\${UI.esc(o.lost_reason)}</span>\` : '')}</td><td class="nowrap">\${UI.fmtDate(o.expected_close_date)}</td></tr>\`).join('')}</tbody></table></div>\` : UI.empty('Nenhuma negocia\xE7\xE3o', 'Crie uma oportunidade quando houver interesse comercial.')}</div>
        <div class="card"><div class="card-title"><h3>Atendimentos (\${r.tickets.length})</h3></div>
          \${r.tickets.length ? \`<div class="table-wrap"><table><thead><tr><th>Protocolo</th><th>Assunto</th><th>Canal</th><th>Status</th><th>Respons\xE1vel</th><th>\xDAltima msg.</th></tr></thead><tbody>\${r.tickets.map((t) => \`<tr class="clickable" data-href="#/atendimentos/\${t.id}"><td class="mono nowrap">\${UI.esc(t.protocol)}</td><td><span class="trunc" style="max-width:260px" title="\${UI.attr(t.subject)}">\${UI.esc(t.subject)}</span></td><td class="nowrap">\${UI.channelIcon(t.channel)} \${UI.esc(t.channel)}</td><td>\${UI.statusBadge(t.status, true)}</td><td class="nowrap">\${UI.esc(t.assignee_name || '\u2014')}</td><td class="nowrap small">\${UI.fmtDateTime(t.last_message_at || t.opened_at)}</td></tr>\`).join('')}</tbody></table></div>\` : UI.empty('Nenhum atendimento', 'Abra o primeiro atendimento para este cliente.')}</div>
        <div class="card"><div class="card-title"><h3>Tarefas (\${r.tasks.filter((t) => !t.done_at).length} abertas)</h3><button class="btn link small" id="btnTask">+ Nova tarefa</button></div>
          \${r.tasks.length ? r.tasks.map((t) => \`<div class="task-row \${t.done_at ? 'done' : ''}"><input type="checkbox" data-task="\${t.id}" \${t.done_at ? 'checked' : ''} aria-label="Concluir"><div><div class="t">\${UI.esc(t.title)}</div><div class="s \${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? 'text-danger' : ''}">\${UI.fmtDateTime(t.due_at)}\${t.assignee_name ? \` \xB7 \${UI.esc(t.assignee_name)}\` : ''}\${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? ' \xB7 atrasada' : ''}</div></div>\${UI.priorityBadge(t.priority)}</div>\`).join('') : UI.empty('Nenhuma tarefa', '')}</div>
        <div class="card"><div class="card-title"><h3>Hist\xF3rico de intera\xE7\xF5es</h3></div>
          \${r.timeline && r.timeline.length ? \`<ul class="timeline">\${r.timeline.map((e) => \`<li class="\${e.kind}"><span class="tl-dot"></span><div><div class="tl-meta">\${e.kind === 'note' ? 'Nota interna' : e.direction === 'saida' ? 'Enviada' : 'Recebida'} \xB7 \${UI.esc(e.channel || '')} \xB7 \${UI.esc(e.user_name || 'Cliente')} \xB7 \${UI.fmtDateTime(e.created_at)} \xB7 <a href="#/atendimentos/\${e.ticket_id}" class="mono">\${UI.esc(e.protocol)}</a></div><div class="tl-body">\${UI.esc(e.body || '')}</div></div></li>\`).join('')}</ul>\` : UI.empty('Sem intera\xE7\xF5es registradas', '')}</div>
      </div></div>\`;
    el.querySelector('#btnEdit').onclick = () => this.form(c);
    const bt = el.querySelector('#btnTicket'); if (bt) bt.onclick = () => CRM.pages.tickets.form({ customer: c }, (t) => { location.hash = \`#/atendimentos/\${t.id}\`; });
    el.querySelector('#btnOpp').onclick = () => CRM.pages.pipeline.form({ customer: c }, () => this.detail(el, id));
    el.querySelector('#btnTask').onclick = () => CRM.pages.tasks.form({ customer_id: c.id, customer_name: c.name }, () => this.detail(el, id));
    el.querySelector('#moreBtn').onclick = (e) => UI.menu(e.currentTarget, [
      { label: 'Nova tarefa', icon: 'tasks', onClick: () => CRM.pages.tasks.form({ customer_id: c.id, customer_name: c.name }, () => this.detail(el, id)) },
      ...(wa ? [{ label: 'Abrir no WhatsApp (externo)', icon: 'external', onClick: () => window.open(wa, '_blank', 'noopener') }] : []),
      ...(CRM.isAdmin() ? [{ sep: true }, { label: 'Excluir cliente', icon: 'trash', danger: true, onClick: async () => { if (!(await UI.confirm('Excluir este cliente? S\xF3 \xE9 poss\xEDvel sem atendimentos ou negocia\xE7\xF5es.', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(\`/customers/\${c.id}\`, { method: 'DELETE' }); UI.ok(r2.message); location.hash = '#/clientes'; } catch (err) { UI.err(err); } } }] : []),
    ]);
    el.querySelector('#noteForm').onsubmit = async (e) => { e.preventDefault(); try { const r2 = await api(\`/customers/\${id}/notes\`, { method: 'POST', body: UI.formData(e.target) }); UI.ok(r2.message); this.detail(el, id); } catch (err) { UI.showErrors(e.target, err); } };
    el.querySelectorAll('[data-opp]').forEach((tr) => tr.onclick = () => CRM.pages.pipeline.detail(Number(tr.dataset.opp), { onChange: () => this.detail(el, id) }));
    el.querySelectorAll('[data-task]').forEach((cb) => cb.onchange = async () => { try { await api(\`/tasks/\${cb.dataset.task}\`, { method: 'PUT', body: { done: cb.checked } }); this.detail(el, id); } catch (err) { UI.err(err); } });
    if (window.innerWidth < 800) el.querySelector('#custGrid').style.gridTemplateColumns = '1fr';
  },

  importDialog() {
    const m = UI.modal({ title: 'Importar clientes (CSV)', size: 'wide', body: \`<div class="help">Colunas aceitas (cabe\xE7alho na primeira linha): <strong>nome</strong> (obrigat\xF3rio), telefone, email, empresa, cidade, cpf_cnpj, origem, etiquetas (separadas por | ou ,), observacoes, responsavel (nome ou e-mail do usu\xE1rio). Separador ; ou , \u2014 codifica\xE7\xE3o UTF-8.</div>
      <div class="field"><label>Arquivo CSV</label><input type="file" id="csvFile" accept=".csv,text/csv"></div><div id="preview"></div>\`,
      footer: \`<button class="btn secondary" data-close>Fechar</button><button class="btn" id="btnCommit" disabled>Importar linhas v\xE1lidas</button>\` });
    let csvText = null;
    const file = m.el.querySelector('#csvFile'), prev = m.el.querySelector('#preview'), commit = m.el.querySelector('#btnCommit');
    file.onchange = async () => {
      const f = file.files[0]; if (!f) return;
      csvText = await f.text();
      prev.innerHTML = '<p class="muted">Validando\u2026</p>';
      try {
        const r = await api('/customers/import', { method: 'POST', body: { csv: csvText } });
        prev.innerHTML = \`<div class="alert \${r.invalid ? 'warning' : 'success'}"><span>\${r.total} linha(s): <strong>\${r.valid}</strong> v\xE1lida(s), <strong>\${r.invalid}</strong> com erro, <strong>\${r.duplicates}</strong> poss\xEDvel(is) duplicidade(s).</span></div>
          <label class="check"><input type="checkbox" id="skipDup" checked> Ignorar linhas com poss\xEDvel duplicidade</label>
          <div class="table-wrap mt-s" style="max-height:340px"><table><thead><tr><th>Linha</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Situa\xE7\xE3o</th></tr></thead><tbody>
          \${r.rows.map((x) => \`<tr><td>\${x.line}</td><td>\${UI.esc(x.data.name || '')}</td><td>\${UI.esc(x.data.phone || '')}</td><td>\${UI.esc(x.data.email || '')}</td><td class="small">\${x.errors.length ? \`<span class="badge danger">Erro</span> \${UI.esc(x.errors.join(' '))}\` : x.warnings.length ? \`<span class="badge warning">Aviso</span> \${UI.esc(x.warnings.join(' '))}\` : '<span class="badge success">OK</span>'}</td></tr>\`).join('')}</tbody></table></div>\`;
        commit.disabled = r.valid === 0;
      } catch (err) { prev.innerHTML = \`<div class="alert danger">\${UI.esc(err.message)}</div>\`; commit.disabled = true; }
    };
    commit.onclick = async () => {
      commit.disabled = true;
      try {
        const r = await api('/customers/import', { method: 'POST', body: { csv: csvText, commit: true, skip_duplicates: m.el.querySelector('#skipDup').checked } });
        prev.innerHTML = \`<div class="alert success"><span>\${UI.esc(r.message)} \${r.skipped ? \`\${r.skipped} ignorada(s) por duplicidade.\` : ''} \${r.invalid ? \`\${r.invalid} com erro n\xE3o importada(s).\` : ''}</span></div>
          \${r.errors.length ? \`<h4>Relat\xF3rio de erros</h4><table><tbody>\${r.errors.map((e) => \`<tr><td>Linha \${e.line}</td><td>\${UI.esc(e.errors.join(' '))}</td></tr>\`).join('')}</tbody></table>\` : ''}\`;
        this.list();
      } catch (err) { UI.err(err); commit.disabled = false; }
    };
  },
};
`, "/js/pages/dashboard.js": `'use strict';
// Painel do dia: primeiro o que exige a\xE7\xE3o (fila, sem resposta, prazos vencidos, oportunidades sem pr\xF3xima a\xE7\xE3o),
// depois pend\xEAncias pessoais (atendente) ou vis\xE3o da equipe (supervisor/administrador).
CRM.pages.dashboard = {
  async render(el) {
    this.el = el;
    const mgr = CRM.isManager();
    const [d, queue, unanswered] = await Promise.all([
      api('/reports/dashboard'),
      api('/tickets', { query: { view: 'queue', limit: 6 } }),
      api('/tickets', { query: mgr ? { view: 'unanswered', limit: 6 } : { view: 'mine', limit: 6 } }),
    ]);
    const t = d.tickets, o = d.opportunities, k = d.tasks, h = d.help;
    const kpi = (label, value, sub, href, help, cls = '') => \`<a class="kpi \${cls}" href="\${href}"><div class="label">\${label}\${help ? UI.help(help) : ''}</div><div class="value">\${value ?? 0}</div><div class="sub">\${sub || ''}</div></a>\`;
    const slaPct = t.fr_samples ? Math.round((t.fr_within_sla / t.fr_samples) * 100) : null;
    const hasData = t.open || o.open || t.resolved_today || k.today || d.my_tasks.length;
    el.innerHTML = CRM.pageHeader('Painel', \`\${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} \xB7 \${mgr ? 'vis\xE3o da equipe' : 'suas pend\xEAncias e pr\xF3ximos contatos'}\`,
      \`<button class="btn secondary" id="btnTicket">\${UI.icons.inbox} <span class="lbl">Abrir atendimento</span></button><a class="btn" href="#/clientes?novo=1">\${UI.icons.userPlus} <span class="lbl">Novo cliente</span></a>\`) +
    \`<h4 class="mb-s">Exige a\xE7\xE3o agora</h4>
    <div class="kpi-row mb">
      \${kpi('Fila de espera', t.queue, 'sem respons\xE1vel', '#/atendimentos?view=queue', h.queue, t.queue ? 'warn' : '')}
      \${kpi(mgr ? 'Clientes sem resposta' : 'Meus sem resposta', mgr ? t.unanswered : t.mine_unanswered, t.overdue ? \`\${t.overdue} com prazo vencido\` : \`prazo: \${t.sla_minutes} min\`, mgr ? '#/atendimentos?view=unanswered' : '#/atendimentos?view=mine', h.unanswered, (mgr ? t.unanswered : t.mine_unanswered) ? (t.overdue ? 'danger' : 'warn') : '')}
      \${kpi('Retornos vencidos', t.follow_up_overdue, 'agendados e n\xE3o feitos', '#/atendimentos?tabela=1&view=follow_up_overdue', h.follow_up_overdue, t.follow_up_overdue ? 'danger' : '')}
      \${kpi('Oportunidades sem pr\xF3xima a\xE7\xE3o', o.no_next_action, o.overdue ? \`\${o.overdue} com prazo vencido\` : 'em etapas abertas', '#/funil?no_task=true', h.no_next_action, o.no_next_action ? 'warn' : '')}
    </div>
    \${!hasData ? \`<div class="card mb">\${UI.empty('Ainda n\xE3o h\xE1 dados para exibir', 'Comece cadastrando um cliente e abrindo o primeiro atendimento.')}<div class="ql"><a href="#/clientes?novo=1">Cadastrar cliente</a><a href="#/atendimentos?novo=1">Abrir atendimento</a>\${CRM.isAdmin() ? '<a href="#/configuracoes">Configurar empresa e equipe</a>' : ''}</div></div>\` : ''}
    \${mgr ? this.managerBlocks(d, queue, unanswered, slaPct) : this.agentBlocks(d, queue, unanswered)}
    <h4 class="mb-s mt">Acompanhamento</h4>
    <div class="kpi-row">
      \${kpi('Conversas abertas', t.open, \`\${t.opened_today} aberta(s) hoje\`, '#/atendimentos?view=open', 'Atendimentos com status Aguardando, Em atendimento ou Aguardando cliente. Situa\xE7\xE3o atual.')}
      \${kpi('Resolvidos hoje', t.resolved_today, mgr ? 'pela equipe' : 'por voc\xEA', '#/atendimentos?tabela=1&view=closed', 'Atendimentos encerrados como Resolvido com data de encerramento igual a hoje.', t.resolved_today ? 'ok' : '')}
      \${kpi('Prazo de 1\xAA resposta', slaPct == null ? '\u2014' : slaPct + '%', t.fr_samples ? \`\${t.fr_samples} atendimento(s) \xB7 m\xE9dia \${UI.fmtDuration(t.avg_first_response_s)}\` : 'sem dados nos \xFAltimos 30 dias', '#/relatorios', h.sla, slaPct == null ? '' : slaPct >= 80 ? 'ok' : 'warn')}
      \${kpi('Ganhos no m\xEAs', UI.fmtMoneyShort(o.won_month_value), \`\${o.won_month} neg\xF3cio(s) \xB7 \${o.lost_month} perdido(s)\`, '#/relatorios', h.won_month, o.won_month ? 'ok' : '')}
    </div>\`;
    el.querySelector('#btnTicket').onclick = () => CRM.pages.tickets.form({}, (tk) => { location.hash = \`#/atendimentos/\${tk.id}\`; });
    el.querySelectorAll('[data-task-done]').forEach((cb) => cb.onchange = async () => { try { await api(\`/tasks/\${cb.dataset.taskDone}\`, { method: 'PUT', body: { done: true } }); UI.ok('Tarefa conclu\xEDda.'); this.render(el); } catch (e) { UI.err(e); cb.checked = false; } });
  },

  ticketList(list, et, es) {
    if (!list.length) return UI.empty(et, es);
    return list.map((x) => \`<a class="conv-item" href="#/atendimentos/\${x.id}">\${UI.avatar(x.customer_name, 'sm')}<div style="min-width:0"><div class="name">\${UI.esc(x.customer_name)}</div><div class="preview">\${UI.esc(x.last_message_preview || x.subject)}</div></div><div class="time">\${UI.fmtShort(x.last_message_at || x.opened_at)}</div><div class="meta">\${UI.channelIcon(x.channel)} \${UI.esc(x.channel)} \${x.assignee_name ? \`\xB7 \${UI.esc(x.assignee_name.split(' ')[0])}\` : ''} \${x.priority === 'urgente' || x.priority === 'alta' ? UI.priorityBadge(x.priority) : ''} \${CRM.pages.tickets.slaHtml(x)}</div></a>\`).join('');
  },
  taskList(list) {
    if (!list.length) return UI.empty('Nada pendente at\xE9 amanh\xE3', 'Suas tarefas e retornos aparecem aqui.');
    return list.map((x) => \`<div class="task-row"><input type="checkbox" data-task-done="\${x.id}" aria-label="Concluir"><div><div class="t">\${x.kind === 'retorno' ? \`\${UI.icons.calendar} \` : ''}\${UI.esc(x.title)}</div><div class="s \${x.due_at && new Date(x.due_at) < Date.now() ? 'text-danger' : ''}">\${x.due_at ? UI.fmtDateTime(x.due_at) : 'sem prazo'}\${x.due_at && new Date(x.due_at) < Date.now() ? ' \xB7 atrasada' : ''}\${x.customer_name ? \` \xB7 <a href="#/clientes/\${x.customer_id}">\${UI.esc(x.customer_name)}</a>\` : ''}</div></div>\${x.ticket_id ? \`<a class="btn xs secondary" href="#/atendimentos/\${x.ticket_id}">Conversa</a>\` : x.opportunity_id ? \`<a class="btn xs secondary" href="#/funil/\${x.opportunity_id}">Negocia\xE7\xE3o</a>\` : ''}</div>\`).join('');
  },
  contacts(list) {
    if (!list.length) return UI.empty('Nenhum retorno agendado', '');
    return list.map((x) => \`<div class="task-row"><span class="dot \${new Date(x.follow_up_at) < Date.now() ? 'danger' : new Date(x.follow_up_at) - Date.now() < 86400000 ? 'warn' : 'on'}"></span><div><div class="t"><a href="#/atendimentos/\${x.id}">\${UI.esc(x.customer_name)}</a> <span class="muted">\xB7 \${UI.esc(x.subject)}</span></div><div class="s \${new Date(x.follow_up_at) < Date.now() ? 'text-danger' : ''}">\${UI.fmtDateTime(x.follow_up_at)}\${new Date(x.follow_up_at) < Date.now() ? ' \xB7 vencido' : ''}</div></div><span class="mono xs muted">\${UI.esc(x.protocol)}</span></div>\`).join('');
  },

  agentBlocks(d, queue, mine) {
    return \`<div class="grid cols-2">
      <div class="card flush"><div class="card-title"><h3>Minhas pend\xEAncias</h3><a href="#/tarefas" class="small">Todas as tarefas</a></div><div style="padding:.3rem 1rem .5rem">\${this.taskList(d.my_tasks)}</div></div>
      <div class="card flush"><div class="card-title"><h3>Pr\xF3ximos contatos</h3><a href="#/atendimentos?tabela=1&follow_up=pending" class="small">Ver todos</a></div><div style="padding:.3rem 1rem .5rem">\${this.contacts(d.next_contacts)}</div></div>
      <div class="card flush"><div class="card-title"><h3>Minhas conversas</h3><a href="#/atendimentos?view=mine" class="small">Ver todas (\${d.tickets.mine_open})</a></div>\${this.ticketList(mine.tickets, 'Nada em andamento', 'Assuma um atendimento da fila para come\xE7ar.')}</div>
      <div class="card flush"><div class="card-title"><h3>Fila de espera</h3><a href="#/atendimentos?view=queue" class="small">Ver fila (\${queue.total})</a></div>\${this.ticketList(queue.tickets, 'Fila vazia', 'Nenhum atendimento aguardando.')}</div>
    </div>\`;
  },

  managerBlocks(d, queue, unanswered, slaPct) {
    const team = d.team || [];
    const maxOpen = Math.max(1, ...team.map((u) => u.open));
    const o = d.opportunities;
    return \`<div class="grid cols-2">
      <div class="card flush"><div class="card-title"><h3>Carga da equipe</h3><span class="small muted">\${team.filter((u) => u.available).length} de \${team.length} dispon\xEDveis \${UI.help('Atendimentos abertos por atendente (situa\xE7\xE3o atual) e quantos est\xE3o com o cliente aguardando resposta. Resolvidos: hoje.')}</span></div>
        \${team.length ? \`<div class="table-wrap"><table><thead><tr><th>Atendente</th><th>Abertos</th><th class="num" title="Sem resposta">S/ resp.</th><th class="num" title="Resolvidos hoje">Hoje</th><th class="num" title="Tarefas atrasadas">Atras.</th></tr></thead><tbody>\${team.map((u) => \`<tr class="clickable" data-href="#/atendimentos?tabela=1&view=open&assignee_id=\${u.id}"><td class="nowrap"><span class="dot \${u.available ? 'on' : 'off'}" title="\${u.available ? 'Dispon\xEDvel' : 'Indispon\xEDvel'}"></span> \${UI.esc(u.name)}\${u.team ? \` <span class="muted xs">\xB7 \${UI.esc(u.team)}</span>\` : ''}</td><td style="min-width:90px"><div class="flex"><div class="bar grow"><span style="width:\${Math.round((u.open / maxOpen) * 100)}%"></span></div><span class="small">\${u.open}</span></div></td><td class="num \${u.unanswered ? 'text-warning strong' : ''}">\${u.unanswered}</td><td class="num">\${u.resolved_today}</td><td class="num \${u.overdue_tasks ? 'text-danger strong' : ''}">\${u.overdue_tasks}</td></tr>\`).join('')}</tbody></table></div>\` : UI.empty('Nenhum atendente ativo', 'Cadastre a equipe em Configura\xE7\xF5es \u203A Usu\xE1rios.')}</div>
      <div class="card flush"><div class="card-title"><h3>Clientes aguardando resposta</h3><a href="#/atendimentos?view=unanswered" class="small">Ver todos (\${d.tickets.unanswered})</a></div>\${this.ticketList(unanswered.tickets, 'Tudo respondido', 'Nenhum cliente aguardando resposta.')}</div>
      <div class="card"><div class="card-title"><h3>Prazos e resultado</h3><a href="#/relatorios" class="small">Relat\xF3rios</a></div>
        <div class="grid cols-2">
          <div><div class="small muted">Cumprimento do prazo de 1\xAA resposta \${UI.help(d.help.sla)}</div><div class="flex"><div class="bar grow \${slaPct == null ? '' : slaPct >= 80 ? 'success' : 'warning'}"><span style="width:\${slaPct || 0}%"></span></div><strong>\${slaPct == null ? '\u2014' : slaPct + '%'}</strong></div><div class="xs muted">\${d.tickets.fr_samples} atendimento(s) em 30 dias \xB7 m\xE9dia \${UI.fmtDuration(d.tickets.avg_first_response_s)}</div></div>
          <div><div class="small muted">Resultado comercial no m\xEAs \${UI.help(d.help.won_month)}</div><div><strong>\${UI.fmtMoney(o.won_month_value)}</strong> <span class="small muted">em \${o.won_month} ganho(s)</span></div><div class="xs muted">\${o.lost_month} perdido(s) \xB7 \${o.closing_week} com previs\xE3o nos pr\xF3ximos 7 dias</div></div>
          <div><div class="small muted">Funil aberto</div><div><strong>\${UI.fmtMoney(o.open_value)}</strong> <span class="small muted">em \${o.open} oportunidade(s)</span></div><div class="xs muted"><a href="#/funil?idle_days=\${o.idle_days}">\${o.idle} parada(s) h\xE1 mais de \${o.idle_days} dias</a> \${UI.help(d.help.idle)}</div></div>
          <div><div class="small muted">Tarefas da equipe</div><div><strong class="\${d.tasks.overdue ? 'text-danger' : ''}">\${d.tasks.overdue}</strong> <span class="small muted">atrasada(s) \xB7 \${d.tasks.today} para hoje</span></div><div class="xs muted"><a href="#/tarefas?view=overdue">Ver tarefas</a></div></div>
        </div></div>
      <div class="card flush"><div class="card-title"><h3>Fila de espera</h3><div class="flex"><a href="#/atendimentos?view=queue" class="small">Ver fila (\${queue.total})</a></div></div>\${this.ticketList(queue.tickets, 'Fila vazia', 'Nenhum atendimento aguardando.')}</div>
      <div class="card flush"><div class="card-title"><h3>Minhas pend\xEAncias</h3><a href="#/tarefas" class="small">Tarefas</a></div><div style="padding:.3rem 1rem .5rem">\${this.taskList(d.my_tasks)}</div></div>
      <div class="card flush"><div class="card-title"><h3>Pr\xF3ximos contatos da equipe</h3><a href="#/atendimentos?tabela=1&follow_up=pending" class="small">Ver todos</a></div><div style="padding:.3rem 1rem .5rem">\${this.contacts(d.next_contacts)}</div></div>
    </div>\`;
  },
  onRealtime() { if (location.hash === '#/' || location.hash === '') this.render(this.el); },
};
`, "/js/pages/pipeline.js": `'use strict';
// Funil comercial: quadro Kanban ou lista, m\xFAltiplos funis, filtros salvos e painel lateral da oportunidade.
CRM.pages.pipeline = {
  async render(el, { id, query }) {
    this.el = el; this.query = query; this.mode = query.modo || UI.store.get('pipeline.mode', 'board');
    const s = await CRM.settingsFull();
    this.pipelines = (s ? s.pipelines : []).filter((p) => p.active);
    this.allStages = s ? s.stages : [];
    this.sources = s ? s.settings.contact_sources : [];
    this.pipelineId = Number(query.pipeline_id) || UI.store.get('pipeline.id', null) || (this.pipelines.find((p) => p.is_default) || this.pipelines[0] || {}).id;
    if (!this.pipelines.some((p) => p.id === this.pipelineId)) this.pipelineId = (this.pipelines[0] || {}).id;
    UI.store.set('pipeline.id', this.pipelineId);
    el.innerHTML = CRM.pageHeader('Funil comercial', 'Oportunidades por etapa. A etapa comercial \xE9 independente do status do atendimento.',
      \`<div class="seg" role="group" aria-label="Modo de visualiza\xE7\xE3o"><button data-mode="board" class="\${this.mode === 'board' ? 'active' : ''}">\${UI.icons.board} Quadro</button><button data-mode="list" class="\${this.mode === 'list' ? 'active' : ''}">\${UI.icons.list} Lista</button></div>
       <button class="btn secondary" id="btnExport">\${UI.icons.download} <span class="lbl">Exportar</span></button><button class="btn" id="btnNew">\${UI.icons.plus} <span class="lbl">Nova oportunidade</span></button>\`) +
    \`<div class="card"><div class="flex between wrap mb-s"><div class="flex wrap">
        \${this.pipelines.length > 1 ? \`<select id="pipeSel" style="width:auto" aria-label="Funil">\${this.pipelines.map((p) => \`<option value="\${p.id}" \${p.id === this.pipelineId ? 'selected' : ''}>\${UI.esc(p.name)}</option>\`).join('')}</select>\` : \`<strong>\${UI.esc((this.pipelines[0] || {}).name || 'Funil')}</strong>\`}
        \${CRM.isAdmin() ? '<a href="#/configuracoes/funil" class="small">Configurar funis</a>' : ''}</div>
        <div id="savedBox"></div></div>
      <form class="filters" id="filters"><div class="field grow"><label>Busca</label><input name="q" value="\${UI.attr(query.q || '')}" placeholder="T\xEDtulo, cliente ou empresa"></div>
      \${CRM.isManager() ? \`<div class="field"><label>Respons\xE1vel</label>\${UI.select('owner_id', [['', 'Todos'], ['none', 'Sem respons\xE1vel'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], query.owner_id)}</div>\` : ''}
      <div class="field"><label>Origem</label>\${UI.select('source', [['', 'Todas'], ...this.sources.map((x) => [x, x])], query.source)}</div>
      <div class="field"><label>Etiqueta</label><input name="tag" value="\${UI.attr(query.tag || '')}" placeholder="ex.: vip"></div>
      <div class="field"><label>Situa\xE7\xE3o</label>\${UI.select('flag', [['', 'Todas'], ['no_task', 'Sem pr\xF3xima a\xE7\xE3o'], ['overdue', 'Prazo vencido'], ['idle', 'Paradas']], query.no_task ? 'no_task' : query.overdue ? 'overdue' : query.idle_days ? 'idle' : '')}</div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/funil">Limpar</a></form><div id="board"></div></div>\`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const flag = d.flag; delete d.flag; if (flag === 'no_task') d.no_task = 'true'; if (flag === 'overdue') d.overdue = 'true'; if (flag === 'idle') d.idle_days = 7; location.hash = \`#/funil?\${UI.qs({ ...d, pipeline_id: this.pipelineId })}\`; };
    el.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { this.mode = b.dataset.mode; UI.store.set('pipeline.mode', this.mode); el.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('active', x === b)); this.board(); });
    const ps = el.querySelector('#pipeSel'); if (ps) ps.onchange = () => { location.hash = \`#/funil?\${UI.qs({ ...this.query, pipeline_id: ps.value })}\`; };
    el.querySelector('#btnNew').onclick = () => this.form({ pipeline_id: this.pipelineId }, () => this.board());
    el.querySelector('#btnExport').onclick = () => UI.download('/opportunities/export.csv');
    UI.savedFilters(el.querySelector('#savedBox'), { scope: 'pipeline', current: () => ({ ...this.query, pipeline_id: this.pipelineId }), onApply: (p) => { location.hash = \`#/funil?\${UI.qs(p)}\`; } });
    await this.board();
    if (id) this.detail(id);
  },

  params() { const q = this.query; return { q: q.q, owner_id: q.owner_id, source: q.source, tag: q.tag, no_task: q.no_task, overdue: q.overdue, idle_days: q.idle_days, pipeline_id: this.pipelineId, sort: this.sort, dir: this.dir }; },

  flags(o) {
    const out = [];
    const overdueTask = o.next_task_at && new Date(o.next_task_at) < Date.now();
    const overdueAction = o.next_action_at && new Date(o.next_action_at) < Date.now();
    if (overdueTask || overdueAction) out.push({ cls: 'warn', text: \`Prazo vencido \${UI.fmtDate(overdueTask ? o.next_task_at : o.next_action_at)}\` });
    else if (!o.open_tasks && !o.next_action_at) out.push({ cls: 'notask', text: 'Sem pr\xF3xima a\xE7\xE3o' });
    return out;
  },

  async board() {
    const box = this.el.querySelector('#board'); if (!box) return;
    const r = await api('/opportunities', { query: this.params() });
    this.stages = r.stages; this.data = r;
    if (!r.opportunities.length && !this.query.q && !this.query.owner_id && !this.query.tag && !this.query.no_task && !this.query.overdue) {
      box.innerHTML = UI.empty('Nenhuma oportunidade neste funil', 'Crie a primeira oportunidade a partir de um cliente, de uma conversa ou pelo bot\xE3o acima.'); return;
    }
    if (this.mode === 'list') return this.listView(box, r);
    const openOnly = r.opportunities.filter((o) => o.stage_kind === 'open');
    const totalOpen = openOnly.reduce((a, o) => a + Number(o.value || 0), 0);
    box.innerHTML = \`<p class="small muted mb-s">\${openOnly.length} em aberto \xB7 \${UI.fmtMoney(totalOpen)} \xB7 \${r.opportunities.length - openOnly.length} encerrada(s) nos \xFAltimos 30 dias. Arraste os cart\xF5es para mudar de etapa.</p>
      <div class="kanban-wrap"><div class="kanban">\${r.stages.map((s) => { const items = r.opportunities.filter((o) => o.stage_id === s.id); const sum = items.reduce((a, o) => a + Number(o.value || 0), 0);
      return \`<div class="kb-col" data-stage="\${s.id}" data-kind="\${s.kind}"><div class="kb-head" style="\${s.color ? \`border-top:3px solid \${UI.attr(s.color)}\` : ''}"><div class="t"><span>\${UI.esc(s.name)}</span><span class="n">\${items.length}</span></div><div class="sum">\${UI.fmtMoney(sum)}</div>\${s.kind === 'open' && totalOpen ? \`<div class="bar"><span style="width:\${Math.round((sum / totalOpen) * 100)}%"></span></div>\` : ''}</div>
        <div class="kb-cards">\${items.map((o) => this.card(o, s)).join('') || '<div class="muted small center" style="padding:1rem">Vazio</div>'}</div></div>\`; }).join('')}</div></div>\`;
    box.querySelectorAll('.kb-card').forEach((card) => {
      card.onclick = () => this.detail(Number(card.dataset.id));
      card.onkeydown = (e) => { if (e.key === 'Enter') this.detail(Number(card.dataset.id)); };
      card.ondragstart = (e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ id: card.dataset.id, version: card.dataset.version })); };
    });
    box.querySelectorAll('.kb-col').forEach((col) => {
      col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = async (e) => { e.preventDefault(); col.classList.remove('over'); const d = JSON.parse(e.dataTransfer.getData('text/plain')); this.move(Number(d.id), Number(col.dataset.stage), col.dataset.kind, Number(d.version)); };
    });
  },

  card(o, s) {
    const fl = this.flags(o);
    const canDrag = CRM.isManager() || o.owner_id === CRM.user.id || !o.owner_id;
    return \`<div class="kb-card \${fl.some((f) => f.cls === 'warn') ? 'late' : fl.length ? 'notask-b' : ''}" draggable="\${canDrag}" tabindex="0" data-id="\${o.id}" data-version="\${o.version}" role="button" aria-label="\${UI.attr(o.title)}">
      <div class="cust" title="\${UI.attr(o.customer_name)}">\${UI.esc(o.customer_name)}\${o.customer_company ? \` <span class="muted">\xB7 \${UI.esc(o.customer_company)}</span>\` : ''}</div>
      <div class="title" title="\${UI.attr(o.title)}">\${UI.esc(o.title)}</div>
      <div class="row"><span class="value">\${UI.fmtMoney(o.value)}</span><span title="Respons\xE1vel">\${o.owner_name ? UI.esc(o.owner_name.split(' ')[0]) : '\u2014'}</span></div>
      <div class="row"><span title="\xDAltimo contato">\${o.last_contact_at ? \`\${UI.icons.message} \${UI.relative(o.last_contact_at)}\` : '<span class="muted">sem contato</span>'}</span>\${s.kind === 'open' && o.expected_close_date ? \`<span title="Previs\xE3o de fechamento">\${UI.icons.calendar} \${UI.fmtDate(o.expected_close_date)}</span>\` : ''}</div>
      \${s.kind === 'open' ? \`<div class="row"><span class="trunc" title="Pr\xF3xima a\xE7\xE3o">\${o.next_action ? \`\${UI.icons.arrowRight} \${UI.esc(o.next_action)}\${o.next_action_at ? \` \xB7 \${UI.fmtDate(o.next_action_at)}\` : ''}\` : (o.open_tasks ? \`\${UI.icons.tasks} \${UI.plural(o.open_tasks, 'tarefa', 'tarefas')} \xB7 \${UI.fmtDate(o.next_task_at)}\` : '')}</span></div>\` : ''}
      \${fl.map((f) => \`<div class="row"><span class="\${f.cls}">\${UI.icons.alert} \${f.text}</span></div>\`).join('')}
      \${o.lost_reason ? \`<div class="row"><span class="badge danger">\${UI.esc(o.lost_reason)}</span></div>\` : ''}\${(o.tags || []).length ? \`<div class="row"><span>\${UI.tags(o.tags)}</span></div>\` : ''}</div>\`;
  },

  listView(box, r) {
    const byStage = r.stages.map((s) => { const items = r.opportunities.filter((o) => o.stage_id === s.id); return \`\${UI.esc(s.name)}: \${items.length} (\${UI.fmtMoneyShort(items.reduce((a, o) => a + Number(o.value || 0), 0))})\`; }).join(' \xB7 ');
    box.innerHTML = \`<p class="small muted mb-s">\${byStage}</p><div id="listTable"></div>\`;
    UI.table(box.querySelector('#listTable'), { id: 'pipeline', rows: r.opportunities, total: r.opportunities.length, limit: 1000, sort: this.sort, dir: this.dir,
      columns: [
        { key: 'customer_name', label: 'Cliente', sortable: true, min: '160px', render: (o) => \`<span class="trunc strong" title="\${UI.attr(o.customer_name)}">\${UI.esc(o.customer_name)}</span>\${o.customer_company ? \`<span class="trunc muted small">\${UI.esc(o.customer_company)}</span>\` : ''}\` },
        { key: 'title', label: 'Oportunidade', sortable: true, min: '180px', render: (o) => \`<span class="trunc" title="\${UI.attr(o.title)}">\${UI.esc(o.title)}</span>\` },
        { key: 'stage', label: 'Etapa', sortable: true, render: (o) => UI.stageBadge(o.stage_name, o.stage_kind) },
        { key: 'value', label: 'Valor', sortable: true, align: 'right', nowrap: true, render: (o) => UI.fmtMoney(o.value) },
        { key: 'owner_name', label: 'Respons\xE1vel', sortable: true, nowrap: true, render: (o) => UI.esc(o.owner_name || '\u2014') },
        { key: 'last_contact', label: '\xDAltimo contato', nowrap: true, render: (o) => o.last_contact_at ? UI.fmtDateTime(o.last_contact_at) : '<span class="muted">\u2014</span>' },
        { key: 'next_action_at', label: 'Pr\xF3xima a\xE7\xE3o', sortable: true, min: '160px', render: (o) => { const f = this.flags(o); return \`<span class="trunc">\${UI.esc(o.next_action || (o.open_tasks ? \`\${o.open_tasks} tarefa(s)\` : ''))}</span>\${o.next_action_at || o.next_task_at ? \`<span class="small \${f.some((x) => x.cls === 'warn') ? 'text-danger strong' : 'muted'}">\${UI.fmtDateTime(o.next_action_at || o.next_task_at)}\${f.some((x) => x.cls === 'warn') ? ' \xB7 vencido' : ''}</span>\` : f.length ? \`<span class="small text-warning">\${f[0].text}</span>\` : ''}\`; } },
        { key: 'expected_close_date', label: 'Previs\xE3o', sortable: true, nowrap: true, render: (o) => UI.fmtDate(o.expected_close_date) },
        { key: 'tags', label: 'Etiquetas', default: false, render: (o) => UI.tags(o.tags) },
        { key: 'created_at', label: 'Criada', sortable: true, nowrap: true, default: false, render: (o) => UI.fmtDate(o.created_at) },
      ],
      onSort: (s, d) => { this.sort = s; this.dir = d; this.board(); }, onRow: (o) => this.detail(o.id) });
  },

  async move(id, stageId, kind, version, after) {
    try {
      let lost_reason;
      if (kind === 'lost') { lost_reason = await UI.prompt('Qual foi o motivo da perda?', { title: 'Marcar como perdida', placeholder: 'ex.: Pre\xE7o, prazo, concorrente\u2026' }); if (lost_reason === null) return; }
      const r = await api(\`/opportunities/\${id}/move\`, { method: 'POST', body: { stage_id: stageId, lost_reason, version } });
      UI.ok(r.message); if (after) after(); else if (this.el && this.el.querySelector('#board')) this.board();
    } catch (err) { UI.err(err); if (after) after(); else if (this.el && this.el.querySelector('#board')) this.board(); }
  },

  async form({ customer, ticket_id, opp, pipeline_id } = {}, onSaved) {
    const isEdit = Boolean(opp);
    const s = await CRM.settingsFull();
    const pipelines = (s ? s.pipelines : []).filter((p) => p.active);
    const stagesAll = s ? s.stages : [];
    const pid = opp ? opp.pipeline_id : (pipeline_id || (pipelines.find((p) => p.is_default) || pipelines[0] || {}).id);
    const sources = s ? s.settings.contact_sources : [];
    const m = UI.modal({ title: isEdit ? 'Editar oportunidade' : 'Nova oportunidade', body: \`<form id="oppForm">
      \${UI.field('customer_id', 'Cliente', \`<input id="custSearch" placeholder="Digite para buscar o cliente\u2026" autocomplete="off" value="\${UI.attr(customer ? customer.name : opp ? opp.customer_name : '')}" \${customer || isEdit ? 'readonly' : ''}><input type="hidden" name="customer_id" data-type="int" value="\${customer ? customer.id : opp ? opp.customer_id : ''}"><div class="search-results" id="custResults" hidden style="position:relative"></div>\`, { required: true })}
      \${UI.field('title', 'T\xEDtulo', UI.input('title', opp?.title, 'required placeholder="ex.: Plano anual \u2014 10 licen\xE7as"'), { required: true })}
      <div class="form-row cols-3">\${UI.field('value', 'Valor estimado (R$)', UI.input('value', opp ? UI.money(opp.value) : '', 'data-type="money" placeholder="0,00" inputmode="decimal"'))}
        \${UI.field('owner_id', 'Respons\xE1vel', UI.select('owner_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), opp ? opp.owner_id : CRM.user.id, 'data-type="int"'))}
        \${isEdit ? UI.field('source', 'Origem', UI.select('source', [['', '\u2014'], ...sources.map((x) => [x, x])], opp.source, 'data-type="nullable"')) : \`<div class="field"><label>Funil e etapa inicial</label><div class="flex">\${pipelines.length > 1 ? UI.select('pipeline_id', pipelines.map((p) => [p.id, p.name]), pid, 'data-type="int" id="pipeSelForm"') : \`<input type="hidden" name="pipeline_id" value="\${pid}" data-type="int">\`}\${UI.select('stage_id', stagesAll.filter((x) => x.kind === 'open' && x.active && x.pipeline_id === pid).map((x) => [x.id, x.name]), '', 'data-type="int" id="stageSelForm"')}</div></div>\`}</div>
      <div class="form-row">\${UI.field('next_action', 'Pr\xF3xima a\xE7\xE3o', UI.input('next_action', opp?.next_action, 'data-type="nullable" placeholder="ex.: Enviar proposta revisada"'))}\${UI.field('next_action_at', 'Quando', \`<input type="datetime-local" name="next_action_at" value="\${UI.toLocalInput(opp?.next_action_at)}">\`)}</div>
      <div class="form-row">\${UI.field('expected_close_date', 'Previs\xE3o de fechamento', \`<input type="date" name="expected_close_date" data-type="nullable" value="\${UI.attr(opp?.expected_close_date ? String(opp.expected_close_date).slice(0, 10) : '')}">\`)}\${UI.field('tags', 'Etiquetas', UI.input('tags', (opp?.tags || []).join(', '), 'data-type="tags" placeholder="separe por v\xEDrgula"'))}</div>
      \${ticket_id ? \`<input type="hidden" name="ticket_id" value="\${ticket_id}" data-type="int">\` : ''}\${isEdit ? \`<input type="hidden" name="version" value="\${opp.version}" data-type="int">\` : ''}</form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="oppForm">\${isEdit ? 'Salvar' : 'Criar oportunidade'}</button>\` });
    const form = m.el.querySelector('#oppForm');
    const pipeSel = form.querySelector('#pipeSelForm'); if (pipeSel) pipeSel.onchange = () => { const st = form.querySelector('#stageSelForm'); st.innerHTML = stagesAll.filter((x) => x.kind === 'open' && x.active && x.pipeline_id === Number(pipeSel.value)).map((x) => \`<option value="\${x.id}">\${UI.esc(x.name)}</option>\`).join(''); };
    if (!customer && !isEdit) CRM.pages.tickets.customerPicker(form.querySelector('#custSearch'), form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form); if (!d.customer_id) { UI.showErrors(form, new ApiError(400, { fields: { customer_id: 'Selecione um cliente.' } })); return; }
      if (isEdit) delete d.customer_id;
      try { const r = isEdit ? await api(\`/opportunities/\${opp.id}\`, { method: 'PUT', body: d }) : await api('/opportunities', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.opportunity); } catch (err) { UI.showErrors(form, err); }
    };
  },

  // Painel lateral amplo: contexto do funil permanece vis\xEDvel atr\xE1s.
  async detail(id, { onChange } = {}) {
    let r; try { r = await api(\`/opportunities/\${id}\`); } catch (err) { return UI.err(err); }
    const o = r.opportunity; const stages = r.stages.filter((s) => s.active);
    const canEdit = CRM.isManager() || o.owner_id === CRM.user.id || o.owner_id === null;
    const isOpen = o.stage_kind === 'open';
    const changed = () => { if (onChange) onChange(); if (this.el && this.el.querySelector('#board')) this.board(); };
    const sources = (CRM._settingsFull && CRM._settingsFull.settings.contact_sources) || [];
    const fl = this.flags(o);
    const d = UI.drawer({ title: o.title, onClose: () => { if (location.hash.startsWith('#/funil/')) history.replaceState(null, '', '#/funil'); },
      body: \`<div class="flex wrap mb">\${UI.stageBadge(o.stage_name, o.stage_kind)}<span class="badge outline">\${UI.esc(o.pipeline_name)}</span>\${fl.map((f) => \`<span class="badge \${f.cls === 'warn' ? 'danger' : 'warning'}">\${f.text}</span>\`).join('')}\${o.open_ticket_id ? \`<a class="badge primary" href="#/atendimentos/\${o.open_ticket_id}">Atendimento \${UI.esc(UI.STATUS[o.open_ticket_status]?.short || '')}</a>\` : ''}</div>
      \${isOpen && canEdit ? \`<div class="flex wrap mb"><label class="small" style="margin:0">Etapa</label>\${UI.select('stage', stages.map((s) => [s.id, s.name]), o.stage_id, 'id="moveSel" style="width:auto"')}<span class="muted small">Ganho/Perdido encerram a negocia\xE7\xE3o; perda exige motivo.</span></div>\` : ''}
      <div class="grid cols-2">
        <div><h4>Dados da negocia\xE7\xE3o</h4><form id="inlineForm"><dl class="def-list" id="oppFields">
          \${this.inline('title', 'T\xEDtulo', o.title, canEdit)}
          \${this.inline('value', 'Valor', UI.money(o.value), canEdit, 'money', UI.fmtMoney(o.value))}
          \${this.inlineSelect('owner_id', 'Respons\xE1vel', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), o.owner_id, canEdit, o.owner_name || '\u2014')}
          \${this.inline('expected_close_date', 'Previs\xE3o', o.expected_close_date ? String(o.expected_close_date).slice(0, 10) : '', canEdit, 'date', UI.fmtDate(o.expected_close_date))}
          \${this.inline('next_action', 'Pr\xF3xima a\xE7\xE3o', o.next_action || '', canEdit, 'text', o.next_action || '\u2014')}
          \${this.inline('next_action_at', 'Quando', UI.toLocalInput(o.next_action_at), canEdit, 'datetime', o.next_action_at ? UI.fmtDateTime(o.next_action_at) : '\u2014')}
          \${this.inlineSelect('source', 'Origem', [['', '\u2014'], ...sources.map((x) => [x, x])], o.source || '', canEdit, o.source || o.customer_source || '\u2014')}
          \${this.inline('tags', 'Etiquetas', (o.tags || []).join(', '), canEdit, 'tags', UI.tags(o.tags) || '\u2014')}
          \${o.lost_reason ? \`<dt>Motivo da perda</dt><dd>\${UI.esc(o.lost_reason)}</dd>\` : ''}
          <dt>Criada</dt><dd>\${UI.fmtDateTime(o.created_at)}</dd>\${o.closed_at ? \`<dt>Encerrada</dt><dd>\${UI.fmtDateTime(o.closed_at)}</dd>\` : ''}<dt>Na etapa h\xE1</dt><dd>\${UI.fmtDuration((Date.now() - new Date(o.stage_entered_at || o.updated_at)) / 1000)}</dd></dl></form>
          \${canEdit ? '<p class="muted xs mt-s">Clique em um campo para editar; a altera\xE7\xE3o \xE9 salva ao sair do campo.</p>' : ''}
          <h4 class="mt">Contato</h4><dl class="def-list"><dt>Cliente</dt><dd><a href="#/clientes/\${o.customer_id}">\${UI.esc(o.customer_name)}</a></dd><dt>Empresa</dt><dd>\${UI.esc(o.customer_company || '\u2014')}</dd><dt>Telefone</dt><dd>\${UI.esc(UI.fmtPhone(o.customer_phone) || '\u2014')}</dd><dt>E-mail</dt><dd>\${UI.esc(o.customer_email || '\u2014')}</dd>\${(o.customer_tags || []).length ? \`<dt>Etiquetas</dt><dd>\${UI.tags(o.customer_tags)}</dd>\` : ''}</dl>
          <h4 class="mt flex between">Tarefas <button class="btn link small" id="taskBtn">+ Tarefa</button></h4>\${r.tasks.length ? r.tasks.map((t) => \`<div class="task-row \${t.done_at ? 'done' : ''}"><input type="checkbox" data-task="\${t.id}" \${t.done_at ? 'checked' : ''} aria-label="Concluir"><div><div class="t">\${UI.esc(t.title)}</div><div class="s \${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? 'text-danger' : ''}">\${t.due_at ? UI.fmtDateTime(t.due_at) : 'sem prazo'}\${t.assignee_name ? \` \xB7 \${UI.esc(t.assignee_name.split(' ')[0])}\` : ''}\${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? ' \xB7 atrasada' : ''}\${t.closed_reason ? \` \xB7 \${UI.esc(t.closed_reason)}\` : ''}</div></div></div>\`).join('') : '<p class="muted small">Nenhuma tarefa. Oportunidades sem tarefa nem pr\xF3xima a\xE7\xE3o aparecem sinalizadas no quadro.</p>'}
          <h4 class="mt">Atendimentos do cliente</h4>\${r.tickets.length ? r.tickets.map((t) => \`<div class="small"><a href="#/atendimentos/\${t.id}"><span class="mono">\${UI.esc(t.protocol)}</span></a> \${UI.esc(t.subject)} \${UI.statusBadge(t.status, true)}</div>\`).join('') : '<p class="muted small">Nenhum atendimento.</p>'}</div>
        <div><h4>Hist\xF3rico</h4><ul class="timeline">\${r.events.map((e) => \`<li class="system"><span class="tl-dot"></span><div><div class="tl-meta">\${UI.esc(e.user_name || 'Sistema')} \xB7 \${UI.fmtDateTime(e.created_at)}</div><div class="tl-body">\${UI.esc(e.body)}</div></div></li>\`).join('')}</ul></div></div>\`,
      footer: \`\${CRM.isManager() ? '<button class="btn danger secondary" id="delBtn">Excluir</button>' : ''}<span class="grow"></span>\${o.open_ticket_id ? \`<a class="btn secondary" href="#/atendimentos/\${o.open_ticket_id}">\${UI.icons.inbox} Abrir conversa</a>\` : \`<button class="btn secondary" id="newTicketBtn">\${UI.icons.inbox} Abrir atendimento</button>\`}<button class="btn secondary" id="editBtn">\${UI.icons.edit} Editar tudo</button><button class="btn" data-close>Fechar</button>\` });
    const el = d.el;
    el.querySelector('#editBtn').onclick = () => { d.close(); this.form({ opp: o }, () => { changed(); this.detail(id, { onChange }); }); };
    const ms = el.querySelector('#moveSel'); if (ms) ms.onchange = () => { const st = stages.find((s) => s.id === Number(ms.value)); if (!st || st.id === o.stage_id) return; d.close(); this.move(o.id, st.id, st.kind, o.version, () => { changed(); this.detail(id, { onChange }); }); };
    el.querySelector('#taskBtn').onclick = () => CRM.pages.tasks.form({ customer_id: o.customer_id, customer_name: o.customer_name, opportunity_id: o.id, assignee_id: o.owner_id }, () => { changed(); d.close(); this.detail(id, { onChange }); });
    const nt = el.querySelector('#newTicketBtn'); if (nt) nt.onclick = () => CRM.pages.tickets.form({ customer: { id: o.customer_id, name: o.customer_name } }, (t) => { d.close(); location.hash = \`#/atendimentos/\${t.id}\`; });
    el.querySelectorAll('[data-task]').forEach((cb) => cb.onchange = async () => { try { await api(\`/tasks/\${cb.dataset.task}\`, { method: 'PUT', body: { done: cb.checked } }); changed(); d.close(); this.detail(id, { onChange }); } catch (e) { UI.err(e); } });
    const del = el.querySelector('#delBtn'); if (del) del.onclick = async () => { if (!(await UI.confirm('Excluir esta oportunidade? Esta a\xE7\xE3o n\xE3o pode ser desfeita.', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(\`/opportunities/\${o.id}\`, { method: 'DELETE' }); UI.ok(r2.message); d.close(); changed(); } catch (err) { UI.err(err); } };
    // Edi\xE7\xE3o direta de campos comuns
    let version = o.version;
    el.querySelectorAll('[data-inline]').forEach((inp) => {
      const save = async () => {
        const name = inp.dataset.inline; let v = inp.value.trim();
        if (inp.dataset.type === 'money') v = v === '' ? 0 : Number(v.replace(/[R$\\s.]/g, '').replace(',', '.'));
        else if (inp.dataset.type === 'tags') v = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
        else if (inp.dataset.type === 'datetime') v = v ? new Date(v).toISOString() : null;
        else if (inp.dataset.type === 'int') v = v === '' ? null : Number(v);
        else if (v === '') v = null;
        if (JSON.stringify(v) === JSON.stringify(inp.dataset.orig === undefined ? null : JSON.parse(inp.dataset.orig))) return;
        try { const r2 = await api(\`/opportunities/\${o.id}\`, { method: 'PUT', body: { [name]: v, version } }); version = r2.opportunity.version; inp.dataset.orig = JSON.stringify(v); UI.ok('Campo salvo.'); changed(); }
        catch (e) { UI.err(e); if (e.status === 409) { d.close(); this.detail(id, { onChange }); } }
      };
      inp.onchange = save;
      inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.tagName !== 'TEXTAREA') { e.preventDefault(); inp.blur(); } };
    });
  },
  inline(name, label, value, canEdit, type = 'text', display) {
    if (!canEdit) return \`<dt>\${label}</dt><dd>\${display !== undefined ? display : UI.esc(value || '\u2014')}</dd>\`;
    const orig = type === 'money' ? Number(String(value || '0').replace(/\\./g, '').replace(',', '.')) : type === 'tags' ? (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []) : type === 'datetime' ? (value ? new Date(value).toISOString() : null) : (value || null);
    const inputType = type === 'date' ? 'date' : type === 'datetime' ? 'datetime-local' : 'text';
    return \`<dt>\${label}</dt><dd><input class="inline-edit" type="\${inputType}" data-inline="\${name}" data-type="\${type}" data-orig='\${UI.attr(JSON.stringify(orig))}' value="\${UI.attr(value ?? '')}" aria-label="\${label}" \${type === 'money' ? 'inputmode="decimal"' : ''}></dd>\`;
  },
  inlineSelect(name, label, options, value, canEdit, display) {
    if (!canEdit) return \`<dt>\${label}</dt><dd>\${UI.esc(display)}</dd>\`;
    const isInt = name.endsWith('_id');
    return \`<dt>\${label}</dt><dd>\${UI.select(name, options, value ?? '', \`class="inline-edit" data-inline="\${name}" data-type="\${isInt ? 'int' : 'text'}" data-orig='\${UI.attr(JSON.stringify(value ?? null))}' aria-label="\${label}"\`)}</dd>\`;
  },
  onRealtime() { if (!document.querySelector('.modal-backdrop, .drawer-backdrop') && this.el && this.el.querySelector('#board')) this.board(); },
};
`, "/js/pages/reports.js": `'use strict';
CRM.pages.reports = {
  async render(el, { query }) {
    this.el = el; this.query = query;
    const s = await CRM.settingsFull();
    const sources = s ? s.settings.contact_sources : [], channels = s ? s.settings.channels : [];
    const today = new Date(), first = new Date(today.getFullYear(), today.getMonth(), 1);
    const iso = (d) => \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
    const q = { from: query.from ?? iso(first), to: query.to ?? iso(today), assignee_id: query.assignee_id || '', source: query.source || '', channel: query.channel || '', status: query.status || '' };
    const preset = (days) => { const t = new Date(), f = new Date(); f.setDate(f.getDate() - days + 1); return \`#/relatorios?\${UI.qs({ ...q, from: iso(f), to: iso(t) })}\`; };
    el.innerHTML = CRM.pageHeader('Relat\xF3rios', 'Indicadores de atendimento e comerciais calculados a partir dos registros.', \`<button class="btn secondary" id="btnExport">\${UI.icons.download} <span class="lbl">Por respons\xE1vel (CSV)</span></button><button class="btn secondary" id="btnExportT">\${UI.icons.download} <span class="lbl">Atendimentos (CSV)</span></button>\`) +
    \`<div class="card"><div class="chips mb-s"><a class="chip" href="\${preset(1)}">Hoje</a><a class="chip" href="\${preset(7)}">7 dias</a><a class="chip" href="\${preset(30)}">30 dias</a><a class="chip" href="#/relatorios">M\xEAs atual</a><a class="chip" href="#/relatorios?from=&to=">Todo o per\xEDodo</a></div>
    <form class="filters" id="filters"><div class="field"><label>De</label><input type="date" name="from" value="\${q.from}"></div><div class="field"><label>At\xE9</label><input type="date" name="to" value="\${q.to}"></div>
      \${CRM.isManager() ? \`<div class="field"><label>Atendente</label>\${UI.select('assignee_id', UI.userOptions(CRM.users, { blank: 'Todos' }), q.assignee_id)}</div>\` : ''}
      <div class="field"><label>Origem do cliente</label>\${UI.select('source', [['', 'Todas'], ...sources.map((x) => [x, x])], q.source)}</div>
      <div class="field"><label>Canal</label>\${UI.select('channel', [['', 'Todos'], ...channels.map((x) => [x, x])], q.channel)}</div>
      <div class="field"><label>Status</label>\${UI.select('status', [['', 'Todos'], ...Object.entries(UI.STATUS).map(([k, v]) => [k, v.label])], q.status)}</div>
      <button class="btn">Aplicar</button></form></div><div id="out" class="mt"><p class="muted">Calculando\u2026</p></div>\`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); location.hash = \`#/relatorios?\${UI.qs(d)}\`; };
    const qs = UI.qs(q);
    el.querySelector('#btnExport').onclick = () => UI.download(\`/reports/export.csv?\${qs}\`);
    el.querySelector('#btnExportT').onclick = () => UI.download(\`/tickets/export.csv?from=\${q.from}&to=\${q.to}\`);
    const r = await api('/reports/summary', { query: q });
    const t = r.tickets, o = r.opportunities, out = el.querySelector('#out'), m = r.methodology;
    const period = q.from || q.to ? \`\${q.from ? 'de ' + UI.fmtDate(q.from + 'T12:00:00') : ''} \${q.to ? 'at\xE9 ' + UI.fmtDate(q.to + 'T12:00:00') : ''}\` : 'todo o per\xEDodo';
    if (!t.opened && !o.open && !o.decided) { out.innerHTML = \`<div class="card">\${UI.empty('Sem dados para o per\xEDodo selecionado', \`Nenhum atendimento ou oportunidade encontrado \${period}. Amplie o per\xEDodo ou remova filtros.\`)}</div>\`; return; }
    const kpi = (l, v, sub = '', cls = '', help = '') => \`<div class="kpi \${cls}"><div class="label">\${l}\${help ? UI.help(help) : ''}</div><div class="value">\${v}</div><div class="sub">\${sub}</div></div>\`;
    const hbars = (rows, labelKey, valueKey, fmt = (x) => x) => { if (!rows.length) return UI.empty('Sem dados', ''); const max = Math.max(...rows.map((x) => Number(x[valueKey]))) || 1; return \`<div class="hbar-list">\${rows.map((x) => \`<div class="row"><span class="trunc" title="\${UI.attr(x[labelKey])}">\${UI.esc(x[labelKey])}</span><div class="bar"><span style="width:\${Math.round((Number(x[valueKey]) / max) * 100)}%"></span></div><span class="right">\${fmt(x[valueKey])}</span></div>\`).join('')}</div>\`; };
    out.innerHTML = \`<p class="muted small">Per\xEDodo: \${period} \${UI.help(m.period)}. Atendimentos abertos no per\xEDodo: <strong>\${t.opened}</strong>.</p>
      <h3>Atendimento</h3><div class="kpi-row mb">\${kpi('Em andamento', t.open, 'situa\xE7\xE3o atual dos abertos no per\xEDodo')}\${kpi('Em espera', t.waiting, '', t.waiting ? 'warn' : '')}\${kpi('Resolvidos', t.resolved, 'encerrados no per\xEDodo', 'ok')}\${kpi('Cancelados', t.cancelled)}
        \${kpi('Tempo m\xE9dio 1\xAA resposta', UI.fmtDuration(t.avg_first_response_s), t.first_response_samples ? \`\${t.first_response_samples} amostra(s)\` : 'dados insuficientes', '', m.first_response)}\${kpi('Tempo m\xE9dio de resolu\xE7\xE3o', UI.fmtDuration(t.avg_resolution_s), t.resolved ? \`\${t.resolved} resolvido(s)\` : 'dados insuficientes', '', m.resolution)}\${kpi('Tarefas atrasadas', r.tasks.overdue, 'situa\xE7\xE3o atual', r.tasks.overdue ? 'danger' : '')}\${kpi('Aguardando cliente', t.waiting_customer)}</div>
      <div class="grid cols-2 mb"><div class="card"><h3>Por respons\xE1vel</h3>\${t.opened ? \`<div class="table-wrap"><table><thead><tr><th>Respons\xE1vel</th><th class="num">Total</th><th class="num">Abertos</th><th class="num">Resolvidos</th></tr></thead><tbody>\${r.by_assignee.map((x) => \`<tr><td>\${UI.esc(x.name)}</td><td class="num">\${x.total}</td><td class="num">\${x.open}</td><td class="num">\${x.resolved}</td></tr>\`).join('')}</tbody></table></div>\` : UI.empty('Sem dados', '')}</div>
        <div class="card"><h3>Por status</h3>\${hbars(r.by_status, 'label', 'n')}<h3 class="mt">Por canal</h3>\${hbars(r.by_channel, 'channel', 'n')}<h3 class="mt">Por origem do cliente</h3>\${hbars(r.by_source, 'source', 'n')}</div></div>
      <h3>Comercial</h3><div class="kpi-row mb">\${kpi('Oportunidades abertas', o.open, UI.fmtMoney(o.open_value))}\${kpi('Neg\xF3cios ganhos', o.won, UI.fmtMoney(o.won_value), 'ok')}\${kpi('Neg\xF3cios perdidos', o.lost, '', o.lost ? 'danger' : '')}\${kpi('Taxa de convers\xE3o', o.conversion == null ? '\u2014' : Math.round(o.conversion * 100) + '%', o.decided ? \`\${o.won} de \${o.decided} encerrados\` : 'sem neg\xF3cios encerrados no per\xEDodo', '', m.conversion)}</div>
      <div class="grid cols-2 mb"><div class="card"><h3>Por etapa</h3>\${hbars(o.by_stage, 'name', 'n')}</div><div class="card"><h3>Motivos de perda</h3>\${o.lost ? hbars(o.lost_reasons, 'reason', 'n') : UI.empty('Nenhuma perda registrada', '')}</div></div>
      <details class="card"><summary>Como os indicadores s\xE3o calculados</summary><ul class="small mt-s">\${Object.values(m).map((x) => \`<li>\${UI.esc(x)}</li>\`).join('')}</ul></details>\`;
  },
};
`, "/js/pages/settings.js": `'use strict';
CRM.pages.settings = {
  async render(el, { sub }) {
    this.el = el;
    CRM.invalidateSettings();
    const r = await api('/settings'); this.data = r;
    const tabs = [['empresa', 'Empresa'], ['usuarios', 'Usu\xE1rios'], ['funil', 'Funis'], ['canais', 'Canais e origens'], ['respostas', 'Respostas r\xE1pidas'], ['automacoes', 'Automa\xE7\xF5es'], ['integracoes', 'Integra\xE7\xF5es'], ['backup', 'Backup'], ['auditoria', 'Auditoria']];
    const allowed = CRM.isAdmin() ? tabs.map(([k]) => k) : CRM.user.role === 'supervisor' ? ['funil', 'respostas', 'automacoes', 'integracoes', 'auditoria'] : ['funil', 'respostas', 'integracoes'];
    const visible = tabs.filter(([k]) => allowed.includes(k));
    this.tab = sub && visible.some(([k]) => k === sub) ? sub : visible[0][0];
    el.innerHTML = CRM.pageHeader('Configura\xE7\xF5es', CRM.isAdmin() ? 'Identidade visual, equipe, funis, respostas r\xE1pidas, automa\xE7\xF5es e integra\xE7\xF5es.' : 'Consulta de configura\xE7\xF5es. Altera\xE7\xF5es estruturais exigem perfil de administrador.') +
      \`<div class="tabs">\${visible.map(([k, l]) => \`<button data-tab="\${k}" class="\${this.tab === k ? 'active' : ''}">\${l}</button>\`).join('')}</div><div id="tabBody"></div>\`;
    el.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) location.hash = \`#/configuracoes/\${b.dataset.tab}\`; };
    this[this.tab](el.querySelector('#tabBody'));
  },

  empresa(box) {
    const s = this.data.settings;
    box.innerHTML = \`<div class="card"><form id="coForm"><div class="grid" style="grid-template-columns: 1fr 260px">
      <div>\${UI.field('name', 'Nome da empresa', UI.input('name', s.name, 'required'), { required: true })}
        <div class="form-row">\${UI.field('primary_color', 'Cor principal (a\xE7\xF5es)', \`<div class="flex"><input type="color" class="color-swatch" id="pc" value="\${s.primary_color}" aria-label="Escolher cor"><input name="primary_color" value="\${s.primary_color}" pattern="^#[0-9a-fA-F]{6}$"></div>\`, { hint: 'Bot\xF5es e destaques. A estrutura usa azul-marinho e cinzas neutros.' })}\${UI.field('accent_color', 'Cor secund\xE1ria', \`<div class="flex"><input type="color" class="color-swatch" id="ac" value="\${s.accent_color}" aria-label="Escolher cor"><input name="accent_color" value="\${s.accent_color}" pattern="^#[0-9a-fA-F]{6}$"></div>\`)}</div>
        <div class="form-row cols-3">\${UI.field('timezone', 'Fuso hor\xE1rio', UI.input('timezone', s.timezone), { hint: 'Ex.: America/Sao_Paulo' })}
          \${UI.field('response_sla_minutes', 'Prazo de resposta (min)', UI.input('response_sla_minutes', s.response_sla_minutes, 'type="number" min="1" max="10080"'), { hint: 'Tempo para responder ao cliente antes de contar como vencido.' })}
          \${UI.field('idle_opportunity_days', 'Oportunidade parada (dias)', UI.input('idle_opportunity_days', s.idle_opportunity_days, 'type="number" min="1" max="365"'), { hint: 'Sem atualiza\xE7\xE3o por este per\xEDodo \xE9 sinalizada no painel.' })}</div>
        <label class="check"><input type="checkbox" name="auto_distribution" \${s.auto_distribution ? 'checked' : ''}> Distribui\xE7\xE3o autom\xE1tica em rod\xEDzio ao abrir atendimentos sem respons\xE1vel</label>
        <label class="check mt-s"><input type="checkbox" name="demo_mode" \${s.demo_mode ? 'checked' : ''}> Modo de demonstra\xE7\xE3o (indicador discreto de dados fict\xEDcios)</label></div>
      <div><label>Logotipo</label><img class="logo-preview" id="logoPrev" src="\${UI.attr(s.logo_data || '')}" alt="" \${s.logo_data ? '' : 'hidden'}><div class="field mt-s"><input type="file" id="logoFile" accept="image/png,image/jpeg,image/svg+xml,image/webp"><div class="hint">PNG, JPEG, WEBP ou SVG, at\xE9 300KB.</div></div><button type="button" class="btn ghost sm" id="logoClear">Remover logotipo</button></div></div>
      <div class="right mt"><button class="btn">Salvar</button></div></form></div>\`;
    const form = box.querySelector('#coForm'); let logo;
    box.querySelector('#pc').oninput = (e) => form.primary_color.value = e.target.value; box.querySelector('#ac').oninput = (e) => form.accent_color.value = e.target.value;
    box.querySelector('#logoFile').onchange = (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 300 * 1024) { UI.toast('Arquivo maior que 300KB.', 'error'); e.target.value = ''; return; } const rd = new FileReader(); rd.onload = () => { logo = rd.result; const p = box.querySelector('#logoPrev'); p.src = logo; p.hidden = false; }; rd.readAsDataURL(f); };
    box.querySelector('#logoClear').onclick = () => { logo = null; box.querySelector('#logoPrev').hidden = true; };
    form.onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(form); if (logo !== undefined) d.logo_data = logo; d.response_sla_minutes = Number(d.response_sla_minutes); d.idle_opportunity_days = Number(d.idle_opportunity_days);
      try { const r = await api('/settings', { method: 'PUT', body: d }); UI.ok(r.message); CRM.settings = r.settings; location.reload(); } catch (err) { UI.showErrors(form, err); } };
  },

  async usuarios(box) {
    const r = await api('/users', { query: { include_inactive: 'true' } });
    box.innerHTML = \`<div class="card"><div class="card-title"><h3>Equipe (\${r.users.filter((u) => u.active).length} ativos)</h3><button class="btn" id="newUser">\${UI.icons.userPlus} Novo usu\xE1rio</button></div>
      <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Equipe</th><th>Situa\xE7\xE3o</th><th>Dispon\xEDvel</th><th>\xDAltimo acesso</th><th></th></tr></thead><tbody>
      \${r.users.map((u) => \`<tr><td class="nowrap"><strong>\${UI.esc(u.name)}</strong></td><td class="small">\${UI.esc(u.email)}</td><td><span class="badge \${u.role === 'admin' ? 'dark' : u.role === 'supervisor' ? 'purple' : 'primary'}">\${UI.ROLE[u.role]}</span></td><td class="small">\${UI.esc(u.team || '\u2014')}</td><td>\${u.active ? '<span class="badge success">Ativo</span>' : '<span class="badge">Desativado</span>'}</td><td class="small">\${u.role === 'atendente' ? (u.available ? 'Sim' : 'N\xE3o') : '\u2014'}</td><td class="small nowrap">\${UI.fmtDateTime(u.last_login_at)}</td>
        <td class="nowrap"><button class="btn sm secondary" data-edit="\${u.id}">Editar</button> <button class="btn sm secondary" data-link="\${u.id}" title="Gerar link de redefini\xE7\xE3o de senha">Senha</button> \${u.active ? \`<button class="btn sm danger secondary" data-deact="\${u.id}" \${u.id === CRM.user.id ? 'disabled' : ''}>Desativar</button>\` : \`<button class="btn sm success" data-act="\${u.id}">Reativar</button>\`}</td></tr>\`).join('')}</tbody></table></div>
      <p class="muted small mt-s">Desativar um usu\xE1rio preserva todo o hist\xF3rico e exige a transfer\xEAncia das pend\xEAncias (atendimentos, tarefas e oportunidades abertas) para outro respons\xE1vel. A equipe \xE9 usada por automa\xE7\xF5es e distribui\xE7\xE3o.</p></div>\`;
    box.querySelector('#newUser').onclick = () => this.userForm(null, () => this.usuarios(box));
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.userForm(r.users.find((u) => u.id === Number(b.dataset.edit)), () => this.usuarios(box)));
    box.querySelectorAll('[data-act]').forEach((b) => b.onclick = async () => { try { const x = await api(\`/users/\${b.dataset.act}/activate\`, { method: 'POST' }); UI.ok(x.message); await CRM.loadUsers(); this.usuarios(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-link]').forEach((b) => b.onclick = async () => { try { const x = await api(\`/users/\${b.dataset.link}/reset-link\`, { method: 'POST' }); UI.modal({ title: 'Link de redefini\xE7\xE3o de senha', size: 'narrow', body: \`<p class="small">\${UI.esc(x.message)} Envie ao usu\xE1rio por um canal seguro:</p><input readonly value="\${UI.attr(x.link)}" data-select-all>\`, footer: '<button class="btn" data-close>Fechar</button>' }); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-deact]').forEach((b) => b.onclick = () => this.deactivate(r.users.find((u) => u.id === Number(b.dataset.deact)), r.users, () => this.usuarios(box)));
  },
  userForm(u, done) {
    const isEdit = Boolean(u);
    const m = UI.modal({ title: isEdit ? 'Editar usu\xE1rio' : 'Novo usu\xE1rio', body: \`<form id="uForm"><div class="form-row">\${UI.field('name', 'Nome', UI.input('name', u?.name, 'required'), { required: true })}\${UI.field('email', 'E-mail', UI.input('email', u?.email, 'type="email" required'), { required: true })}</div>
      <div class="form-row cols-3">\${UI.field('role', 'Perfil', UI.select('role', Object.entries(UI.ROLE), u?.role || 'atendente'), { required: true })}\${UI.field('team', 'Equipe', UI.input('team', u?.team, 'data-type="nullable" placeholder="ex.: Comercial"'))}\${UI.field('password', isEdit ? 'Nova senha' : 'Senha inicial', UI.input('password', '', \`type="password" minlength="8" \${isEdit ? '' : 'required'} autocomplete="new-password"\`), { required: !isEdit, hint: isEdit ? 'Em branco mant\xE9m a atual.' : 'M\xEDnimo de 8 caracteres.' })}</div>
      <label class="check"><input type="checkbox" name="available" \${u ? (u.available ? 'checked' : '') : 'checked'}> Dispon\xEDvel para distribui\xE7\xE3o autom\xE1tica (atendentes)</label>
      <div class="help mt"><strong>Administrador:</strong> configura o sistema e gerencia usu\xE1rios. <strong>Supervisor:</strong> acompanha a equipe, indicadores, automa\xE7\xF5es e redistribui atendimentos. <strong>Atendente:</strong> acessa seus clientes e atendimentos e a fila compartilhada.</div></form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="uForm">\${isEdit ? 'Salvar' : 'Criar usu\xE1rio'}</button>\` });
    m.el.querySelector('#uForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target); if (!d.password) delete d.password;
      try { const r = isEdit ? await api(\`/users/\${u.id}\`, { method: 'PUT', body: d }) : await api('/users', { method: 'POST', body: d }); UI.ok(r.message); m.close(); await CRM.loadUsers(); done(); } catch (err) { UI.showErrors(e.target, err); } };
  },
  deactivate(u, users, done) {
    const others = users.filter((x) => x.active && x.id !== u.id);
    const m = UI.modal({ title: \`Desativar \${u.name}\`, size: 'narrow', body: \`<form id="dForm"><p class="small">O usu\xE1rio perder\xE1 o acesso imediatamente. O hist\xF3rico \xE9 preservado. As pend\xEAncias (atendimentos abertos, tarefas, oportunidades e clientes sob responsabilidade) ser\xE3o transferidas para:</p>
      \${UI.field('transfer_to', 'Transferir pend\xEAncias para', UI.select('transfer_to', [['', '\u2014 N\xE3o transferir (s\xF3 permitido sem pend\xEAncias) \u2014'], ...others.map((x) => [x.id, \`\${x.name} (\${UI.ROLE[x.role]})\`])], '', 'data-type="int"'))}<div id="dErr"></div></form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn danger" type="submit" form="dForm">Desativar</button>\` });
    m.el.querySelector('#dForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target);
      try { const r = await api(\`/users/\${u.id}/deactivate\`, { method: 'POST', body: { transfer_to: d.transfer_to || null } }); UI.ok(\`\${r.message} Transferidos: \${r.transferred.tickets} atendimento(s), \${r.transferred.tasks} tarefa(s), \${r.transferred.opportunities} oportunidade(s), \${r.transferred.customers} cliente(s).\`); m.close(); await CRM.loadUsers(); done(); }
      catch (err) { if (err.status === 409 && err.data.pending) { const p = err.data.pending; m.el.querySelector('#dErr').innerHTML = \`<div class="alert warning"><span>\${UI.esc(err.message)} Pend\xEAncias: \${p.tickets} atendimento(s), \${p.tasks} tarefa(s), \${p.opportunities} oportunidade(s), \${p.customers} cliente(s).</span></div>\`; } else UI.showErrors(e.target, err); } };
  },

  async funil(box) {
    const ro = !CRM.isAdmin();
    const r = await api('/settings/pipelines');
    this.pipelines = r.pipelines;
    const cur = this.pipelineEdit && r.pipelines.some((p) => p.id === this.pipelineEdit) ? this.pipelineEdit : (r.pipelines.find((p) => p.is_default) || r.pipelines[0]).id;
    this.pipelineEdit = cur;
    const p = r.pipelines.find((x) => x.id === cur);
    const stages = p.stages.filter((s) => s.active);
    const row = (s = { name: '', kind: 'open', color: null }) => \`<tr data-id="\${s.id || ''}"><td><input name="name" value="\${UI.attr(s.name)}" required \${ro ? 'readonly' : ''} aria-label="Nome da etapa"></td><td>\${UI.select('kind', [['open', 'Aberta'], ['won', 'Ganho'], ['lost', 'Perdido']], s.kind, ro ? 'disabled' : '')}</td><td><input type="color" name="color" value="\${UI.attr(s.color || '#94a3b8')}" class="color-swatch" \${ro ? 'disabled' : ''} aria-label="Cor"></td><td class="nowrap">\${ro ? '' : \`<button type="button" class="icon-btn" data-up aria-label="Subir">\${UI.icons.arrowUp}</button><button type="button" class="icon-btn" data-down aria-label="Descer">\${UI.icons.arrowDown}</button><button type="button" class="icon-btn" data-rm title="Remover" aria-label="Remover">\${UI.icons.trash}</button>\`}</td></tr>\`;
    box.innerHTML = \`<div class="grid" style="grid-template-columns: 280px 1fr"><div class="card"><div class="card-title"><h3>Funis</h3>\${ro ? '' : \`<button class="btn sm secondary" id="addPipe">\${UI.icons.plus} Novo</button>\`}</div>
        \${r.pipelines.map((x) => \`<div class="task-row" style="cursor:pointer" data-pipe="\${x.id}"><span class="dot \${x.id === cur ? 'on' : x.active ? '' : 'danger'}"></span><div><div class="t">\${UI.esc(x.name)}\${x.is_default ? ' <span class="badge outline">padr\xE3o</span>' : ''}\${!x.active ? ' <span class="badge">inativo</span>' : ''}</div><div class="s">\${x.stages.filter((s) => s.active).length} etapas</div></div></div>\`).join('')}
        <p class="muted xs mt-s">Cada funil tem suas pr\xF3prias etapas. Oportunidades ficam no funil escolhido ao cri\xE1-las.</p></div>
      <div class="card"><div class="card-title"><h3>Etapas de "\${UI.esc(p.name)}"</h3>\${ro ? '' : \`<div class="flex"><button class="btn sm secondary" id="renamePipe">Renomear</button>\${p.is_default ? '' : \`<button class="btn sm secondary" id="defaultPipe">Tornar padr\xE3o</button>\`}\${p.active ? \`<button class="btn sm danger secondary" id="deactPipe" \${p.is_default ? 'disabled' : ''}>Desativar</button>\` : \`<button class="btn sm success" id="actPipe">Reativar</button>\`}</div>\`}</div>
        <p class="muted small">Ordene as etapas; \xE9 obrigat\xF3rio ter exatamente uma etapa "Ganho" e uma "Perdido". Etapas removidas que j\xE1 possuem oportunidades ficam apenas ocultas.</p>
        <form id="stForm"><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Cor</th><th></th></tr></thead><tbody id="stBody">\${stages.map(row).join('')}</tbody></table></div>
        \${ro ? '' : \`<div class="flex between mt"><button type="button" class="btn secondary sm" id="addSt">\${UI.icons.plus} Adicionar etapa</button><button class="btn">Salvar etapas</button></div>\`}</form></div></div>\`;
    box.querySelectorAll('[data-pipe]').forEach((d) => d.onclick = () => { this.pipelineEdit = Number(d.dataset.pipe); this.funil(box); });
    if (ro) return;
    const body = box.querySelector('#stBody');
    box.querySelector('#addSt').onclick = () => body.insertAdjacentHTML('beforeend', row());
    body.onclick = (e) => { const tr = e.target.closest('tr'); if (!tr) return; if (e.target.closest('[data-rm]')) tr.remove(); if (e.target.closest('[data-up]') && tr.previousElementSibling) tr.previousElementSibling.before(tr); if (e.target.closest('[data-down]') && tr.nextElementSibling) tr.nextElementSibling.after(tr); };
    box.querySelector('#stForm').onsubmit = async (e) => { e.preventDefault(); const list = [...body.querySelectorAll('tr')].map((tr) => ({ id: tr.dataset.id ? Number(tr.dataset.id) : undefined, name: tr.querySelector('[name=name]').value.trim(), kind: tr.querySelector('[name=kind]').value, color: tr.querySelector('[name=color]').value }));
      try { const x = await api('/settings/stages', { method: 'PUT', body: { pipeline_id: cur, stages: list } }); UI.ok(x.message); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    box.querySelector('#addPipe').onclick = async () => { const name = await UI.prompt('Nome do novo funil', { title: 'Novo funil', placeholder: 'ex.: P\xF3s-venda' }); if (!name) return; try { const x = await api('/settings/pipelines', { method: 'POST', body: { name } }); UI.ok(x.message); this.pipelineEdit = x.pipeline.id; CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    box.querySelector('#renamePipe').onclick = async () => { const name = await UI.prompt('Novo nome', { title: 'Renomear funil', value: p.name }); if (!name) return; try { await api(\`/settings/pipelines/\${cur}\`, { method: 'PUT', body: { name } }); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    const dp = box.querySelector('#defaultPipe'); if (dp) dp.onclick = async () => { try { await api(\`/settings/pipelines/\${cur}\`, { method: 'PUT', body: { is_default: true } }); UI.ok('Funil padr\xE3o atualizado.'); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    const de = box.querySelector('#deactPipe'); if (de) de.onclick = async () => { if (!(await UI.confirm('Desativar este funil? As oportunidades existentes continuam acess\xEDveis pela ficha do cliente.', { danger: true, okLabel: 'Desativar' }))) return; try { await api(\`/settings/pipelines/\${cur}\`, { method: 'PUT', body: { active: false } }); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    const ac = box.querySelector('#actPipe'); if (ac) ac.onclick = async () => { try { await api(\`/settings/pipelines/\${cur}\`, { method: 'PUT', body: { active: true } }); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
  },

  canais(box) {
    const s = this.data.settings;
    box.innerHTML = \`<div class="grid cols-2"><div class="card"><h3>Canais de atendimento</h3><form id="chForm">\${UI.field('channels', 'Um por linha', UI.textarea('channels', s.channels.join('\\n'), 'rows="8" data-type="lines"'))}<button class="btn">Salvar canais</button></form></div>
      <div class="card"><h3>Origens de contato</h3><form id="srForm">\${UI.field('contact_sources', 'Um por linha', UI.textarea('contact_sources', s.contact_sources.join('\\n'), 'rows="8" data-type="lines"'))}<button class="btn">Salvar origens</button></form></div></div>\`;
    const save = (form, key) => async (e) => { e.preventDefault(); const d = UI.formData(form); try { const r = await api('/settings', { method: 'PUT', body: { [key]: d[key] } }); UI.ok(r.message); this.data.settings = r.settings; CRM.invalidateSettings(); } catch (err) { UI.showErrors(form, err); } };
    const ch = box.querySelector('#chForm'), sr = box.querySelector('#srForm'); ch.onsubmit = save(ch, 'channels'); sr.onsubmit = save(sr, 'contact_sources');
  },

  async respostas(box) {
    const canEdit = CRM.isManager();
    const r = await api('/quick-replies', { query: { all: 'true' } });
    box.innerHTML = \`<div class="card"><div class="card-title"><h3>Respostas r\xE1pidas (\${r.quick_replies.length})</h3>\${canEdit ? \`<button class="btn" id="newQr">\${UI.icons.plus} Nova resposta</button>\` : ''}</div>
      <p class="muted small">Na conversa, digite <span class="mono">/</span> seguido do atalho ou use o bot\xE3o "Respostas r\xE1pidas". Vari\xE1veis: <span class="mono">{nome}</span> (primeiro nome do cliente), <span class="mono">{atendente}</span>, <span class="mono">{protocolo}</span>.</p>
      \${r.quick_replies.length ? \`<div class="table-wrap"><table><thead><tr><th>T\xEDtulo</th><th>Atalho</th><th>Texto</th><th>Situa\xE7\xE3o</th>\${canEdit ? '<th></th>' : ''}</tr></thead><tbody>\${r.quick_replies.map((q) => \`<tr><td class="nowrap"><strong>\${UI.esc(q.title)}</strong></td><td class="mono">\${q.shortcut ? '/' + UI.esc(q.shortcut) : ''}</td><td><span class="trunc" style="max-width:420px" title="\${UI.attr(q.body)}">\${UI.esc(q.body)}</span></td><td>\${q.active ? '<span class="badge success">Ativa</span>' : '<span class="badge">Inativa</span>'}</td>\${canEdit ? \`<td class="nowrap"><button class="btn sm secondary" data-edit="\${q.id}">Editar</button> <button class="btn sm secondary" data-toggle="\${q.id}" data-active="\${q.active}">\${q.active ? 'Desativar' : 'Ativar'}</button> <button class="icon-btn" data-del="\${q.id}" aria-label="Excluir">\${UI.icons.trash}</button></td>\` : ''}</tr>\`).join('')}</tbody></table></div>\` : UI.empty('Nenhuma resposta r\xE1pida', 'Cadastre textos padr\xE3o para acelerar as respostas.')}</div>\`;
    if (!canEdit) return;
    const form = (q) => {
      const isEdit = Boolean(q);
      const m = UI.modal({ title: isEdit ? 'Editar resposta r\xE1pida' : 'Nova resposta r\xE1pida', body: \`<form id="qrForm"><div class="form-row">\${UI.field('title', 'T\xEDtulo', UI.input('title', q?.title, 'required'), { required: true })}\${UI.field('shortcut', 'Atalho', UI.input('shortcut', q?.shortcut, 'data-type="nullable" placeholder="ex.: ola"'), { hint: 'Digite /atalho na conversa.' })}</div>\${UI.field('body', 'Texto', UI.textarea('body', q?.body, 'required rows="5" placeholder="Ol\xE1 {nome}, aqui \xE9 {atendente}\u2026"'), { required: true })}<label class="check"><input type="checkbox" name="active" \${!q || q.active ? 'checked' : ''}> Ativa</label></form>\`,
        footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="qrForm">Salvar</button>\` });
      m.el.querySelector('#qrForm').onsubmit = async (e) => { e.preventDefault(); try { const x = isEdit ? await api(\`/quick-replies/\${q.id}\`, { method: 'PUT', body: UI.formData(e.target) }) : await api('/quick-replies', { method: 'POST', body: UI.formData(e.target) }); UI.ok(x.message); m.close(); CRM.invalidateSettings(); this.respostas(box); } catch (err) { UI.showErrors(e.target, err); } };
    };
    box.querySelector('#newQr').onclick = () => form(null);
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => form(r.quick_replies.find((q) => q.id === Number(b.dataset.edit))));
    box.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = async () => { try { await api(\`/quick-replies/\${b.dataset.toggle}\`, { method: 'PUT', body: { active: b.dataset.active !== 'true' } }); CRM.invalidateSettings(); this.respostas(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await UI.confirm('Excluir esta resposta r\xE1pida?', { danger: true, okLabel: 'Excluir' }))) return; try { await api(\`/quick-replies/\${b.dataset.del}\`, { method: 'DELETE' }); CRM.invalidateSettings(); this.respostas(box); } catch (err) { UI.err(err); } });
  },

  async automacoes(box) {
    const [meta, r, runs] = await Promise.all([api('/automations/meta'), api('/automations'), api('/automations/runs', { query: { limit: 60 } })]);
    this.autoMeta = meta;
    const T = meta.triggers, A = meta.actions;
    const condText = (rule) => { const c = rule.conditions || {}; const parts = []; if (c.channel) parts.push(\`canal = \${c.channel}\`); if (c.priority) parts.push(\`prioridade = \${c.priority}\`); if (c.minutes) parts.push(\`ap\xF3s \${c.minutes} min\`); if (c.days) parts.push(\`ap\xF3s \${c.days} dias\`); if (c.stage_id) { const st = this.data.stages.find((s) => s.id === Number(c.stage_id)); parts.push(\`etapa = \${st ? st.name : c.stage_id}\`); } if (c.pipeline_id) { const p = this.data.pipelines.find((x) => x.id === Number(c.pipeline_id)); parts.push(\`funil = \${p ? p.name : c.pipeline_id}\`); } if (rule.team) parts.push(\`equipe = \${rule.team}\`); return parts.length ? parts.join(', ') : 'sem condi\xE7\xE3o'; };
    const actText = (rule) => { const p = rule.action_params || {}; switch (rule.action) { case 'create_task': return \`tarefa "\${p.title}" em \${p.due_in_days || 1} dia(s)\`; case 'notify': return \`notificar \${p.to === 'supervisors' ? 'supervisores' : p.to === 'owner' ? 'respons\xE1vel' : p.to === 'admins' ? 'administradores' : CRM.userName(Number(p.to)) || p.to}\`; case 'set_priority': return \`prioridade \u2192 \${p.priority}\`; case 'add_tag': return \`etiqueta "\${p.tag}"\`; case 'send_message': return \`enviar "\${(p.body || '').slice(0, 40)}\u2026"\`; default: return A[rule.action]?.label || rule.action; } };
    box.innerHTML = \`<div class="grid" style="grid-template-columns: 1fr 380px">
      <div class="card"><div class="card-title"><h3>Regras (\${r.rules.length})</h3><div class="flex"><button class="btn secondary sm" id="runNow" title="Executa agora as verifica\xE7\xF5es agendadas (prazos vencidos, oportunidades paradas)">\${UI.icons.play} Verificar agora</button><button class="btn" id="newRule">\${UI.icons.plus} Nova regra</button></div></div>
        <p class="muted small">Cada regra tem gatilho \u2192 condi\xE7\xE3o \u2192 a\xE7\xE3o. As verifica\xE7\xF5es agendadas rodam a cada minuto no servidor. Tarefas duplicadas s\xE3o evitadas e acompanhamentos s\xE3o encerrados quando o cliente responde ou a negocia\xE7\xE3o \xE9 fechada.\${meta.whatsapp_connected ? '' : ' Mensagens autom\xE1ticas exigem o WhatsApp conectado.'}</p>
        \${r.rules.length ? r.rules.map((rule) => \`<div class="rule-card"><div class="flex between"><div><strong>\${UI.esc(rule.name)}</strong> \${rule.active ? '<span class="badge success">ativa</span>' : '<span class="badge">pausada</span>'}</div>
            <div class="flex"><button class="btn xs secondary" data-toggle="\${rule.id}" data-active="\${rule.active}">\${rule.active ? \`\${UI.icons.pause} Pausar\` : \`\${UI.icons.play} Ativar\`}</button><button class="btn xs secondary" data-edit="\${rule.id}">Editar</button><button class="icon-btn" data-del="\${rule.id}" aria-label="Excluir">\${UI.icons.trash}</button></div></div>
          <div class="flow"><span class="step">\${UI.icons.zap} \${UI.esc(T[rule.trigger]?.label || rule.trigger)}</span>\${UI.icons.arrowRight}<span class="step">\${UI.esc(condText(rule))}</span>\${UI.icons.arrowRight}<span class="step">\${UI.esc(actText(rule))}</span></div>
          <div class="xs muted mt-s">\${rule.runs_count} execu\xE7\xE3o(\xF5es) no total \xB7 \${rule.runs_7d} nos \xFAltimos 7 dias\${rule.failures_7d ? \` \xB7 <span class="text-danger">\${rule.failures_7d} falha(s)</span>\` : ''}\${rule.last_run_at ? \` \xB7 \xFAltima \${UI.relative(rule.last_run_at)}\` : ''}</div></div>\`).join('') : UI.empty('Nenhuma regra', 'Crie a primeira regra ou use um dos modelos sugeridos.')}
        <h4 class="mt">Modelos sugeridos</h4><div class="chips">\${this.ruleTemplates().map((t, i) => \`<button type="button" class="chip" data-tpl="\${i}">\${UI.icons.plus} \${UI.esc(t.name)}</button>\`).join('')}</div></div>
      <div class="card flush"><div class="card-title"><h3>Hist\xF3rico de execu\xE7\xE3o</h3></div>\${runs.runs.length ? \`<div style="max-height:70vh;overflow:auto">\${runs.runs.map((x) => \`<div class="task-row"><span class="dot \${x.status === 'executada' ? 'on' : x.status === 'falhou' ? 'danger' : 'off'}" title="\${x.status}"></span><div><div class="t">\${UI.esc(x.rule_name)} <span class="muted">\xB7 \${x.entity === 'ticket' ? \`<a href="#/atendimentos/\${x.entity_id}" class="mono">\${UI.esc(x.entity_label || x.entity_id)}</a>\` : \`<a href="#/funil/\${x.entity_id}">\${UI.esc(x.entity_label || x.entity_id)}</a>\`}</span></div><div class="s">\${x.status} \xB7 \${UI.esc(x.details || '')} \xB7 \${UI.fmtDateTime(x.created_at)}</div></div></div>\`).join('')}</div>\` : UI.empty('Nenhuma execu\xE7\xE3o ainda', '')}</div></div>\`;
    box.querySelector('#newRule').onclick = () => this.ruleForm(null, () => this.automacoes(box));
    box.querySelector('#runNow').onclick = async () => { try { const x = await api('/automations/run-scheduled', { method: 'POST' }); UI.ok(x.message); this.automacoes(box); } catch (err) { UI.err(err); } };
    box.querySelectorAll('[data-tpl]').forEach((b) => b.onclick = () => this.ruleForm(this.ruleTemplates()[Number(b.dataset.tpl)], () => this.automacoes(box), true));
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.ruleForm(r.rules.find((x) => x.id === Number(b.dataset.edit)), () => this.automacoes(box)));
    box.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = async () => { try { const x = await api(\`/automations/\${b.dataset.toggle}\`, { method: 'PUT', body: { active: b.dataset.active !== 'true' } }); UI.ok(x.message); this.automacoes(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await UI.confirm('Excluir esta regra e seu hist\xF3rico?', { danger: true, okLabel: 'Excluir' }))) return; try { await api(\`/automations/\${b.dataset.del}\`, { method: 'DELETE' }); this.automacoes(box); } catch (err) { UI.err(err); } });
  },
  ruleTemplates() {
    const proposal = (this.data.stages || []).find((s) => /proposta/i.test(s.name) && s.active);
    return [
      { name: 'Tarefa ap\xF3s proposta enviada', trigger: 'opportunity_stage_changed', conditions: { stage_id: proposal ? proposal.id : '' }, action: 'create_task', action_params: { title: 'Acompanhar proposta de {cliente}', due_in_days: 2, priority: 'alta', assignee: 'owner' } },
      { name: 'Alerta de oportunidade parada', trigger: 'opportunity_idle', conditions: { days: 7 }, action: 'notify', action_params: { to: 'owner', title: 'Oportunidade parada', body: '{oportunidade} de {cliente} est\xE1 sem movimenta\xE7\xE3o h\xE1 mais de 7 dias.' } },
      { name: 'Distribuir novos atendimentos', trigger: 'ticket_created', conditions: {}, action: 'distribute', action_params: {} },
      { name: 'Avisar supervisor de prazo vencido', trigger: 'ticket_response_overdue', conditions: { minutes: '' }, action: 'notify', action_params: { to: 'supervisors', title: 'Prazo de resposta vencido', body: '{protocolo} \u2014 {cliente} aguarda resposta h\xE1 mais tempo que o prazo.' } },
      { name: 'Retorno vencido vira urgente', trigger: 'ticket_follow_up_overdue', conditions: { minutes: 60 }, action: 'set_priority', action_params: { priority: 'urgente' } },
    ];
  },
  ruleForm(rule, done, isTemplate = false) {
    const meta = this.autoMeta; const T = meta.triggers, A = meta.actions;
    const isEdit = Boolean(rule && rule.id && !isTemplate);
    const r = rule || { name: '', trigger: 'ticket_created', conditions: {}, action: 'notify', action_params: {}, team: '', active: true };
    const stages = this.data.stages.filter((s) => s.active), pipelines = this.data.pipelines.filter((p) => p.active);
    const teams = [...new Set(CRM.users.map((u) => u.team).filter(Boolean))];
    const m = UI.modal({ title: isEdit ? 'Editar regra' : 'Nova regra de automa\xE7\xE3o', body: \`<form id="ruleForm">
      \${UI.field('name', 'Nome', UI.input('name', r.name, 'required'), { required: true })}
      <div class="form-row">\${UI.field('trigger', 'Gatilho (quando)', UI.select('trigger', Object.entries(T).map(([k, v]) => [k, v.label]), r.trigger, 'id="trigSel"'), { required: true })}\${UI.field('action', 'A\xE7\xE3o (ent\xE3o)', UI.select('action', Object.entries(A).filter(([k]) => k !== 'send_message' || meta.whatsapp_connected).map(([k, v]) => [k, v.label]), r.action, 'id="actSel"'), { required: true })}</div>
      <h4>Condi\xE7\xF5es (se)</h4><div class="form-row cols-3" id="condBox"></div>
      <h4>Par\xE2metros da a\xE7\xE3o</h4><div class="form-row" id="paramBox"></div>
      <div class="form-row">\${UI.field('team', 'Aplicar \xE0 equipe', UI.select('team', [['', 'Todas'], ...teams.map((t) => [t, t])], r.team || ''), { hint: 'Considera a equipe do respons\xE1vel; na distribui\xE7\xE3o, escolhe atendentes da equipe.' })}<div class="field"><label>&nbsp;</label><label class="check"><input type="checkbox" name="active" \${r.active !== false ? 'checked' : ''}> Regra ativa</label></div></div></form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="ruleForm">\${isEdit ? 'Salvar' : 'Criar regra'}</button>\` });
    const form = m.el.querySelector('#ruleForm');
    const renderCond = () => {
      const t = T[form.trigger.value]; const c = r.conditions || {}; const box = form.querySelector('#condBox'); const parts = [];
      if (t.conditions.includes('channel')) parts.push(UI.field('c_channel', 'Canal', UI.select('c_channel', [['', 'Qualquer'], ...this.data.settings.channels.map((x) => [x, x])], c.channel || '')));
      if (t.conditions.includes('priority')) parts.push(UI.field('c_priority', 'Prioridade', UI.select('c_priority', [['', 'Qualquer'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], c.priority || '')));
      if (t.conditions.includes('minutes')) parts.push(UI.field('c_minutes', 'Minutos', UI.input('c_minutes', c.minutes ?? '', 'type="number" min="0" placeholder="padr\xE3o: prazo configurado"'), { hint: form.trigger.value === 'ticket_follow_up_overdue' ? 'Toler\xE2ncia ap\xF3s o hor\xE1rio do retorno.' : 'Em branco usa o prazo de resposta da empresa.' }));
      if (t.conditions.includes('days')) parts.push(UI.field('c_days', 'Dias parada', UI.input('c_days', c.days ?? '', 'type="number" min="1" placeholder="padr\xE3o: configura\xE7\xE3o"')));
      if (t.conditions.includes('stage_id')) parts.push(UI.field('c_stage_id', 'Etapa de destino', UI.select('c_stage_id', [['', 'Qualquer'], ...stages.map((s) => [s.id, \`\${s.name} (\${pipelines.find((p) => p.id === s.pipeline_id)?.name || ''})\`])], c.stage_id || '')));
      if (t.conditions.includes('pipeline_id')) parts.push(UI.field('c_pipeline_id', 'Funil', UI.select('c_pipeline_id', [['', 'Qualquer'], ...pipelines.map((p) => [p.id, p.name])], c.pipeline_id || '')));
      box.innerHTML = parts.join('') || '<p class="muted small">Sem condi\xE7\xF5es adicionais para este gatilho.</p>';
    };
    const renderParams = () => {
      const a = form.action.value; const p = r.action_params || {}; const box = form.querySelector('#paramBox'); const parts = [];
      if (a === 'create_task') parts.push(UI.field('p_title', 'T\xEDtulo da tarefa', UI.input('p_title', p.title || '', 'required placeholder="ex.: Acompanhar proposta de {cliente}"'), { required: true, hint: 'Vari\xE1veis: {cliente}, {protocolo}, {oportunidade}, {etapa}.' }), UI.field('p_due_in_days', 'Prazo (dias)', UI.input('p_due_in_days', p.due_in_days ?? 1, 'type="number" min="0"')), UI.field('p_priority', 'Prioridade', UI.select('p_priority', [['baixa', 'Baixa'], ['normal', 'Normal'], ['alta', 'Alta']], p.priority || 'normal')), UI.field('p_assignee', 'Respons\xE1vel', UI.select('p_assignee', [['owner', 'Respons\xE1vel do registro'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], p.assignee || 'owner')));
      if (a === 'notify') parts.push(UI.field('p_to', 'Notificar', UI.select('p_to', [['owner', 'Respons\xE1vel do registro'], ['supervisors', 'Supervisores e administradores'], ['admins', 'Administradores'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], p.to || 'owner')), UI.field('p_title', 'T\xEDtulo', UI.input('p_title', p.title || '', 'required'), { required: true }), UI.field('p_body', 'Mensagem', UI.input('p_body', p.body || '', 'placeholder="{protocolo} \u2014 {cliente}"'), { hint: 'Vari\xE1veis: {cliente}, {protocolo}, {assunto}, {oportunidade}, {etapa}.' }));
      if (a === 'set_priority') parts.push(UI.field('p_priority', 'Nova prioridade', UI.select('p_priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), p.priority || 'alta')));
      if (a === 'add_tag') parts.push(UI.field('p_tag', 'Etiqueta', UI.input('p_tag', p.tag || '', 'required')));
      if (a === 'send_message') parts.push(UI.field('p_body', 'Texto da mensagem', UI.textarea('p_body', p.body || '', 'required'), { hint: 'Enviada pela API oficial apenas dentro da janela de 24h e para atendimentos do canal WhatsApp.' }));
      if (a === 'distribute') parts.push('<p class="muted small">Atribui o atendimento ao pr\xF3ximo atendente dispon\xEDvel no rod\xEDzio (da equipe selecionada, se houver). Sem ningu\xE9m dispon\xEDvel, permanece na fila.</p>');
      box.innerHTML = parts.join('');
    };
    form.querySelector('#trigSel').onchange = renderCond; form.querySelector('#actSel').onchange = renderParams;
    renderCond(); renderParams();
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form);
      const conditions = {}, action_params = {};
      Object.entries(d).forEach(([k, v]) => { if (k.startsWith('c_') && v !== '' && v !== null) conditions[k.slice(2)] = v; if (k.startsWith('p_') && v !== '' && v !== null) action_params[k.slice(2)] = v; });
      const body = { name: d.name, trigger: d.trigger, action: d.action, conditions, action_params, team: d.team || null, active: d.active };
      try { const x = isEdit ? await api(\`/automations/\${rule.id}\`, { method: 'PUT', body }) : await api('/automations', { method: 'POST', body }); UI.ok(x.message); m.close(); done(); } catch (err) { UI.showErrors(form, err); }
    };
  },

  async integracoes(box) {
    const wa = await api('/whatsapp/status'); const smtp = this.data.integrations.smtp;
    const st = wa.state;
    const stateBadge = st === 'ativo' ? '<span class="badge success">Conectado \xB7 recebendo eventos</span>' : st === 'configurado_sem_eventos' ? '<span class="badge warning">Configurado \xB7 sem eventos ainda</span>' : '<span class="badge">Desconectado</span>';
    const log = CRM.isManager() ? await api('/whatsapp/log', { query: { limit: 30 } }).catch(() => ({ messages: [] })) : { messages: [] };
    box.innerHTML = \`<div class="grid" style="grid-template-columns: 1fr 1fr"><div class="card"><div class="card-title"><h3>\${UI.icons.whatsapp} WhatsApp Business (API oficial)</h3>\${stateBadge}</div>
      <p class="small">\${UI.esc(wa.message)}</p>
      <div class="state-box"><div class="status-line"><span class="dot \${wa.connected ? 'on' : 'off'}"></span> Credenciais no servidor: <strong>\${wa.connected ? 'presentes' : 'ausentes'}</strong></div>
        <div class="status-line"><span class="dot \${wa.webhook_ready ? 'on' : 'off'}"></span> Webhook: <strong>\${wa.webhook_ready ? 'pronto para verifica\xE7\xE3o' : 'n\xE3o verific\xE1vel'}</strong></div>
        <div class="status-line"><span class="dot \${wa.signature_check ? 'on' : 'warn'}"></span> Valida\xE7\xE3o de assinatura: <strong>\${wa.signature_check ? 'ativa' : 'desativada'}</strong></div>
        <div class="status-line"><span class="dot \${wa.last_event_at ? 'on' : 'off'}"></span> \xDAltimo evento recebido: <strong>\${wa.last_event_at ? UI.fmtDateTime(wa.last_event_at) : 'nenhum'}</strong></div>
        \${wa.last_error ? \`<div class="status-line text-danger"><span class="dot danger"></span> \xDAltimo erro (\${UI.fmtDateTime(wa.last_error_at)}): \${UI.esc(wa.last_error)}</div>\` : ''}
        <div class="status-line"><span class="dot"></span> Mensagens: \${wa.stats.received} recebida(s), \${wa.stats.sent} enviada(s)\${wa.stats.failed ? \`, <span class="text-danger">\${wa.stats.failed} com falha</span>\` : ''}</div></div>
      \${wa.pending.length ? \`<h4 class="mt">Pend\xEAncias para concluir a conex\xE3o</h4><ul class="small">\${wa.pending.map((p) => \`<li>\${UI.esc(p)}</li>\`).join('')}</ul>\` : '<p class="small text-success mt">Nenhuma pend\xEAncia de configura\xE7\xE3o.</p>'}
      <p class="small muted">Enquanto a integra\xE7\xE3o n\xE3o estiver conectada, o bot\xE3o "Abrir no WhatsApp" funciona como atalho externo e as intera\xE7\xF5es devem ser registradas manualmente na conversa (identificadas como "registro manual").</p>
      <details class="mt"><summary>Detalhes t\xE9cnicos (administrador)</summary><div class="help mt-s">
        <p>Vari\xE1veis no arquivo <span class="mono">.env</span> do servidor (nunca armazenadas no banco nem exibidas aqui):</p>
        <pre class="code">WHATSAPP_TOKEN=            # token permanente do app Meta
WHATSAPP_PHONE_NUMBER_ID=  # ID do n\xFAmero no WhatsApp Business
WHATSAPP_VERIFY_TOKEN=     # valor \xE0 sua escolha, usado na verifica\xE7\xE3o do webhook
WHATSAPP_APP_SECRET=       # segredo do app, valida a assinatura X-Hub-Signature-256</pre>
        <p>URL do webhook para cadastrar no painel da Meta (campo <span class="mono">messages</span>):<br><span class="mono">\${UI.esc(wa.webhook_url)}</span></p>
        <p>Como funciona: mensagens recebidas s\xE3o vinculadas ao cliente pelo telefone (criando o cliente quando n\xE3o existe) e ao atendimento aberto mais recente (abrindo um novo na fila quando n\xE3o h\xE1). Eventos repetidos s\xE3o ignorados pelo identificador da mensagem. Status enviado \u2192 entregue \u2192 lido \u2192 falhou aparecem na conversa. Texto livre s\xF3 pode ser enviado at\xE9 24h ap\xF3s a \xFAltima mensagem do cliente; fora da janela \xE9 preciso usar um modelo aprovado.</p>
        <p>Ap\xF3s alterar o <span class="mono">.env</span>, reinicie o servi\xE7o. Guia completo em <span class="mono">docs/INSTALACAO.md</span>.</p></div></details></div>
      <div class="stack"><div class="card"><div class="card-title"><h3>\${UI.icons.mail} E-mail (SMTP)</h3>\${smtp.configured ? '<span class="badge success">Configurado</span>' : '<span class="badge">N\xE3o configurado</span>'}</div>
      <p class="small">\${smtp.configured ? 'A recupera\xE7\xE3o de senha envia o link por e-mail.' : 'Sem SMTP, a recupera\xE7\xE3o de senha registra o link no log do servidor e o administrador pode gerar um link em Configura\xE7\xF5es \u203A Usu\xE1rios \u203A Senha.'}</p>
      <details><summary class="small">Detalhes t\xE9cnicos</summary><div class="help mt-s">Vari\xE1veis: <span class="mono">SMTP_HOST</span>, <span class="mono">SMTP_PORT</span>, <span class="mono">SMTP_SECURE</span>, <span class="mono">SMTP_USER</span>, <span class="mono">SMTP_PASS</span>, <span class="mono">MAIL_FROM</span>.</div></details></div>
      <div class="card"><h3>Outros canais</h3><p class="small muted">Telefone, e-mail, chat do site e presencial s\xE3o registrados manualmente na conversa. A prioridade \xE9 concluir o WhatsApp oficial antes de integrar outros canais; nenhum outro \xE9 apresentado como conectado.</p></div>
      \${CRM.isManager() ? \`<div class="card flush"><div class="card-title"><h3>Registro de mensagens da API</h3></div>\${log.messages.length ? \`<div class="table-wrap" style="max-height:340px"><table><thead><tr><th>Quando</th><th>Dir.</th><th>Cliente</th><th>Status</th><th>Texto</th></tr></thead><tbody>\${log.messages.map((x) => \`<tr><td class="nowrap small">\${UI.fmtDateTime(x.created_at)}</td><td>\${x.direction === 'saida' ? 'Envio' : 'Receb.'}</td><td class="small">\${UI.esc(x.customer_name || '\u2014')}\${x.protocol ? \` <a href="#/atendimentos/\${x.ticket_id}" class="mono xs">\${UI.esc(x.protocol)}</a>\` : ''}</td><td><span class="badge \${x.status === 'falhou' ? 'danger' : x.status === 'lido' ? 'primary' : ''}" title="\${UI.attr(x.error || '')}">\${UI.esc(x.status)}</span></td><td><span class="trunc" style="max-width:200px" title="\${UI.attr(x.body || '')}">\${UI.esc(x.body || '')}</span></td></tr>\`).join('')}</tbody></table></div>\` : '<p class="muted small" style="padding:0 1rem 1rem">Nenhuma mensagem trafegou pela API ainda.</p>'}</div>\` : ''}</div></div>\`;
  },

  backup(box) {
    box.innerHTML = \`<div class="card"><h3>Backup e restaura\xE7\xE3o</h3>
      <p class="small">Os backups s\xE3o gerados no servidor com <span class="mono">pg_dump</span> e ficam na pasta <span class="mono">backups/</span> do projeto (reten\xE7\xE3o dos \xFAltimos 30). Recomenda-se copiar os arquivos para um local externo.</p>
      <h4>Gerar backup</h4><pre class="code">npm run backup</pre>
      <h4>Agendar diariamente (cron, 02h)</h4><pre class="code">0 2 * * * cd /caminho/do/crm && npm run backup >> backups/backup.log 2>&1</pre>
      <h4>Restaurar</h4><pre class="code">npm run restore -- backups/crm-AAAAMMDD-HHMMSS.dump</pre>
      <p class="small muted">A restaura\xE7\xE3o substitui todos os dados do banco configurado em DATABASE_URL. Pare o servidor antes e confirme a opera\xE7\xE3o quando solicitado. Detalhes em <span class="mono">docs/INSTALACAO.md</span>.</p></div>\`;
  },

  async auditoria(box) {
    const q = this.auditQuery || {};
    const r = await api('/settings/audit', { query: { limit: 200, ...q } });
    box.innerHTML = \`<div class="card"><div class="card-title"><h3>Registro de a\xE7\xF5es (\xFAltimas 200)</h3></div><form class="filters" id="auForm"><div class="field"><label>Usu\xE1rio</label>\${UI.select('user_id', [['', 'Todos'], ...CRM.users.map((u) => [u.id, u.name])], q.user_id)}</div><div class="field"><label>A\xE7\xE3o cont\xE9m</label><input name="action" value="\${UI.attr(q.action || '')}" placeholder="ex.: ticket_"></div><button class="btn secondary">Filtrar</button></form>
      <div class="table-wrap"><table><thead><tr><th>Quando</th><th>Usu\xE1rio</th><th>A\xE7\xE3o</th><th>Entidade</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
      \${r.entries.map((a) => \`<tr><td class="small nowrap">\${UI.fmtDateTime(a.created_at)}</td><td class="small nowrap">\${UI.esc(a.user_name || '\u2014')}</td><td class="mono">\${UI.esc(a.action)}</td><td class="small nowrap">\${UI.esc(a.entity || '')} \${UI.esc(a.entity_id || '')}</td><td class="small muted"><span class="trunc" style="max-width:320px" title="\${UI.attr(JSON.stringify(a.details))}">\${UI.esc(JSON.stringify(a.details))}</span></td><td class="small muted">\${UI.esc(a.ip || '')}</td></tr>\`).join('') || '<tr><td colspan="6" class="muted">Nenhum registro.</td></tr>'}</tbody></table></div></div>\`;
    box.querySelector('#auForm').onsubmit = (e) => { e.preventDefault(); this.auditQuery = UI.formData(e.target); this.auditoria(box); };
  },
};
`, "/js/pages/tasks.js": `'use strict';
CRM.pages.tasks = {
  async render(el, { query }) {
    this.el = el; this.view = query.view || 'today'; this.query = query;
    el.innerHTML = CRM.pageHeader('Tarefas e retornos', 'Compromissos vinculados a clientes, atendimentos e oportunidades.', \`<button class="btn" id="btnNew">\${UI.icons.plus} <span class="lbl">Nova tarefa</span></button>\`) +
      \`<div class="tabs" id="tabs"></div><div class="card">\${CRM.isManager() ? \`<div class="filters"><div class="field"><label>Respons\xE1vel</label>\${UI.select('assignee_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.assignee_id, 'id="assigneeFilter"')}</div></div>\` : ''}<div id="list"></div></div>\`;
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.list());
    const af = el.querySelector('#assigneeFilter'); if (af) af.onchange = () => this.list();
    await this.list();
  },
  async list() {
    const af = this.el.querySelector('#assigneeFilter');
    const r = await api('/tasks', { query: { view: this.view, assignee_id: af ? af.value : '' } });
    const s = r.summary;
    this.el.querySelector('#tabs').innerHTML = [['today', 'Hoje', s.today, 'primary'], ['overdue', 'Atrasadas', s.overdue, 'danger'], ['upcoming', 'Futuras', s.upcoming, ''], ['open', 'Todas abertas', s.open, ''], ['done', 'Conclu\xEDdas', null, '']]
      .map(([k, l, n, c]) => \`<button data-view="\${k}" class="\${this.view === k ? 'active' : ''}">\${l}\${n ? \` <span class="badge \${c}">\${n}</span>\` : ''}</button>\`).join('');
    this.el.querySelector('#tabs').onclick = (e) => { const b = e.target.closest('[data-view]'); if (!b) return; this.view = b.dataset.view; history.replaceState(null, '', \`#/tarefas?view=\${this.view}\`); this.list(); };
    const box = this.el.querySelector('#list');
    this.tasks = r.tasks;
    const msgs = { today: ['Nenhuma tarefa para hoje', 'Aproveite para adiantar as futuras.'], overdue: ['Nenhuma tarefa atrasada', 'Tudo em dia.'], upcoming: ['Nenhuma tarefa futura', ''], open: ['Nenhuma tarefa aberta', 'Crie uma tarefa pelo bot\xE3o acima.'], done: ['Nenhuma tarefa conclu\xEDda', ''] };
    const KIND = { retorno: 'Retorno', acompanhamento: 'Acompanhamento', tarefa: 'Tarefa' };
    UI.table(box, { id: 'tasks', rows: r.tasks, total: r.tasks.length, limit: 500,
      columns: [
        { key: 'done', label: '', width: '36px', render: (t) => \`<input type="checkbox" data-done="\${t.id}" \${t.done_at ? 'checked' : ''} aria-label="\${t.done_at ? 'Reabrir' : 'Concluir'}">\` },
        { key: 'title', label: 'Tarefa', min: '220px', render: (t) => \`<span class="trunc \${t.done_at ? 'muted' : 'strong'}" style="max-width:340px;\${t.done_at ? 'text-decoration:line-through' : ''}" title="\${UI.attr(t.title)}">\${UI.esc(t.title)}</span>\${t.description ? \`<span class="trunc muted small" style="max-width:340px" title="\${UI.attr(t.description)}">\${UI.esc(t.description)}</span>\` : ''}\${t.closed_reason ? \`<span class="muted xs">\${UI.esc(t.closed_reason)}</span>\` : ''}\` },
        { key: 'kind', label: 'Tipo', nowrap: true, render: (t) => \`<span class="badge outline">\${KIND[t.kind] || t.kind}</span>\${t.automation_rule_id ? \` <span class="badge outline" title="Criada por automa\xE7\xE3o">\${UI.icons.zap}</span>\` : ''}\` },
        { key: 'link', label: 'Vinculada a', min: '160px', render: (t) => \`\${t.customer_name ? \`<a href="#/clientes/\${t.customer_id}">\${UI.esc(t.customer_name)}</a>\` : ''}\${t.ticket_protocol ? \` \xB7 <a href="#/atendimentos/\${t.ticket_id}" class="mono">\${UI.esc(t.ticket_protocol)}</a>\` : ''}\${t.opportunity_title ? \` \xB7 <a href="#/funil/\${t.opportunity_id}">\${UI.esc(t.opportunity_title)}</a>\` : ''}\` },
        { key: 'assignee_name', label: 'Respons\xE1vel', nowrap: true, render: (t) => UI.esc(t.assignee_name || '\u2014') },
        { key: 'due_at', label: 'Prazo', nowrap: true, render: (t) => { const late = !t.done_at && t.due_at && new Date(t.due_at) < Date.now(); return late ? \`<span class="text-danger strong">\${UI.fmtDateTime(t.due_at)} \xB7 atrasada</span>\` : UI.fmtDateTime(t.due_at); } },
        { key: 'priority', label: 'Prioridade', render: (t) => UI.priorityBadge(t.priority) },
        { key: 'actions', label: '', nowrap: true, render: (t) => \`<button class="icon-btn" data-edit="\${t.id}" title="Editar" aria-label="Editar">\${UI.icons.edit}</button><button class="icon-btn" data-del="\${t.id}" title="Excluir" aria-label="Excluir">\${UI.icons.trash}</button>\` },
      ], empty: UI.empty(...msgs[this.view]) });
    box.querySelectorAll('[data-done]').forEach((c) => c.onchange = async () => { try { const r2 = await api(\`/tasks/\${c.dataset.done}\`, { method: 'PUT', body: { done: c.checked } }); UI.ok(r2.message); this.list(); } catch (err) { UI.err(err); this.list(); } });
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.form({ task: this.tasks.find((t) => t.id === Number(b.dataset.edit)) }, () => this.list()));
    box.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await UI.confirm('Excluir esta tarefa?', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(\`/tasks/\${b.dataset.del}\`, { method: 'DELETE' }); UI.ok(r2.message); this.list(); } catch (err) { UI.err(err); } });
  },
  form({ task, customer_id, customer_name, ticket_id, opportunity_id, assignee_id } = {}, onSaved) {
    const isEdit = Boolean(task);
    const m = UI.modal({ title: isEdit ? 'Editar tarefa' : 'Nova tarefa', body: \`<form id="taskForm">
      \${UI.field('title', 'T\xEDtulo', UI.input('title', task?.title, 'required'), { required: true })}
      \${UI.field('description', 'Descri\xE7\xE3o', UI.textarea('description', task?.description, 'data-type="nullable" rows="2"'))}
      <div class="form-row cols-3">\${UI.field('assignee_id', 'Respons\xE1vel', UI.select('assignee_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), task ? task.assignee_id : (assignee_id || CRM.user.id), 'data-type="int"'))}
        \${UI.field('due_at', 'Prazo', \`<input type="datetime-local" name="due_at" value="\${UI.toLocalInput(task?.due_at || (isEdit ? null : new Date(Date.now() + 86400000).setHours(9, 0, 0, 0)))}">\`)}\${UI.field('priority', 'Prioridade', UI.select('priority', [['baixa', 'Baixa'], ['normal', 'Normal'], ['alta', 'Alta']], task?.priority || 'normal'))}</div>
      \${customer_name || task?.customer_name ? \`<p class="muted small">Vinculada ao cliente <strong>\${UI.esc(customer_name || task.customer_name)}</strong>\${ticket_id || task?.ticket_protocol ? ' e ao atendimento' : ''}\${opportunity_id || task?.opportunity_title ? ' e \xE0 oportunidade' : ''}.</p>\` : \`\${UI.field('customer_id', 'Cliente (opcional)', \`<input id="custSearch" placeholder="Digite para buscar\u2026" autocomplete="off"><input type="hidden" name="customer_id" data-type="int"><div class="search-results" id="custResults" hidden style="position:relative"></div>\`)}\`}
      \${!isEdit && customer_id ? \`<input type="hidden" name="customer_id" value="\${customer_id}" data-type="int">\` : ''}\${!isEdit && ticket_id ? \`<input type="hidden" name="ticket_id" value="\${ticket_id}" data-type="int">\` : ''}\${!isEdit && opportunity_id ? \`<input type="hidden" name="opportunity_id" value="\${opportunity_id}" data-type="int">\` : ''}</form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="taskForm">\${isEdit ? 'Salvar' : 'Criar tarefa'}</button>\` });
    const form = m.el.querySelector('#taskForm');
    const cs = form.querySelector('#custSearch'); if (cs) CRM.pages.tickets.customerPicker(cs, form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(form); if (d.customer_id === null || d.customer_id === '') delete d.customer_id;
      try { const r = isEdit ? await api(\`/tasks/\${task.id}\`, { method: 'PUT', body: d }) : await api('/tasks', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.task); } catch (err) { UI.showErrors(form, err); } };
  },
};
`, "/js/pages/tickets.js": `'use strict';
// Central de conversas: lista (esquerda), conversa (centro) e contexto do cliente (direita). Vis\xE3o em tabela para supervis\xE3o.
CRM.pages.tickets = {
  VIEWS: [['mine', 'Meus'], ['queue', 'Fila'], ['unanswered', 'Sem resposta'], ['waiting_customer', 'Aguardando cliente'], ['open', 'Todos abertos'], ['closed', 'Encerrados']],

  async render(el, { id, query }) {
    this.el = el; this.id = id || null; this.query = query;
    const s = await CRM.settingsFull();
    this.channels = s ? s.settings.channels : ['WhatsApp', 'Telefone', 'E-mail'];
    this.quick = s ? s.quick_replies : [];
    this.sla = s ? s.settings.response_sla_minutes : 30;
    if (!this.waStatus) this.waStatus = await api('/whatsapp/status').catch(() => ({ connected: false }));
    if (query.tabela) return this.table(el, query);
    if (query.novo) { history.replaceState(null, '', '#/atendimentos'); setTimeout(() => this.form({}, (t) => { location.hash = \`#/atendimentos/\${t.id}\`; }), 50); }
    this.view = query.view || (this.id ? (this.view || 'open') : UI.store.get('inbox.view', CRM.user.role === 'atendente' ? 'mine' : 'open'));
    UI.store.set('inbox.view', this.view);
    this.filters = { q: query.q || '', channel: query.channel || '', assignee_id: query.assignee_id || '', priority: query.priority || '' };
    el.className = 'content full';
    el.innerHTML = \`<div class="inbox \${this.id ? 'm-conv' : 'm-list'}" id="inbox">
      <section class="conv-list" aria-label="Lista de conversas"><div class="head">
        <div class="flex"><input id="convSearch" placeholder="Buscar conversa\u2026" value="\${UI.attr(this.filters.q)}" aria-label="Buscar conversa">
          <div class="menu-wrap"><button class="icon-btn" id="convFilters" title="Filtros" aria-label="Filtros">\${UI.icons.filter}</button></div>
          <button class="icon-btn" id="convNew" title="Abrir atendimento" aria-label="Abrir atendimento">\${UI.icons.plus}</button></div>
        <div class="chips" id="convViews"></div></div>
        <div class="items" id="convItems"><p class="muted small" style="padding:1rem">Carregando\u2026</p></div>
        <div style="padding:.45rem .75rem;border-top:1px solid var(--border)" class="flex between"><a href="#/atendimentos?tabela=1" class="small">\${UI.icons.list} Vis\xE3o em tabela</a>\${CRM.isManager() ? '<button class="btn link small" id="btnDistribute">Distribuir fila</button>' : ''}</div>
      </section>
      <section class="conv-main" id="convMain" aria-label="Conversa"><div class="conv-empty"><div>\${UI.icons.inbox}<br><strong>Selecione uma conversa</strong><br><span class="small">ou abra um novo atendimento pelo bot\xE3o +</span></div></div></section>
      <aside class="conv-context" id="convCtx" aria-label="Contexto do cliente"></aside>
    </div>\`;
    const search = el.querySelector('#convSearch');
    search.oninput = UI.debounce(() => { this.filters.q = search.value.trim(); this.list(); }, 300);
    el.querySelector('#convNew').onclick = () => this.form({}, (t) => { location.hash = \`#/atendimentos/\${t.id}\`; });
    el.querySelector('#convFilters').onclick = (e) => this.filterMenu(e.currentTarget);
    const dist = el.querySelector('#btnDistribute'); if (dist) dist.onclick = async () => { try { const r = await api('/tickets/distribute', { method: 'POST' }); UI.toast(r.message, r.assigned ? 'success' : 'warning'); this.list(); } catch (err) { UI.err(err); } };
    await this.renderViews();
    await this.list();
    if (this.id) await this.open(this.id);
  },

  async renderViews() {
    const c = (await api('/tickets/counts').catch(() => ({ counts: {} }))).counts || {};
    CRM.counts = c;
    const box = this.el.querySelector('#convViews'); if (!box) return;
    box.innerHTML = this.VIEWS.map(([k, l]) => \`<button type="button" class="chip \${this.view === k ? 'active' : ''}" data-view="\${k}">\${l}\${c[k] ? \` <span class="n">\${c[k]}</span>\` : ''}</button>\`).join('');
    box.querySelectorAll('[data-view]').forEach((b) => b.onclick = () => { this.view = b.dataset.view; UI.store.set('inbox.view', this.view); box.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b)); this.list(); });
  },

  filterMenu(btn) {
    const f = this.filters;
    const m = UI.modal({ title: 'Filtrar conversas', size: 'narrow', body: \`<form id="cfForm">
      \${UI.field('channel', 'Canal', UI.select('channel', [['', 'Todos'], ...this.channels.map((c) => [c, c])], f.channel))}
      \${CRM.isManager() ? UI.field('assignee_id', 'Respons\xE1vel', UI.select('assignee_id', [['', 'Todos'], ['none', 'Sem respons\xE1vel'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], f.assignee_id)) : ''}
      \${UI.field('priority', 'Prioridade', UI.select('priority', [['', 'Todas'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], f.priority))}</form>\`,
      footer: \`<button class="btn ghost" id="cfClear">Limpar</button><button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="cfForm">Aplicar</button>\` });
    m.el.querySelector('#cfForm').onsubmit = (e) => { e.preventDefault(); Object.assign(this.filters, UI.formData(e.target)); m.close(); this.list(); btn.classList.toggle('active', Boolean(this.filters.channel || this.filters.assignee_id || this.filters.priority)); };
    m.el.querySelector('#cfClear').onclick = () => { this.filters = { q: this.filters.q, channel: '', assignee_id: '', priority: '' }; m.close(); this.list(); };
  },

  async list() {
    const box = this.el.querySelector('#convItems'); if (!box) return;
    const q = { view: this.view, ...this.filters, limit: 80 };
    let r; try { r = await api('/tickets', { query: q }); } catch (e) { box.innerHTML = \`<div class="alert danger">\${UI.esc(e.message)}</div>\`; return; }
    this.rows = r.tickets;
    if (!r.tickets.length) {
      const msgs = { queue: ['Fila vazia', 'Todos os atendimentos foram assumidos.'], mine: ['Nenhuma conversa sua', 'Assuma um atendimento da fila para come\xE7ar.'], unanswered: ['Tudo respondido', 'Nenhum cliente aguardando resposta.'], waiting_customer: ['Nenhuma conversa aguardando o cliente', ''], closed: ['Nenhum atendimento encerrado', ''], open: ['Nenhuma conversa aberta', 'Abra um novo atendimento pelo bot\xE3o +.'] };
      box.innerHTML = UI.empty(...(msgs[this.view] || ['Nada encontrado', 'Ajuste a busca ou os filtros.'])); return;
    }
    box.innerHTML = r.tickets.map((t) => this.item(t)).join('');
    box.querySelectorAll('.conv-item').forEach((a) => a.onclick = (e) => { e.preventDefault(); location.hash = \`#/atendimentos/\${a.dataset.id}\`; });
  },

  slaHtml(t) {
    if (!t.awaiting_reply || !t.response_due_at) return '';
    const ms = new Date(t.response_due_at) - Date.now();
    if (ms < 0) return \`<span class="sla late" title="Prazo de resposta vencido">\${UI.icons.alert} vencido \${UI.relative(t.response_due_at).replace('h\xE1 ', 'h\xE1 ')}</span>\`;
    if (ms < 10 * 60000) return \`<span class="sla soon" title="Prazo de resposta">\${UI.icons.clock} \${Math.max(1, Math.round(ms / 60000))} min</span>\`;
    return \`<span class="sla" title="Prazo de resposta">\${UI.icons.clock} \${UI.fmtDuration(ms / 1000)}</span>\`;
  },

  item(t) {
    const active = t.id === this.id;
    const last = t.last_message_preview || t.subject || '';
    const prefix = t.last_message_direction === 'saida' ? 'Voc\xEA: ' : '';
    return \`<a class="conv-item \${active ? 'active' : ''}" data-id="\${t.id}" href="#/atendimentos/\${t.id}" aria-current="\${active ? 'true' : 'false'}">
      \${UI.avatar(t.customer_name)}
      <div style="min-width:0"><div class="name">\${UI.esc(t.customer_name)}</div><div class="preview \${t.last_message_direction ? '' : 'note-prev'}">\${UI.esc(prefix + last)}</div></div>
      <div><div class="time">\${UI.fmtShort(t.last_message_at || t.opened_at)}</div>\${t.unread_count ? \`<span class="unread" title="\${t.unread_count} sem leitura">\${t.unread_count}</span>\` : ''}</div>
      <div class="meta"><span class="ch" title="\${UI.attr(t.channel)}">\${UI.channelIcon(t.channel)} \${UI.esc(t.channel)}</span>
        <span>\${t.assignee_name ? UI.esc(t.assignee_name.split(' ')[0]) : '<em>na fila</em>'}</span>
        \${t.status === 'aguardando_cliente' ? '<span class="badge purple">aguard. cliente</span>' : ''}\${['resolvido', 'cancelado'].includes(t.status) ? UI.statusBadge(t.status, true) : ''}
        \${t.priority === 'urgente' || t.priority === 'alta' ? UI.priorityBadge(t.priority) : ''}\${this.slaHtml(t)}</div></a>\`;
  },

  // ---------- Conversa selecionada ----------
  async open(id, { keepDraft = false } = {}) {
    this.id = id;
    const main = this.el.querySelector('#convMain'), ctx = this.el.querySelector('#convCtx'), inbox = this.el.querySelector('#inbox');
    if (!main) return;
    const draft = keepDraft ? main.querySelector('#composerText')?.value : '';
    let r; try { r = await api(\`/tickets/\${id}\`); } catch (e) { main.innerHTML = \`<div class="conv-empty"><div>\${UI.icons.alert}<br>\${UI.esc(e.message)}<br><a href="#/atendimentos">Voltar \xE0 lista</a></div></div>\`; ctx.innerHTML = ''; return; }
    const t = r.ticket;
    // Atualiza\xE7\xE3o em tempo real: se o estado do atendimento n\xE3o mudou, s\xF3 a conversa e o contexto s\xE3o redesenhados (o texto digitado \xE9 preservado).
    const prev = this.current && this.current.ticket;
    if (keepDraft && prev && prev.id === t.id && prev.version === t.version && prev.status === t.status && prev.assignee_id === t.assignee_id && main.querySelector('#composer')) {
      this.current = r;
      const body = main.querySelector('#convBody'); const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
      body.innerHTML = this.messages(r); if (atBottom) body.scrollTop = body.scrollHeight;
      this.context(ctx, r, { canAct: ['aguardando', 'em_atendimento', 'aguardando_cliente'].includes(t.status) && (t.assignee_id === CRM.user.id || CRM.isManager()), mgr: CRM.isManager() });
      return;
    }
    this.current = r;
    inbox.classList.remove('m-list', 'm-ctx'); inbox.classList.add('m-conv');
    this.el.querySelectorAll('.conv-item').forEach((a) => a.classList.toggle('active', Number(a.dataset.id) === id));
    if (t.unread_count) api(\`/tickets/\${id}/read\`, { method: 'POST' }).catch(() => {});
    const open = ['aguardando', 'em_atendimento', 'aguardando_cliente'].includes(t.status);
    const isOwner = t.assignee_id === CRM.user.id, mgr = CRM.isManager();
    const canAct = open && (isOwner || mgr);
    const wa = t.customer_phone_digits ? UI.waLink(t.customer_phone_digits) : null;
    const primary = [];
    if (t.status === 'aguardando' && (!t.assignee_id || isOwner)) primary.push(\`<button class="btn success" data-act="claim">\${UI.icons.check} <span class="lbl">Assumir</span></button>\`);
    if (canAct && t.status !== 'aguardando') {
      primary.push(\`<button class="btn secondary" data-act="followup" title="Agendar retorno">\${UI.icons.calendar} <span class="lbl">Retorno</span></button>\`);
      primary.push(\`<button class="btn" data-act="status" data-status="resolvido">\${UI.icons.checkCircle} <span class="lbl">Resolver</span></button>\`);
    }
    if (!open) primary.push(\`<button class="btn" data-act="reopen">\${UI.icons.refresh} <span class="lbl">Reabrir</span></button>\`);
    main.innerHTML = \`<div class="conv-head">
      <button class="icon-btn mobile-back" id="backList" aria-label="Voltar \xE0 lista">\${UI.icons.arrowLeft}</button>
      \${UI.avatar(t.customer_name)}
      <div class="who"><div class="name"><a href="#/clientes/\${t.customer_id}" style="color:inherit">\${UI.esc(t.customer_name)}</a>\${t.customer_company ? \` <span class="muted small">\xB7 \${UI.esc(t.customer_company)}</span>\` : ''}</div>
        <div class="sub"><span class="mono">\${UI.esc(t.protocol)}</span>\${UI.statusBadge(t.status, true)}\${UI.priorityBadge(t.priority)}<span class="ch">\${UI.channelIcon(t.channel)} \${UI.esc(t.channel)}</span><span>\${t.assignee_name ? \`Resp.: <strong>\${UI.esc(t.assignee_name)}</strong>\` : '<em>na fila</em>'}</span>\${t.follow_up_at && open ? \`<span class="\${new Date(t.follow_up_at) < Date.now() ? 'text-danger' : ''}" title="Retorno agendado">\${UI.icons.calendar} \${UI.fmtDateTime(t.follow_up_at)}</span>\` : ''}</div></div>
      <div class="actions">\${primary.join('')}<div class="menu-wrap"><button class="icon-btn" id="moreActions" aria-label="Mais a\xE7\xF5es" aria-haspopup="true">\${UI.icons.more}</button></div><button class="icon-btn mobile-back" id="showCtx" aria-label="Dados do cliente">\${UI.icons.user}</button></div>
    </div>
    <div class="conv-body" id="convBody">\${this.messages(r)}</div>
    \${this.composer(t, canAct, mgr, open, draft)}\`;
    main.querySelector('#backList').onclick = () => { inbox.classList.remove('m-conv'); inbox.classList.add('m-list'); history.replaceState(null, '', '#/atendimentos'); };
    main.querySelector('#showCtx').onclick = () => inbox.classList.toggle('m-ctx');
    main.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => this.action(b.dataset.act, t, b.dataset.status, () => { this.open(id, { keepDraft: true }); this.list(); this.renderViews(); }));
    main.querySelector('#moreActions').onclick = (e) => this.moreMenu(e.currentTarget, t, { open, isOwner, mgr, canAct, wa });
    const body = main.querySelector('#convBody'); body.scrollTop = body.scrollHeight;
    this.bindComposer(main, t, canAct, mgr, open);
    this.context(ctx, r, { canAct, mgr });
  },

  subjectTitle(t) { return \`\${t.protocol} \xB7 \${t.subject}\`; },

  moreMenu(btn, t, { open, isOwner, mgr, canAct, wa }) {
    const items = [{ head: this.subjectTitle(t) }];
    const done = () => { this.open(t.id, { keepDraft: true }); this.list(); this.renderViews(); };
    if (canAct && t.status !== 'aguardando') {
      if (t.status !== 'aguardando_cliente') items.push({ label: 'Marcar como aguardando cliente', icon: 'clock', onClick: () => this.action('status', t, 'aguardando_cliente', done) });
      else items.push({ label: 'Retomar atendimento', icon: 'play', onClick: () => this.action('status', t, 'em_atendimento', done) });
      items.push({ label: 'Transferir\u2026', icon: 'users', onClick: () => this.action('transfer', t, null, done) });
      items.push({ label: 'Devolver \xE0 fila', icon: 'inbox', onClick: () => this.action('release', t, null, done) });
    }
    if (t.status === 'aguardando' && t.assignee_id && !isOwner && mgr) items.push({ label: 'Reatribuir\u2026', icon: 'users', onClick: () => this.action('transfer', t, null, done) });
    if (open && (isOwner || mgr || !t.assignee_id)) items.push({ label: 'Editar assunto, canal e prioridade', icon: 'edit', onClick: () => this.action('edit', t, null, done) });
    items.push({ label: 'Nova oportunidade', icon: 'pipeline', onClick: () => CRM.pages.pipeline.form({ customer: { id: t.customer_id, name: t.customer_name }, ticket_id: t.id }, done) });
    items.push({ label: 'Nova tarefa', icon: 'tasks', onClick: () => CRM.pages.tasks.form({ customer_id: t.customer_id, customer_name: t.customer_name, ticket_id: t.id, assignee_id: t.assignee_id }, done) });
    items.push({ sep: true }, { label: 'Ficha do cliente', icon: 'user', href: \`#/clientes/\${t.customer_id}\` });
    if (wa) items.push({ label: 'Abrir no WhatsApp (externo)', icon: 'external', onClick: () => window.open(wa, '_blank', 'noopener') });
    if (canAct && (t.status !== 'aguardando' || mgr)) items.push({ sep: true }, { label: 'Cancelar atendimento', icon: 'xCircle', danger: true, onClick: () => this.action('status', t, 'cancelado', done) });
    UI.menu(btn, items);
  },

  messages(r) {
    const { events, attachments } = r;
    const byEvent = {}; (attachments || []).forEach((a) => { (byEvent[a.event_id] = byEvent[a.event_id] || []).push(a); });
    let lastDay = null; const out = [];
    for (const e of events) {
      const day = new Date(e.created_at).toDateString();
      if (day !== lastDay) { out.push(\`<div class="day-sep">\${UI.fmtDate(e.created_at)}</div>\`); lastDay = day; }
      const atts = (byEvent[e.id] || []).map((a) => \`<div class="att"><a href="\${a.url || \`\${window.API_BASE || ''}/api/tickets/\${r.ticket.id}/attachments/\${a.id}\`}" target="_blank" rel="noopener" \${a.url ? \`download="\${UI.attr(a.name)}"\` : ''}>\${a.mime && a.mime.startsWith('image/') ? UI.icons.image : UI.icons.file} \${UI.esc(a.name)}\${a.size ? \` <span class="muted">(\${UI.fmtBytes(a.size)})</span>\` : ''}</a></div>\`).join('');
      if (e.kind === 'system') { out.push(\`<div class="msg sys" title="\${UI.fmtDateTime(e.created_at)}">\${UI.esc(e.body || '')}\${e.user_name ? \` \xB7 \${UI.esc(e.user_name)}\` : ''} \xB7 \${UI.fmtTime(e.created_at)}</div>\`); continue; }
      if (e.kind === 'note') { out.push(\`<div class="msg note"><div class="m-tag">\${UI.icons.lock} Nota interna \xB7 n\xE3o vis\xEDvel ao cliente</div>\${UI.esc(e.body || '')}\${atts}<div class="m-meta">\${UI.esc(e.user_name || '')} \xB7 \${UI.fmtTime(e.created_at)}</div></div>\`); continue; }
      const out_ = e.direction === 'saida';
      const p = e.payload || {};
      const via = p.via === 'whatsapp_api' ? 'WhatsApp (API oficial)' : \`\${e.channel || ''} \xB7 registro manual\`;
      let status = '';
      if (out_ && p.via === 'whatsapp_api') {
        const st = p.status || 'enviado';
        status = st === 'falhou' ? \`<span class="status failed" title="\${UI.attr(p.error || 'Falha no envio')}">\${UI.icons.alert} falhou</span>\` : st === 'lido' ? \`<span class="status read" title="Lida">\${UI.icons.checkDouble} lida</span>\` : st === 'entregue' ? \`<span class="status" title="Entregue">\${UI.icons.checkDouble} entregue</span>\` : \`<span class="status" title="Enviada">\${UI.icons.check} enviada</span>\`;
      }
      out.push(\`<div class="msg \${out_ ? 'out' : 'in'}">\${UI.esc(e.body || '')}\${atts}<div class="m-meta"><span title="\${UI.attr(via)}">\${out_ ? UI.esc(e.user_name || 'Sistema') : 'Cliente'}\${p.via === 'whatsapp_api' ? '' : ' \xB7 manual'}</span>\xB7 \${UI.fmtTime(e.created_at)} \${status}</div></div>\`);
    }
    return out.join('') || '<div class="muted small center" style="padding:2rem">Sem mensagens ainda.</div>';
  },

  composer(t, canAct, mgr, open, draft = '') {
    const waLive = this.waStatus && this.waStatus.connected && t.channel === 'WhatsApp';
    const disabledReason = !open ? 'Atendimento encerrado. Reabra para continuar a conversa.' : !(canAct || mgr) ? 'Assuma o atendimento para responder ao cliente.' : '';
    return \`<div class="composer" id="composer">
      <div class="mode" role="tablist"><button type="button" class="active" data-mode="reply" role="tab">\${UI.icons.send} Responder</button><button type="button" class="note" data-mode="note" role="tab">\${UI.icons.lock} Nota interna</button><button type="button" data-mode="inbound" role="tab" title="Registrar uma mensagem que o cliente enviou por fora do sistema">\${UI.icons.inbox} Registrar recebida</button>
        <span class="grow"></span><span class="small muted" id="channelInfo">\${waLive ? \`\${UI.icons.whatsapp} envio pela API oficial\` : \`\${UI.channelIcon(t.channel)} \${UI.esc(t.channel)} \xB7 registro manual\`}</span></div>
      <div style="position:relative"><textarea id="composerText" placeholder="\${disabledReason || 'Escreva a resposta ao cliente\u2026 (Ctrl+Enter envia)'}" \${disabledReason && !mgr ? 'disabled' : ''} aria-label="Mensagem">\${UI.esc(draft || '')}</textarea><div id="qrPop" class="qr-pop" hidden></div></div>
      <div class="att-list" id="attList"></div>
      <div class="tools">
        <button type="button" class="btn ghost sm" id="btnQuick" title="Respostas r\xE1pidas">\${UI.icons.zap} Respostas r\xE1pidas</button>
        <button type="button" class="btn ghost sm" id="btnAttach" title="Anexar arquivo (at\xE9 2 MB)">\${UI.icons.paperclip} Anexar</button><input type="file" id="attFile" hidden multiple>
        <select id="inboundChannel" hidden style="width:auto;min-height:28px;padding:.2rem .5rem" aria-label="Canal">\${this.channels.map((c) => \`<option \${c === t.channel ? 'selected' : ''}>\${UI.esc(c)}</option>\`).join('')}</select>
        <span class="hint" id="composerHint">\${disabledReason || (waLive ? 'A mensagem ser\xE1 enviada ao cliente pelo WhatsApp Business. Status de entrega aparecem na conversa.' : 'A mensagem \xE9 registrada como enviada ao cliente por ' + UI.esc(t.channel) + '. A primeira resposta define o tempo de 1\xAA resposta.')}</span>
        <button type="button" class="btn" id="btnSend" \${disabledReason && !mgr ? 'disabled' : ''}>\${UI.icons.send} Enviar</button></div></div>\`;
  },

  bindComposer(main, t, canAct, mgr, open) {
    const comp = main.querySelector('#composer'), ta = main.querySelector('#composerText'), send = main.querySelector('#btnSend'), hint = main.querySelector('#composerHint');
    const chSel = main.querySelector('#inboundChannel'), attList = main.querySelector('#attList'), file = main.querySelector('#attFile');
    let mode = 'reply'; let atts = [];
    const waLive = this.waStatus && this.waStatus.connected && t.channel === 'WhatsApp';
    const setMode = (m) => {
      mode = m; comp.classList.toggle('note-mode', m === 'note');
      comp.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
      chSel.hidden = m !== 'inbound';
      const closed = !open;
      if (m === 'note') { ta.disabled = false; send.disabled = false; ta.placeholder = 'Nota interna: vis\xEDvel apenas para a equipe (Ctrl+Enter salva)'; hint.textContent = 'Notas internas n\xE3o s\xE3o enviadas ao cliente e n\xE3o contam como resposta.'; send.innerHTML = \`\${UI.icons.lock} Salvar nota\`; }
      else if (m === 'inbound') { const ok = !closed && (canAct || mgr); ta.disabled = !ok; send.disabled = !ok; ta.placeholder = ok ? 'Texto da mensagem recebida do cliente (telefone, e-mail, presencial\u2026)' : 'Assuma o atendimento para registrar.'; hint.textContent = ok ? 'Registro manual de uma mensagem que o cliente enviou fora do CRM. Zera o contador de resposta.' : 'Assuma o atendimento para registrar intera\xE7\xF5es.'; send.innerHTML = \`\${UI.icons.inbox} Registrar\`; }
      else { const ok = !closed && (canAct || mgr); ta.disabled = !ok; send.disabled = !ok; ta.placeholder = ok ? 'Escreva a resposta ao cliente\u2026 (Ctrl+Enter envia)' : (closed ? 'Atendimento encerrado. Reabra para continuar.' : 'Assuma o atendimento para responder.'); hint.textContent = ok ? (waLive ? 'A mensagem ser\xE1 enviada ao cliente pelo WhatsApp Business.' : \`Registrada como enviada ao cliente por \${t.channel}.\`) : (closed ? 'Atendimento encerrado.' : 'Assuma o atendimento para responder ao cliente.'); send.innerHTML = \`\${UI.icons.send} Enviar\`; }
    };
    comp.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { setMode(b.dataset.mode); ta.focus(); });
    setMode('reply');
    // Respostas r\xE1pidas: bot\xE3o ou "/" no in\xEDcio do texto
    const pop = main.querySelector('#qrPop');
    const showQuick = (filter = '') => {
      const list = (this.quick || []).filter((q) => !filter || q.title.toLowerCase().includes(filter) || (q.shortcut || '').toLowerCase().includes(filter));
      if (!list.length) { pop.innerHTML = \`<div class="muted small" style="padding:.6rem .8rem">\${this.quick.length ? 'Nenhuma resposta corresponde.' : 'Nenhuma resposta r\xE1pida cadastrada. Administradores cadastram em Configura\xE7\xF5es \u203A Respostas r\xE1pidas.'}</div>\`; pop.hidden = false; return; }
      pop.innerHTML = list.map((q) => \`<button type="button" data-q="\${q.id}"><div class="t">\${UI.esc(q.title)}\${q.shortcut ? \` <span class="mono muted">/\${UI.esc(q.shortcut)}</span>\` : ''}</div><div class="b">\${UI.esc(q.body)}</div></button>\`).join('');
      pop.hidden = false;
      pop.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { const q = this.quick.find((x) => x.id === Number(b.dataset.q)); const first = (t.customer_name || '').split(' ')[0]; ta.value = (ta.value.replace(/^\\/\\S*$/, '') + q.body.replace(/\\{nome\\}/g, first).replace(/\\{atendente\\}/g, CRM.user.name.split(' ')[0]).replace(/\\{protocolo\\}/g, t.protocol)).trim(); pop.hidden = true; ta.focus(); });
    };
    main.querySelector('#btnQuick').onclick = () => { if (!pop.hidden) { pop.hidden = true; return; } showQuick(); };
    ta.addEventListener('input', () => { const m = ta.value.match(/^\\/(\\S*)$/); if (m) showQuick(m[1].toLowerCase()); else pop.hidden = true; });
    document.addEventListener('click', (e) => { if (!e.target.closest('#qrPop, #btnQuick, #composerText')) pop.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; ta.focus(); } });
    // Anexos
    main.querySelector('#btnAttach').onclick = () => file.click();
    const renderAtts = () => { attList.innerHTML = atts.map((a, i) => \`<span class="badge outline">\${UI.icons.paperclip} \${UI.esc(a.name)} <button type="button" class="icon-btn" style="min-height:0;min-width:0;padding:0 2px" data-rm="\${i}" aria-label="Remover">\${UI.icons.x}</button></span>\`).join(''); attList.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { atts.splice(Number(b.dataset.rm), 1); renderAtts(); }); };
    file.onchange = async () => { for (const f of file.files) { if (f.size > 2 * 1024 * 1024) { UI.toast(\`"\${f.name}" excede 2 MB.\`, 'warning'); continue; } if (atts.length >= 5) { UI.toast('M\xE1ximo de 5 anexos por mensagem.', 'warning'); break; } atts.push({ name: f.name, mime: f.type || 'application/octet-stream', data: await UI.readFile(f) }); } file.value = ''; renderAtts(); };
    // Envio
    const submit = async () => {
      const text = ta.value.trim(); if (!text && !atts.length) return; if (!text) { UI.toast('Escreva um texto para acompanhar o anexo.', 'warning'); return; }
      send.disabled = true;
      try {
        let r;
        if (mode === 'note') r = await api(\`/tickets/\${t.id}/notes\`, { method: 'POST', body: { body: text, attachments: atts } });
        else if (mode === 'inbound') r = await api(\`/tickets/\${t.id}/interactions\`, { method: 'POST', body: { direction: 'entrada', channel: chSel.value, body: text, attachments: atts } });
        else if (waLive && !atts.length) {
          try { r = await api('/whatsapp/send', { method: 'POST', body: { customer_id: t.customer_id, ticket_id: t.id, body: text } }); }
          catch (e) { if (e.status === 409 && e.data.window_closed) { return this.templateDialog(t, e, () => { ta.value = ''; this.open(t.id); this.list(); }); } throw e; }
        } else r = await api(\`/tickets/\${t.id}/interactions\`, { method: 'POST', body: { direction: 'saida', channel: t.channel, body: text, attachments: atts } });
        ta.value = ''; atts = []; renderAtts(); UI.ok(r.message);
        await this.open(t.id); this.list(); this.renderViews();
      } catch (e) { UI.err(e); } finally { send.disabled = false; }
    };
    send.onclick = submit;
    ta.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') pop.hidden = true; };
    if (!ta.disabled) setTimeout(() => ta.focus(), 50);
  },

  templateDialog(t, err, done) {
    const m = UI.modal({ title: 'Fora da janela de 24 horas', size: 'narrow', body: \`<div class="alert warning">\${UI.esc(err.message)}</div>
      <form id="tplForm">\${UI.field('name', 'Nome do modelo aprovado', UI.input('name', '', 'required placeholder="ex.: retorno_atendimento"'), { required: true, hint: 'O modelo precisa estar aprovado na conta do WhatsApp Business.' })}\${UI.field('language', 'Idioma', UI.input('language', 'pt_BR'))}</form>
      <p class="small muted">Alternativa: use "Abrir no WhatsApp" no menu e registre a mensagem manualmente.</p>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="tplForm">Enviar modelo</button>\` });
    m.el.querySelector('#tplForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target); try { const r = await api('/whatsapp/send', { method: 'POST', body: { customer_id: t.customer_id, ticket_id: t.id, template: { name: d.name, language: d.language || 'pt_BR' } } }); UI.ok(r.message); m.close(); done(); } catch (e2) { UI.showErrors(e.target, e2); } };
  },

  // ---------- Contexto (direita) ----------
  context(ctx, r, { canAct, mgr }) {
    const t = r.ticket, c = r.customer || {};
    const opps = r.opportunities || [], openOpp = opps.filter((o) => o.stage_kind === 'open');
    const openTasks = (r.tasks || []).filter((x) => !x.done_at), custTasks = r.customer_tasks || [];
    const inbox = this.el.querySelector('#inbox');
    ctx.innerHTML = \`<div class="ctx-sec"><h4><span>Cliente</span><span class="flex"><button class="icon-btn mobile-back" id="ctxClose" aria-label="Fechar">\${UI.icons.x}</button><a href="#/clientes/\${t.customer_id}" class="small">Ficha completa</a></span></h4>
        <dl class="def-list"><dt>Telefone</dt><dd>\${UI.esc(UI.fmtPhone(c.phone) || '\u2014')}</dd><dt>E-mail</dt><dd>\${UI.esc(c.email || '\u2014')}</dd><dt>Empresa</dt><dd>\${UI.esc(c.company || '\u2014')}</dd><dt>Origem</dt><dd>\${UI.esc(c.source || '\u2014')}</dd><dt>Respons\xE1vel</dt><dd>\${UI.esc(c.owner_name || '\u2014')}</dd>\${(c.tags || []).length ? \`<dt>Etiquetas</dt><dd>\${UI.tags(c.tags)}</dd>\` : ''}</dl>
        \${c.notes ? \`<p class="small muted mt-s" style="white-space:pre-wrap">\${UI.esc(c.notes)}</p>\` : ''}
        <div class="flex mt-s"><button class="btn secondary xs" id="ctxEditCust">\${UI.icons.edit} Editar</button>\${t.customer_phone_digits ? \`<a class="btn secondary xs" href="\${UI.waLink(t.customer_phone_digits)}" target="_blank" rel="noopener" title="Abre o WhatsApp fora do CRM; sem sincroniza\xE7\xE3o de mensagens">\${UI.icons.external} WhatsApp</a>\` : ''}</div></div>
      <div class="ctx-sec"><h4><span>Atendimento</span></h4><dl class="def-list"><dt>Assunto</dt><dd>\${UI.esc(t.subject)}</dd><dt>Abertura</dt><dd>\${UI.fmtDateTime(t.opened_at)}</dd><dt>1\xAA resposta</dt><dd>\${t.first_response_at ? \`\${UI.fmtDuration((new Date(t.first_response_at) - new Date(t.opened_at)) / 1000)}\` : '<span class="muted">pendente</span>'}</dd>\${t.closed_at ? \`<dt>Encerrado</dt><dd>\${UI.fmtDateTime(t.closed_at)}</dd>\` : ''}\${t.follow_up_at ? \`<dt>Retorno</dt><dd class="\${new Date(t.follow_up_at) < Date.now() ? 'text-danger' : ''}">\${UI.fmtDateTime(t.follow_up_at)}</dd>\` : ''}<dt>Aberto por</dt><dd>\${UI.esc(t.created_by_name || 'WhatsApp')}</dd></dl>\${t.description ? \`<p class="small mt-s" style="white-space:pre-wrap">\${UI.esc(t.description)}</p>\` : ''}</div>
      <div class="ctx-sec"><h4><span>Negocia\xE7\xE3o</span><button class="btn link small" id="ctxNewOpp">+ Nova</button></h4>
        \${openOpp.length ? openOpp.map((o) => \`<div class="ctx-item" data-opp="\${o.id}"><div class="t"><a href="#/funil/\${o.id}" data-opp-open="\${o.id}">\${UI.esc(o.title)}</a><span>\${UI.fmtMoney(o.value)}</span></div>
          <div class="flex mt-s"><select data-opp-stage="\${o.id}" data-version="\${o.version}" aria-label="Etapa" style="min-height:28px;padding:.15rem .4rem;font-size:12.5px">\${this.stagesFor(o).map((s) => \`<option value="\${s.id}" \${s.id === o.stage_id ? 'selected' : ''}>\${UI.esc(s.name)}</option>\`).join('')}</select></div>
          <div class="muted xs mt-s">\${o.owner_name ? UI.esc(o.owner_name) : 'sem respons\xE1vel'}\${o.next_action ? \` \xB7 pr\xF3x.: \${UI.esc(o.next_action)}\${o.next_action_at ? \` (\${UI.fmtDate(o.next_action_at)})\` : ''}\` : ' \xB7 <span class="text-warning">sem pr\xF3xima a\xE7\xE3o</span>'}</div></div>\`).join('')
        : \`<p class="muted small">Nenhuma negocia\xE7\xE3o aberta.\${opps.length ? \` \${opps.length} encerrada(s) na ficha do cliente.\` : ''} A etapa comercial \xE9 independente do status do atendimento.</p>\`}</div>
      <div class="ctx-sec"><h4><span>Tarefas</span><button class="btn link small" id="ctxNewTask">+ Nova</button></h4>
        \${[...openTasks, ...custTasks].length ? [...openTasks, ...custTasks].map((x) => \`<div class="task-row"><input type="checkbox" data-task-done="\${x.id}" aria-label="Concluir"><div><div class="t">\${UI.esc(x.title)}</div><div class="s \${x.due_at && new Date(x.due_at) < Date.now() ? 'text-danger' : ''}">\${x.due_at ? UI.fmtDateTime(x.due_at) : 'sem prazo'}\${x.assignee_name ? \` \xB7 \${UI.esc(x.assignee_name.split(' ')[0])}\` : ''}\${x.due_at && new Date(x.due_at) < Date.now() ? ' \xB7 atrasada' : ''}</div></div></div>\`).join('') : '<p class="muted small">Nenhuma tarefa pendente.</p>'}</div>
      <div class="ctx-sec"><h4><span>Anexos (\${(r.attachments || []).length})</span></h4>\${(r.attachments || []).length ? (r.attachments || []).map((a) => \`<div class="small"><a href="\${a.url || \`\${window.API_BASE || ''}/api/tickets/\${t.id}/attachments/\${a.id}\`}" target="_blank" rel="noopener" \${a.url ? \`download="\${UI.attr(a.name)}"\` : ''}>\${UI.icons.paperclip} \${UI.esc(a.name)}</a> <span class="muted xs">\${UI.fmtDate(a.created_at)}</span></div>\`).join('') : '<p class="muted small">Nenhum anexo nesta conversa.</p>'}</div>
      <div class="ctx-sec"><h4><span>Outros atendimentos</span></h4>\${(r.customer_tickets || []).length ? (r.customer_tickets || []).map((x) => \`<div class="small"><a href="#/atendimentos/\${x.id}"><span class="mono">\${UI.esc(x.protocol)}</span></a> \${UI.esc(x.subject)} \${UI.statusBadge(x.status, true)}</div>\`).join('') : '<p class="muted small">Primeiro atendimento deste cliente.</p>'}</div>\`;
    ctx.querySelector('#ctxClose').onclick = () => inbox.classList.remove('m-ctx');
    const done = () => { this.open(t.id, { keepDraft: true }); };
    ctx.querySelector('#ctxEditCust').onclick = () => CRM.pages.customers.form(c, done);
    ctx.querySelector('#ctxNewOpp').onclick = () => CRM.pages.pipeline.form({ customer: { id: t.customer_id, name: t.customer_name }, ticket_id: t.id }, done);
    ctx.querySelector('#ctxNewTask').onclick = () => CRM.pages.tasks.form({ customer_id: t.customer_id, customer_name: t.customer_name, ticket_id: t.id, assignee_id: t.assignee_id || CRM.user.id }, done);
    ctx.querySelectorAll('[data-task-done]').forEach((cb) => cb.onchange = async () => { try { await api(\`/tasks/\${cb.dataset.taskDone}\`, { method: 'PUT', body: { done: true } }); UI.ok('Tarefa conclu\xEDda.'); done(); } catch (e) { UI.err(e); cb.checked = false; } });
    ctx.querySelectorAll('[data-opp-open]').forEach((a) => a.onclick = (e) => { e.preventDefault(); CRM.pages.pipeline.detail(Number(a.dataset.oppOpen), { onChange: done }); });
    ctx.querySelectorAll('[data-opp-stage]').forEach((sel) => sel.onchange = async () => {
      const o = openOpp.find((x) => x.id === Number(sel.dataset.oppStage)); const st = this.stagesFor(o).find((s) => s.id === Number(sel.value));
      await CRM.pages.pipeline.move(o.id, st.id, st.kind, o.version, done); done();
    });
  },
  stagesFor(o) { const all = (CRM._settingsFull && CRM._settingsFull.stages) || []; return all.filter((s) => s.active && s.pipeline_id === o.pipeline_id); },

  // ---------- A\xE7\xF5es ----------
  async claim(id, after) {
    try { const r = await api(\`/tickets/\${id}/claim\`, { method: 'POST' }); UI.ok(r.message); if (after) after(); else location.hash = \`#/atendimentos/\${id}\`; }
    catch (err) { UI.toast(err.message, 'warning', 6000); if (after) after(); }
  },

  async action(act, t, status, done) {
    try {
      if (act === 'claim') return this.claim(t.id, done);
      if (act === 'release') { if (!(await UI.confirm('Devolver este atendimento \xE0 fila de espera?'))) return; const r = await api(\`/tickets/\${t.id}/release\`, { method: 'POST' }); UI.ok(r.message); return done(); }
      if (act === 'reopen') { const note = await UI.prompt('Motivo da reabertura (opcional)', { title: 'Reabrir atendimento', required: false }); if (note === null) return; const r = await api(\`/tickets/\${t.id}/reopen\`, { method: 'POST', body: { note: note || undefined } }); UI.ok(r.message); return done(); }
      if (act === 'status') {
        const label = UI.STATUS[status].label; let note;
        if (status === 'resolvido' || status === 'cancelado') { note = await UI.prompt(\`\${status === 'resolvido' ? 'Resumo da solu\xE7\xE3o' : 'Motivo do cancelamento'} (opcional)\`, { title: \`Marcar como \${label}\`, required: false, multiline: true }); if (note === null) return; }
        const r = await api(\`/tickets/\${t.id}/status\`, { method: 'POST', body: { status, note: note || undefined, version: t.version } }); UI.ok(r.message); return done();
      }
      if (act === 'transfer') {
        const opts = CRM.users.filter((u) => u.id !== t.assignee_id && u.active !== false);
        const m = UI.modal({ title: 'Transferir atendimento', size: 'narrow', body: \`<form id="trForm">\${UI.field('to_user_id', 'Novo respons\xE1vel', UI.select('to_user_id', opts.map((u) => [u.id, \`\${u.name} (\${UI.ROLE[u.role]})\${u.role === 'atendente' && !u.available ? ' \u2014 indispon\xEDvel' : ''}\`]), '', 'data-type="int" required'), { required: true })}\${UI.field('reason', 'Motivo', UI.input('reason', '', 'placeholder="Opcional"'))}<input type="hidden" name="version" value="\${t.version}" data-type="int"></form>\`,
          footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="trForm">Transferir</button>\` });
        m.el.querySelector('#trForm').onsubmit = async (e) => { e.preventDefault(); try { const r = await api(\`/tickets/\${t.id}/transfer\`, { method: 'POST', body: UI.formData(e.target) }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.showErrors(e.target, err); } };
        return;
      }
      if (act === 'followup') {
        const def = t.follow_up_at || new Date(Date.now() + 86400000).toISOString();
        const m = UI.modal({ title: 'Agendar retorno', size: 'narrow', body: \`<form id="fuForm">\${UI.field('at', 'Data e hora do retorno', \`<input type="datetime-local" name="at" value="\${UI.toLocalInput(def)}" required>\`, { required: true, hint: 'Uma tarefa de retorno \xE9 criada para o respons\xE1vel; ela \xE9 encerrada automaticamente se o cliente responder antes.' })}
          <div class="chips mb-s">\${[['Amanh\xE3 9h', 1, 9], ['Em 2 dias', 2, 9], ['Pr\xF3x. semana', 7, 9]].map(([l, d, h]) => \`<button type="button" class="chip" data-d="\${d}" data-h="\${h}">\${l}</button>\`).join('')}</div>
          \${UI.field('note', 'Observa\xE7\xE3o', UI.input('note', '', 'placeholder="Opcional"'))}</form>\`,
          footer: \`\${t.follow_up_at ? '<button class="btn ghost" id="clearFu">Remover agendamento</button>' : ''}<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="fuForm">Agendar</button>\` });
        m.el.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { const d = new Date(); d.setDate(d.getDate() + Number(b.dataset.d)); d.setHours(Number(b.dataset.h), 0, 0, 0); m.el.querySelector('[name=at]').value = UI.toLocalInput(d); });
        m.el.querySelector('#fuForm').onsubmit = async (e) => { e.preventDefault(); try { const d = UI.formData(e.target); const r = await api(\`/tickets/\${t.id}/follow-up\`, { method: 'POST', body: { at: d.at, note: d.note || undefined } }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.showErrors(e.target, err); } };
        const cl = m.el.querySelector('#clearFu'); if (cl) cl.onclick = async () => { try { const r = await api(\`/tickets/\${t.id}/follow-up\`, { method: 'POST', body: { at: null } }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.err(err); } };
        return;
      }
      if (act === 'edit') {
        const m = UI.modal({ title: 'Editar atendimento', body: \`<form id="edForm">\${UI.field('subject', 'Assunto', UI.input('subject', t.subject, 'required'), { required: true })}<div class="form-row">\${UI.field('channel', 'Canal', UI.select('channel', (this.channels || [t.channel]).map((c) => [c, c]), t.channel))}\${UI.field('priority', 'Prioridade', UI.select('priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), t.priority))}</div>\${UI.field('description', 'Descri\xE7\xE3o', UI.textarea('description', t.description, 'data-type="nullable"'))}<input type="hidden" name="version" value="\${t.version}" data-type="int"></form>\`,
          footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="edForm">Salvar</button>\` });
        m.el.querySelector('#edForm').onsubmit = async (e) => { e.preventDefault(); try { const r = await api(\`/tickets/\${t.id}\`, { method: 'PUT', body: UI.formData(e.target) }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.showErrors(e.target, err); } };
      }
    } catch (err) { UI.err(err); if (err.status === 409) done(); }
  },

  // ---------- Abrir atendimento ----------
  async form({ customer } = {}, onSaved) {
    if (!this.channels) { const s = await CRM.settingsFull(); this.channels = s ? s.settings.channels : ['WhatsApp', 'Telefone', 'E-mail']; }
    const assigneeOpts = CRM.isManager() ? UI.userOptions(CRM.users, { blank: '\u2014 Deixar na fila \u2014' }) : [['', '\u2014 Deixar na fila \u2014'], [CRM.user.id, \`\${CRM.user.name} (eu)\`]];
    const m = UI.modal({ title: 'Abrir atendimento', body: \`<form id="tkForm">
      \${UI.field('customer_id', 'Cliente', \`<div class="flex"><input id="custSearch" placeholder="Digite para buscar o cliente\u2026" autocomplete="off" value="\${UI.attr(customer ? customer.name : '')}" \${customer ? 'readonly' : ''} class="grow"><input type="hidden" name="customer_id" data-type="int" value="\${customer ? customer.id : ''}">\${customer ? '' : '<button type="button" class="btn secondary sm" id="newCust">+ Novo</button>'}</div><div class="search-results" id="custResults" hidden style="position:relative"></div>\`, { required: true })}
      \${UI.field('subject', 'Assunto', UI.input('subject', '', 'required maxlength="200"'), { required: true })}
      <div class="form-row cols-3">\${UI.field('channel', 'Canal', UI.select('channel', this.channels.map((c) => [c, c]), this.channels[0]), { required: true })}
        \${UI.field('priority', 'Prioridade', UI.select('priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), 'normal'))}
        \${UI.field('assignee_id', 'Respons\xE1vel', UI.select('assignee_id', assigneeOpts, CRM.user.role === 'atendente' ? CRM.user.id : '', 'data-type="int"'))}</div>
      \${UI.field('first_message', 'Mensagem do cliente', UI.textarea('first_message', '', 'placeholder="O que o cliente disse ao entrar em contato (registrada como mensagem recebida)"'))}
      \${UI.field('description', 'Contexto interno', UI.textarea('description', '', 'data-type="nullable" placeholder="Opcional: observa\xE7\xF5es vis\xEDveis s\xF3 para a equipe" rows="2"'))}
      <label class="check"><input type="checkbox" name="auto_assign"> Distribuir automaticamente em rod\xEDzio (se ningu\xE9m for escolhido)</label></form>\`,
      footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="tkForm">Abrir atendimento</button>\` });
    const form = m.el.querySelector('#tkForm');
    if (!customer) this.customerPicker(form.querySelector('#custSearch'), form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form); if (!d.customer_id) { UI.showErrors(form, new ApiError(400, { fields: { customer_id: 'Selecione um cliente.' } })); return; }
      if (!d.first_message) delete d.first_message;
      try { const r = await api('/tickets', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.ticket); else location.hash = \`#/atendimentos/\${r.ticket.id}\`; } catch (err) { UI.showErrors(form, err); }
    };
  },

  customerPicker(input, box, hidden, modal) {
    const run = UI.debounce(async () => {
      const q = input.value.trim(); if (q.length < 2) { box.hidden = true; return; }
      const r = await api('/customers', { query: { q, limit: 8 } });
      box.innerHTML = r.customers.length ? r.customers.map((c) => \`<a href="#" data-id="\${c.id}" data-name="\${UI.attr(c.name)}"><strong>\${UI.esc(c.name)}</strong> <span class="muted small">\${UI.esc(UI.fmtPhone(c.phone))} \${UI.esc(c.company || '')}</span></a>\`).join('') : '<div class="cat">Nenhum cliente encontrado</div>';
      box.hidden = false;
    }, 250);
    input.oninput = () => { hidden.value = ''; run(); };
    box.onclick = (e) => { e.preventDefault(); const a = e.target.closest('a'); if (!a) return; hidden.value = a.dataset.id; input.value = a.dataset.name; box.hidden = true; };
    const nb = modal.el.querySelector('#newCust'); if (nb) nb.onclick = () => CRM.pages.customers.form(null, (c) => { hidden.value = c.id; input.value = c.name; });
  },

  // ---------- Vis\xE3o em tabela (supervis\xE3o) ----------
  async table(el, query) {
    this.tq = { ...query }; delete this.tq.tabela;
    this.page = Number(query.page) || 1;
    el.innerHTML = CRM.pageHeader('Atendimentos', 'Vis\xE3o em tabela para supervis\xE3o: filtros, ordena\xE7\xE3o, colunas e exporta\xE7\xE3o.',
      \`<a class="btn secondary" href="#/atendimentos">\${UI.icons.inbox} <span class="lbl">Central de conversas</span></a>\${CRM.isManager() ? \`<button class="btn secondary" id="btnDistribute" title="Distribui a fila sem respons\xE1vel em rod\xEDzio">\${UI.icons.repeat} <span class="lbl">Distribuir fila</span></button>\` : ''}<button class="btn secondary" id="btnExport">\${UI.icons.download} <span class="lbl">Exportar CSV</span></button><button class="btn" id="btnNew">\${UI.icons.plus} <span class="lbl">Abrir atendimento</span></button>\`) +
    \`<div class="card"><div id="savedBox" class="mb-s"></div><form class="filters" id="filters">
      <div class="field grow"><label>Busca</label><input name="q" value="\${UI.attr(query.q || '')}" placeholder="Protocolo, assunto, cliente ou telefone"></div>
      <div class="field"><label>Vis\xE3o</label>\${UI.select('view', [['', 'Todas'], ['open', 'Abertos'], ['queue', 'Fila'], ['mine', 'Meus'], ['unanswered', 'Sem resposta'], ['overdue', 'Prazo vencido'], ['waiting_customer', 'Aguardando cliente'], ['follow_up_overdue', 'Retorno vencido'], ['closed', 'Encerrados']], query.view)}</div>
      <div class="field"><label>Status</label>\${UI.select('status', [['', 'Todos'], ...Object.entries(UI.STATUS).map(([k, v]) => [k, v.label])], query.status)}</div>
      <div class="field"><label>Prioridade</label>\${UI.select('priority', [['', 'Todas'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], query.priority)}</div>
      <div class="field"><label>Canal</label>\${UI.select('channel', [['', 'Todos'], ...this.channels.map((c) => [c, c])], query.channel)}</div>
      \${CRM.isManager() ? \`<div class="field"><label>Respons\xE1vel</label>\${UI.select('assignee_id', [['', 'Todos'], ['none', 'Sem respons\xE1vel'], ...CRM.users.map((u) => [u.id, u.name])], query.assignee_id)}</div>\` : ''}
      <div class="field"><label>De</label><input type="date" name="from" value="\${UI.attr(query.from || '')}"></div><div class="field"><label>At\xE9</label><input type="date" name="to" value="\${UI.attr(query.to || '')}"></div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/atendimentos?tabela=1">Limpar</a></form><div id="list"></div></div>\`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); location.hash = \`#/atendimentos?\${UI.qs({ tabela: 1, ...d })}\`; };
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.tableList());
    el.querySelector('#btnExport').onclick = () => UI.download(\`/tickets/export.csv?\${UI.qs(this.tq)}\`);
    const dist = el.querySelector('#btnDistribute'); if (dist) dist.onclick = async () => { try { const r = await api('/tickets/distribute', { method: 'POST' }); UI.toast(r.message, r.assigned ? 'success' : 'warning'); this.tableList(); } catch (err) { UI.err(err); } };
    UI.savedFilters(el.querySelector('#savedBox'), { scope: 'tickets', current: () => this.tq, onApply: (p) => { location.hash = \`#/atendimentos?\${UI.qs({ tabela: 1, ...p })}\`; } });
    await this.tableList();
  },

  async tableList() {
    const box = this.el.querySelector('#list'); if (!box) return;
    const q = { ...this.tq, page: this.page, limit: 25 };
    if (!q.view && !q.status) q.open = 'true';
    const r = await api('/tickets', { query: q });
    const late = (t) => t.awaiting_reply && t.response_due_at && new Date(t.response_due_at) < Date.now();
    UI.table(box, { id: 'tickets', rows: r.tickets, total: r.total, page: r.page, limit: r.limit, sort: q.sort, dir: q.dir,
      columns: [
        { key: 'protocol', label: 'Protocolo', sortable: true, nowrap: true, render: (t) => \`<span class="mono">\${UI.esc(t.protocol)}</span>\` },
        { key: 'customer_name', label: 'Cliente', sortable: true, min: '180px', render: (t) => \`<span class="trunc strong" title="\${UI.attr(t.customer_name)}">\${UI.esc(t.customer_name)}</span><span class="trunc muted small">\${UI.esc(UI.fmtPhone(t.customer_phone))}</span>\` },
        { key: 'subject', label: 'Assunto', sortable: true, min: '200px', render: (t) => \`<span class="trunc" title="\${UI.attr(t.subject)}">\${UI.esc(t.subject)}</span>\` },
        { key: 'last_message_preview', label: '\xDAltima mensagem', default: false, min: '200px', render: (t) => \`<span class="trunc muted" title="\${UI.attr(t.last_message_preview || '')}">\${UI.esc(t.last_message_preview || '')}</span>\` },
        { key: 'channel', label: 'Canal', sortable: true, nowrap: true, render: (t) => \`\${UI.channelIcon(t.channel)} \${UI.esc(t.channel)}\` },
        { key: 'priority', label: 'Prioridade', sortable: true, render: (t) => UI.priorityBadge(t.priority) },
        { key: 'status', label: 'Status', sortable: true, render: (t) => UI.statusBadge(t.status) },
        { key: 'assignee_name', label: 'Respons\xE1vel', sortable: true, nowrap: true, render: (t) => UI.esc(t.assignee_name || '\u2014') },
        { key: 'response_due_at', label: 'Prazo de resposta', sortable: true, nowrap: true, render: (t) => t.awaiting_reply ? \`<span class="\${late(t) ? 'text-danger strong' : ''}">\${late(t) ? 'vencido ' : 'at\xE9 '}\${UI.fmtDateTime(t.response_due_at)}</span>\` : '<span class="muted">\u2014</span>' },
        { key: 'last_message_at', label: '\xDAltima msg.', sortable: true, nowrap: true, default: false, render: (t) => UI.fmtDateTime(t.last_message_at) },
        { key: 'opened_at', label: 'Abertura', sortable: true, nowrap: true, render: (t) => \`<span title="\${UI.fmtDateTime(t.opened_at)}">\${UI.fmtDateTime(t.opened_at)}</span>\` },
        { key: 'closed_at', label: 'Encerramento', sortable: false, nowrap: true, default: false, render: (t) => UI.fmtDateTime(t.closed_at) },
        { key: 'follow_up_at', label: 'Retorno', sortable: true, nowrap: true, render: (t) => t.follow_up_at ? \`<span class="\${new Date(t.follow_up_at) < Date.now() ? 'text-danger strong' : ''}">\${UI.fmtDateTime(t.follow_up_at)}</span>\` : '' },
        { key: 'unread_count', label: 'N\xE3o lidas', align: 'right', default: false, render: (t) => t.unread_count || '' },
        { key: 'actions', label: '', render: (t) => t.status === 'aguardando' && (!t.assignee_id || t.assignee_id === CRM.user.id) ? \`<button class="btn sm success" data-claim="\${t.id}">Assumir</button>\` : '' },
      ],
      onSort: (sort, dir) => { this.tq.sort = sort; this.tq.dir = dir; this.tableList(); },
      onPage: (p) => { this.page = p; this.tableList(); },
      onRow: (t) => { location.hash = \`#/atendimentos/\${t.id}\`; },
      rowClass: (t) => (late(t) ? 'late' : ''),
      empty: UI.empty('Nenhum atendimento encontrado', 'Ajuste os filtros ou abra um novo atendimento.') });
    box.querySelectorAll('[data-claim]').forEach((b) => b.onclick = () => this.claim(Number(b.dataset.claim), () => this.tableList()));
  },

  onRealtime() { if (this.query && this.query.tabela) return this.tableList(); this.list(); this.renderViews(); if (this.id) this.open(this.id, { keepDraft: true }); },
};
`, "/js/ui.js": `'use strict';
// Utilit\xE1rios de interface: escape HTML, formata\xE7\xE3o (pt-BR), \xEDcones, toasts, modais, painel lateral, menus e tabelas.
const UI = {};

UI.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
UI.attr = UI.esc;

// ---------- Formata\xE7\xE3o ----------
UI.fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '\u2014');
UI.fmtDateTime = (d) => (d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014');
UI.fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
// Hor\xE1rio curto para listas: hoje \u2192 hora; esta semana \u2192 dia; sen\xE3o \u2192 dd/mm.
UI.fmtShort = (d) => {
  if (!d) return ''; const x = new Date(d), now = new Date();
  if (x.toDateString() === now.toDateString()) return UI.fmtTime(x);
  const diff = (now - x) / 86400000;
  if (diff < 6) return x.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return x.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
UI.fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
UI.fmtMoneyShort = (v) => { v = Number(v || 0); if (Math.abs(v) >= 1e6) return \`R$ \${(v / 1e6).toFixed(1).replace('.', ',')} mi\`; if (Math.abs(v) >= 1e4) return \`R$ \${(v / 1e3).toFixed(1).replace('.', ',')} mil\`; return UI.fmtMoney(v); };
UI.fmtDuration = (s) => {
  if (s == null || isNaN(s)) return '\u2014';
  s = Math.round(Number(s));
  if (s < 60) return \`\${s}s\`;
  const m = Math.round(s / 60); if (m < 60) return \`\${m} min\`;
  const h = s / 3600; if (h < 48) return \`\${h.toFixed(1).replace('.', ',')} h\`;
  return \`\${(h / 24).toFixed(1).replace('.', ',')} dias\`;
};
UI.relative = (d) => {
  if (!d) return '\u2014';
  const diff = (new Date(d) - Date.now()) / 1000; const abs = Math.abs(diff);
  const f = (n, u) => \`\${diff < 0 ? 'h\xE1' : 'em'} \${n} \${u}\`;
  if (abs < 60) return diff < 0 ? 'agora' : 'em instantes';
  if (abs < 3600) return f(Math.round(abs / 60), 'min');
  if (abs < 86400) return f(Math.round(abs / 3600), 'h');
  return f(Math.round(abs / 86400), abs < 172800 ? 'dia' : 'dias');
};
UI.toLocalInput = (d) => { if (!d) return ''; const x = new Date(d); const p = (n) => String(n).padStart(2, '0'); return \`\${x.getFullYear()}-\${p(x.getMonth() + 1)}-\${p(x.getDate())}T\${p(x.getHours())}:\${p(x.getMinutes())}\`; };
UI.fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
UI.initials = (name) => String(name || '?').split(/\\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
UI.waLink = (phoneDigits) => (phoneDigits ? \`https://wa.me/\${phoneDigits}\` : null);
UI.digits = (s) => String(s || '').replace(/\\D+/g, '');
UI.phoneDigits = (phone) => { const d = UI.digits(phone); if (!d) return null; return d.length <= 11 ? '55' + d : d; };
UI.fmtPhone = (p) => { const d = UI.digits(p); if (d.length === 13 && d.startsWith('55')) return \`(\${d.slice(2, 4)}) \${d.slice(4, 9)}-\${d.slice(9)}\`; if (d.length === 12 && d.startsWith('55')) return \`(\${d.slice(2, 4)}) \${d.slice(4, 8)}-\${d.slice(8)}\`; if (d.length === 11) return \`(\${d.slice(0, 2)}) \${d.slice(2, 7)}-\${d.slice(7)}\`; if (d.length === 10) return \`(\${d.slice(0, 2)}) \${d.slice(2, 6)}-\${d.slice(6)}\`; return p || ''; };
UI.avatar = (name, cls = '') => \`<span class="avatar \${cls}" title="\${UI.attr(name || '')}">\${UI.esc(UI.initials(name))}</span>\`;
UI.plural = (n, s, p) => \`\${n} \${n === 1 ? s : p}\`;

UI.STATUS = {
  aguardando: { label: 'Aguardando atendimento', short: 'Na fila', cls: 'warning' }, em_atendimento: { label: 'Em atendimento', short: 'Em atendimento', cls: 'primary' },
  aguardando_cliente: { label: 'Aguardando cliente', short: 'Aguard. cliente', cls: 'purple' }, resolvido: { label: 'Resolvido', short: 'Resolvido', cls: 'success' }, cancelado: { label: 'Cancelado', short: 'Cancelado', cls: 'dark' },
};
UI.PRIORITY = { baixa: { label: 'Baixa', cls: 'outline' }, normal: { label: 'Normal', cls: 'info' }, alta: { label: 'Alta', cls: 'warning' }, urgente: { label: 'Urgente', cls: 'danger' } };
UI.ROLE = { admin: 'Administrador', supervisor: 'Supervisor', atendente: 'Atendente' };
UI.statusBadge = (s, short) => { const m = UI.STATUS[s] || { label: s, cls: '' }; return \`<span class="badge \${m.cls}">\${UI.esc(short ? m.short : m.label)}</span>\`; };
UI.priorityBadge = (p) => { const m = UI.PRIORITY[p] || { label: p, cls: '' }; return \`<span class="badge \${m.cls}">\${UI.esc(m.label)}</span>\`; };
UI.stageBadge = (name, kind) => \`<span class="badge \${kind === 'won' ? 'success' : kind === 'lost' ? 'danger' : 'primary'}">\${UI.esc(name)}</span>\`;
UI.tags = (list) => (list || []).map((t) => \`<span class="tag">\${UI.esc(t)}</span>\`).join('');

// ---------- \xCDcones (fam\xEDlia \xFAnica, tra\xE7o 1.8) ----------
const I = (d, extra = '') => \`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" \${extra}>\${d}</svg>\`;
UI.icons = {
  dashboard: I('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
  customers: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  tickets: I('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  pipeline: I('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'),
  tasks: I('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  reports: I('<path d="M18 20V10M12 20V4M6 20v-6"/>'),
  settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  search: I('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'),
  bell: I('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  menu: I('<path d="M3 12h18M3 6h18M3 18h18"/>'),
  close: I('<path d="M18 6L6 18M6 6l12 12"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  check: I('<path d="M20 6L9 17l-5-5"/>'),
  checkDouble: I('<path d="M18 6L7 17l-4-4"/><path d="M22 10l-7.5 7.5"/>'),
  clock: I('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  alert: I('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
  info: I('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  help: I('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>'),
  more: I('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  chevronLeft: I('<path d="M15 18l-6-6 6-6"/>'), chevronRight: I('<path d="M9 18l6-6-6-6"/>'), chevronDown: I('<path d="M6 9l6 6 6-6"/>'), chevronUp: I('<path d="M18 15l-6-6-6 6"/>'),
  arrowLeft: I('<path d="M19 12H5M12 19l-7-7 7-7"/>'), arrowRight: I('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  edit: I('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  trash: I('<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  send: I('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>'),
  note: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>'),
  paperclip: I('<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  zap: I('<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'),
  calendar: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  user: I('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  userPlus: I('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>'),
  phone: I('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  mail: I('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>'),
  message: I('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  globe: I('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  building: I('<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 6h.01M12 10h.01M12 14h.01"/>'),
  external: I('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>'),
  filter: I('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'),
  columns: I('<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/>'),
  list: I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  board: I('<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>'),
  inbox: I('<path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
  save: I('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  download: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  upload: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  refresh: I('<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
  play: I('<path d="M5 3l14 9-14 9V3z"/>'), pause: I('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
  tag: I('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>'),
  dollar: I('<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  flag: I('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'),
  eye: I('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  lock: I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  logout: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  sidebar: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  x: I('<path d="M18 6L6 18M6 6l12 12"/>'),
  minus: I('<path d="M5 12h14"/>'),
  repeat: I('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  users: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  whatsapp: I('<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>'),
  circle: I('<circle cx="12" cy="12" r="9"/>'),
  checkCircle: I('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'),
  xCircle: I('<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>'),
  sort: I('<path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/>'),
  grip: I('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'),
  arrowUp: I('<path d="M12 19V5M5 12l7-7 7 7"/>'), arrowDown: I('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
  target: I('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  handshake: I('<path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 0 0 0-7.65z"/>'),
  copy: I('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  file: I('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>'),
  image: I('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
};
UI.channelIcon = (ch) => { const c = String(ch || '').toLowerCase(); if (c.includes('whats')) return UI.icons.whatsapp; if (c.includes('tele') || c.includes('fone')) return UI.icons.phone; if (c.includes('mail')) return UI.icons.mail; if (c.includes('chat')) return UI.icons.message; if (c.includes('presen')) return UI.icons.building; if (c.includes('site') || c.includes('insta')) return UI.icons.globe; return UI.icons.message; };
UI.help = (text) => \`<span class="help-icon" tabindex="0" data-help="\${UI.attr(text)}" aria-label="Como \xE9 calculado">\${UI.icons.help}</span>\`;

// ---------- Toasts ----------
UI.toast = (msg, type = 'info', ms = 4000) => {
  const el = document.createElement('div'); el.className = \`toast \${type}\`; el.textContent = msg; el.setAttribute('role', 'status');
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
};
UI.ok = (m) => UI.toast(m, 'success');
UI.err = (e) => UI.toast(e instanceof Error ? e.message : String(e), 'error', 6000);
UI.empty = (title, text, action = '') => \`<div class="empty"><strong>\${UI.esc(title)}</strong>\${text ? UI.esc(text) : ''}\${action ? \`<div class="mt-s">\${action}</div>\` : ''}</div>\`;

// ---------- Modal ----------
UI.modal = ({ title, body, footer, size = '', onClose }) => {
  const back = document.createElement('div'); back.className = 'modal-backdrop';
  back.innerHTML = \`<div class="modal \${size}" role="dialog" aria-modal="true" aria-label="\${UI.attr(title)}">
    <div class="modal-header"><h2>\${UI.esc(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">\${UI.icons.close}</button></div>
    <div class="modal-body">\${body}</div>
    \${footer !== null ? \`<div class="modal-footer">\${footer || ''}</div>\` : ''}
  </div>\`;
  const prev = document.activeElement;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); if (prev && prev.focus) prev.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = back.querySelector('input:not([type=hidden]):not([readonly]), select, textarea, button:not([data-close])'); if (first) first.focus();
  return { el: back, close };
};

// Painel lateral (drawer): mant\xE9m o contexto da tela por tr\xE1s.
UI.drawer = ({ title, body, footer, size = '', onClose }) => {
  const back = document.createElement('div'); back.className = 'drawer-backdrop';
  back.innerHTML = \`<aside class="drawer \${size}" role="dialog" aria-modal="true" aria-label="\${UI.attr(title)}">
    <div class="drawer-header"><h2 id="drawerTitle">\${UI.esc(title)}</h2><div class="flex" id="drawerHeadActions"></div><button class="icon-btn" data-close aria-label="Fechar">\${UI.icons.close}</button></div>
    <div class="drawer-body">\${body}</div>
    \${footer !== null ? \`<div class="drawer-footer">\${footer || ''}</div>\` : ''}
  </aside>\`;
  const prev = document.activeElement;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); if (prev && prev.focus) prev.focus(); };
  const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) close(); };
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = back.querySelector('.drawer-body button, .drawer-body input, .drawer-body a'); if (first) first.focus();
  return { el: back, close, body: back.querySelector('.drawer-body'), setTitle: (t) => { back.querySelector('#drawerTitle').textContent = t; } };
};

UI.confirm = (message, { title = 'Confirmar', okLabel = 'Confirmar', danger = false } = {}) => new Promise((resolve) => {
  const m = UI.modal({ title, size: 'narrow', body: \`<p>\${UI.esc(message)}</p>\`,
    footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn \${danger ? 'danger' : ''}" data-ok>\${UI.esc(okLabel)}</button>\`,
    onClose: () => resolve(false) });
  m.el.querySelector('[data-ok]').onclick = () => { resolve(true); m.el.querySelector('[data-close]').click(); };
});

UI.prompt = (message, { title = 'Informe', placeholder = '', required = true, multiline = false, value = '' } = {}) => new Promise((resolve) => {
  let done = false;
  const m = UI.modal({ title, size: 'narrow', body: \`<form id="promptForm"><div class="field"><label>\${UI.esc(message)}</label>
    \${multiline ? \`<textarea name="v" placeholder="\${UI.attr(placeholder)}">\${UI.esc(value)}</textarea>\` : \`<input name="v" value="\${UI.attr(value)}" placeholder="\${UI.attr(placeholder)}">\`}<div class="error"></div></div></form>\`,
    footer: \`<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="promptForm">Confirmar</button>\`,
    onClose: () => { if (!done) resolve(null); } });
  m.el.querySelector('#promptForm').onsubmit = (e) => {
    e.preventDefault(); const v = e.target.v.value.trim();
    if (required && !v) { e.target.querySelector('.error').textContent = 'Campo obrigat\xF3rio.'; return; }
    done = true; resolve(v); m.close();
  };
});

// Menu suspenso ancorado em um bot\xE3o. items: [{label, icon, onClick, danger, sep, head}]
UI.menu = (anchor, items, { align = 'right' } = {}) => {
  document.querySelectorAll('.menu').forEach((m) => m.remove());
  const wrap = anchor.closest('.menu-wrap') || anchor.parentElement;
  if (!wrap.classList.contains('menu-wrap')) { wrap.style.position = 'relative'; }
  const menu = document.createElement('div'); menu.className = \`menu \${align === 'left' ? 'left' : ''}\`; menu.setAttribute('role', 'menu');
  menu.innerHTML = items.map((it, i) => it.sep ? '<div class="sep"></div>' : it.head ? \`<div class="head">\${UI.esc(it.head)}</div>\` : it.href ? \`<a href="\${UI.attr(it.href)}" role="menuitem">\${it.icon ? UI.icons[it.icon] || '' : ''}\${UI.esc(it.label)}</a>\` : \`<button type="button" role="menuitem" data-i="\${i}" class="\${it.danger ? 'danger' : ''}" \${it.disabled ? 'disabled' : ''}>\${it.icon ? UI.icons[it.icon] || '' : ''}\${UI.esc(it.label)}</button>\`).join('');
  wrap.appendChild(menu);
  const close = () => { menu.remove(); document.removeEventListener('click', onDoc, true); document.removeEventListener('keydown', onKey); };
  const onDoc = (e) => { if (!menu.contains(e.target)) close(); else if (e.target.closest('a')) setTimeout(close, 10); };
  const onKey = (e) => { if (e.key === 'Escape') { close(); anchor.focus(); } };
  menu.querySelectorAll('button[data-i]').forEach((b) => b.onclick = () => { close(); items[Number(b.dataset.i)].onClick(); });
  setTimeout(() => { document.addEventListener('click', onDoc, true); document.addEventListener('keydown', onKey); const f = menu.querySelector('button, a'); if (f) f.focus(); }, 0);
  return { close };
};

// ---------- Formul\xE1rios ----------
UI.formData = (form) => {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'radio') { if (!el.checked) continue; v = el.value; }
    else if (el.type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (el.type === 'datetime-local') v = UI.fromLocalInput(el.value);
    else v = el.value.trim();
    const t = el.dataset.type;
    if (t === 'int') v = v === '' || v === null ? null : Number(v);
    if (t === 'tags') v = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (t === 'nullable' && v === '') v = null;
    if (t === 'money') v = v === '' || v === null ? 0 : Number(String(v).replace(/[R$\\s.]/g, '').replace(',', '.'));
    if (t === 'lines') v = v ? v.split('\\n').map((s) => s.trim()).filter(Boolean) : [];
    out[el.name] = v;
  }
  return out;
};

UI.showErrors = (form, err) => {
  form.querySelectorAll('.field.has-error').forEach((f) => { f.classList.remove('has-error'); const e = f.querySelector('.error'); if (e) e.textContent = ''; });
  const fields = (err && err.data && err.data.fields) || {};
  let focused = false;
  for (const [name, msg] of Object.entries(fields)) {
    const el = form.elements[name]; if (!el) continue;
    const field = el.closest('.field'); if (!field) continue;
    field.classList.add('has-error');
    let e = field.querySelector('.error'); if (!e) { e = document.createElement('div'); e.className = 'error'; field.appendChild(e); }
    e.textContent = msg;
    if (!focused) { el.focus(); focused = true; }
  }
  if (!Object.keys(fields).length && err) UI.err(err);
};

UI.field = (name, label, input, { required = false, hint = '' } = {}) => {
  const m = input.match(/^<(?:input|select|textarea)[^>]*\\sid="([^"]+)"/);
  const id = m ? m[1] : \`f_\${name}\`;
  const html = m ? input : input.replace(/^<(input|select|textarea)/, \`<$1 id="\${id}"\`);
  return \`<div class="field"><label for="\${id}">\${UI.esc(label)}\${required ? ' <span class="req">*</span>' : ''}</label>\${html}\${hint ? \`<div class="hint">\${UI.esc(hint)}</div>\` : ''}<div class="error"></div></div>\`;
};
UI.input = (name, value = '', attrs = '') => \`<input name="\${name}" value="\${UI.attr(value ?? '')}" \${attrs}>\`;
UI.select = (name, options, value, attrs = '') => \`<select name="\${name}" \${attrs}>\${options.map((o) => {
  const [v, l] = Array.isArray(o) ? o : [o, o];
  return \`<option value="\${UI.attr(v)}" \${String(v) === String(value ?? '') ? 'selected' : ''}>\${UI.esc(l)}</option>\`;
}).join('')}</select>\`;
UI.textarea = (name, value = '', attrs = '') => \`<textarea name="\${name}" \${attrs}>\${UI.esc(value ?? '')}</textarea>\`;
UI.userOptions = (users, { blank = '\u2014 Sem respons\xE1vel \u2014', filter } = {}) => [['', blank], ...users.filter((u) => u.active !== false && (!filter || filter(u))).map((u) => [u.id, u.name])];
UI.money = (v) => (v == null || v === '' ? '' : Number(v).toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.'));

UI.download = async (path) => {
  if (window.DEMO_STATIC) { try { const r = await api(path); const blob = new Blob([r.csv], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = r.filename || 'exportacao.csv'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { UI.err(e); } return; }
  const a = document.createElement('a'); a.href = (window.API_BASE || '') + '/api' + path; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
};
UI.debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
UI.readFile = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
UI.fmtBytes = (n) => (n < 1024 ? \`\${n} B\` : n < 1048576 ? \`\${(n / 1024).toFixed(0)} KB\` : \`\${(n / 1048576).toFixed(1)} MB\`);
UI.store = { get: (k, d) => { try { const v = localStorage.getItem('crm.' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } }, set: (k, v) => { try { localStorage.setItem('crm.' + k, JSON.stringify(v)); } catch (_) { /* ignore */ } } };
UI.qs = (obj) => { const qs = new URLSearchParams(); Object.entries(obj || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) qs.set(k, v === true ? 'true' : v); }); return qs.toString(); };

// ---------- Tabela gen\xE9rica: colunas selecion\xE1veis, ordena\xE7\xE3o, pagina\xE7\xE3o, truncamento ----------
// columns: [{ key, label, render(row), sortable, width, align, default (vis\xEDvel), min }]
UI.table = (box, { id, columns, rows, total, page = 1, limit = 25, sort, dir, onSort, onPage, onRow, empty, rowClass, rowAttrs }) => {
  const hiddenCols = new Set(UI.store.get(\`cols.\${id}\`, columns.filter((c) => c.default === false).map((c) => c.key)));
  const visible = columns.filter((c) => !hiddenCols.has(c.key));
  const pages = Math.max(1, Math.ceil((total ?? rows.length) / limit));
  const head = visible.map((c) => \`<th class="\${c.sortable ? 'sortable' : ''} \${c.align === 'right' ? 'num' : ''}" \${c.sortable ? \`data-sort="\${c.key}"\` : ''} style="\${c.width ? \`width:\${c.width};\` : ''}\${c.min ? \`min-width:\${c.min};\` : ''}">\${UI.esc(c.label)}\${sort === c.key ? \`<span class="sort-ind">\${dir === 'desc' ? '\u25BC' : '\u25B2'}</span>\` : ''}</th>\`).join('');
  const body = rows.length ? rows.map((r) => \`<tr class="\${onRow ? 'clickable' : ''} \${rowClass ? rowClass(r) : ''}" \${rowAttrs ? rowAttrs(r) : ''} data-row="\${r.id}">\${visible.map((c) => \`<td class="\${c.align === 'right' ? 'num' : ''} \${c.nowrap ? 'nowrap' : ''}">\${c.render ? c.render(r) : UI.esc(r[c.key] ?? '')}</td>\`).join('')}</tr>\`).join('')
    : \`<tr><td colspan="\${visible.length}">\${empty || UI.empty('Nenhum registro', '')}</td></tr>\`;
  box.innerHTML = \`<div class="table-toolbar"><div class="muted small">\${total ?? rows.length} registro(s)\${pages > 1 ? \` \xB7 p\xE1gina \${page} de \${pages}\` : ''}</div>
    <div class="menu-wrap"><button class="btn ghost sm" type="button" data-cols aria-haspopup="true">\${UI.icons.columns} Colunas</button></div></div>
    <div class="table-wrap"><table><thead><tr>\${head}</tr></thead><tbody>\${body}</tbody></table></div>
    \${pages > 1 ? \`<div class="pagination"><button class="btn secondary sm" data-page="\${page - 1}" \${page <= 1 ? 'disabled' : ''}>\${UI.icons.chevronLeft} Anterior</button><span class="muted">\${page} / \${pages}</span><button class="btn secondary sm" data-page="\${page + 1}" \${page >= pages ? 'disabled' : ''}>Pr\xF3xima \${UI.icons.chevronRight}</button></div>\` : ''}\`;
  box.querySelectorAll('th[data-sort]').forEach((th) => { th.tabIndex = 0; const go = () => onSort && onSort(th.dataset.sort, sort === th.dataset.sort && dir !== 'desc' ? 'desc' : 'asc'); th.onclick = go; th.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  box.querySelectorAll('[data-page]').forEach((b) => b.onclick = () => onPage && onPage(Number(b.dataset.page)));
  if (onRow) box.querySelectorAll('tr[data-row]').forEach((tr) => { tr.tabIndex = 0; tr.onclick = (e) => { if (e.target.closest('a, button, input, select, label')) return; onRow(rows.find((r) => String(r.id) === tr.dataset.row), e); }; tr.onkeydown = (e) => { if (e.key === 'Enter' && e.target === tr) onRow(rows.find((r) => String(r.id) === tr.dataset.row), e); }; });
  const colsBtn = box.querySelector('[data-cols]');
  colsBtn.onclick = () => {
    const existing = box.querySelector('.col-picker'); if (existing) { existing.remove(); return; }
    const pick = document.createElement('div'); pick.className = 'col-picker';
    pick.innerHTML = columns.map((c) => \`<label><input type="checkbox" data-col="\${c.key}" \${hiddenCols.has(c.key) ? '' : 'checked'}> \${UI.esc(c.label)}</label>\`).join('');
    colsBtn.parentElement.appendChild(pick);
    pick.onchange = (e) => { const k = e.target.dataset.col; if (e.target.checked) hiddenCols.delete(k); else hiddenCols.add(k); UI.store.set(\`cols.\${id}\`, [...hiddenCols]); UI.table(box, { id, columns, rows, total, page, limit, sort, dir, onSort, onPage, onRow, empty, rowClass, rowAttrs }); box.querySelector('[data-cols]').click(); };
    setTimeout(() => document.addEventListener('click', function h(e) { if (!pick.contains(e.target) && e.target !== colsBtn) { pick.remove(); document.removeEventListener('click', h); } }), 0);
  };
};

// Barra de filtros salvos (por escopo). onApply(params), currentParams()
UI.savedFilters = async (box, { scope, current, onApply, extraChips = '' }) => {
  const r = await api('/saved-filters', { query: { scope } }).catch(() => ({ filters: [] }));
  const render = (list) => {
    box.innerHTML = \`<div class="chips">\${extraChips}\${list.map((f) => \`<button type="button" class="chip" data-f="\${f.id}" title="\${f.shared ? 'Compartilhado por ' + UI.esc(f.user_name) : 'Meu filtro'}">\${f.shared ? UI.icons.users : UI.icons.filter} \${UI.esc(f.name)}</button>\`).join('')}
      <button type="button" class="chip" data-save title="Salvar os filtros atuais">\${UI.icons.save} Salvar filtro</button></div>\`;
    box.querySelectorAll('[data-f]').forEach((b) => { const f = list.find((x) => x.id === Number(b.dataset.f)); b.onclick = (e) => { if (e.shiftKey || e.altKey) return del(f); onApply(f.params); }; b.oncontextmenu = (e) => { e.preventDefault(); UI.menu(b, [{ label: 'Aplicar', icon: 'filter', onClick: () => onApply(f.params) }, { label: 'Excluir filtro', icon: 'trash', danger: true, onClick: () => del(f) }], { align: 'left' }); }; });
    box.querySelector('[data-save]').onclick = async () => {
      const params = current(); const name = await UI.prompt('Nome do filtro', { title: 'Salvar filtro', placeholder: 'ex.: Meus urgentes' }); if (!name) return;
      const shared = CRM.isManager() ? await UI.confirm('Compartilhar este filtro com toda a equipe?', { title: 'Compartilhar', okLabel: 'Compartilhar' }) : false;
      try { await api('/saved-filters', { method: 'POST', body: { scope, name, params, shared } }); UI.ok('Filtro salvo.'); const r2 = await api('/saved-filters', { query: { scope } }); render(r2.filters); } catch (e) { UI.err(e); }
    };
  };
  const del = async (f) => { if (!(await UI.confirm(\`Excluir o filtro "\${f.name}"?\`, { danger: true, okLabel: 'Excluir' }))) return; try { await api(\`/saved-filters/\${f.id}\`, { method: 'DELETE' }); const r2 = await api('/saved-filters', { query: { scope } }); render(r2.filters); } catch (e) { UI.err(e); } };
  render(r.filters);
};

window.UI = UI;
window.CRM = window.CRM || { pages: {} };
` };
    globalThis.__MIGRATIONS__ = [{ "name": "001_init.sql", "sql": `-- Esquema inicial do CRM

CREATE TABLE IF NOT EXISTS company_settings (
  id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name          TEXT NOT NULL DEFAULT 'Minha Empresa',
  logo_data     TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1d4ed8',
  accent_color  TEXT NOT NULL DEFAULT '#0f766e',
  timezone      TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  auto_distribution BOOLEAN NOT NULL DEFAULT FALSE,
  demo_mode     BOOLEAN NOT NULL DEFAULT FALSE,
  contact_sources TEXT[] NOT NULL DEFAULT ARRAY['Site','Indica\xE7\xE3o','WhatsApp','Instagram','Telefone','E-mail','Outro'],
  channels      TEXT[] NOT NULL DEFAULT ARRAY['WhatsApp','Telefone','E-mail','Chat','Presencial','Outro'],
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO company_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','supervisor','atendente')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  last_assigned_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sess\xF5es (connect-pg-simple)
CREATE TABLE IF NOT EXISTS user_sessions (
  sid    VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
  sess   JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS user_sessions_expire_idx ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  phone_digits TEXT,                 -- somente d\xEDgitos, para busca e duplicidade
  email       TEXT,
  company     TEXT,
  city        TEXT,
  document    TEXT,                  -- CPF ou CNPJ (opcional)
  source      TEXT,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  notes       TEXT,
  owner_id    INTEGER REFERENCES users(id),
  created_by  INTEGER REFERENCES users(id),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customers_phone_digits_idx ON customers (phone_digits);
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers (lower(email));
CREATE INDEX IF NOT EXISTS customers_owner_idx ON customers (owner_id);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers (lower(name));

CREATE TABLE IF NOT EXISTS customer_notes (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS ticket_protocol_seq;

CREATE TABLE IF NOT EXISTS tickets (
  id          SERIAL PRIMARY KEY,
  protocol    TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  subject     TEXT NOT NULL,
  description TEXT,
  channel     TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta','urgente')),
  status      TEXT NOT NULL DEFAULT 'aguardando'
              CHECK (status IN ('aguardando','em_atendimento','aguardando_cliente','resolvido','cancelado')),
  assignee_id INTEGER REFERENCES users(id),
  opened_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  closed_at   TIMESTAMPTZ,
  follow_up_at TIMESTAMPTZ,          -- retorno agendado
  created_by  INTEGER REFERENCES users(id),
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets (status);
CREATE INDEX IF NOT EXISTS tickets_assignee_idx ON tickets (assignee_id);
CREATE INDEX IF NOT EXISTS tickets_customer_idx ON tickets (customer_id);
CREATE INDEX IF NOT EXISTS tickets_opened_idx ON tickets (opened_at);

-- Linha do tempo do atendimento: anota\xE7\xF5es internas, intera\xE7\xF5es e eventos do sistema
CREATE TABLE IF NOT EXISTS ticket_events (
  id         SERIAL PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id),
  kind       TEXT NOT NULL CHECK (kind IN ('note','interaction','system')),
  direction  TEXT CHECK (direction IN ('entrada','saida')),
  channel    TEXT,
  body       TEXT,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_events_ticket_idx ON ticket_events (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id       SERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL,
  kind     TEXT NOT NULL DEFAULT 'open' CHECK (kind IN ('open','won','lost')),
  active   BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO pipeline_stages (name, position, kind)
SELECT * FROM (VALUES
  ('Novo contato', 1, 'open'),
  ('Em atendimento', 2, 'open'),
  ('Proposta enviada', 3, 'open'),
  ('Negocia\xE7\xE3o', 4, 'open'),
  ('Ganho', 5, 'won'),
  ('Perdido', 6, 'lost')
) AS v(name, position, kind)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages);

CREATE TABLE IF NOT EXISTS opportunities (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  customer_id  INTEGER NOT NULL REFERENCES customers(id),
  owner_id     INTEGER REFERENCES users(id),
  stage_id     INTEGER NOT NULL REFERENCES pipeline_stages(id),
  value        NUMERIC(14,2) NOT NULL DEFAULT 0,
  next_action  TEXT,
  next_action_at TIMESTAMPTZ,
  expected_close_date DATE,
  lost_reason  TEXT,
  ticket_id    INTEGER REFERENCES tickets(id),
  closed_at    TIMESTAMPTZ,
  version      INTEGER NOT NULL DEFAULT 1,
  created_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS opportunities_stage_idx ON opportunities (stage_id);
CREATE INDEX IF NOT EXISTS opportunities_customer_idx ON opportunities (customer_id);
CREATE INDEX IF NOT EXISTS opportunities_owner_idx ON opportunities (owner_id);

CREATE TABLE IF NOT EXISTS opportunity_events (
  id             SERIAL PRIMARY KEY,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES users(id),
  body           TEXT NOT NULL,
  payload        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  customer_id    INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE SET NULL,
  ticket_id      INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
  assignee_id    INTEGER REFERENCES users(id),
  due_at         TIMESTAMPTZ,
  priority       TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa','normal','alta')),
  done_at        TIMESTAMPTZ,
  created_by     INTEGER REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_assignee_idx ON tasks (assignee_id, done_at);
CREATE INDEX IF NOT EXISTS tasks_due_idx ON tasks (due_at);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  action     TEXT NOT NULL,
  entity     TEXT,
  entity_id  TEXT,
  details    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip         TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at);

-- Mensagens da integra\xE7\xE3o oficial do WhatsApp (somente quando conectada)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER REFERENCES customers(id),
  ticket_id     INTEGER REFERENCES tickets(id),
  user_id       INTEGER REFERENCES users(id),
  direction     TEXT NOT NULL CHECK (direction IN ('entrada','saida')),
  wa_message_id TEXT UNIQUE,
  phone_digits  TEXT NOT NULL,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'enviado',
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS whatsapp_messages_phone_idx ON whatsapp_messages (phone_digits, created_at);
` }, { "name": "002_rls.sql", "sql": "-- Habilita Row Level Security em todas as tabelas, sem pol\xEDticas.\n-- O servidor do CRM conecta como dono do banco (ignora RLS). Em provedores que exp\xF5em\n-- o banco por API (ex.: Supabase/PostgREST), isso impede acesso direto \xE0s tabelas.\nDO $$\nDECLARE t TEXT;\nBEGIN\n  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP\n    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);\n  END LOOP;\nEND $$;\n" }, { "name": "003_inbox_pipelines_automations.sql", "sql": "-- Evolu\xE7\xE3o: central de conversas, m\xFAltiplos funis, filtros salvos, respostas r\xE1pidas,\n-- automa\xE7\xF5es e integra\xE7\xE3o WhatsApp verific\xE1vel. Todas as altera\xE7\xF5es preservam os dados.\n\n-- ===== Configura\xE7\xF5es =====\nALTER TABLE company_settings ADD COLUMN IF NOT EXISTS response_sla_minutes INTEGER NOT NULL DEFAULT 30;\nALTER TABLE company_settings ADD COLUMN IF NOT EXISTS idle_opportunity_days INTEGER NOT NULL DEFAULT 7;\nALTER TABLE company_settings ADD COLUMN IF NOT EXISTS whatsapp_last_event_at TIMESTAMPTZ;\nALTER TABLE company_settings ADD COLUMN IF NOT EXISTS whatsapp_last_error TEXT;\nALTER TABLE company_settings ADD COLUMN IF NOT EXISTS whatsapp_last_error_at TIMESTAMPTZ;\nALTER TABLE company_settings ALTER COLUMN primary_color SET DEFAULT '#2563eb';\nALTER TABLE company_settings ALTER COLUMN accent_color SET DEFAULT '#1e3a5f';\n\n-- ===== Usu\xE1rios: equipe (para automa\xE7\xF5es e distribui\xE7\xE3o) =====\nALTER TABLE users ADD COLUMN IF NOT EXISTS team TEXT;\n\n-- ===== Atendimentos: campos da central de conversas (denormalizados a partir da linha do tempo) =====\nALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;\nALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_message_preview TEXT;\nALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_message_direction TEXT;\nALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_customer_message_at TIMESTAMPTZ;\nALTER TABLE tickets ADD COLUMN IF NOT EXISTS last_agent_message_at TIMESTAMPTZ;\nALTER TABLE tickets ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0;\n\nUPDATE tickets t SET\n  last_message_at = s.last_at,\n  last_message_preview = s.preview,\n  last_message_direction = s.direction,\n  last_customer_message_at = s.last_in,\n  last_agent_message_at = s.last_out\nFROM (\n  SELECT e.ticket_id,\n    max(e.created_at) AS last_at,\n    (array_agg(left(e.body, 160) ORDER BY e.created_at DESC, e.id DESC))[1] AS preview,\n    (array_agg(e.direction ORDER BY e.created_at DESC, e.id DESC))[1] AS direction,\n    max(e.created_at) FILTER (WHERE e.direction = 'entrada') AS last_in,\n    max(e.created_at) FILTER (WHERE e.direction = 'saida') AS last_out\n  FROM ticket_events e WHERE e.kind = 'interaction' GROUP BY e.ticket_id\n) s WHERE s.ticket_id = t.id AND t.last_message_at IS NULL;\n\nUPDATE tickets SET unread_count = (\n  SELECT count(*) FROM ticket_events e WHERE e.ticket_id = tickets.id AND e.kind = 'interaction' AND e.direction = 'entrada'\n    AND (tickets.last_agent_message_at IS NULL OR e.created_at > tickets.last_agent_message_at)\n) WHERE status IN ('aguardando','em_atendimento','aguardando_cliente');\n\nCREATE INDEX IF NOT EXISTS tickets_last_message_idx ON tickets (last_message_at DESC NULLS LAST);\n\n-- Anexos de atendimento (arquivos pequenos armazenados no banco)\nCREATE TABLE IF NOT EXISTS ticket_attachments (\n  id         SERIAL PRIMARY KEY,\n  ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,\n  event_id   INTEGER REFERENCES ticket_events(id) ON DELETE SET NULL,\n  name       TEXT NOT NULL,\n  mime       TEXT NOT NULL,\n  size       INTEGER NOT NULL,\n  data       BYTEA,\n  wa_media_id TEXT,\n  created_by INTEGER REFERENCES users(id),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS ticket_attachments_ticket_idx ON ticket_attachments (ticket_id);\n\n-- Respostas r\xE1pidas\nCREATE TABLE IF NOT EXISTS quick_replies (\n  id         SERIAL PRIMARY KEY,\n  title      TEXT NOT NULL,\n  shortcut   TEXT,\n  body       TEXT NOT NULL,\n  active     BOOLEAN NOT NULL DEFAULT TRUE,\n  created_by INTEGER REFERENCES users(id),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\n\n-- Filtros salvos (por usu\xE1rio; opcionalmente compartilhados)\nCREATE TABLE IF NOT EXISTS saved_filters (\n  id         SERIAL PRIMARY KEY,\n  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  scope      TEXT NOT NULL,\n  name       TEXT NOT NULL,\n  params     JSONB NOT NULL DEFAULT '{}'::jsonb,\n  shared     BOOLEAN NOT NULL DEFAULT FALSE,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS saved_filters_scope_idx ON saved_filters (scope, user_id);\n\n-- ===== Funis m\xFAltiplos =====\nCREATE TABLE IF NOT EXISTS pipelines (\n  id         SERIAL PRIMARY KEY,\n  name       TEXT NOT NULL,\n  position   INTEGER NOT NULL DEFAULT 1,\n  is_default BOOLEAN NOT NULL DEFAULT FALSE,\n  active     BOOLEAN NOT NULL DEFAULT TRUE,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nINSERT INTO pipelines (name, position, is_default) SELECT 'Funil comercial', 1, TRUE WHERE NOT EXISTS (SELECT 1 FROM pipelines);\nALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES pipelines(id);\nUPDATE pipeline_stages SET pipeline_id = (SELECT id FROM pipelines WHERE is_default ORDER BY id LIMIT 1) WHERE pipeline_id IS NULL;\nALTER TABLE pipeline_stages ALTER COLUMN pipeline_id SET NOT NULL;\nALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS color TEXT;\nCREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_idx ON pipeline_stages (pipeline_id, position);\n\nALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';\nALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source TEXT;\nALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ;\nUPDATE opportunities SET stage_entered_at = COALESCE(stage_entered_at, updated_at, created_at);\nALTER TABLE opportunities ALTER COLUMN stage_entered_at SET DEFAULT now();\n\n-- ===== Tarefas: origem em automa\xE7\xE3o e motivo de encerramento =====\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_rule_id INTEGER;\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS closed_reason TEXT;\nALTER TABLE tasks ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'tarefa';\n\n-- ===== Automa\xE7\xF5es =====\nCREATE TABLE IF NOT EXISTS automation_rules (\n  id          SERIAL PRIMARY KEY,\n  name        TEXT NOT NULL,\n  trigger     TEXT NOT NULL,\n  conditions  JSONB NOT NULL DEFAULT '{}'::jsonb,\n  action      TEXT NOT NULL,\n  action_params JSONB NOT NULL DEFAULT '{}'::jsonb,\n  team        TEXT,\n  active      BOOLEAN NOT NULL DEFAULT TRUE,\n  last_run_at TIMESTAMPTZ,\n  runs_count  INTEGER NOT NULL DEFAULT 0,\n  created_by  INTEGER REFERENCES users(id),\n  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE TABLE IF NOT EXISTS automation_runs (\n  id         BIGSERIAL PRIMARY KEY,\n  rule_id    INTEGER NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,\n  entity     TEXT NOT NULL,\n  entity_id  INTEGER NOT NULL,\n  status     TEXT NOT NULL CHECK (status IN ('executada','ignorada','falhou')),\n  details    TEXT,\n  dedupe_key TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n);\nCREATE INDEX IF NOT EXISTS automation_runs_rule_idx ON automation_runs (rule_id, created_at DESC);\nCREATE UNIQUE INDEX IF NOT EXISTS automation_runs_dedupe_idx ON automation_runs (rule_id, dedupe_key) WHERE dedupe_key IS NOT NULL;\nALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_automation_rule_fk;\nALTER TABLE tasks ADD CONSTRAINT tasks_automation_rule_fk FOREIGN KEY (automation_rule_id) REFERENCES automation_rules(id) ON DELETE SET NULL;\n\n-- ===== WhatsApp =====\nALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS ticket_event_id INTEGER REFERENCES ticket_events(id) ON DELETE SET NULL;\nALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS error TEXT;\nALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS status_at TIMESTAMPTZ;\nALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text';\n\n-- RLS nas tabelas novas (mesma pol\xEDtica da migra\xE7\xE3o 002: sem pol\xEDticas; o servidor \xE9 dono do banco)\nDO $$\nDECLARE t TEXT;\nBEGIN\n  FOR t IN SELECT unnest(ARRAY['ticket_attachments','quick_replies','saved_filters','pipelines','automation_rules','automation_runs']) LOOP\n    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);\n  END LOOP;\nEND $$;\n" }];
  }
});

// npm-dep:path
var require_path = __commonJS({
  "npm-dep:path"(exports, module) {
    module.exports = globalThis.__deps["path"];
  }
});

// npm-dep:express
var require_express = __commonJS({
  "npm-dep:express"(exports, module) {
    module.exports = globalThis.__deps["express"];
  }
});

// npm-dep:helmet
var require_helmet = __commonJS({
  "npm-dep:helmet"(exports, module) {
    module.exports = globalThis.__deps["helmet"];
  }
});

// npm-dep:express-session
var require_express_session = __commonJS({
  "npm-dep:express-session"(exports, module) {
    module.exports = globalThis.__deps["express-session"];
  }
});

// npm-dep:connect-pg-simple
var require_connect_pg_simple = __commonJS({
  "npm-dep:connect-pg-simple"(exports, module) {
    module.exports = globalThis.__deps["connect-pg-simple"];
  }
});

// npm-dep:dotenv
var require_dotenv = __commonJS({
  "npm-dep:dotenv"(exports, module) {
    module.exports = globalThis.__deps["dotenv"];
  }
});

// src/config.js
var require_config = __commonJS({
  "src/config.js"(exports, module) {
    "use strict";
    require_dotenv().config();
    function bool(v, def = false) {
      if (v === void 0 || v === "") return def;
      return ["1", "true", "yes", "sim"].includes(String(v).toLowerCase());
    }
    var edge = typeof globalThis.Deno !== "undefined";
    var config = {
      env: process.env.NODE_ENV || "development",
      edge,
      basePath: (process.env.BASE_PATH || "").replace(/\/$/, ""),
      // caminho visto pelo app (ex.: /crm)
      publicBase: (process.env.PUBLIC_BASE || process.env.BASE_PATH || "").replace(/\/$/, ""),
      // caminho visto pelo navegador (ex.: /functions/v1/crm)
      port: Number(process.env.PORT || 3e3),
      appUrl: (process.env.APP_URL || `http://localhost:${process.env.PORT || 3e3}`).replace(/\/$/, ""),
      databaseUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
      databaseSsl: bool(process.env.DATABASE_SSL),
      sessionSecret: process.env.SESSION_SECRET,
      sessionHours: Number(process.env.SESSION_HOURS || 12),
      cookieSecure: bool(process.env.COOKIE_SECURE),
      smtp: {
        host: process.env.SMTP_HOST || "",
        port: Number(process.env.SMTP_PORT || 587),
        secure: bool(process.env.SMTP_SECURE),
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
        from: process.env.MAIL_FROM || "CRM <nao-responda@localhost>"
      },
      whatsapp: {
        token: process.env.WHATSAPP_TOKEN || "",
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
        appSecret: process.env.WHATSAPP_APP_SECRET || ""
      }
    };
    config.smtp.configured = Boolean(config.smtp.host);
    config.whatsapp.configured = Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId);
    var fatal = (msg) => {
      console.error(msg);
      if (edge) throw new Error(msg);
      process.exit(1);
    };
    if (!config.databaseUrl) fatal("DATABASE_URL n\xE3o definido. Copie .env.example para .env e ajuste.");
    if (!config.sessionSecret || config.sessionSecret.length < 16) fatal("SESSION_SECRET ausente ou muito curto (m\xEDnimo 16 caracteres).");
    if (config.env === "production" && /dev-secret|troque-este-valor/.test(config.sessionSecret)) fatal("SESSION_SECRET de exemplo em produ\xE7\xE3o. Gere um valor aleat\xF3rio.");
    module.exports = config;
  }
});

// npm-dep:pg
var require_pg = __commonJS({
  "npm-dep:pg"(exports, module) {
    module.exports = globalThis.__deps["pg"];
  }
});

// src/db.js
var require_db = __commonJS({
  "src/db.js"(exports, module) {
    "use strict";
    var { Pool } = require_pg();
    var config = require_config();
    var pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
      max: 15
    });
    pool.on("error", (err) => console.error("Erro inesperado no pool do PostgreSQL", err));
    async function query(text, params) {
      return pool.query(text, params);
    }
    async function tx(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        try {
          await client.query("ROLLBACK");
        } catch (_) {
        }
        throw err;
      } finally {
        client.release();
      }
    }
    module.exports = { pool, query, tx };
  }
});

// src/lib/errors.js
var require_errors = __commonJS({
  "src/lib/errors.js"(exports, module) {
    "use strict";
    var HttpError = class extends Error {
      constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
      }
    };
    var badRequest = (msg, details) => new HttpError(400, msg, details);
    var unauthorized = (msg = "Fa\xE7a login para continuar.") => new HttpError(401, msg);
    var forbidden = (msg = "Voc\xEA n\xE3o tem permiss\xE3o para esta a\xE7\xE3o.") => new HttpError(403, msg);
    var notFound = (msg = "Registro n\xE3o encontrado.") => new HttpError(404, msg);
    var conflict = (msg, details) => new HttpError(409, msg, details);
    module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
  }
});

// src/middleware/auth.js
var require_auth = __commonJS({
  "src/middleware/auth.js"(exports, module) {
    "use strict";
    var { unauthorized, forbidden } = require_errors();
    var { query } = require_db();
    var ROLES = ["admin", "supervisor", "atendente"];
    async function loadUser(req, _res, next) {
      try {
        if (req.session && req.session.userId) {
          const { rows } = await query(
            "SELECT id, name, email, role, active, available FROM users WHERE id = $1",
            [req.session.userId]
          );
          const user = rows[0];
          if (user && user.active) {
            req.user = user;
          } else {
            req.session.destroy(() => {
            });
          }
        }
        next();
      } catch (err) {
        next(err);
      }
    }
    function requireAuth(req, _res, next) {
      if (!req.user) return next(unauthorized());
      next();
    }
    function requireRole(...roles) {
      return (req, _res, next) => {
        if (!req.user) return next(unauthorized());
        if (!roles.includes(req.user.role)) return next(forbidden());
        next();
      };
    }
    var isManager = (user) => user && (user.role === "admin" || user.role === "supervisor");
    module.exports = { ROLES, loadUser, requireAuth, requireRole, isManager };
  }
});

// npm-dep:bcryptjs
var require_bcryptjs = __commonJS({
  "npm-dep:bcryptjs"(exports, module) {
    module.exports = globalThis.__deps["bcryptjs"];
  }
});

// npm-dep:express-rate-limit
var require_express_rate_limit = __commonJS({
  "npm-dep:express-rate-limit"(exports, module) {
    module.exports = globalThis.__deps["express-rate-limit"];
  }
});

// npm-dep:zod
var require_zod = __commonJS({
  "npm-dep:zod"(exports, module) {
    module.exports = globalThis.__deps["zod"];
  }
});

// src/middleware/validate.js
var require_validate = __commonJS({
  "src/middleware/validate.js"(exports, module) {
    "use strict";
    var { badRequest } = require_errors();
    function validate(schema, source = "body") {
      return (req, _res, next) => {
        const result = schema.safeParse(req[source]);
        if (!result.success) {
          const fields = {};
          for (const issue of result.error.issues) {
            const key = issue.path.join(".") || "_";
            if (!fields[key]) fields[key] = translate(issue);
          }
          return next(badRequest("Verifique os campos destacados.", { fields }));
        }
        req[source === "body" ? "data" : "queryData"] = result.data;
        next();
      };
    }
    function translate(issue) {
      switch (issue.code) {
        case "invalid_type":
          if (issue.received === "undefined" || issue.received === "null") return "Campo obrigat\xF3rio.";
          return "Valor inv\xE1lido.";
        case "too_small":
          if (issue.type === "string") return issue.minimum <= 1 ? "Campo obrigat\xF3rio." : `M\xEDnimo de ${issue.minimum} caracteres.`;
          return `Valor m\xEDnimo: ${issue.minimum}.`;
        case "too_big":
          if (issue.type === "string") return `M\xE1ximo de ${issue.maximum} caracteres.`;
          return `Valor m\xE1ximo: ${issue.maximum}.`;
        case "invalid_string":
          if (issue.validation === "email") return "E-mail inv\xE1lido.";
          return "Formato inv\xE1lido.";
        case "invalid_enum_value":
          return "Op\xE7\xE3o inv\xE1lida.";
        default:
          return issue.message || "Valor inv\xE1lido.";
      }
    }
    module.exports = { validate };
  }
});

// src/lib/audit.js
var require_audit = __commonJS({
  "src/lib/audit.js"(exports, module) {
    "use strict";
    var { query } = require_db();
    async function audit(req, action, entity, entityId, details = {}, client) {
      try {
        const q = client ? client.query.bind(client) : query;
        await q(
          `INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user ? req.user.id : null,
            action,
            entity,
            entityId == null ? null : String(entityId),
            JSON.stringify(details),
            req.ip || null
          ]
        );
      } catch (err) {
        console.error("Falha ao registrar auditoria:", err.message);
      }
    }
    module.exports = { audit };
  }
});

// npm-dep:nodemailer
var require_nodemailer = __commonJS({
  "npm-dep:nodemailer"(exports, module) {
    module.exports = globalThis.__deps["nodemailer"];
  }
});

// src/lib/mailer.js
var require_mailer = __commonJS({
  "src/lib/mailer.js"(exports, module) {
    "use strict";
    var nodemailer = require_nodemailer();
    var config = require_config();
    var transporter = null;
    if (config.smtp.configured) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : void 0
      });
    }
    async function sendMail({ to, subject, text }) {
      if (!transporter) return false;
      await transporter.sendMail({ from: config.smtp.from, to, subject, text });
      return true;
    }
    module.exports = { sendMail, configured: Boolean(transporter) };
  }
});

// src/routes/auth.js
var require_auth2 = __commonJS({
  "src/routes/auth.js"(exports, module) {
    "use strict";
    var express = require_express();
    var bcrypt = require_bcryptjs();
    var crypto = require_crypto();
    var rateLimit = require_express_rate_limit();
    var { z } = require_zod();
    var { query } = require_db();
    var config = require_config();
    var { validate } = require_validate();
    var { requireAuth } = require_auth();
    var { badRequest, unauthorized } = require_errors();
    var { audit } = require_audit();
    var mailer = require_mailer();
    var router = express.Router();
    var loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1e3,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }
    });
    router.post("/login", loginLimiter, validate(z.object({
      email: z.string().trim().email(),
      password: z.string().min(1)
    })), async (req, res, next) => {
      try {
        const { email, password } = req.data;
        const { rows } = await query("SELECT * FROM users WHERE lower(email) = lower($1)", [email]);
        const user = rows[0];
        const ok = user && await bcrypt.compare(password, user.password_hash);
        if (!ok) return next(unauthorized("E-mail ou senha incorretos."));
        if (!user.active) return next(unauthorized("Usu\xE1rio desativado. Fale com o administrador."));
        await new Promise((resolve, reject) => req.session.regenerate((e) => e ? reject(e) : resolve()));
        req.session.userId = user.id;
        await query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);
        req.user = user;
        await audit(req, "login", "user", user.id);
        res.json({ user: publicUser(user) });
      } catch (err) {
        next(err);
      }
    });
    router.post("/logout", (req, res) => {
      req.session.destroy(() => {
        res.clearCookie("crm.sid");
        res.json({ ok: true });
      });
    });
    router.get("/me", requireAuth, (req, res) => {
      res.json({ user: publicUser(req.user) });
    });
    router.put("/me/password", requireAuth, validate(z.object({
      current_password: z.string().min(1),
      new_password: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres.").max(200)
    })), async (req, res, next) => {
      try {
        const { rows } = await query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
        if (!await bcrypt.compare(req.data.current_password, rows[0].password_hash)) {
          return next(badRequest("Senha atual incorreta.", { fields: { current_password: "Senha atual incorreta." } }));
        }
        const hash = await bcrypt.hash(req.data.new_password, 12);
        await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [hash, req.user.id]);
        await audit(req, "password_change", "user", req.user.id);
        res.json({ ok: true, message: "Senha alterada com sucesso." });
      } catch (err) {
        next(err);
      }
    });
    router.put("/me/availability", requireAuth, validate(z.object({ available: z.boolean() })), async (req, res, next) => {
      try {
        await query("UPDATE users SET available = $1, updated_at = now() WHERE id = $2", [req.data.available, req.user.id]);
        res.json({ ok: true, available: req.data.available });
      } catch (err) {
        next(err);
      }
    });
    var forgotLimiter = rateLimit({
      windowMs: 60 * 60 * 1e3,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Muitas solicita\xE7\xF5es. Tente novamente mais tarde." }
    });
    router.post("/forgot-password", forgotLimiter, validate(z.object({ email: z.string().trim().email() })), async (req, res, next) => {
      try {
        const { rows } = await query("SELECT id, name, email FROM users WHERE lower(email) = lower($1) AND active", [req.data.email]);
        if (rows[0]) {
          const { token, link } = await createResetToken(rows[0].id);
          const sent = await mailer.sendMail({
            to: rows[0].email,
            subject: "Recupera\xE7\xE3o de senha",
            text: `Ol\xE1, ${rows[0].name}.

Para definir uma nova senha, acesse o link abaixo (v\xE1lido por 1 hora):
${link}

Se voc\xEA n\xE3o solicitou, ignore esta mensagem.`
          }).catch((e) => {
            console.error("Falha ao enviar e-mail:", e.message);
            return false;
          });
          if (!sent) {
            console.warn(`[recupera\xE7\xE3o de senha] SMTP n\xE3o configurado. Link para ${rows[0].email}: ${link}`);
          }
        }
        res.json({ ok: true, message: "Se o e-mail estiver cadastrado, enviaremos as instru\xE7\xF5es de recupera\xE7\xE3o.", mail_configured: mailer.configured });
      } catch (err) {
        next(err);
      }
    });
    router.post("/reset-password", validate(z.object({
      token: z.string().min(10),
      password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200)
    })), async (req, res, next) => {
      try {
        const hash = crypto.createHash("sha256").update(req.data.token).digest("hex");
        const { rows } = await query(
          `SELECT pr.id, pr.user_id FROM password_resets pr
       WHERE pr.token_hash = $1 AND pr.used_at IS NULL AND pr.expires_at > now()`,
          [hash]
        );
        if (!rows[0]) return next(badRequest("Link inv\xE1lido ou expirado. Solicite uma nova recupera\xE7\xE3o."));
        const pwHash = await bcrypt.hash(req.data.password, 12);
        await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [pwHash, rows[0].user_id]);
        await query("UPDATE password_resets SET used_at = now() WHERE id = $1", [rows[0].id]);
        await query("DELETE FROM user_sessions WHERE sess->>'userId' = $1", [String(rows[0].user_id)]);
        req.user = { id: rows[0].user_id };
        await audit(req, "password_reset", "user", rows[0].user_id);
        res.json({ ok: true, message: "Senha redefinida. Fa\xE7a login com a nova senha." });
      } catch (err) {
        next(err);
      }
    });
    async function createResetToken(userId) {
      const token = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(token).digest("hex");
      await query("INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '1 hour')", [userId, hash]);
      return { token, link: `${config.appUrl}/#/redefinir-senha/${token}` };
    }
    function publicUser(u) {
      return { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, available: u.available };
    }
    module.exports = { router, createResetToken, publicUser };
  }
});

// src/lib/realtime.js
var require_realtime = __commonJS({
  "src/lib/realtime.js"(exports, module) {
    "use strict";
    var clients = /* @__PURE__ */ new Map();
    function subscribe(req, res) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
      });
      res.write(`event: hello
data: {}

`);
      clients.set(res, req.user.id);
      const ping = setInterval(() => {
        try {
          res.write(": ping\n\n");
        } catch (_) {
        }
      }, 25e3);
      req.on("close", () => {
        clearInterval(ping);
        clients.delete(res);
      });
    }
    function broadcast(event, data = {}, userIds) {
      const payload = `event: ${event}
data: ${JSON.stringify(data)}

`;
      for (const [res, uid] of clients) {
        if (userIds && !userIds.includes(uid)) continue;
        try {
          res.write(payload);
        } catch (_) {
          clients.delete(res);
        }
      }
    }
    module.exports = { subscribe, broadcast };
  }
});

// src/routes/users.js
var require_users = __commonJS({
  "src/routes/users.js"(exports, module) {
    "use strict";
    var express = require_express();
    var bcrypt = require_bcryptjs();
    var { z } = require_zod();
    var { query, tx } = require_db();
    var { validate } = require_validate();
    var { requireAuth, requireRole, ROLES } = require_auth();
    var { badRequest, notFound, conflict } = require_errors();
    var { audit } = require_audit();
    var { createResetToken } = require_auth2();
    var { broadcast } = require_realtime();
    var router = express.Router();
    router.use(requireAuth);
    router.get("/", async (req, res, next) => {
      try {
        const includeInactive = req.query.include_inactive === "true" && req.user.role !== "atendente";
        const { rows } = await query(
          `SELECT id, name, email, role, active, available, team, last_login_at, created_at
       FROM users ${includeInactive ? "" : "WHERE active"} ORDER BY active DESC, name`
        );
        const list = req.user.role === "admin" ? rows : rows.map((u) => ({ id: u.id, name: u.name, role: u.role, active: u.active, available: u.available, team: u.team }));
        res.json({ users: list });
      } catch (err) {
        next(err);
      }
    });
    var userSchema = z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().email().max(200),
      role: z.enum(ROLES),
      password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200).optional(),
      available: z.boolean().optional(),
      team: z.string().trim().max(60).nullable().optional()
    });
    router.post("/", requireRole("admin"), validate(userSchema.required({ password: true })), async (req, res, next) => {
      try {
        const d = req.data;
        const dup = await query("SELECT 1 FROM users WHERE lower(email) = lower($1)", [d.email]);
        if (dup.rowCount) return next(badRequest("J\xE1 existe um usu\xE1rio com este e-mail.", { fields: { email: "E-mail j\xE1 cadastrado." } }));
        const hash = await bcrypt.hash(d.password, 12);
        const { rows } = await query(
          `INSERT INTO users (name, email, password_hash, role, available, team) VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, name, email, role, active, available, team, created_at`,
          [d.name, d.email, hash, d.role, d.available !== false, d.team || null]
        );
        await audit(req, "user_create", "user", rows[0].id, { email: d.email, role: d.role });
        res.status(201).json({ user: rows[0], message: "Usu\xE1rio criado com sucesso." });
      } catch (err) {
        next(err);
      }
    });
    router.put("/:id", requireRole("admin"), validate(userSchema.partial()), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const d = req.data;
        const cur = await query("SELECT * FROM users WHERE id = $1", [id]);
        if (!cur.rowCount) return next(notFound("Usu\xE1rio n\xE3o encontrado."));
        if (d.email) {
          const dup = await query("SELECT 1 FROM users WHERE lower(email) = lower($1) AND id <> $2", [d.email, id]);
          if (dup.rowCount) return next(badRequest("J\xE1 existe um usu\xE1rio com este e-mail.", { fields: { email: "E-mail j\xE1 cadastrado." } }));
        }
        if (d.role && id === req.user.id && d.role !== "admin") {
          return next(badRequest("Voc\xEA n\xE3o pode remover seu pr\xF3prio perfil de administrador."));
        }
        const hash = d.password ? await bcrypt.hash(d.password, 12) : null;
        const { rows } = await query(
          `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role),
        password_hash = COALESCE($4, password_hash), available = COALESCE($5, available), team = CASE WHEN $7::boolean THEN $8 ELSE team END, updated_at = now()
       WHERE id = $6 RETURNING id, name, email, role, active, available, team`,
          [d.name ?? null, d.email ?? null, d.role ?? null, hash, d.available ?? null, id, d.team !== void 0, d.team ?? null]
        );
        await audit(req, "user_update", "user", id, { fields: Object.keys(d).filter((k) => k !== "password"), password_changed: Boolean(hash) });
        res.json({ user: rows[0], message: "Usu\xE1rio atualizado." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/deactivate", requireRole("admin"), validate(z.object({
      transfer_to: z.number().int().positive().nullable().optional()
    })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        if (id === req.user.id) return next(badRequest("Voc\xEA n\xE3o pode desativar o seu pr\xF3prio usu\xE1rio."));
        const target = req.data.transfer_to || null;
        const result = await tx(async (client) => {
          const cur = await client.query("SELECT id, name, active FROM users WHERE id = $1 FOR UPDATE", [id]);
          if (!cur.rowCount) throw notFound("Usu\xE1rio n\xE3o encontrado.");
          if (target) {
            const t = await client.query("SELECT id FROM users WHERE id = $1 AND active AND id <> $2", [target, id]);
            if (!t.rowCount) throw badRequest("Usu\xE1rio de destino inv\xE1lido ou inativo.");
          }
          const pending = {
            tickets: (await client.query(`SELECT id FROM tickets WHERE assignee_id = $1 AND status NOT IN ('resolvido','cancelado')`, [id])).rows.map((r) => r.id),
            tasks: (await client.query("SELECT id FROM tasks WHERE assignee_id = $1 AND done_at IS NULL", [id])).rows.map((r) => r.id),
            opportunities: (await client.query(`SELECT o.id FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.owner_id = $1 AND s.kind = 'open'`, [id])).rows.map((r) => r.id),
            customers: (await client.query("SELECT id FROM customers WHERE owner_id = $1", [id])).rows.map((r) => r.id)
          };
          const total = pending.tickets.length + pending.tasks.length + pending.opportunities.length;
          if (total > 0 && !target) {
            throw conflict("Este usu\xE1rio possui pend\xEAncias. Informe para quem transferi-las.", { pending: {
              tickets: pending.tickets.length,
              tasks: pending.tasks.length,
              opportunities: pending.opportunities.length,
              customers: pending.customers.length
            } });
          }
          if (target) {
            if (pending.tickets.length) {
              await client.query(`UPDATE tickets SET assignee_id = $1, status = CASE WHEN status = 'em_atendimento' THEN 'em_atendimento' ELSE status END,
            version = version + 1, updated_at = now() WHERE id = ANY($2::int[])`, [target, pending.tickets]);
              for (const tid of pending.tickets) {
                await client.query(
                  `INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload) VALUES ($1,$2,'system',$3,$4)`,
                  [tid, req.user.id, "Atendimento transferido por desativa\xE7\xE3o de usu\xE1rio", JSON.stringify({ from: id, to: target, action: "transfer" })]
                );
              }
            }
            if (pending.tasks.length) await client.query("UPDATE tasks SET assignee_id = $1, updated_at = now() WHERE id = ANY($2::int[])", [target, pending.tasks]);
            if (pending.opportunities.length) await client.query("UPDATE opportunities SET owner_id = $1, version = version + 1, updated_at = now() WHERE id = ANY($2::int[])", [target, pending.opportunities]);
            if (pending.customers.length) await client.query("UPDATE customers SET owner_id = $1, updated_at = now() WHERE id = ANY($2::int[])", [target, pending.customers]);
          }
          await client.query("UPDATE users SET active = FALSE, available = FALSE, updated_at = now() WHERE id = $1", [id]);
          await client.query("DELETE FROM user_sessions WHERE sess->>'userId' = $1", [String(id)]);
          await audit(req, "user_deactivate", "user", id, { transfer_to: target, transferred: {
            tickets: pending.tickets.length,
            tasks: pending.tasks.length,
            opportunities: pending.opportunities.length,
            customers: pending.customers.length
          } }, client);
          return pending;
        });
        broadcast("tickets_changed", { reason: "user_deactivated" });
        res.json({ ok: true, message: "Usu\xE1rio desativado. O hist\xF3rico foi preservado.", transferred: {
          tickets: result.tickets.length,
          tasks: result.tasks.length,
          opportunities: result.opportunities.length,
          customers: result.customers.length
        } });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/activate", requireRole("admin"), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const { rowCount } = await query("UPDATE users SET active = TRUE, updated_at = now() WHERE id = $1", [id]);
        if (!rowCount) return next(notFound("Usu\xE1rio n\xE3o encontrado."));
        await audit(req, "user_activate", "user", id);
        res.json({ ok: true, message: "Usu\xE1rio reativado." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/reset-link", requireRole("admin"), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const { rowCount } = await query("SELECT 1 FROM users WHERE id = $1 AND active", [id]);
        if (!rowCount) return next(notFound("Usu\xE1rio n\xE3o encontrado ou inativo."));
        const { link } = await createResetToken(id);
        await audit(req, "user_reset_link", "user", id);
        res.json({ link, message: "Link gerado. Ele \xE9 v\xE1lido por 1 hora." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/settings.js
var require_settings = __commonJS({
  "src/routes/settings.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query, tx } = require_db();
    var config = require_config();
    var { validate } = require_validate();
    var { requireAuth, requireRole } = require_auth();
    var { audit } = require_audit();
    var mailer = require_mailer();
    var { broadcast } = require_realtime();
    var { badRequest, notFound } = require_errors();
    var router = express.Router();
    router.get("/public", async (_req, res, next) => {
      try {
        const { rows } = await query("SELECT name, logo_data, primary_color, accent_color, demo_mode FROM company_settings WHERE id = 1");
        res.json({ settings: rows[0] });
      } catch (err) {
        next(err);
      }
    });
    router.get("/", requireAuth, async (req, res, next) => {
      try {
        const { rows } = await query("SELECT * FROM company_settings WHERE id = 1");
        const stages = await query("SELECT * FROM pipeline_stages ORDER BY pipeline_id, position");
        const pipelines = await query("SELECT * FROM pipelines ORDER BY position, id");
        const quick = await query("SELECT id, title, shortcut, body, active FROM quick_replies WHERE active ORDER BY title");
        res.json({
          settings: rows[0],
          stages: stages.rows,
          pipelines: pipelines.rows,
          quick_replies: quick.rows,
          integrations: {
            smtp: { configured: mailer.configured },
            whatsapp: { configured: config.whatsapp.configured, phone_number_id: config.whatsapp.configured ? config.whatsapp.phoneNumberId : null }
          }
        });
      } catch (err) {
        next(err);
      }
    });
    var color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use o formato #RRGGBB.");
    router.put("/", requireRole("admin"), validate(z.object({
      name: z.string().trim().min(1).max(120).optional(),
      logo_data: z.string().max(4e5, "Logotipo muito grande (m\xE1x. ~300KB).").nullable().optional(),
      primary_color: color.optional(),
      accent_color: color.optional(),
      timezone: z.string().min(1).max(60).optional(),
      auto_distribution: z.boolean().optional(),
      demo_mode: z.boolean().optional(),
      contact_sources: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
      channels: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
      response_sla_minutes: z.number().int().min(1).max(10080).optional(),
      idle_opportunity_days: z.number().int().min(1).max(365).optional()
    })), async (req, res, next) => {
      try {
        const d = req.data;
        if (d.logo_data && !/^data:image\/(png|jpeg|svg\+xml|webp);base64,/.test(d.logo_data)) {
          return next(badRequest("Logotipo inv\xE1lido. Envie PNG, JPEG, WEBP ou SVG.", { fields: { logo_data: "Formato inv\xE1lido." } }));
        }
        const { rows } = await query(
          `UPDATE company_settings SET
        name = COALESCE($1, name), logo_data = CASE WHEN $2::boolean THEN $3 ELSE logo_data END,
        primary_color = COALESCE($4, primary_color), accent_color = COALESCE($5, accent_color),
        timezone = COALESCE($6, timezone), auto_distribution = COALESCE($7, auto_distribution),
        demo_mode = COALESCE($8, demo_mode), contact_sources = COALESCE($9, contact_sources),
        channels = COALESCE($10, channels), response_sla_minutes = COALESCE($11, response_sla_minutes), idle_opportunity_days = COALESCE($12, idle_opportunity_days), updated_at = now()
       WHERE id = 1 RETURNING *`,
          [
            d.name ?? null,
            d.logo_data !== void 0,
            d.logo_data ?? null,
            d.primary_color ?? null,
            d.accent_color ?? null,
            d.timezone ?? null,
            d.auto_distribution ?? null,
            d.demo_mode ?? null,
            d.contact_sources ?? null,
            d.channels ?? null,
            d.response_sla_minutes ?? null,
            d.idle_opportunity_days ?? null
          ]
        );
        await audit(req, "settings_update", "company_settings", 1, { fields: Object.keys(d) });
        broadcast("settings_changed", {});
        res.json({ settings: rows[0], message: "Configura\xE7\xF5es salvas." });
      } catch (err) {
        next(err);
      }
    });
    router.get("/pipelines", requireAuth, async (_req, res, next) => {
      try {
        const pipelines = (await query("SELECT * FROM pipelines ORDER BY position, id")).rows;
        const stages = (await query("SELECT * FROM pipeline_stages ORDER BY pipeline_id, position")).rows;
        res.json({ pipelines: pipelines.map((p) => ({ ...p, stages: stages.filter((s) => s.pipeline_id === p.id) })) });
      } catch (err) {
        next(err);
      }
    });
    router.post("/pipelines", requireRole("admin"), validate(z.object({ name: z.string().trim().min(1).max(80) })), async (req, res, next) => {
      try {
        const out = await tx(async (client) => {
          const pos = (await client.query("SELECT COALESCE(max(position),0)+1 AS p FROM pipelines")).rows[0].p;
          const p = (await client.query("INSERT INTO pipelines (name, position) VALUES ($1,$2) RETURNING *", [req.data.name, pos])).rows[0];
          const defaults = [["Novo contato", "open"], ["Qualifica\xE7\xE3o", "open"], ["Proposta", "open"], ["Negocia\xE7\xE3o", "open"], ["Ganho", "won"], ["Perdido", "lost"]];
          for (let i = 0; i < defaults.length; i++) await client.query("INSERT INTO pipeline_stages (pipeline_id, name, kind, position) VALUES ($1,$2,$3,$4)", [p.id, defaults[i][0], defaults[i][1], i + 1]);
          return p;
        });
        await audit(req, "pipeline_create", "pipeline", out.id, { name: out.name });
        res.status(201).json({ pipeline: out, message: "Funil criado com etapas padr\xE3o." });
      } catch (err) {
        next(err);
      }
    });
    router.put("/pipelines/:id", requireRole("admin"), validate(z.object({ name: z.string().trim().min(1).max(80).optional(), is_default: z.boolean().optional(), active: z.boolean().optional() })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const out = await tx(async (client) => {
          const cur = (await client.query("SELECT * FROM pipelines WHERE id = $1", [id])).rows[0];
          if (!cur) throw notFound("Funil n\xE3o encontrado.");
          if (req.data.active === false) {
            const others = await client.query("SELECT count(*)::int AS n FROM pipelines WHERE active AND id <> $1", [id]);
            if (!others.rows[0].n) throw badRequest("Mantenha ao menos um funil ativo.");
            if (cur.is_default) throw badRequest("Defina outro funil como padr\xE3o antes de desativar este.");
          }
          if (req.data.is_default) await client.query("UPDATE pipelines SET is_default = FALSE");
          const r = await client.query("UPDATE pipelines SET name = COALESCE($1, name), is_default = COALESCE($2, is_default), active = COALESCE($3, active) WHERE id = $4 RETURNING *", [req.data.name ?? null, req.data.is_default ?? null, req.data.active ?? null, id]);
          return r.rows[0];
        });
        await audit(req, "pipeline_update", "pipeline", id, { fields: Object.keys(req.data) });
        res.json({ pipeline: out, message: "Funil atualizado." });
      } catch (err) {
        next(err);
      }
    });
    router.get("/stages", requireAuth, async (req, res, next) => {
      try {
        const params = [];
        let where = "";
        if (req.query.pipeline_id) {
          params.push(Number(req.query.pipeline_id));
          where = "WHERE pipeline_id = $1";
        }
        const { rows } = await query(`SELECT * FROM pipeline_stages ${where} ORDER BY pipeline_id, position`, params);
        res.json({ stages: rows });
      } catch (err) {
        next(err);
      }
    });
    router.put("/stages", requireRole("admin"), validate(z.object({
      pipeline_id: z.number().int().positive().optional(),
      stages: z.array(z.object({
        id: z.number().int().positive().optional(),
        name: z.string().trim().min(1).max(60),
        kind: z.enum(["open", "won", "lost"]),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
        active: z.boolean().optional()
      })).min(3).max(15)
    })), async (req, res, next) => {
      try {
        const list = req.data.stages;
        const active = list.filter((s) => s.active !== false);
        if (active.filter((s) => s.kind === "won").length !== 1 || active.filter((s) => s.kind === "lost").length !== 1) {
          return next(badRequest('O funil precisa ter exatamente uma etapa "Ganho" e uma etapa "Perdido" ativas.'));
        }
        if (!active.some((s) => s.kind === "open")) return next(badRequest("Inclua ao menos uma etapa aberta."));
        const out = await tx(async (client) => {
          const pipelineId = req.data.pipeline_id || (await client.query("SELECT id FROM pipelines ORDER BY is_default DESC, position LIMIT 1")).rows[0].id;
          const existing = (await client.query("SELECT id FROM pipeline_stages WHERE pipeline_id = $1", [pipelineId])).rows.map((r) => r.id);
          const keep = /* @__PURE__ */ new Set();
          let pos = 1;
          for (const s of list) {
            if (s.id) {
              if (!existing.includes(s.id)) throw badRequest("Etapa n\xE3o pertence a este funil.");
              keep.add(s.id);
              await client.query("UPDATE pipeline_stages SET name=$1, kind=$2, active=$3, position=$4, color=$5 WHERE id=$6", [s.name, s.kind, s.active !== false, pos++, s.color ?? null, s.id]);
            } else {
              const r = await client.query("INSERT INTO pipeline_stages (pipeline_id, name, kind, active, position, color) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id", [pipelineId, s.name, s.kind, s.active !== false, pos++, s.color ?? null]);
              keep.add(r.rows[0].id);
            }
          }
          for (const id of existing) {
            if (keep.has(id)) continue;
            const used = await client.query("SELECT 1 FROM opportunities WHERE stage_id = $1 LIMIT 1", [id]);
            if (used.rowCount) await client.query("UPDATE pipeline_stages SET active = FALSE, position = 999 WHERE id = $1", [id]);
            else await client.query("DELETE FROM pipeline_stages WHERE id = $1", [id]);
          }
          return (await client.query("SELECT * FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position", [pipelineId])).rows;
        });
        await audit(req, "stages_update", "pipeline_stages", req.data.pipeline_id || null, { count: list.length });
        res.json({ stages: out, message: "Etapas do funil atualizadas." });
      } catch (err) {
        next(err);
      }
    });
    router.get("/audit", requireRole("admin", "supervisor"), async (req, res, next) => {
      try {
        const limit = Math.min(Number(req.query.limit) || 100, 500);
        const params = [limit];
        const where = [];
        if (req.query.user_id) {
          params.push(Number(req.query.user_id));
          where.push(`a.user_id = $${params.length}`);
        }
        if (req.query.action) {
          params.push(`%${req.query.action}%`);
          where.push(`a.action ILIKE $${params.length}`);
        }
        const { rows } = await query(
          `SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY a.created_at DESC LIMIT $1`,
          params
        );
        res.json({ entries: rows });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/lib/util.js
var require_util = __commonJS({
  "src/lib/util.js"(exports, module) {
    "use strict";
    var onlyDigits = (s) => s ? String(s).replace(/\D+/g, "") : "";
    function normalizePhone(s) {
      let d = onlyDigits(s);
      if (!d) return null;
      if (d.length === 10 || d.length === 11) d = "55" + d;
      return d;
    }
    function normalizeEmail(s) {
      if (!s) return null;
      const e = String(s).trim().toLowerCase();
      return e || null;
    }
    function validDocument(doc) {
      const d = onlyDigits(doc);
      if (!d) return true;
      if (d.length === 11) return validCpf(d);
      if (d.length === 14) return validCnpj(d);
      return false;
    }
    function validCpf(c) {
      if (/^(\d)\1+$/.test(c)) return false;
      const calc = (len) => {
        let sum = 0;
        for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
        const r = sum * 10 % 11;
        return r === 10 ? 0 : r;
      };
      return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
    }
    function validCnpj(c) {
      if (/^(\d)\1+$/.test(c)) return false;
      const calc = (len) => {
        const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let sum = 0;
        for (let i = 0; i < len; i++) sum += Number(c[i]) * w[i];
        const r = sum % 11;
        return r < 2 ? 0 : 11 - r;
      };
      return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
    }
    async function nextProtocol(client) {
      const { rows } = await client.query("SELECT nextval('ticket_protocol_seq') AS n");
      const d = /* @__PURE__ */ new Date();
      const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      return `${ymd}-${String(rows[0].n).padStart(6, "0")}`;
    }
    function toCsv(rows, columns) {
      const esc = (v) => {
        if (v == null) return "";
        let s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("|") : String(v);
        if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const header = columns.map((c) => esc(c.label)).join(";");
      const lines = rows.map((r) => columns.map((c) => esc(typeof c.get === "function" ? c.get(r) : r[c.key])).join(";"));
      return "\uFEFF" + [header, ...lines].join("\r\n");
    }
    function parseCsv(text) {
      text = text.replace(/^﻿/, "");
      const firstLine = text.split(/\r?\n/)[0] || "";
      const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ",";
      const rows = [];
      let row = [], field = "", inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
          if (ch === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i++;
            } else inQuotes = false;
          } else field += ch;
        } else if (ch === '"') inQuotes = true;
        else if (ch === sep) {
          row.push(field);
          field = "";
        } else if (ch === "\n" || ch === "\r") {
          if (ch === "\r" && text[i + 1] === "\n") i++;
          row.push(field);
          field = "";
          if (row.some((f) => f.trim() !== "")) rows.push(row);
          row = [];
        } else field += ch;
      }
      row.push(field);
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      return rows;
    }
    module.exports = { onlyDigits, normalizePhone, normalizeEmail, validDocument, nextProtocol, toCsv, parseCsv };
  }
});

// src/routes/customers.js
var require_customers = __commonJS({
  "src/routes/customers.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query, tx } = require_db();
    var { validate } = require_validate();
    var { requireAuth, isManager } = require_auth();
    var { badRequest, notFound, conflict, forbidden } = require_errors();
    var { audit } = require_audit();
    var { normalizePhone, normalizeEmail, validDocument, toCsv, parseCsv, onlyDigits } = require_util();
    var router = express.Router();
    router.use(requireAuth);
    function scopeSql(user, alias = "c", params) {
      if (isManager(user)) return "TRUE";
      params.push(user.id);
      const p = `$${params.length}`;
      return `(${alias}.owner_id = ${p} OR ${alias}.owner_id IS NULL OR EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id = ${alias}.id AND t.assignee_id = ${p}))`;
    }
    async function loadCustomer(req, id) {
      const params = [id];
      const scope = scopeSql(req.user, "c", params);
      const { rows } = await query(
        `SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id
     WHERE c.id = $1 AND ${scope}`,
        params
      );
      if (!rows[0]) throw notFound("Cliente n\xE3o encontrado ou fora do seu escopo.");
      return rows[0];
    }
    var customerSchema = z.object({
      name: z.string().trim().min(2).max(160),
      phone: z.string().trim().max(30).nullable().optional(),
      email: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
      company: z.string().trim().max(160).nullable().optional(),
      city: z.string().trim().max(120).nullable().optional(),
      document: z.string().trim().max(20).nullable().optional(),
      source: z.string().trim().max(60).nullable().optional(),
      tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
      notes: z.string().max(5e3).nullable().optional(),
      owner_id: z.number().int().positive().nullable().optional(),
      version: z.number().int().optional()
    });
    function clean(d) {
      const out = { ...d };
      if (out.email === "") out.email = null;
      if (out.email) out.email = normalizeEmail(out.email);
      if (out.phone !== void 0) out.phone_digits = normalizePhone(out.phone);
      if (out.document) {
        if (!validDocument(out.document)) throw badRequest("CPF ou CNPJ inv\xE1lido.", { fields: { document: "CPF/CNPJ inv\xE1lido." } });
        out.document = onlyDigits(out.document);
      }
      return out;
    }
    async function findDuplicates(phoneDigits, email, excludeId) {
      if (!phoneDigits && !email) return [];
      const params = [phoneDigits || null, email || null, excludeId || 0];
      const { rows } = await query(
        `SELECT id, name, phone, email, company FROM customers
     WHERE id <> $3 AND (($1::text IS NOT NULL AND phone_digits = $1) OR ($2::text IS NOT NULL AND lower(email) = $2))
     LIMIT 5`,
        params
      );
      return rows;
    }
    router.get("/", async (req, res, next) => {
      try {
        const params = [];
        const where = [scopeSql(req.user, "c", params)];
        if (req.query.q) {
          params.push(`%${req.query.q.trim()}%`);
          const textIdx = params.length;
          const digits = onlyDigits(req.query.q);
          let digitsClause = "";
          if (digits) {
            params.push(`%${digits}%`);
            digitsClause = `OR c.phone_digits LIKE $${params.length} OR c.document LIKE $${params.length}`;
          }
          where.push(`(c.name ILIKE $${textIdx} OR c.email ILIKE $${textIdx} OR c.company ILIKE $${textIdx} ${digitsClause})`);
        }
        if (req.query.source) {
          params.push(req.query.source);
          where.push(`c.source = $${params.length}`);
        }
        if (req.query.owner_id) {
          params.push(Number(req.query.owner_id));
          where.push(`c.owner_id = $${params.length}`);
        }
        if (req.query.city) {
          params.push(`%${req.query.city}%`);
          where.push(`c.city ILIKE $${params.length}`);
        }
        if (req.query.tag) {
          params.push(req.query.tag);
          where.push(`$${params.length} = ANY(c.tags)`);
        }
        if (req.query.pending_followup === "true") {
          where.push(`EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id = c.id AND t.follow_up_at IS NOT NULL AND t.status NOT IN ('resolvido','cancelado'))`);
        }
        const limit = Math.min(Number(req.query.limit) || 25, 200);
        const page = Math.max(Number(req.query.page) || 1, 1);
        if (req.query.no_open_ticket === "true") where.push(`NOT EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id = c.id AND t.status NOT IN ('resolvido','cancelado'))`);
        const SORTS = { name: "lower(c.name)", updated_at: "c.updated_at", created_at: "c.created_at", company: "lower(c.company)", city: "lower(c.city)", source: "c.source", owner_name: "u.name", next_follow_up: "next_follow_up", open_tickets: "open_tickets" };
        const order = req.query.sort && SORTS[req.query.sort] ? `${SORTS[req.query.sort]} ${req.query.dir === "desc" ? "DESC NULLS LAST" : "ASC NULLS LAST"}` : "c.updated_at DESC";
        const sql = `FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE ${where.join(" AND ")}`;
        const total = (await query(`SELECT count(*)::int AS n ${sql}`, params)).rows[0].n;
        params.push(limit, (page - 1) * limit);
        const { rows } = await query(
          `SELECT c.id, c.name, c.phone, c.email, c.company, c.city, c.source, c.tags, c.owner_id, u.name AS owner_name, c.created_at, c.updated_at,
        (SELECT count(*)::int FROM tickets t WHERE t.customer_id = c.id AND t.status NOT IN ('resolvido','cancelado')) AS open_tickets,
        (SELECT min(t.follow_up_at) FROM tickets t WHERE t.customer_id = c.id AND t.follow_up_at IS NOT NULL AND t.status NOT IN ('resolvido','cancelado')) AS next_follow_up,
        (SELECT max(e.created_at) FROM ticket_events e JOIN tickets t ON t.id = e.ticket_id WHERE t.customer_id = c.id AND e.kind = 'interaction') AS last_contact_at,
        (SELECT count(*)::int FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.customer_id = c.id AND s.kind = 'open') AS open_opportunities
       ${sql} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        );
        res.json({ customers: rows, total, page, limit });
      } catch (err) {
        next(err);
      }
    });
    router.get("/export.csv", async (req, res, next) => {
      try {
        const params = [];
        const scope = scopeSql(req.user, "c", params);
        const { rows } = await query(
          `SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE ${scope} ORDER BY c.name`,
          params
        );
        await audit(req, "customers_export", "customer", null, { count: rows.length });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="clientes.csv"');
        res.send(toCsv(rows, [
          { key: "id", label: "id" },
          { key: "name", label: "nome" },
          { key: "phone", label: "telefone" },
          { key: "email", label: "email" },
          { key: "company", label: "empresa" },
          { key: "city", label: "cidade" },
          { key: "document", label: "cpf_cnpj" },
          { key: "source", label: "origem" },
          { key: "tags", label: "etiquetas" },
          { key: "owner_name", label: "responsavel" },
          { key: "notes", label: "observacoes" },
          { key: "created_at", label: "criado_em" }
        ]));
      } catch (err) {
        next(err);
      }
    });
    router.get("/check-duplicates", async (req, res, next) => {
      try {
        const dups = await findDuplicates(normalizePhone(req.query.phone), normalizeEmail(req.query.email), Number(req.query.exclude_id) || 0);
        res.json({ duplicates: dups });
      } catch (err) {
        next(err);
      }
    });
    var importSchema = z.object({ csv: z.string().min(1).max(5 * 1024 * 1024), commit: z.boolean().optional(), skip_duplicates: z.boolean().optional() });
    var HEADER_MAP = {
      nome: "name",
      name: "name",
      telefone: "phone",
      phone: "phone",
      celular: "phone",
      email: "email",
      "e-mail": "email",
      empresa: "company",
      company: "company",
      cidade: "city",
      city: "city",
      cpf_cnpj: "document",
      cpf: "document",
      cnpj: "document",
      documento: "document",
      origem: "source",
      source: "source",
      etiquetas: "tags",
      tags: "tags",
      observacoes: "notes",
      observa\u00E7\u00F5es: "notes",
      notes: "notes",
      responsavel: "owner",
      respons\u00E1vel: "owner"
    };
    router.post("/import", validate(importSchema), async (req, res, next) => {
      try {
        if (!isManager(req.user)) return next(forbidden("Apenas administradores e supervisores podem importar clientes."));
        const rows = parseCsv(req.data.csv);
        if (rows.length < 2) return next(badRequest("O arquivo precisa ter um cabe\xE7alho e ao menos uma linha."));
        const header = rows[0].map((h) => HEADER_MAP[h.trim().toLowerCase()] || null);
        if (!header.includes("name")) return next(badRequest('Coluna obrigat\xF3ria ausente: "nome".'));
        const users = (await query("SELECT id, name, email FROM users WHERE active")).rows;
        const results = [];
        const seenPhones = /* @__PURE__ */ new Set(), seenEmails = /* @__PURE__ */ new Set();
        for (let i = 1; i < rows.length; i++) {
          const rec = {};
          rows[i].forEach((v, idx) => {
            if (header[idx]) rec[header[idx]] = v.trim();
          });
          const errors = [];
          if (!rec.name || rec.name.length < 2) errors.push("Nome obrigat\xF3rio.");
          const email = normalizeEmail(rec.email);
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("E-mail inv\xE1lido.");
          const phoneDigits = normalizePhone(rec.phone);
          if (rec.phone && !phoneDigits) errors.push("Telefone inv\xE1lido.");
          if (rec.document && !validDocument(rec.document)) errors.push("CPF/CNPJ inv\xE1lido.");
          let ownerId = null;
          if (rec.owner) {
            const u = users.find((x) => x.name.toLowerCase() === rec.owner.toLowerCase() || x.email.toLowerCase() === rec.owner.toLowerCase());
            if (u) ownerId = u.id;
            else errors.push(`Respons\xE1vel "${rec.owner}" n\xE3o encontrado.`);
          }
          const warnings = [];
          if (phoneDigits && seenPhones.has(phoneDigits) || email && seenEmails.has(email)) warnings.push("Duplicado dentro do pr\xF3prio arquivo.");
          if (phoneDigits) seenPhones.add(phoneDigits);
          if (email) seenEmails.add(email);
          const dups = errors.length ? [] : await findDuplicates(phoneDigits, email, 0);
          if (dups.length) warnings.push(`Poss\xEDvel duplicidade com: ${dups.map((d) => `#${d.id} ${d.name}`).join(", ")}`);
          results.push({ line: i + 1, data: {
            ...rec,
            email,
            phone_digits: phoneDigits,
            owner_id: ownerId,
            tags: rec.tags ? rec.tags.split(/[|,]/).map((t) => t.trim()).filter(Boolean) : []
          }, errors, warnings, duplicate: dups.length > 0 });
        }
        const valid = results.filter((r) => !r.errors.length);
        if (!req.data.commit) {
          return res.json({
            preview: true,
            total: results.length,
            valid: valid.length,
            invalid: results.length - valid.length,
            duplicates: results.filter((r) => r.duplicate).length,
            rows: results.slice(0, 500)
          });
        }
        let imported = 0, skipped = 0;
        await tx(async (client) => {
          for (const r of valid) {
            if (req.data.skip_duplicates && r.duplicate) {
              skipped++;
              continue;
            }
            const d = r.data;
            await client.query(
              `INSERT INTO customers (name, phone, phone_digits, email, company, city, document, source, tags, notes, owner_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
              [
                d.name,
                d.phone || null,
                d.phone_digits,
                d.email,
                d.company || null,
                d.city || null,
                d.document ? onlyDigits(d.document) : null,
                d.source || null,
                d.tags,
                d.notes || null,
                d.owner_id,
                req.user.id
              ]
            );
            imported++;
          }
        });
        await audit(req, "customers_import", "customer", null, { imported, skipped, invalid: results.length - valid.length });
        res.json({
          preview: false,
          imported,
          skipped,
          invalid: results.length - valid.length,
          errors: results.filter((r) => r.errors.length).map((r) => ({ line: r.line, errors: r.errors })),
          message: `${imported} cliente(s) importado(s).`
        });
      } catch (err) {
        next(err);
      }
    });
    router.get("/:id", async (req, res, next) => {
      try {
        const c = await loadCustomer(req, Number(req.params.id));
        const [tickets, opps, tasks, notes, wa] = await Promise.all([
          query(`SELECT t.id, t.protocol, t.subject, t.status, t.priority, t.channel, t.assignee_id, u.name AS assignee_name, t.opened_at, t.closed_at, t.follow_up_at, t.last_message_at, t.last_message_preview, t.unread_count
             FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.customer_id = $1 ORDER BY t.opened_at DESC`, [c.id]),
          query(`SELECT o.*, s.name AS stage_name, s.kind AS stage_kind, s.pipeline_id, p.name AS pipeline_name, u.name AS owner_name FROM opportunities o
             JOIN pipeline_stages s ON s.id = o.stage_id JOIN pipelines p ON p.id = s.pipeline_id LEFT JOIN users u ON u.id = o.owner_id WHERE o.customer_id = $1 ORDER BY (s.kind = 'open') DESC, o.created_at DESC`, [c.id]),
          query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.customer_id = $1 ORDER BY t.done_at NULLS FIRST, t.due_at`, [c.id]),
          query(`SELECT n.*, u.name AS user_name FROM customer_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.customer_id = $1 ORDER BY n.created_at DESC`, [c.id]),
          query(`SELECT id, direction, body, status, created_at FROM whatsapp_messages WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`, [c.id])
        ]);
        const timeline = (await query(`SELECT e.id, e.ticket_id, e.kind, e.direction, e.channel, e.body, e.created_at, u.name AS user_name, t.protocol FROM ticket_events e JOIN tickets t ON t.id = e.ticket_id LEFT JOIN users u ON u.id = e.user_id
      WHERE t.customer_id = $1 AND e.kind IN ('interaction','note') ORDER BY e.created_at DESC LIMIT 40`, [c.id])).rows;
        const duplicates = await findDuplicates(c.phone_digits, c.email ? c.email.toLowerCase() : null, c.id);
        res.json({ customer: c, tickets: tickets.rows, opportunities: opps.rows, tasks: tasks.rows, notes: notes.rows, whatsapp_messages: wa.rows, timeline, duplicates });
      } catch (err) {
        next(err);
      }
    });
    router.post("/", validate(customerSchema), async (req, res, next) => {
      try {
        const d = clean(req.data);
        const dups = await findDuplicates(d.phone_digits, d.email, 0);
        if (dups.length && !req.query.force) {
          return next(conflict("J\xE1 existe um cliente com este telefone ou e-mail.", { duplicates: dups, can_force: true }));
        }
        const ownerId = d.owner_id === void 0 ? req.user.role === "atendente" ? req.user.id : null : d.owner_id;
        const { rows } = await query(
          `INSERT INTO customers (name, phone, phone_digits, email, company, city, document, source, tags, notes, owner_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [
            d.name,
            d.phone || null,
            d.phone_digits || null,
            d.email || null,
            d.company || null,
            d.city || null,
            d.document || null,
            d.source || null,
            d.tags || [],
            d.notes || null,
            ownerId,
            req.user.id
          ]
        );
        await audit(req, "customer_create", "customer", rows[0].id, { name: d.name });
        res.status(201).json({ customer: rows[0], message: "Cliente cadastrado com sucesso.", duplicates: dups });
      } catch (err) {
        next(err);
      }
    });
    router.put("/:id", validate(customerSchema.partial()), async (req, res, next) => {
      try {
        const cur = await loadCustomer(req, Number(req.params.id));
        if (req.user.role === "atendente" && req.data.owner_id !== void 0 && req.data.owner_id !== cur.owner_id && req.data.owner_id !== req.user.id && cur.owner_id !== req.user.id) {
          return next(forbidden("Atendentes s\xF3 podem alterar o respons\xE1vel de seus pr\xF3prios clientes."));
        }
        const d = clean(req.data);
        if (d.version !== void 0 && d.version !== cur.version) {
          return next(conflict("Este cliente foi alterado por outro usu\xE1rio. Recarregue a p\xE1gina para ver a vers\xE3o atual.", { current: cur }));
        }
        const phoneDigits = d.phone !== void 0 ? d.phone_digits : cur.phone_digits;
        const email = d.email !== void 0 ? d.email : cur.email;
        const dups = await findDuplicates(phoneDigits, email ? email.toLowerCase() : null, cur.id);
        if (dups.length && !req.query.force && (d.phone !== void 0 || d.email !== void 0)) {
          return next(conflict("J\xE1 existe outro cliente com este telefone ou e-mail.", { duplicates: dups, can_force: true }));
        }
        const { rows } = await query(
          `UPDATE customers SET name = COALESCE($1, name), phone = CASE WHEN $2::boolean THEN $3 ELSE phone END,
        phone_digits = CASE WHEN $2::boolean THEN $4 ELSE phone_digits END, email = CASE WHEN $5::boolean THEN $6 ELSE email END,
        company = CASE WHEN $7::boolean THEN $8 ELSE company END, city = CASE WHEN $9::boolean THEN $10 ELSE city END,
        document = CASE WHEN $11::boolean THEN $12 ELSE document END, source = CASE WHEN $13::boolean THEN $14 ELSE source END,
        tags = COALESCE($15, tags), notes = CASE WHEN $16::boolean THEN $17 ELSE notes END,
        owner_id = CASE WHEN $18::boolean THEN $19 ELSE owner_id END, version = version + 1, updated_at = now()
       WHERE id = $20 RETURNING *`,
          [
            d.name ?? null,
            d.phone !== void 0,
            d.phone || null,
            d.phone_digits || null,
            d.email !== void 0,
            d.email || null,
            d.company !== void 0,
            d.company || null,
            d.city !== void 0,
            d.city || null,
            d.document !== void 0,
            d.document || null,
            d.source !== void 0,
            d.source || null,
            d.tags ?? null,
            d.notes !== void 0,
            d.notes || null,
            d.owner_id !== void 0,
            d.owner_id ?? null,
            cur.id
          ]
        );
        await audit(req, "customer_update", "customer", cur.id, { fields: Object.keys(req.data) });
        res.json({ customer: rows[0], message: "Cliente atualizado." });
      } catch (err) {
        next(err);
      }
    });
    router.delete("/:id", async (req, res, next) => {
      try {
        if (req.user.role !== "admin") return next(forbidden("Apenas administradores podem excluir clientes."));
        const c = await loadCustomer(req, Number(req.params.id));
        const used = await query("SELECT (SELECT count(*) FROM tickets WHERE customer_id=$1)::int AS t, (SELECT count(*) FROM opportunities WHERE customer_id=$1)::int AS o", [c.id]);
        if (used.rows[0].t || used.rows[0].o) return next(conflict("Este cliente possui atendimentos ou oportunidades e n\xE3o pode ser exclu\xEDdo. O hist\xF3rico deve ser preservado."));
        await query("DELETE FROM customers WHERE id = $1", [c.id]);
        await audit(req, "customer_delete", "customer", c.id, { name: c.name });
        res.json({ ok: true, message: "Cliente exclu\xEDdo." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/notes", validate(z.object({ body: z.string().trim().min(1).max(5e3) })), async (req, res, next) => {
      try {
        const c = await loadCustomer(req, Number(req.params.id));
        const { rows } = await query(
          `INSERT INTO customer_notes (customer_id, user_id, body) VALUES ($1,$2,$3) RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name`,
          [c.id, req.user.id, req.data.body]
        );
        await query("UPDATE customers SET updated_at = now() WHERE id = $1", [c.id]);
        res.status(201).json({ note: rows[0], message: "Anota\xE7\xE3o adicionada." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = { router, loadCustomer, scopeSql };
  }
});

// src/lib/notify.js
var require_notify = __commonJS({
  "src/lib/notify.js"(exports, module) {
    "use strict";
    var { query } = require_db();
    var { broadcast } = require_realtime();
    async function notify(userId, title, body, link, client) {
      if (!userId) return;
      const q = client ? client.query.bind(client) : query;
      await q(
        "INSERT INTO notifications (user_id, title, body, link) VALUES ($1,$2,$3,$4)",
        [userId, title, body || null, link || null]
      );
      broadcast("notification", { title, body, link }, [userId]);
    }
    module.exports = { notify };
  }
});

// src/lib/whatsapp.js
var require_whatsapp = __commonJS({
  "src/lib/whatsapp.js"(exports, module) {
    "use strict";
    var { query, tx } = require_db();
    var config = require_config();
    var { broadcast } = require_realtime();
    var { normalizePhone, nextProtocol } = require_util();
    var { HttpError } = require_errors();
    var wa = config.whatsapp;
    var GRAPH = "https://graph.facebook.com/v20.0";
    var STATUS_PT = { sent: "enviado", delivered: "entregue", read: "lido", failed: "falhou", deleted: "apagado" };
    function state() {
      const missing = [];
      if (!wa.token) missing.push("WHATSAPP_TOKEN");
      if (!wa.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
      if (!wa.verifyToken) missing.push("WHATSAPP_VERIFY_TOKEN");
      if (!wa.appSecret) missing.push("WHATSAPP_APP_SECRET");
      return { configured: wa.configured, missing, webhook_ready: wa.configured && Boolean(wa.verifyToken), signature_check: Boolean(wa.appSecret) };
    }
    async function recordError(msg) {
      try {
        await query("UPDATE company_settings SET whatsapp_last_error = $1, whatsapp_last_error_at = now() WHERE id = 1", [String(msg).slice(0, 500)]);
      } catch (_) {
      }
    }
    async function windowOpen(customerId) {
      const { rows } = await query(`SELECT max(created_at) AS last_in FROM whatsapp_messages WHERE customer_id = $1 AND direction = 'entrada'`, [customerId]);
      const last = rows[0].last_in ? new Date(rows[0].last_in) : null;
      return { open: Boolean(last && Date.now() - last.getTime() < 24 * 3600 * 1e3), last_inbound_at: last };
    }
    async function graph(path, body) {
      const resp = await fetch(`${GRAPH}/${path}`, { method: "POST", headers: { Authorization: `Bearer ${wa.token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const msg = data.error?.message || `HTTP ${resp.status}`;
        await recordError(msg);
        throw new HttpError(502, `A API do WhatsApp recusou o envio: ${msg}`, { code: data.error?.code });
      }
      return data;
    }
    async function sendText({ ticketId, customerId, body, userId, template, viaRule }) {
      if (!wa.configured) throw new HttpError(503, "WhatsApp n\xE3o est\xE1 conectado. Configure as credenciais no servidor ou registre a intera\xE7\xE3o manualmente.");
      const c = (await query("SELECT id, phone_digits, name FROM customers WHERE id = $1", [customerId])).rows[0];
      if (!c || !c.phone_digits) throw new HttpError(400, "Cliente sem telefone v\xE1lido para WhatsApp.");
      let payload;
      if (template) {
        payload = { messaging_product: "whatsapp", to: c.phone_digits, type: "template", template: { name: template.name, language: { code: template.language || "pt_BR" } } };
      } else {
        const w = await windowOpen(c.id);
        if (!w.open) throw new HttpError(409, "Fora da janela de 24h: o cliente n\xE3o enviou mensagem nas \xFAltimas 24 horas. Pelas regras da Meta, s\xF3 \xE9 permitido enviar um modelo (template) aprovado.", { window_closed: true, last_inbound_at: w.last_inbound_at });
        payload = { messaging_product: "whatsapp", to: c.phone_digits, type: "text", text: { body, preview_url: false } };
      }
      const data = await graph(`${wa.phoneNumberId}/messages`, payload);
      const waId = data.messages?.[0]?.id || null;
      const text = template ? `[modelo: ${template.name}]` : body;
      return tx(async (client) => {
        let eventId = null;
        if (ticketId) {
          const ev = await client.query(
            `INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload) VALUES ($1,$2,'interaction','saida','WhatsApp',$3,$4) RETURNING id`,
            [ticketId, userId, text, JSON.stringify({ via: "whatsapp_api", wa_message_id: waId, status: "enviado", rule_id: viaRule || null })]
          );
          eventId = ev.rows[0].id;
          await client.query(`UPDATE tickets SET first_response_at = COALESCE(first_response_at, now()), last_message_at = now(), last_message_preview = left($2, 160),
        last_message_direction = 'saida', last_agent_message_at = now(), unread_count = 0, updated_at = now() WHERE id = $1`, [ticketId, text]);
        }
        const { rows } = await client.query(
          `INSERT INTO whatsapp_messages (customer_id, ticket_id, user_id, direction, wa_message_id, phone_digits, body, status, raw, ticket_event_id, message_type)
       VALUES ($1,$2,$3,'saida',$4,$5,$6,'enviado',$7,$8,$9) RETURNING *`,
          [c.id, ticketId || null, userId, waId, c.phone_digits, text, JSON.stringify(data), eventId, template ? "template" : "text"]
        );
        broadcast("tickets_changed", { id: ticketId, action: "message" });
        return rows[0];
      });
    }
    async function processWebhook(body) {
      let messages = 0, statuses = 0;
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const v = change.value || {};
          const contacts = new Map((v.contacts || []).map((c) => [normalizePhone(c.wa_id), c.profile?.name]));
          for (const m of v.messages || []) {
            if (await inbound(m, contacts)) messages++;
          }
          for (const s of v.statuses || []) {
            if (await statusUpdate(s)) statuses++;
          }
        }
      }
      await query("UPDATE company_settings SET whatsapp_last_event_at = now() WHERE id = 1");
      return { messages, statuses };
    }
    function describe(m) {
      switch (m.type) {
        case "text":
          return { body: m.text?.body || "", media: null };
        case "image":
          return { body: m.image?.caption || "[imagem]", media: { id: m.image?.id, mime: m.image?.mime_type, name: "imagem" } };
        case "document":
          return { body: m.document?.caption || `[documento] ${m.document?.filename || ""}`.trim(), media: { id: m.document?.id, mime: m.document?.mime_type, name: m.document?.filename || "documento" } };
        case "audio":
          return { body: "[\xE1udio]", media: { id: m.audio?.id, mime: m.audio?.mime_type, name: "audio" } };
        case "video":
          return { body: m.video?.caption || "[v\xEDdeo]", media: { id: m.video?.id, mime: m.video?.mime_type, name: "video" } };
        case "sticker":
          return { body: "[figurinha]", media: null };
        case "location":
          return { body: `[localiza\xE7\xE3o] ${m.location?.latitude}, ${m.location?.longitude}`, media: null };
        case "button":
          return { body: m.button?.text || "[bot\xE3o]", media: null };
        case "interactive":
          return { body: m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || "[interativo]", media: null };
        default:
          return { body: `[${m.type}]`, media: null };
      }
    }
    async function inbound(m, contacts) {
      const phone = normalizePhone(m.from);
      if (!phone || !m.id) return false;
      const { body, media } = describe(m);
      return tx(async (client) => {
        const ins = await client.query(
          `INSERT INTO whatsapp_messages (direction, wa_message_id, phone_digits, body, status, raw, message_type) VALUES ('entrada',$1,$2,$3,'recebido',$4,$5)
       ON CONFLICT (wa_message_id) DO NOTHING RETURNING id`,
          [m.id, phone, body, JSON.stringify(m), m.type || "text"]
        );
        if (!ins.rowCount) return false;
        const msgId = ins.rows[0].id;
        let cust = (await client.query("SELECT id, name FROM customers WHERE phone_digits = $1 ORDER BY id LIMIT 1", [phone])).rows[0];
        let createdCustomer = false;
        if (!cust) {
          const name = contacts.get(phone) || `WhatsApp ${phone.slice(-4)}`;
          cust = (await client.query(`INSERT INTO customers (name, phone, phone_digits, source, tags) VALUES ($1,$2,$3,'WhatsApp','{}') RETURNING id, name`, [name, "+" + phone, phone])).rows[0];
          createdCustomer = true;
        }
        let ticket = (await client.query(`SELECT * FROM tickets WHERE customer_id = $1 AND status NOT IN ('resolvido','cancelado') ORDER BY opened_at DESC LIMIT 1 FOR UPDATE`, [cust.id])).rows[0];
        let createdTicket = false;
        if (!ticket) {
          const protocol = await nextProtocol(client);
          const subject = body.replace(/\s+/g, " ").slice(0, 80) || "Mensagem pelo WhatsApp";
          ticket = (await client.query(`INSERT INTO tickets (protocol, customer_id, subject, channel, priority, status) VALUES ($1,$2,$3,'WhatsApp','normal','aguardando') RETURNING *`, [protocol, cust.id, subject])).rows[0];
          await client.query(`INSERT INTO ticket_events (ticket_id, kind, body, payload) VALUES ($1,'system','Atendimento aberto automaticamente por mensagem recebida no WhatsApp',$2)`, [ticket.id, JSON.stringify({ action: "created", channel: "WhatsApp", via: "whatsapp_api" })]);
          createdTicket = true;
        }
        const at = m.timestamp ? new Date(Number(m.timestamp) * 1e3) : /* @__PURE__ */ new Date();
        const ev = await client.query(
          `INSERT INTO ticket_events (ticket_id, kind, direction, channel, body, payload, created_at) VALUES ($1,'interaction','entrada','WhatsApp',$2,$3,$4) RETURNING id`,
          [ticket.id, body, JSON.stringify({ via: "whatsapp_api", wa_message_id: m.id, type: m.type, media: media || null }), at]
        );
        if (media && media.id) {
          await client.query(`INSERT INTO ticket_attachments (ticket_id, event_id, name, mime, size, wa_media_id) VALUES ($1,$2,$3,$4,0,$5)`, [ticket.id, ev.rows[0].id, media.name, media.mime || "application/octet-stream", media.id]);
        }
        await client.query(`UPDATE whatsapp_messages SET customer_id = $1, ticket_id = $2, ticket_event_id = $3 WHERE id = $4`, [cust.id, ticket.id, ev.rows[0].id, msgId]);
        const newStatus = ticket.status === "aguardando_cliente" ? "em_atendimento" : ticket.status;
        await client.query(`UPDATE tickets SET last_message_at = now(), last_message_preview = left($2, 160), last_message_direction = 'entrada', last_customer_message_at = now(),
      unread_count = unread_count + 1, status = $3, version = version + 1, updated_at = now() WHERE id = $1`, [ticket.id, body, newStatus]);
        if (newStatus !== ticket.status) {
          await client.query(`INSERT INTO ticket_events (ticket_id, kind, body, payload) VALUES ($1,'system','Cliente respondeu: status alterado de Aguardando cliente para Em atendimento',$2)`, [ticket.id, JSON.stringify({ action: "status", from: ticket.status, to: newStatus })]);
        }
        setImmediate(async () => {
          const automations = require_automations();
          await automations.stopFollowUps("ticket_id = $1", [ticket.id], "Cliente respondeu");
          await automations.trigger("ticket_customer_replied", "ticket", ticket.id, { dedupeKey: `reply:${m.id}` });
          if (createdTicket) await automations.trigger("ticket_created", "ticket", ticket.id);
          const { notify } = require_notify();
          if (ticket.assignee_id) await notify(ticket.assignee_id, "Nova mensagem no WhatsApp", `${cust.name}: ${body.slice(0, 80)}`, `#/atendimentos/${ticket.id}`);
        });
        broadcast("whatsapp_message", { customer_id: cust.id, ticket_id: ticket.id, phone, created_customer: createdCustomer, created_ticket: createdTicket });
        broadcast("tickets_changed", { id: ticket.id, action: "message" });
        return true;
      });
    }
    async function statusUpdate(s) {
      if (!s.id || !s.status) return false;
      const status = STATUS_PT[s.status] || s.status;
      const err = s.errors?.[0] ? `${s.errors[0].code}: ${s.errors[0].title || s.errors[0].message || ""}` : null;
      const at = s.timestamp ? new Date(Number(s.timestamp) * 1e3) : /* @__PURE__ */ new Date();
      const rank = { enviado: 1, entregue: 2, lido: 3, falhou: 9 };
      const { rows } = await query(`SELECT id, ticket_id, ticket_event_id, status FROM whatsapp_messages WHERE wa_message_id = $1`, [s.id]);
      const m = rows[0];
      if (!m) return false;
      if ((rank[status] || 0) <= (rank[m.status] || 0) && status !== "falhou") return false;
      await query("UPDATE whatsapp_messages SET status = $1, status_at = $2, error = $3 WHERE id = $4", [status, at, err, m.id]);
      if (m.ticket_event_id) await query(`UPDATE ticket_events SET payload = payload || $1::jsonb WHERE id = $2`, [JSON.stringify({ status, status_at: at, error: err }), m.ticket_event_id]);
      if (status === "falhou") await recordError(`Envio ${s.id} falhou: ${err || "sem detalhe"}`);
      broadcast("tickets_changed", { id: m.ticket_id, action: "status" });
      return true;
    }
    async function fetchMedia(mediaId) {
      if (!wa.configured) throw new HttpError(503, "WhatsApp n\xE3o est\xE1 conectado.");
      const meta = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${wa.token}` } });
      const info = await meta.json().catch(() => ({}));
      if (!meta.ok || !info.url) throw new HttpError(502, `N\xE3o foi poss\xEDvel obter a m\xEDdia: ${info.error?.message || meta.status}`);
      const file = await fetch(info.url, { headers: { Authorization: `Bearer ${wa.token}` } });
      if (!file.ok) throw new HttpError(502, "Falha ao baixar a m\xEDdia do WhatsApp.");
      return { mime: info.mime_type || "application/octet-stream", buffer: Buffer.from(await file.arrayBuffer()) };
    }
    module.exports = { state, sendText, processWebhook, windowOpen, fetchMedia, STATUS_PT };
  }
});

// src/lib/automations.js
var require_automations = __commonJS({
  "src/lib/automations.js"(exports, module) {
    "use strict";
    var { query, tx, pool } = require_db();
    var { notify } = require_notify();
    var { broadcast } = require_realtime();
    var config = require_config();
    var TRIGGERS = {
      ticket_created: { label: "Atendimento aberto", entity: "ticket", scheduled: false, conditions: ["channel", "priority", "team"] },
      ticket_customer_replied: { label: "Cliente respondeu", entity: "ticket", scheduled: false, conditions: ["channel", "team"] },
      ticket_response_overdue: { label: "Prazo de resposta vencido", entity: "ticket", scheduled: true, conditions: ["minutes", "priority", "team"] },
      ticket_follow_up_overdue: { label: "Retorno agendado vencido", entity: "ticket", scheduled: true, conditions: ["minutes", "team"] },
      opportunity_stage_changed: { label: "Oportunidade mudou de etapa", entity: "opportunity", scheduled: false, conditions: ["stage_id", "team"] },
      opportunity_idle: { label: "Oportunidade parada", entity: "opportunity", scheduled: true, conditions: ["days", "pipeline_id", "team"] }
    };
    var ACTIONS = {
      create_task: { label: "Criar tarefa", params: ["title", "due_in_days", "priority", "assignee"] },
      notify: { label: "Notificar", params: ["to", "title", "body"] },
      distribute: { label: "Distribuir em rod\xEDzio", params: [] },
      set_priority: { label: "Alterar prioridade", params: ["priority"] },
      add_tag: { label: "Adicionar etiqueta ao cliente", params: ["tag"] },
      send_message: { label: "Enviar mensagem (canal conectado)", params: ["body"] }
    };
    async function activeRules(trigger2) {
      const { rows } = await query("SELECT * FROM automation_rules WHERE active AND trigger = $1 ORDER BY id", [trigger2]);
      return rows;
    }
    async function recordRun(rule, entity, entityId, status, details, dedupeKey) {
      try {
        const { rowCount } = await query(
          `INSERT INTO automation_runs (rule_id, entity, entity_id, status, details, dedupe_key) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (rule_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`,
          [rule.id, entity, entityId, status, details || null, dedupeKey || null]
        );
        if (rowCount && status === "executada") await query("UPDATE automation_rules SET last_run_at = now(), runs_count = runs_count + 1 WHERE id = $1", [rule.id]);
        return rowCount > 0;
      } catch (e) {
        console.error("Falha ao registrar execu\xE7\xE3o de automa\xE7\xE3o:", e.message);
        return false;
      }
    }
    async function alreadyRan(rule, dedupeKey) {
      if (!dedupeKey) return false;
      const { rowCount } = await query("SELECT 1 FROM automation_runs WHERE rule_id = $1 AND dedupe_key = $2", [rule.id, dedupeKey]);
      return rowCount > 0;
    }
    function matches(rule, ctx) {
      const c = rule.conditions || {};
      const t = ctx.ticket, o = ctx.opportunity;
      if (c.channel && t && t.channel !== c.channel) return false;
      if (c.priority && t && t.priority !== c.priority) return false;
      if (c.stage_id && o && Number(c.stage_id) !== Number(o.stage_id)) return false;
      if (c.pipeline_id && o && Number(c.pipeline_id) !== Number(o.pipeline_id)) return false;
      if (rule.team) {
        const ownerTeam = ctx.ownerTeam;
        if (ownerTeam !== void 0 && ownerTeam !== null && ownerTeam !== rule.team) return false;
      }
      return true;
    }
    async function resolveUsers(to, ctx) {
      if (to === "owner") {
        const id = ctx.ticket ? ctx.ticket.assignee_id : ctx.opportunity ? ctx.opportunity.owner_id : null;
        return id ? [id] : [];
      }
      if (to === "supervisors") return (await query(`SELECT id FROM users WHERE active AND role IN ('supervisor','admin')`)).rows.map((r) => r.id);
      if (to === "admins") return (await query(`SELECT id FROM users WHERE active AND role = 'admin'`)).rows.map((r) => r.id);
      const n = Number(to);
      return n ? [n] : [];
    }
    function fill(text, ctx) {
      const t = ctx.ticket || {}, o = ctx.opportunity || {};
      return String(text || "").replace(/\{protocolo\}/g, t.protocol || "").replace(/\{assunto\}/g, t.subject || "").replace(/\{cliente\}/g, ctx.customerName || t.customer_name || o.customer_name || "").replace(/\{oportunidade\}/g, o.title || "").replace(/\{etapa\}/g, ctx.stageName || o.stage_name || "");
    }
    async function runAction(rule, ctx) {
      const p = rule.action_params || {};
      const t = ctx.ticket, o = ctx.opportunity;
      const link = t ? `#/atendimentos/${t.id}` : o ? `#/funil/${o.id}` : null;
      switch (rule.action) {
        case "create_task": {
          const entityCol = t ? "ticket_id" : "opportunity_id", entityId = t ? t.id : o.id;
          const dup = await query(`SELECT 1 FROM tasks WHERE automation_rule_id = $1 AND ${entityCol} = $2 AND done_at IS NULL`, [rule.id, entityId]);
          if (dup.rowCount) return { status: "ignorada", details: "J\xE1 existe uma tarefa aberta criada por esta regra." };
          let assignee = p.assignee === "owner" || !p.assignee ? t ? t.assignee_id : o.owner_id : Number(p.assignee) || null;
          if (!assignee) assignee = (await query(`SELECT id FROM users WHERE active AND role IN ('supervisor','admin') ORDER BY role, id LIMIT 1`)).rows[0]?.id || null;
          const due = new Date(Date.now() + (Number(p.due_in_days) || 1) * 864e5);
          const title = fill(p.title || "Acompanhar {cliente}", ctx);
          const { rows } = await query(
            `INSERT INTO tasks (title, description, customer_id, ticket_id, opportunity_id, assignee_id, due_at, priority, automation_rule_id, kind)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'acompanhamento') RETURNING id`,
            [
              title,
              `Criada automaticamente pela regra "${rule.name}".`,
              t ? t.customer_id : o.customer_id,
              t ? t.id : null,
              o ? o.id : null,
              assignee,
              due,
              ["baixa", "normal", "alta"].includes(p.priority) ? p.priority : "normal",
              rule.id
            ]
          );
          if (assignee) await notify(assignee, "Tarefa criada por automa\xE7\xE3o", title, "#/tarefas");
          return { status: "executada", details: `Tarefa #${rows[0].id} "${title}" para ${due.toLocaleDateString("pt-BR")}.` };
        }
        case "notify": {
          const users = await resolveUsers(p.to || "owner", ctx);
          if (!users.length) return { status: "ignorada", details: "Nenhum destinat\xE1rio." };
          const title = fill(p.title || rule.name, ctx), body = fill(p.body || "", ctx);
          for (const u of users) await notify(u, title, body, link);
          return { status: "executada", details: `Notificados: ${users.length} usu\xE1rio(s).` };
        }
        case "distribute": {
          if (!t) return { status: "ignorada", details: "A\xE7\xE3o v\xE1lida apenas para atendimentos." };
          const out = await tx(async (client) => {
            const cur = (await client.query(`SELECT id, assignee_id, status FROM tickets WHERE id = $1 FOR UPDATE`, [t.id])).rows[0];
            if (!cur || cur.assignee_id || cur.status !== "aguardando") return null;
            const teamSql = rule.team ? "AND team = $1" : "AND $1::text IS NULL";
            const pick = (await client.query(`SELECT id, name FROM users WHERE active AND available AND role = 'atendente' ${teamSql} ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`, [rule.team || null])).rows[0];
            if (!pick) return false;
            await client.query("UPDATE users SET last_assigned_at = now() WHERE id = $1", [pick.id]);
            await client.query("UPDATE tickets SET assignee_id = $1, version = version + 1, updated_at = now() WHERE id = $2", [pick.id, t.id]);
            await client.query(
              `INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload) VALUES ($1,NULL,'system',$2,$3)`,
              [t.id, `Distribu\xEDdo automaticamente para ${pick.name} (regra "${rule.name}")`, JSON.stringify({ action: "assigned", to: pick.id, auto: true, rule_id: rule.id })]
            );
            await notify(pick.id, "Novo atendimento atribu\xEDdo", `${t.protocol} \u2014 ${t.subject}`, link, client);
            return pick;
          });
          if (out === null) return { status: "ignorada", details: "Atendimento j\xE1 tem respons\xE1vel ou n\xE3o est\xE1 na fila." };
          if (out === false) return { status: "ignorada", details: "Nenhum atendente dispon\xEDvel; permanece na fila." };
          broadcast("tickets_changed", { id: t.id, action: "distributed" });
          return { status: "executada", details: `Atribu\xEDdo a ${out.name}.` };
        }
        case "set_priority": {
          if (!t || !["baixa", "normal", "alta", "urgente"].includes(p.priority)) return { status: "ignorada", details: "Prioridade inv\xE1lida." };
          if (t.priority === p.priority) return { status: "ignorada", details: "Prioridade j\xE1 era a definida." };
          await query("UPDATE tickets SET priority = $1, version = version + 1, updated_at = now() WHERE id = $2", [p.priority, t.id]);
          await query(`INSERT INTO ticket_events (ticket_id, kind, body, payload) VALUES ($1,'system',$2,$3)`, [t.id, `Prioridade alterada para "${p.priority}" (regra "${rule.name}")`, JSON.stringify({ action: "priority", to: p.priority, rule_id: rule.id })]);
          broadcast("tickets_changed", { id: t.id, action: "updated" });
          return { status: "executada", details: `Prioridade: ${p.priority}.` };
        }
        case "add_tag": {
          const cid = t ? t.customer_id : o.customer_id;
          const tag = String(p.tag || "").trim();
          if (!tag) return { status: "ignorada", details: "Etiqueta vazia." };
          const { rowCount } = await query(`UPDATE customers SET tags = array_append(tags, $1), updated_at = now() WHERE id = $2 AND NOT ($1 = ANY(tags))`, [tag, cid]);
          return rowCount ? { status: "executada", details: `Etiqueta "${tag}" adicionada.` } : { status: "ignorada", details: "Cliente j\xE1 tinha a etiqueta." };
        }
        case "send_message": {
          if (!t) return { status: "ignorada", details: "A\xE7\xE3o v\xE1lida apenas para atendimentos." };
          if (!config.whatsapp.configured) return { status: "falhou", details: "WhatsApp n\xE3o est\xE1 conectado; mensagem autom\xE1tica n\xE3o enviada." };
          if (t.channel !== "WhatsApp") return { status: "ignorada", details: "Atendimento n\xE3o \xE9 do canal WhatsApp." };
          const wa = require_whatsapp();
          try {
            const r = await wa.sendText({ ticketId: t.id, customerId: t.customer_id, body: fill(p.body, ctx), userId: null, viaRule: rule.id });
            return { status: "executada", details: `Mensagem enviada (id ${r.wa_message_id || "?"}).` };
          } catch (e) {
            return { status: "falhou", details: e.message };
          }
        }
        default:
          return { status: "falhou", details: "A\xE7\xE3o desconhecida." };
      }
    }
    async function loadContext(entity, id) {
      if (entity === "ticket") {
        const t = (await query(`SELECT t.*, c.name AS customer_name, u.team AS owner_team FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = $1`, [id])).rows[0];
        return t ? { ticket: t, customerName: t.customer_name, ownerTeam: t.owner_team } : null;
      }
      const o = (await query(`SELECT o.*, c.name AS customer_name, s.name AS stage_name, s.pipeline_id, u.team AS owner_team FROM opportunities o JOIN customers c ON c.id = o.customer_id JOIN pipeline_stages s ON s.id = o.stage_id LEFT JOIN users u ON u.id = o.owner_id WHERE o.id = $1`, [id])).rows[0];
      return o ? { opportunity: o, customerName: o.customer_name, stageName: o.stage_name, ownerTeam: o.owner_team } : null;
    }
    async function trigger(name, entity, id, extra = {}) {
      try {
        const rules = await activeRules(name);
        if (!rules.length) return;
        const ctx = await loadContext(entity, id);
        if (!ctx) return;
        Object.assign(ctx, extra);
        for (const rule of rules) {
          if (!matches(rule, ctx)) continue;
          const key = extra.dedupeKey ? `${entity}:${id}:${extra.dedupeKey}` : null;
          if (await alreadyRan(rule, key)) continue;
          const r = await runAction(rule, ctx);
          await recordRun(rule, entity, id, r.status, r.details, key);
        }
      } catch (e) {
        console.error(`Automa\xE7\xE3o (${name}) falhou:`, e.message);
      }
    }
    async function stopFollowUps(where, params, reason) {
      const { rowCount } = await query(`UPDATE tasks SET done_at = now(), closed_reason = $${params.length + 1}, updated_at = now()
    WHERE done_at IS NULL AND (automation_rule_id IS NOT NULL OR kind = 'acompanhamento') AND ${where}`, [...params, reason]);
      return rowCount;
    }
    async function runScheduled() {
      const settings = (await query("SELECT response_sla_minutes, idle_opportunity_days FROM company_settings WHERE id = 1")).rows[0];
      for (const rule of await activeRules("ticket_response_overdue")) {
        const minutes = Number(rule.conditions?.minutes) || settings.response_sla_minutes;
        const { rows } = await query(
          `SELECT t.id, COALESCE(t.last_customer_message_at, t.opened_at) AS since FROM tickets t
       WHERE t.status IN ('aguardando','em_atendimento') AND (t.last_agent_message_at IS NULL OR t.last_customer_message_at > t.last_agent_message_at)
         AND COALESCE(t.last_customer_message_at, t.opened_at) < now() - ($1 || ' minutes')::interval`,
          [String(minutes)]
        );
        for (const r of rows) await trigger_one(rule, "ticket", r.id, `overdue:${new Date(r.since).toISOString()}`);
      }
      for (const rule of await activeRules("ticket_follow_up_overdue")) {
        const minutes = Number(rule.conditions?.minutes) || 0;
        const { rows } = await query(`SELECT id, follow_up_at FROM tickets WHERE status IN ('aguardando','em_atendimento','aguardando_cliente') AND follow_up_at IS NOT NULL AND follow_up_at < now() - ($1 || ' minutes')::interval`, [String(minutes)]);
        for (const r of rows) await trigger_one(rule, "ticket", r.id, `followup:${new Date(r.follow_up_at).toISOString()}`);
      }
      for (const rule of await activeRules("opportunity_idle")) {
        const days = Number(rule.conditions?.days) || settings.idle_opportunity_days;
        const { rows } = await query(`SELECT o.id, o.updated_at FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE s.kind = 'open' AND o.updated_at < now() - ($1 || ' days')::interval`, [String(days)]);
        for (const r of rows) await trigger_one(rule, "opportunity", r.id, `idle:${new Date(r.updated_at).toISOString()}`);
      }
    }
    async function trigger_one(rule, entity, id, dedupe) {
      try {
        const key = `${entity}:${id}:${dedupe}`;
        if (await alreadyRan(rule, key)) return;
        const ctx = await loadContext(entity, id);
        if (!ctx || !matches(rule, ctx)) return;
        const r = await runAction(rule, ctx);
        await recordRun(rule, entity, id, r.status, r.details, key);
      } catch (e) {
        console.error("Automa\xE7\xE3o agendada falhou:", e.message);
      }
    }
    var timer = null;
    function startScheduler(intervalMs = 6e4) {
      if (timer) return;
      const tick = () => runScheduled().catch((e) => console.error("Agendador de automa\xE7\xF5es:", e.message));
      timer = setInterval(tick, intervalMs);
      if (timer.unref) timer.unref();
      setTimeout(tick, 5e3).unref?.();
    }
    function stopScheduler() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    module.exports = { TRIGGERS, ACTIONS, trigger, runScheduled, startScheduler, stopScheduler, stopFollowUps, pool };
  }
});

// src/routes/tickets.js
var require_tickets = __commonJS({
  "src/routes/tickets.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query, tx } = require_db();
    var { validate } = require_validate();
    var { requireAuth, isManager, requireRole } = require_auth();
    var { badRequest, notFound, conflict, forbidden } = require_errors();
    var { audit } = require_audit();
    var { broadcast } = require_realtime();
    var { notify } = require_notify();
    var { nextProtocol, toCsv } = require_util();
    var automations = require_automations();
    var router = express.Router();
    router.use(requireAuth);
    var STATUS = ["aguardando", "em_atendimento", "aguardando_cliente", "resolvido", "cancelado"];
    var STATUS_LABEL = { aguardando: "Aguardando atendimento", em_atendimento: "Em atendimento", aguardando_cliente: "Aguardando cliente", resolvido: "Resolvido", cancelado: "Cancelado" };
    var OPEN = ["aguardando", "em_atendimento", "aguardando_cliente"];
    function scopeSql(user, params, alias = "t") {
      if (isManager(user)) return "TRUE";
      params.push(user.id);
      return `(${alias}.assignee_id = $${params.length} OR ${alias}.assignee_id IS NULL)`;
    }
    var AWAITING = `(t.status IN ('aguardando','em_atendimento') AND (t.last_agent_message_at IS NULL OR COALESCE(t.last_customer_message_at, t.opened_at) > t.last_agent_message_at))`;
    var RESPONSE_DUE = `CASE WHEN ${AWAITING} THEN COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval ELSE NULL END`;
    var SELECT_COLS = `t.*, c.name AS customer_name, c.phone AS customer_phone, c.phone_digits AS customer_phone_digits, c.company AS customer_company, c.email AS customer_email, c.tags AS customer_tags,
  u.name AS assignee_name, cb.name AS created_by_name, ${AWAITING} AS awaiting_reply, ${RESPONSE_DUE} AS response_due_at, cs.response_sla_minutes,
  (SELECT count(*)::int FROM tasks tk WHERE tk.ticket_id = t.id AND tk.done_at IS NULL) AS open_tasks,
  (SELECT count(*)::int FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.customer_id = t.customer_id AND s.kind = 'open') AS open_opportunities,
  (SELECT count(*)::int FROM ticket_attachments a WHERE a.ticket_id = t.id) AS attachments_count`;
    var FROM = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN users cb ON cb.id = t.created_by CROSS JOIN company_settings cs`;
    var SELECT = `SELECT ${SELECT_COLS} ${FROM}`;
    async function loadTicket(req, id, client) {
      const q = client ? client.query.bind(client) : query;
      const params = [id];
      const scope = scopeSql(req.user, params);
      const { rows } = await q(`${SELECT} WHERE t.id = $1 AND ${scope}`, params);
      if (!rows[0]) throw notFound("Atendimento n\xE3o encontrado ou fora do seu escopo.");
      return rows[0];
    }
    async function addEvent(client, ticketId, userId, kind, body, extra = {}) {
      const { rows } = await client.query(
        `INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name`,
        [ticketId, userId, kind, extra.direction || null, extra.channel || null, body, JSON.stringify(extra.payload || {})]
      );
      if (kind === "interaction") {
        const out = extra.direction === "saida";
        await client.query(
          `UPDATE tickets SET last_message_at = now(), last_message_preview = left($2, 160), last_message_direction = $3,
        last_customer_message_at = CASE WHEN $4::boolean THEN last_customer_message_at ELSE now() END,
        last_agent_message_at = CASE WHEN $4::boolean THEN now() ELSE last_agent_message_at END,
        unread_count = CASE WHEN $4::boolean THEN 0 ELSE unread_count + 1 END,
        first_response_at = CASE WHEN $4::boolean THEN COALESCE(first_response_at, now()) ELSE first_response_at END,
        updated_at = now() WHERE id = $1`,
          [ticketId, body || "", extra.direction || null, out]
        );
      } else {
        await client.query("UPDATE tickets SET updated_at = now() WHERE id = $1", [ticketId]);
      }
      return rows[0];
    }
    async function pickNextAttendant(client, excludeId, team) {
      const { rows } = await client.query(
        `SELECT id, name FROM users WHERE active AND available AND role = 'atendente' AND id <> COALESCE($1, 0) AND ($2::text IS NULL OR team = $2)
     ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`,
        [excludeId || null, team || null]
      );
      if (!rows[0]) return null;
      await client.query("UPDATE users SET last_assigned_at = now() WHERE id = $1", [rows[0].id]);
      return rows[0];
    }
    var ticketSchema = z.object({
      customer_id: z.number().int().positive(),
      subject: z.string().trim().min(3).max(200),
      description: z.string().max(1e4).nullable().optional(),
      channel: z.string().trim().min(1).max(60),
      priority: z.enum(["baixa", "normal", "alta", "urgente"]).default("normal"),
      assignee_id: z.number().int().positive().nullable().optional(),
      auto_assign: z.boolean().optional(),
      first_message: z.string().trim().max(1e4).optional()
    });
    var SORTS = {
      opened_at: "t.opened_at",
      last_message_at: "COALESCE(t.last_message_at, t.opened_at)",
      protocol: "t.protocol",
      customer_name: "c.name",
      subject: "t.subject",
      status: "t.status",
      assignee_name: "u.name",
      channel: "t.channel",
      follow_up_at: "t.follow_up_at",
      response_due_at: RESPONSE_DUE,
      priority: `CASE t.priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END`
    };
    function buildWhere(req) {
      const params = [];
      const where = [scopeSql(req.user, params)];
      const q = req.query;
      const view = q.view || "";
      if (view === "mine") {
        params.push(req.user.id);
        where.push(`t.assignee_id = $${params.length} AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
      } else if (view === "queue") where.push(`t.status = 'aguardando' AND t.assignee_id IS NULL`);
      else if (view === "unanswered") where.push(AWAITING);
      else if (view === "waiting_customer") where.push(`t.status = 'aguardando_cliente'`);
      else if (view === "closed") where.push(`t.status IN ('resolvido','cancelado')`);
      else if (view === "open") where.push(`t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
      else if (view === "overdue") where.push(`${AWAITING} AND COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval < now()`);
      else if (view === "follow_up_overdue") where.push(`t.follow_up_at IS NOT NULL AND t.follow_up_at < now() AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
      if (q.status) {
        const list = String(q.status).split(",").filter((s) => STATUS.includes(s));
        if (list.length) {
          params.push(list);
          where.push(`t.status = ANY($${params.length}::text[])`);
        }
      } else if (q.open === "true") {
        params.push(OPEN);
        where.push(`t.status = ANY($${params.length}::text[])`);
      }
      if (q.queue === "true") where.push(`t.status = 'aguardando'`);
      if (q.mine === "true") {
        params.push(req.user.id);
        where.push(`t.assignee_id = $${params.length}`);
      }
      if (q.assignee_id === "none") where.push("t.assignee_id IS NULL");
      else if (q.assignee_id) {
        params.push(Number(q.assignee_id));
        where.push(`t.assignee_id = $${params.length}`);
      }
      if (q.priority) {
        params.push(q.priority);
        where.push(`t.priority = $${params.length}`);
      }
      if (q.channel) {
        params.push(q.channel);
        where.push(`t.channel = $${params.length}`);
      }
      if (q.customer_id) {
        params.push(Number(q.customer_id));
        where.push(`t.customer_id = $${params.length}`);
      }
      if (q.follow_up === "pending") where.push(`t.follow_up_at IS NOT NULL AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
      if (q.tag) {
        params.push(q.tag);
        where.push(`$${params.length} = ANY(c.tags)`);
      }
      if (q.q) {
        params.push(`%${q.q.trim()}%`);
        where.push(`(t.protocol ILIKE $${params.length} OR t.subject ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length} OR c.company ILIKE $${params.length})`);
      }
      if (q.from) {
        params.push(q.from);
        where.push(`t.opened_at >= $${params.length}::timestamptz`);
      }
      if (q.to) {
        params.push(q.to);
        where.push(`t.opened_at < ($${params.length}::date + 1)`);
      }
      return { params, where };
    }
    router.get("/", async (req, res, next) => {
      try {
        const { params, where } = buildWhere(req);
        const q = req.query;
        const limit = Math.min(Number(q.limit) || 50, 300);
        const page = Math.max(Number(q.page) || 1, 1);
        const base = `${FROM} WHERE ${where.join(" AND ")}`;
        const total = (await query(`SELECT count(*)::int AS n ${base}`, params)).rows[0].n;
        let order = `CASE t.priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.opened_at ASC`;
        if (q.sort && SORTS[q.sort]) order = `${SORTS[q.sort]} ${q.dir === "desc" ? "DESC NULLS LAST" : "ASC NULLS LAST"}, t.id DESC`;
        else if (q.view && !["queue"].includes(q.view)) order = `COALESCE(t.last_message_at, t.opened_at) DESC`;
        params.push(limit, (page - 1) * limit);
        const { rows } = await query(`SELECT ${SELECT_COLS} ${base} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        res.json({ tickets: rows, total, page, limit });
      } catch (err) {
        next(err);
      }
    });
    router.get("/counts", async (req, res, next) => {
      try {
        const params = [];
        const scope = scopeSql(req.user, params);
        params.push(req.user.id);
        const me = `$${params.length}`;
        const { rows } = await query(`SELECT
        count(*) FILTER (WHERE t.status = 'aguardando' AND t.assignee_id IS NULL)::int AS queue,
        count(*) FILTER (WHERE t.assignee_id = ${me} AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}'))::int AS mine,
        count(*) FILTER (WHERE ${AWAITING})::int AS unanswered,
        count(*) FILTER (WHERE ${AWAITING} AND COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval < now())::int AS overdue,
        count(*) FILTER (WHERE t.status = 'aguardando_cliente')::int AS waiting_customer,
        count(*) FILTER (WHERE t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}'))::int AS open,
        count(*) FILTER (WHERE t.status IN ('resolvido','cancelado') AND t.closed_at > now() - interval '30 days')::int AS closed,
        count(*) FILTER (WHERE t.follow_up_at IS NOT NULL AND t.follow_up_at < now() AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}'))::int AS follow_up_overdue,
        COALESCE(sum(t.unread_count) FILTER (WHERE t.assignee_id = ${me} OR t.assignee_id IS NULL), 0)::int AS unread
      ${FROM} WHERE ${scope}`, params);
        res.json({ counts: rows[0] });
      } catch (err) {
        next(err);
      }
    });
    router.get("/export.csv", async (req, res, next) => {
      try {
        const { params, where } = buildWhere(req);
        const { rows } = await query(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY t.opened_at DESC LIMIT 5000`, params);
        await audit(req, "tickets_export", "ticket", null, { count: rows.length });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="atendimentos.csv"');
        res.send(toCsv(rows, [
          { key: "protocol", label: "protocolo" },
          { key: "customer_name", label: "cliente" },
          { key: "customer_phone", label: "telefone" },
          { key: "subject", label: "assunto" },
          { key: "channel", label: "canal" },
          { key: "priority", label: "prioridade" },
          { label: "status", get: (r) => STATUS_LABEL[r.status] },
          { key: "assignee_name", label: "responsavel" },
          { key: "opened_at", label: "abertura" },
          { key: "first_response_at", label: "primeira_resposta" },
          { key: "last_message_at", label: "ultima_mensagem" },
          { key: "closed_at", label: "encerramento" },
          { key: "follow_up_at", label: "retorno_agendado" }
        ]));
      } catch (err) {
        next(err);
      }
    });
    router.get("/:id", async (req, res, next) => {
      try {
        const t = await loadTicket(req, Number(req.params.id));
        const [events, tasks, opps, attachments, customer, history] = await Promise.all([
          query(`SELECT e.*, u.name AS user_name FROM ticket_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.ticket_id = $1 ORDER BY e.created_at ASC, e.id ASC`, [t.id]),
          query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.ticket_id = $1 ORDER BY t.done_at NULLS FIRST, t.due_at`, [t.id]),
          query(`SELECT o.id, o.title, o.value, o.stage_id, o.owner_id, o.next_action, o.next_action_at, o.expected_close_date, o.version, o.ticket_id, s.name AS stage_name, s.kind AS stage_kind, s.pipeline_id, u.name AS owner_name
             FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id LEFT JOIN users u ON u.id = o.owner_id WHERE o.customer_id = $1 ORDER BY (s.kind = 'open') DESC, o.updated_at DESC`, [t.customer_id]),
          query(`SELECT id, event_id, name, mime, size, wa_media_id, created_at FROM ticket_attachments WHERE ticket_id = $1 ORDER BY created_at`, [t.id]),
          query(`SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE c.id = $1`, [t.customer_id]),
          query(`SELECT id, protocol, subject, status, opened_at, closed_at FROM tickets WHERE customer_id = $1 AND id <> $2 ORDER BY opened_at DESC LIMIT 8`, [t.customer_id, t.id])
        ]);
        const custTasks = await query(`SELECT t.id, t.title, t.due_at, t.done_at, t.priority, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.customer_id = $1 AND t.done_at IS NULL AND (t.ticket_id IS NULL OR t.ticket_id <> $2) ORDER BY t.due_at LIMIT 10`, [t.customer_id, t.id]);
        res.json({ ticket: t, events: events.rows, tasks: tasks.rows, opportunities: opps.rows, attachments: attachments.rows, customer: customer.rows[0], customer_tickets: history.rows, customer_tasks: custTasks.rows });
      } catch (err) {
        next(err);
      }
    });
    router.post("/", validate(ticketSchema), async (req, res, next) => {
      try {
        const d = req.data;
        if (req.user.role === "atendente" && d.assignee_id && d.assignee_id !== req.user.id) {
          return next(forbidden("Atendentes s\xF3 podem atribuir atendimentos a si mesmos ou deix\xE1-los na fila."));
        }
        const result = await tx(async (client) => {
          const cust = await client.query("SELECT id FROM customers WHERE id = $1", [d.customer_id]);
          if (!cust.rowCount) throw badRequest("Cliente n\xE3o encontrado.", { fields: { customer_id: "Cliente inv\xE1lido." } });
          let assigneeId = d.assignee_id || null;
          let distributed = false;
          if (!assigneeId) {
            const settings = (await client.query("SELECT auto_distribution FROM company_settings WHERE id = 1")).rows[0];
            if (settings.auto_distribution || d.auto_assign) {
              const pick = await pickNextAttendant(client);
              if (pick) {
                assigneeId = pick.id;
                distributed = true;
              }
            }
          }
          const protocol = await nextProtocol(client);
          const { rows } = await client.query(
            `INSERT INTO tickets (protocol, customer_id, subject, description, channel, priority, status, assignee_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,'aguardando',$7,$8) RETURNING *`,
            [protocol, d.customer_id, d.subject, d.description || null, d.channel, d.priority, assigneeId, req.user.id]
          );
          const t = rows[0];
          await addEvent(client, t.id, req.user.id, "system", "Atendimento aberto", { payload: { action: "created", channel: d.channel } });
          if (d.first_message) await addEvent(client, t.id, req.user.id, "interaction", d.first_message, { direction: "entrada", channel: d.channel, payload: { manual: true } });
          if (assigneeId) {
            await addEvent(client, t.id, req.user.id, "system", distributed ? "Distribu\xEDdo automaticamente (rod\xEDzio)" : "Respons\xE1vel atribu\xEDdo", { payload: { action: "assigned", to: assigneeId, auto: distributed } });
            if (assigneeId !== req.user.id) await notify(assigneeId, "Novo atendimento atribu\xEDdo", `${protocol} \u2014 ${d.subject}`, `#/atendimentos/${t.id}`, client);
          }
          await audit(req, "ticket_create", "ticket", t.id, { protocol, assignee_id: assigneeId, auto: distributed }, client);
          return t;
        });
        broadcast("tickets_changed", { id: result.id, action: "created" });
        setImmediate(() => automations.trigger("ticket_created", "ticket", result.id));
        res.status(201).json({ ticket: result, message: `Atendimento ${result.protocol} aberto.` });
      } catch (err) {
        next(err);
      }
    });
    router.put("/:id", validate(z.object({
      subject: z.string().trim().min(3).max(200).optional(),
      description: z.string().max(1e4).nullable().optional(),
      channel: z.string().trim().min(1).max(60).optional(),
      priority: z.enum(["baixa", "normal", "alta", "urgente"]).optional(),
      version: z.number().int().optional()
    })), async (req, res, next) => {
      try {
        const t = await loadTicket(req, Number(req.params.id));
        if (!isManager(req.user) && t.assignee_id !== req.user.id && t.assignee_id !== null) return next(forbidden("Somente o respons\xE1vel pode editar este atendimento."));
        const d = req.data;
        if (d.version !== void 0 && d.version !== t.version) return next(conflict("Este atendimento foi alterado por outro usu\xE1rio. Recarregue para ver a vers\xE3o atual.", { current: t }));
        const { rows } = await query(
          `UPDATE tickets SET subject = COALESCE($1, subject), description = CASE WHEN $2::boolean THEN $3 ELSE description END,
        channel = COALESCE($4, channel), priority = COALESCE($5, priority), version = version + 1, updated_at = now() WHERE id = $6 RETURNING *`,
          [d.subject ?? null, d.description !== void 0, d.description ?? null, d.channel ?? null, d.priority ?? null, t.id]
        );
        await audit(req, "ticket_update", "ticket", t.id, { fields: Object.keys(d) });
        broadcast("tickets_changed", { id: t.id, action: "updated" });
        res.json({ ticket: rows[0], message: "Atendimento atualizado." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/claim", async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const result = await tx(async (client) => {
          const upd = await client.query(
            `UPDATE tickets SET assignee_id = $1, status = 'em_atendimento', version = version + 1, updated_at = now()
         WHERE id = $2 AND status = 'aguardando' AND (assignee_id IS NULL OR assignee_id = $1) RETURNING *`,
            [req.user.id, id]
          );
          if (!upd.rowCount) {
            const cur = await client.query(`SELECT t.status, t.assignee_id, u.name AS assignee_name FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = $1`, [id]);
            if (!cur.rowCount) throw notFound("Atendimento n\xE3o encontrado.");
            const c = cur.rows[0];
            if (c.assignee_id && c.assignee_id !== req.user.id) throw conflict(`Este atendimento j\xE1 foi assumido por ${c.assignee_name}.`, { assignee_id: c.assignee_id, status: c.status });
            throw conflict(`Este atendimento n\xE3o est\xE1 aguardando (status atual: ${STATUS_LABEL[c.status]}).`, { status: c.status });
          }
          await addEvent(client, id, req.user.id, "system", "Atendimento assumido", { payload: { action: "claimed", to: req.user.id } });
          await client.query("UPDATE users SET last_assigned_at = now() WHERE id = $1", [req.user.id]);
          await audit(req, "ticket_claim", "ticket", id, {}, client);
          return upd.rows[0];
        });
        broadcast("tickets_changed", { id, action: "claimed" });
        res.json({ ticket: result, message: "Voc\xEA assumiu este atendimento." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/read", async (req, res, next) => {
      try {
        const t = await loadTicket(req, Number(req.params.id));
        if (t.unread_count) {
          await query("UPDATE tickets SET unread_count = 0 WHERE id = $1", [t.id]);
          broadcast("tickets_changed", { id: t.id, action: "read" }, [req.user.id]);
        }
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/transfer", validate(z.object({ to_user_id: z.number().int().positive(), reason: z.string().max(500).optional(), version: z.number().int().optional() })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const result = await tx(async (client) => {
          const t = await loadTicket(req, id, client);
          if (!isManager(req.user) && t.assignee_id !== req.user.id && t.assignee_id !== null) throw forbidden("Somente o respons\xE1vel ou um supervisor pode transferir este atendimento.");
          if (!OPEN.includes(t.status)) throw conflict("N\xE3o \xE9 poss\xEDvel transferir um atendimento encerrado. Reabra-o primeiro.");
          if (req.data.version !== void 0 && req.data.version !== t.version) throw conflict("Este atendimento foi alterado por outro usu\xE1rio. Recarregue para ver a vers\xE3o atual.", { current: t });
          const target = await client.query("SELECT id, name FROM users WHERE id = $1 AND active", [req.data.to_user_id]);
          if (!target.rowCount) throw badRequest("Usu\xE1rio de destino inv\xE1lido ou inativo.");
          if (target.rows[0].id === t.assignee_id) throw badRequest("O atendimento j\xE1 est\xE1 com este respons\xE1vel.");
          const upd = await client.query(
            `UPDATE tickets SET assignee_id = $1, status = CASE WHEN status = 'aguardando_cliente' THEN status ELSE 'em_atendimento' END,
         version = version + 1, updated_at = now() WHERE id = $2 RETURNING *`,
            [target.rows[0].id, id]
          );
          await addEvent(
            client,
            id,
            req.user.id,
            "system",
            `Transferido para ${target.rows[0].name}${req.data.reason ? ` \u2014 ${req.data.reason}` : ""}`,
            { payload: { action: "transfer", from: t.assignee_id, to: target.rows[0].id, reason: req.data.reason || null } }
          );
          await client.query("UPDATE users SET last_assigned_at = now() WHERE id = $1", [target.rows[0].id]);
          await notify(target.rows[0].id, "Atendimento transferido para voc\xEA", `${t.protocol} \u2014 ${t.subject}`, `#/atendimentos/${id}`, client);
          await audit(req, "ticket_transfer", "ticket", id, { from: t.assignee_id, to: target.rows[0].id }, client);
          return upd.rows[0];
        });
        broadcast("tickets_changed", { id, action: "transferred" });
        res.json({ ticket: result, message: "Atendimento transferido." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/release", async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const result = await tx(async (client) => {
          const t = await loadTicket(req, id, client);
          if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden("Somente o respons\xE1vel ou um supervisor pode devolver este atendimento \xE0 fila.");
          if (!OPEN.includes(t.status)) throw conflict("Atendimento encerrado n\xE3o pode voltar \xE0 fila. Reabra-o primeiro.");
          const upd = await client.query(`UPDATE tickets SET assignee_id = NULL, status = 'aguardando', version = version + 1, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
          await addEvent(client, id, req.user.id, "system", "Devolvido \xE0 fila de espera", { payload: { action: "released", from: t.assignee_id } });
          await audit(req, "ticket_release", "ticket", id, { from: t.assignee_id }, client);
          return upd.rows[0];
        });
        broadcast("tickets_changed", { id, action: "released" });
        res.json({ ticket: result, message: "Atendimento devolvido \xE0 fila." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/status", validate(z.object({
      status: z.enum(["em_atendimento", "aguardando_cliente", "resolvido", "cancelado"]),
      note: z.string().max(2e3).optional(),
      version: z.number().int().optional()
    })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const result = await tx(async (client) => {
          const t = await loadTicket(req, id, client);
          if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden("Somente o respons\xE1vel ou um supervisor pode alterar o status.");
          if (!OPEN.includes(t.status)) throw conflict('Atendimento j\xE1 encerrado. Use "Reabrir" para continuar.');
          if (req.data.version !== void 0 && req.data.version !== t.version) throw conflict("Este atendimento foi alterado por outro usu\xE1rio. Recarregue para ver a vers\xE3o atual.", { current: t });
          if (!t.assignee_id && req.data.status !== "cancelado") throw conflict("Assuma o atendimento antes de alterar o status.");
          const closing = ["resolvido", "cancelado"].includes(req.data.status);
          const upd = await client.query(
            `UPDATE tickets SET status = $1, closed_at = CASE WHEN $2::boolean THEN now() ELSE NULL END, unread_count = CASE WHEN $2::boolean THEN 0 ELSE unread_count END, version = version + 1, updated_at = now() WHERE id = $3 RETURNING *`,
            [req.data.status, closing, id]
          );
          await addEvent(
            client,
            id,
            req.user.id,
            "system",
            `Status alterado: ${STATUS_LABEL[t.status]} \u2192 ${STATUS_LABEL[req.data.status]}${req.data.note ? ` \u2014 ${req.data.note}` : ""}`,
            { payload: { action: "status", from: t.status, to: req.data.status } }
          );
          if (closing) await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Atendimento encerrado', updated_at = now() WHERE ticket_id = $1 AND done_at IS NULL AND kind = 'acompanhamento'`, [id]);
          await audit(req, "ticket_status", "ticket", id, { from: t.status, to: req.data.status }, client);
          return upd.rows[0];
        });
        broadcast("tickets_changed", { id, action: "status" });
        res.json({ ticket: result, message: `Status atualizado para "${STATUS_LABEL[result.status]}".` });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/reopen", validate(z.object({ note: z.string().max(2e3).optional() })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const result = await tx(async (client) => {
          const t = await loadTicket(req, id, client);
          if (OPEN.includes(t.status)) throw conflict("Este atendimento j\xE1 est\xE1 aberto.");
          const assigneeActive = t.assignee_id ? (await client.query("SELECT 1 FROM users WHERE id = $1 AND active", [t.assignee_id])).rowCount > 0 : false;
          const status = assigneeActive ? "em_atendimento" : "aguardando";
          const upd = await client.query(
            `UPDATE tickets SET status = $1, assignee_id = CASE WHEN $2::boolean THEN assignee_id ELSE NULL END, closed_at = NULL, version = version + 1, updated_at = now() WHERE id = $3 RETURNING *`,
            [status, assigneeActive, id]
          );
          await addEvent(client, id, req.user.id, "system", `Atendimento reaberto${req.data.note ? ` \u2014 ${req.data.note}` : ""}`, { payload: { action: "reopened", from: t.status, to: status } });
          if (assigneeActive && t.assignee_id !== req.user.id) await notify(t.assignee_id, "Atendimento reaberto", `${t.protocol} \u2014 ${t.subject}`, `#/atendimentos/${id}`, client);
          await audit(req, "ticket_reopen", "ticket", id, {}, client);
          return upd.rows[0];
        });
        broadcast("tickets_changed", { id, action: "reopened" });
        res.json({ ticket: result, message: "Atendimento reaberto." });
      } catch (err) {
        next(err);
      }
    });
    var attachmentSchema = z.array(z.object({
      name: z.string().trim().min(1).max(200),
      mime: z.string().trim().min(1).max(120),
      data: z.string().min(1).max(3 * 1024 * 1024)
    })).max(5).optional();
    async function saveAttachments(client, ticketId, eventId, userId, list) {
      const out = [];
      for (const a of list || []) {
        const buf = Buffer.from(a.data.replace(/^data:[^;]+;base64,/, ""), "base64");
        if (buf.length > 2 * 1024 * 1024) throw badRequest(`Anexo "${a.name}" maior que 2 MB.`);
        const { rows } = await client.query(
          `INSERT INTO ticket_attachments (ticket_id, event_id, name, mime, size, data, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, mime, size, created_at`,
          [ticketId, eventId, a.name, a.mime, buf.length, buf, userId]
        );
        out.push(rows[0]);
      }
      return out;
    }
    router.post("/:id/notes", validate(z.object({ body: z.string().trim().min(1).max(5e3), attachments: attachmentSchema })), async (req, res, next) => {
      try {
        const t = await loadTicket(req, Number(req.params.id));
        const ev = await tx(async (client) => {
          const e = await addEvent(client, t.id, req.user.id, "note", req.data.body);
          e.attachments = await saveAttachments(client, t.id, e.id, req.user.id, req.data.attachments);
          if (e.attachments.length) await client.query(`UPDATE ticket_events SET payload = payload || $1::jsonb WHERE id = $2`, [JSON.stringify({ attachments: e.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size })) }), e.id]);
          return e;
        });
        broadcast("tickets_changed", { id: t.id, action: "note" });
        res.status(201).json({ event: ev, message: "Anota\xE7\xE3o interna registrada." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/interactions", validate(z.object({
      direction: z.enum(["entrada", "saida"]),
      channel: z.string().trim().min(1).max(60),
      body: z.string().trim().min(1).max(1e4),
      attachments: attachmentSchema
    })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const out = await tx(async (client) => {
          const t = await loadTicket(req, id, client);
          if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden("Assuma o atendimento para registrar intera\xE7\xF5es.");
          if (!OPEN.includes(t.status)) throw conflict("Atendimento encerrado. Reabra-o para registrar novas intera\xE7\xF5es.");
          const e = await addEvent(client, id, req.user.id, "interaction", req.data.body, { direction: req.data.direction, channel: req.data.channel, payload: { manual: true } });
          e.attachments = await saveAttachments(client, id, e.id, req.user.id, req.data.attachments);
          if (e.attachments.length) await client.query(`UPDATE ticket_events SET payload = payload || $1::jsonb WHERE id = $2`, [JSON.stringify({ manual: true, attachments: e.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size })) }), e.id]);
          let status = t.status;
          if (req.data.direction === "entrada" && t.status === "aguardando_cliente") {
            status = "em_atendimento";
            await client.query(`UPDATE tickets SET status = 'em_atendimento', version = version + 1 WHERE id = $1`, [id]);
            await addEvent(client, id, req.user.id, "system", "Cliente respondeu: status alterado de Aguardando cliente para Em atendimento", { payload: { action: "status", from: t.status, to: status } });
          }
          const upd = await client.query(`${SELECT} WHERE t.id = $1`, [id]);
          return { event: e, ticket: upd.rows[0] };
        });
        broadcast("tickets_changed", { id, action: "message" });
        if (req.data.direction === "entrada") setImmediate(async () => {
          await automations.stopFollowUps("ticket_id = $1", [id], "Cliente respondeu");
          await automations.trigger("ticket_customer_replied", "ticket", id, { dedupeKey: `reply:${out.event.id}` });
        });
        res.status(201).json({ ...out, message: "Intera\xE7\xE3o registrada." });
      } catch (err) {
        next(err);
      }
    });
    router.get("/:id/attachments/:aid", async (req, res, next) => {
      try {
        const t = await loadTicket(req, Number(req.params.id));
        const a = (await query("SELECT * FROM ticket_attachments WHERE id = $1 AND ticket_id = $2", [Number(req.params.aid), t.id])).rows[0];
        if (!a) return next(notFound("Anexo n\xE3o encontrado."));
        if (!a.data && a.wa_media_id) {
          const { mime, buffer } = await require_whatsapp().fetchMedia(a.wa_media_id);
          res.setHeader("Content-Type", mime);
          res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(a.name)}"`);
          return res.send(buffer);
        }
        res.setHeader("Content-Type", a.mime);
        res.setHeader("Content-Disposition", `${req.query.download ? "attachment" : "inline"}; filename="${encodeURIComponent(a.name)}"`);
        res.send(a.data);
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/follow-up", validate(z.object({ at: z.string().datetime({ offset: true }).nullable(), note: z.string().max(500).optional() })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        const out = await tx(async (client) => {
          const t = await loadTicket(req, id, client);
          if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden("Somente o respons\xE1vel pode agendar retorno.");
          const upd = await client.query("UPDATE tickets SET follow_up_at = $1, updated_at = now() WHERE id = $2 RETURNING *", [req.data.at, id]);
          let task = null;
          if (req.data.at) {
            await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Retorno reagendado', updated_at = now() WHERE ticket_id = $1 AND done_at IS NULL AND kind = 'retorno'`, [id]);
            const r = await client.query(
              `INSERT INTO tasks (title, description, customer_id, ticket_id, assignee_id, due_at, priority, created_by, kind)
           VALUES ($1,$2,$3,$4,$5,$6,'alta',$7,'retorno') RETURNING *`,
              [`Retorno: ${t.subject} (${t.protocol})`, req.data.note || null, t.customer_id, id, t.assignee_id || req.user.id, req.data.at, req.user.id]
            );
            task = r.rows[0];
            await addEvent(client, id, req.user.id, "system", `Retorno agendado para ${new Date(req.data.at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}${req.data.note ? ` \u2014 ${req.data.note}` : ""}`, { payload: { action: "follow_up", at: req.data.at } });
          } else {
            await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Agendamento removido', updated_at = now() WHERE ticket_id = $1 AND done_at IS NULL AND kind = 'retorno'`, [id]);
            await addEvent(client, id, req.user.id, "system", "Retorno agendado removido", { payload: { action: "follow_up_cleared" } });
          }
          return { ticket: upd.rows[0], task };
        });
        broadcast("tickets_changed", { id, action: "follow_up" });
        res.json({ ...out, message: req.data.at ? "Retorno agendado e tarefa criada." : "Agendamento removido." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/distribute", requireRole("admin", "supervisor"), async (req, res, next) => {
      try {
        const out = await tx(async (client) => {
          const queue = await client.query(`SELECT id, protocol, subject FROM tickets WHERE status = 'aguardando' AND assignee_id IS NULL ORDER BY
        CASE priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, opened_at FOR UPDATE SKIP LOCKED`);
          let assigned = 0;
          for (const t of queue.rows) {
            const pick = await pickNextAttendant(client);
            if (!pick) break;
            await client.query("UPDATE tickets SET assignee_id = $1, version = version + 1, updated_at = now() WHERE id = $2", [pick.id, t.id]);
            await addEvent(client, t.id, req.user.id, "system", `Distribu\xEDdo automaticamente (rod\xEDzio) para ${pick.name}`, { payload: { action: "assigned", to: pick.id, auto: true } });
            await notify(pick.id, "Novo atendimento atribu\xEDdo", `${t.protocol} \u2014 ${t.subject}`, `#/atendimentos/${t.id}`, client);
            assigned++;
          }
          await audit(req, "tickets_distribute", "ticket", null, { assigned, remaining: queue.rowCount - assigned }, client);
          return { assigned, remaining: queue.rowCount - assigned };
        });
        broadcast("tickets_changed", { action: "distributed" });
        const msg = out.assigned === 0 ? out.remaining === 0 ? "N\xE3o h\xE1 atendimentos na fila." : "Nenhum atendente dispon\xEDvel. Os atendimentos permanecem na fila." : `${out.assigned} atendimento(s) distribu\xEDdo(s).${out.remaining ? ` ${out.remaining} permanecem na fila.` : ""}`;
        res.json({ ...out, message: msg });
      } catch (err) {
        next(err);
      }
    });
    module.exports = { router, STATUS_LABEL, OPEN, AWAITING };
  }
});

// src/routes/pipeline.js
var require_pipeline = __commonJS({
  "src/routes/pipeline.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query, tx } = require_db();
    var { validate } = require_validate();
    var { requireAuth, isManager } = require_auth();
    var { badRequest, notFound, conflict, forbidden } = require_errors();
    var { audit } = require_audit();
    var { broadcast } = require_realtime();
    var { notify } = require_notify();
    var { toCsv } = require_util();
    var automations = require_automations();
    var router = express.Router();
    router.use(requireAuth);
    function scopeSql(user, params) {
      if (isManager(user)) return "TRUE";
      params.push(user.id);
      return `(o.owner_id = $${params.length} OR o.owner_id IS NULL)`;
    }
    var SELECT = `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.company AS customer_company, c.source AS customer_source, c.tags AS customer_tags,
  u.name AS owner_name, s.name AS stage_name, s.kind AS stage_kind, s.pipeline_id, p.name AS pipeline_name,
  (SELECT count(*)::int FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL) AS open_tasks,
  (SELECT min(t.due_at) FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL) AS next_task_at,
  (SELECT max(e.created_at) FROM ticket_events e JOIN tickets t ON t.id = e.ticket_id WHERE t.customer_id = o.customer_id AND e.kind = 'interaction') AS last_contact_at,
  (SELECT t.id FROM tickets t WHERE t.customer_id = o.customer_id AND t.status NOT IN ('resolvido','cancelado') ORDER BY t.opened_at DESC LIMIT 1) AS open_ticket_id,
  (SELECT t.status FROM tickets t WHERE t.customer_id = o.customer_id AND t.status NOT IN ('resolvido','cancelado') ORDER BY t.opened_at DESC LIMIT 1) AS open_ticket_status
  FROM opportunities o JOIN customers c ON c.id = o.customer_id LEFT JOIN users u ON u.id = o.owner_id JOIN pipeline_stages s ON s.id = o.stage_id JOIN pipelines p ON p.id = s.pipeline_id`;
    async function load(req, id, client) {
      const q = client ? client.query.bind(client) : query;
      const params = [id];
      const { rows } = await q(`${SELECT} WHERE o.id = $1 AND ${scopeSql(req.user, params)}`, params);
      if (!rows[0]) throw notFound("Oportunidade n\xE3o encontrada ou fora do seu escopo.");
      return rows[0];
    }
    var schema = z.object({
      title: z.string().trim().min(2).max(200),
      customer_id: z.number().int().positive(),
      owner_id: z.number().int().positive().nullable().optional(),
      stage_id: z.number().int().positive().optional(),
      pipeline_id: z.number().int().positive().optional(),
      value: z.number().min(0).max(1e12).default(0),
      next_action: z.string().trim().max(300).nullable().optional(),
      next_action_at: z.string().datetime({ offset: true }).nullable().optional(),
      expected_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inv\xE1lida.").nullable().optional(),
      ticket_id: z.number().int().positive().nullable().optional(),
      tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
      source: z.string().trim().max(60).nullable().optional(),
      version: z.number().int().optional()
    });
    var SORTS = { updated_at: "o.updated_at", created_at: "o.created_at", value: "o.value", title: "o.title", customer_name: "c.name", owner_name: "u.name", stage: "s.position", expected_close_date: "o.expected_close_date", next_action_at: "o.next_action_at" };
    router.get("/", async (req, res, next) => {
      try {
        const params = [];
        const where = [scopeSql(req.user, params)];
        const q = req.query;
        let pipelineId = q.pipeline_id ? Number(q.pipeline_id) : null;
        const pipelines = (await query("SELECT * FROM pipelines WHERE active ORDER BY position, id")).rows;
        if (!pipelineId && !q.all_pipelines) pipelineId = (pipelines.find((p) => p.is_default) || pipelines[0] || {}).id || null;
        if (pipelineId) {
          params.push(pipelineId);
          where.push(`s.pipeline_id = $${params.length}`);
        }
        if (q.owner_id === "none") where.push("o.owner_id IS NULL");
        else if (q.owner_id) {
          params.push(Number(q.owner_id));
          where.push(`o.owner_id = $${params.length}`);
        }
        if (q.customer_id) {
          params.push(Number(q.customer_id));
          where.push(`o.customer_id = $${params.length}`);
        }
        if (q.q) {
          params.push(`%${q.q.trim()}%`);
          where.push(`(o.title ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.company ILIKE $${params.length})`);
        }
        if (q.tag) {
          params.push(q.tag);
          where.push(`($${params.length} = ANY(o.tags) OR $${params.length} = ANY(c.tags))`);
        }
        if (q.source) {
          params.push(q.source);
          where.push(`COALESCE(o.source, c.source) = $${params.length}`);
        }
        if (q.stage_id) {
          params.push(Number(q.stage_id));
          where.push(`o.stage_id = $${params.length}`);
        }
        if (q.open === "true") where.push(`s.kind = 'open'`);
        if (q.kind) {
          params.push(q.kind);
          where.push(`s.kind = $${params.length}`);
        }
        if (q.no_task === "true") where.push(`s.kind = 'open' AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL) AND (o.next_action_at IS NULL)`);
        if (q.overdue === "true") where.push(`s.kind = 'open' AND ((o.next_action_at IS NOT NULL AND o.next_action_at < now()) OR EXISTS (SELECT 1 FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL AND t.due_at < now()))`);
        if (q.idle_days) {
          params.push(String(Number(q.idle_days) || 7));
          where.push(`s.kind = 'open' AND o.updated_at < now() - ($${params.length} || ' days')::interval`);
        }
        if (q.min_value) {
          params.push(Number(q.min_value));
          where.push(`o.value >= $${params.length}`);
        }
        if (q.closed_from) {
          params.push(q.closed_from);
          where.push(`o.closed_at >= $${params.length}::timestamptz`);
        }
        if (q.from) {
          params.push(q.from);
          where.push(`o.created_at >= $${params.length}::date`);
        }
        if (q.to) {
          params.push(q.to);
          where.push(`o.created_at < ($${params.length}::date + 1)`);
        }
        const stagesParams = pipelineId ? [pipelineId] : [];
        const stages = await query(`SELECT * FROM pipeline_stages WHERE active ${pipelineId ? "AND pipeline_id = $1" : ""} ORDER BY pipeline_id, position`, stagesParams);
        let order = "o.updated_at DESC";
        if (q.sort && SORTS[q.sort]) order = `${SORTS[q.sort]} ${q.dir === "desc" ? "DESC NULLS LAST" : "ASC NULLS LAST"}`;
        const { rows } = await query(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT 1000`, params);
        const cutoff = Date.now() - 30 * 864e5;
        const list = q.all === "true" ? rows : rows.filter((o) => o.stage_kind === "open" || !o.closed_at || new Date(o.closed_at).getTime() >= cutoff);
        res.json({ pipelines, pipeline_id: pipelineId, stages: stages.rows, opportunities: list, total: rows.length });
      } catch (err) {
        next(err);
      }
    });
    router.get("/export.csv", async (req, res, next) => {
      try {
        const params = [];
        const { rows } = await query(`${SELECT} WHERE ${scopeSql(req.user, params)} ORDER BY o.created_at DESC`, params);
        await audit(req, "opportunities_export", "opportunity", null, { count: rows.length });
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="oportunidades.csv"');
        res.send(toCsv(rows, [
          { key: "id", label: "id" },
          { key: "title", label: "titulo" },
          { key: "customer_name", label: "cliente" },
          { key: "owner_name", label: "responsavel" },
          { key: "pipeline_name", label: "funil" },
          { key: "stage_name", label: "etapa" },
          { key: "value", label: "valor" },
          { key: "next_action", label: "proxima_acao" },
          { key: "next_action_at", label: "proxima_acao_em" },
          { key: "expected_close_date", label: "previsao_fechamento" },
          { key: "lost_reason", label: "motivo_perda" },
          { key: "tags", label: "etiquetas" },
          { key: "created_at", label: "criado_em" },
          { key: "closed_at", label: "fechado_em" }
        ]));
      } catch (err) {
        next(err);
      }
    });
    router.get("/:id", async (req, res, next) => {
      try {
        const o = await load(req, Number(req.params.id));
        const [events, tasks, tickets, stages] = await Promise.all([
          query(`SELECT e.*, u.name AS user_name FROM opportunity_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.opportunity_id = $1 ORDER BY e.created_at DESC, e.id DESC`, [o.id]),
          query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.opportunity_id = $1 ORDER BY t.done_at NULLS FIRST, t.due_at`, [o.id]),
          query(`SELECT id, protocol, subject, status, opened_at, assignee_id FROM tickets WHERE customer_id = $1 ORDER BY opened_at DESC LIMIT 6`, [o.customer_id]),
          query("SELECT * FROM pipeline_stages WHERE active AND pipeline_id = $1 ORDER BY position", [o.pipeline_id])
        ]);
        res.json({ opportunity: o, events: events.rows, tasks: tasks.rows, tickets: tickets.rows, stages: stages.rows });
      } catch (err) {
        next(err);
      }
    });
    router.post("/", validate(schema), async (req, res, next) => {
      try {
        const d = req.data;
        if (req.user.role === "atendente" && d.owner_id && d.owner_id !== req.user.id) return next(forbidden("Atendentes s\xF3 podem criar oportunidades sob sua pr\xF3pria responsabilidade."));
        const out = await tx(async (client) => {
          const cust = await client.query("SELECT id, source FROM customers WHERE id = $1", [d.customer_id]);
          if (!cust.rowCount) throw badRequest("Cliente n\xE3o encontrado.", { fields: { customer_id: "Cliente inv\xE1lido." } });
          let stageId = d.stage_id;
          if (!stageId) {
            const pipelineId = d.pipeline_id || (await client.query("SELECT id FROM pipelines WHERE active ORDER BY is_default DESC, position LIMIT 1")).rows[0]?.id;
            stageId = (await client.query(`SELECT id FROM pipeline_stages WHERE active AND kind = 'open' AND pipeline_id = $1 ORDER BY position LIMIT 1`, [pipelineId])).rows[0]?.id;
          }
          const stage = stageId ? (await client.query("SELECT * FROM pipeline_stages WHERE id = $1 AND active", [stageId])).rows[0] : null;
          if (!stage) throw badRequest("Etapa inv\xE1lida.");
          if (stage.kind !== "open") throw badRequest("Crie a oportunidade em uma etapa aberta.");
          const ownerId = d.owner_id === void 0 ? req.user.id : d.owner_id;
          const { rows } = await client.query(
            `INSERT INTO opportunities (title, customer_id, owner_id, stage_id, value, next_action, next_action_at, expected_close_date, ticket_id, tags, source, created_by, stage_entered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now()) RETURNING *`,
            [d.title, d.customer_id, ownerId, stageId, d.value, d.next_action || null, d.next_action_at || null, d.expected_close_date || null, d.ticket_id || null, d.tags || [], d.source || cust.rows[0].source || null, req.user.id]
          );
          await client.query(
            "INSERT INTO opportunity_events (opportunity_id, user_id, body, payload) VALUES ($1,$2,$3,$4)",
            [rows[0].id, req.user.id, `Oportunidade criada na etapa "${stage.name}"`, JSON.stringify({ action: "created", stage_id: stageId })]
          );
          await audit(req, "opportunity_create", "opportunity", rows[0].id, { title: d.title, value: d.value }, client);
          return rows[0];
        });
        broadcast("pipeline_changed", { id: out.id });
        res.status(201).json({ opportunity: out, message: "Oportunidade criada." });
      } catch (err) {
        next(err);
      }
    });
    router.put("/:id", validate(schema.partial()), async (req, res, next) => {
      try {
        const o = await load(req, Number(req.params.id));
        const d = req.data;
        if (!isManager(req.user) && o.owner_id !== req.user.id && o.owner_id !== null) return next(forbidden("Somente o respons\xE1vel pode editar esta oportunidade."));
        if (d.version !== void 0 && d.version !== o.version) return next(conflict("Esta oportunidade foi alterada por outro usu\xE1rio. Recarregue para ver a vers\xE3o atual.", { current: o }));
        if (d.stage_id !== void 0 && d.stage_id !== o.stage_id) return next(badRequest('Use a a\xE7\xE3o "mover etapa" para alterar a etapa.'));
        if (!isManager(req.user) && d.owner_id !== void 0 && d.owner_id !== null && d.owner_id !== req.user.id) return next(forbidden("Atendentes n\xE3o podem atribuir oportunidades a outros usu\xE1rios."));
        const { rows } = await query(
          `UPDATE opportunities SET title = COALESCE($1, title), owner_id = CASE WHEN $2::boolean THEN $3 ELSE owner_id END, value = COALESCE($4, value),
        next_action = CASE WHEN $5::boolean THEN $6 ELSE next_action END, next_action_at = CASE WHEN $7::boolean THEN $8 ELSE next_action_at END,
        expected_close_date = CASE WHEN $9::boolean THEN $10 ELSE expected_close_date END, tags = COALESCE($11, tags), source = CASE WHEN $12::boolean THEN $13 ELSE source END,
        version = version + 1, updated_at = now() WHERE id = $14 RETURNING *`,
          [
            d.title ?? null,
            d.owner_id !== void 0,
            d.owner_id ?? null,
            d.value ?? null,
            d.next_action !== void 0,
            d.next_action ?? null,
            d.next_action_at !== void 0,
            d.next_action_at ?? null,
            d.expected_close_date !== void 0,
            d.expected_close_date ?? null,
            d.tags ?? null,
            d.source !== void 0,
            d.source ?? null,
            o.id
          ]
        );
        const changed = Object.keys(d).filter((k) => k !== "version" && JSON.stringify(d[k]) !== JSON.stringify(o[k]));
        if (changed.length) await query("INSERT INTO opportunity_events (opportunity_id, user_id, body, payload) VALUES ($1,$2,$3,$4)", [o.id, req.user.id, `Campos atualizados: ${changed.map(fieldLabel).join(", ")}`, JSON.stringify({ action: "updated", fields: changed })]);
        if (d.owner_id !== void 0 && d.owner_id !== o.owner_id && d.owner_id && d.owner_id !== req.user.id) await notify(d.owner_id, "Oportunidade atribu\xEDda a voc\xEA", o.title, `#/funil/${o.id}`);
        await audit(req, "opportunity_update", "opportunity", o.id, { fields: Object.keys(d) });
        broadcast("pipeline_changed", { id: o.id });
        res.json({ opportunity: rows[0], message: "Oportunidade atualizada." });
      } catch (err) {
        next(err);
      }
    });
    function fieldLabel(k) {
      return { title: "t\xEDtulo", owner_id: "respons\xE1vel", value: "valor", next_action: "pr\xF3xima a\xE7\xE3o", next_action_at: "data da pr\xF3xima a\xE7\xE3o", expected_close_date: "previs\xE3o", tags: "etiquetas", source: "origem" }[k] || k;
    }
    router.post("/:id/move", validate(z.object({ stage_id: z.number().int().positive(), lost_reason: z.string().trim().max(300).optional(), version: z.number().int().optional() })), async (req, res, next) => {
      try {
        const id = Number(req.params.id);
        let moved = null;
        const out = await tx(async (client) => {
          const o = await load(req, id, client);
          if (!isManager(req.user) && o.owner_id !== req.user.id && o.owner_id !== null) throw forbidden("Somente o respons\xE1vel pode mover esta oportunidade.");
          if (req.data.version !== void 0 && req.data.version !== o.version) throw conflict("Esta oportunidade foi alterada por outro usu\xE1rio. Recarregue para ver a vers\xE3o atual.", { current: o });
          const stage = (await client.query("SELECT * FROM pipeline_stages WHERE id = $1 AND active", [req.data.stage_id])).rows[0];
          if (!stage) throw badRequest("Etapa inv\xE1lida.");
          if (stage.pipeline_id !== o.pipeline_id) throw badRequest("A etapa pertence a outro funil.");
          if (stage.id === o.stage_id) return o;
          if (stage.kind === "lost" && !req.data.lost_reason) throw badRequest("Informe o motivo da perda.", { fields: { lost_reason: "Motivo obrigat\xF3rio." }, requires_lost_reason: true });
          const closed = stage.kind !== "open";
          const { rows } = await client.query(
            `UPDATE opportunities SET stage_id = $1, closed_at = CASE WHEN $2::boolean THEN now() ELSE NULL END, lost_reason = CASE WHEN $3::boolean THEN $4 ELSE NULL END,
         stage_entered_at = now(), version = version + 1, updated_at = now() WHERE id = $5 RETURNING *`,
            [stage.id, closed, stage.kind === "lost", req.data.lost_reason || null, id]
          );
          await client.query(
            "INSERT INTO opportunity_events (opportunity_id, user_id, body, payload) VALUES ($1,$2,$3,$4)",
            [
              id,
              req.user.id,
              `Movida de "${o.stage_name}" para "${stage.name}"${stage.kind === "lost" ? ` \u2014 motivo: ${req.data.lost_reason}` : ""}`,
              JSON.stringify({ action: "move", from: o.stage_id, to: stage.id, lost_reason: req.data.lost_reason || null })
            ]
          );
          if (closed) await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Negocia\xE7\xE3o encerrada', updated_at = now() WHERE opportunity_id = $1 AND done_at IS NULL AND (automation_rule_id IS NOT NULL OR kind = 'acompanhamento')`, [id]);
          await audit(req, "opportunity_move", "opportunity", id, { from: o.stage_id, to: stage.id, kind: stage.kind }, client);
          moved = stage;
          return rows[0];
        });
        broadcast("pipeline_changed", { id });
        if (moved) setImmediate(() => automations.trigger("opportunity_stage_changed", "opportunity", id, { dedupeKey: `stage:${moved.id}:${Date.now()}` }));
        res.json({ opportunity: out, message: "Etapa atualizada." });
      } catch (err) {
        next(err);
      }
    });
    router.delete("/:id", async (req, res, next) => {
      try {
        if (!isManager(req.user)) return next(forbidden("Apenas administradores e supervisores podem excluir oportunidades."));
        const o = await load(req, Number(req.params.id));
        await query("DELETE FROM opportunities WHERE id = $1", [o.id]);
        await audit(req, "opportunity_delete", "opportunity", o.id, { title: o.title });
        broadcast("pipeline_changed", { id: o.id });
        res.json({ ok: true, message: "Oportunidade exclu\xEDda." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/tasks.js
var require_tasks = __commonJS({
  "src/routes/tasks.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query } = require_db();
    var { validate } = require_validate();
    var { requireAuth, isManager } = require_auth();
    var { notFound, forbidden } = require_errors();
    var { audit } = require_audit();
    var { notify } = require_notify();
    var router = express.Router();
    router.use(requireAuth);
    var SELECT = `SELECT t.*, u.name AS assignee_name, c.name AS customer_name, o.title AS opportunity_title, tk.protocol AS ticket_protocol
  FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN customers c ON c.id = t.customer_id
  LEFT JOIN opportunities o ON o.id = t.opportunity_id LEFT JOIN tickets tk ON tk.id = t.ticket_id`;
    function scopeSql(user, params) {
      if (isManager(user)) return "TRUE";
      params.push(user.id);
      return `(t.assignee_id = $${params.length} OR t.created_by = $${params.length})`;
    }
    var schema = z.object({
      title: z.string().trim().min(2).max(200),
      description: z.string().max(5e3).nullable().optional(),
      customer_id: z.number().int().positive().nullable().optional(),
      opportunity_id: z.number().int().positive().nullable().optional(),
      ticket_id: z.number().int().positive().nullable().optional(),
      assignee_id: z.number().int().positive().nullable().optional(),
      due_at: z.string().datetime({ offset: true }).nullable().optional(),
      priority: z.enum(["baixa", "normal", "alta"]).default("normal")
    });
    router.get("/", async (req, res, next) => {
      try {
        const params = [];
        const where = [scopeSql(req.user, params)];
        const view = req.query.view || "all";
        if (view === "today") where.push(`t.done_at IS NULL AND t.due_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date`);
        else if (view === "upcoming") where.push(`t.done_at IS NULL AND t.due_at::date > (now() AT TIME ZONE 'America/Sao_Paulo')::date`);
        else if (view === "overdue") where.push(`t.done_at IS NULL AND t.due_at < now()`);
        else if (view === "open") where.push("t.done_at IS NULL");
        else if (view === "done") where.push("t.done_at IS NOT NULL");
        if (req.query.assignee_id) {
          params.push(Number(req.query.assignee_id));
          where.push(`t.assignee_id = $${params.length}`);
        }
        if (req.query.customer_id) {
          params.push(Number(req.query.customer_id));
          where.push(`t.customer_id = $${params.length}`);
        }
        const { rows } = await query(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY t.done_at NULLS FIRST, t.due_at NULLS LAST, t.created_at DESC LIMIT 500`, params);
        const p2 = [];
        const scope2 = scopeSql(req.user, p2);
        const summary = (await query(
          `SELECT count(*) FILTER (WHERE done_at IS NULL AND due_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS today,
              count(*) FILTER (WHERE done_at IS NULL AND due_at::date > (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS upcoming,
              count(*) FILTER (WHERE done_at IS NULL AND due_at < now())::int AS overdue,
              count(*) FILTER (WHERE done_at IS NULL)::int AS open
       FROM tasks t WHERE ${scope2}`,
          p2
        )).rows[0];
        res.json({ tasks: rows, summary });
      } catch (err) {
        next(err);
      }
    });
    router.post("/", validate(schema), async (req, res, next) => {
      try {
        const d = req.data;
        if (!isManager(req.user) && d.assignee_id && d.assignee_id !== req.user.id) return next(forbidden("Atendentes n\xE3o podem atribuir tarefas a outros usu\xE1rios."));
        const assignee = d.assignee_id === void 0 ? req.user.id : d.assignee_id;
        const { rows } = await query(
          `INSERT INTO tasks (title, description, customer_id, opportunity_id, ticket_id, assignee_id, due_at, priority, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [d.title, d.description || null, d.customer_id || null, d.opportunity_id || null, d.ticket_id || null, assignee, d.due_at || null, d.priority, req.user.id]
        );
        if (assignee && assignee !== req.user.id) await notify(assignee, "Nova tarefa atribu\xEDda", d.title, "#/tarefas");
        await audit(req, "task_create", "task", rows[0].id, { title: d.title });
        res.status(201).json({ task: rows[0], message: "Tarefa criada." });
      } catch (err) {
        next(err);
      }
    });
    async function loadTask(req, id) {
      const params = [id];
      const { rows } = await query(`${SELECT} WHERE t.id = $1 AND ${scopeSql(req.user, params)}`, params);
      if (!rows[0]) throw notFound("Tarefa n\xE3o encontrada ou fora do seu escopo.");
      return rows[0];
    }
    router.put("/:id", validate(schema.partial().extend({ done: z.boolean().optional() })), async (req, res, next) => {
      try {
        const t = await loadTask(req, Number(req.params.id));
        const d = req.data;
        if (!isManager(req.user) && d.assignee_id !== void 0 && d.assignee_id !== null && d.assignee_id !== req.user.id) {
          return next(forbidden("Atendentes n\xE3o podem atribuir tarefas a outros usu\xE1rios."));
        }
        const { rows } = await query(
          `UPDATE tasks SET title = COALESCE($1, title), description = CASE WHEN $2::boolean THEN $3 ELSE description END,
        customer_id = CASE WHEN $4::boolean THEN $5 ELSE customer_id END, opportunity_id = CASE WHEN $6::boolean THEN $7 ELSE opportunity_id END,
        assignee_id = CASE WHEN $8::boolean THEN $9 ELSE assignee_id END, due_at = CASE WHEN $10::boolean THEN $11 ELSE due_at END,
        priority = COALESCE($12, priority), done_at = CASE WHEN $13::boolean THEN (CASE WHEN $14::boolean THEN now() ELSE NULL END) ELSE done_at END,
        updated_at = now() WHERE id = $15 RETURNING *`,
          [
            d.title ?? null,
            d.description !== void 0,
            d.description ?? null,
            d.customer_id !== void 0,
            d.customer_id ?? null,
            d.opportunity_id !== void 0,
            d.opportunity_id ?? null,
            d.assignee_id !== void 0,
            d.assignee_id ?? null,
            d.due_at !== void 0,
            d.due_at ?? null,
            d.priority ?? null,
            d.done !== void 0,
            d.done === true,
            t.id
          ]
        );
        if (d.assignee_id && d.assignee_id !== t.assignee_id && d.assignee_id !== req.user.id) await notify(d.assignee_id, "Tarefa atribu\xEDda a voc\xEA", t.title, "#/tarefas");
        await audit(req, "task_update", "task", t.id, { fields: Object.keys(d) });
        res.json({ task: rows[0], message: d.done === true ? "Tarefa conclu\xEDda." : d.done === false ? "Tarefa reaberta." : "Tarefa atualizada." });
      } catch (err) {
        next(err);
      }
    });
    router.delete("/:id", async (req, res, next) => {
      try {
        const t = await loadTask(req, Number(req.params.id));
        if (!isManager(req.user) && t.created_by !== req.user.id && t.assignee_id !== req.user.id) return next(forbidden());
        await query("DELETE FROM tasks WHERE id = $1", [t.id]);
        await audit(req, "task_delete", "task", t.id, { title: t.title });
        res.json({ ok: true, message: "Tarefa exclu\xEDda." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/reports.js
var require_reports = __commonJS({
  "src/routes/reports.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { query } = require_db();
    var { requireAuth, isManager } = require_auth();
    var { toCsv } = require_util();
    var { STATUS_LABEL } = require_tickets();
    var router = express.Router();
    router.use(requireAuth);
    var METHODOLOGY = {
      first_response: "Tempo m\xE9dio entre a abertura do atendimento e o registro da primeira intera\xE7\xE3o de sa\xEDda (resposta ao cliente). Considera apenas atendimentos abertos no per\xEDodo que j\xE1 possuem primeira resposta.",
      resolution: "Tempo m\xE9dio entre a abertura e o encerramento (status Resolvido) dos atendimentos encerrados no per\xEDodo.",
      conversion: "Taxa de convers\xE3o = neg\xF3cios ganhos \xF7 (ganhos + perdidos) entre as oportunidades encerradas no per\xEDodo. Oportunidades ainda abertas n\xE3o entram no c\xE1lculo.",
      period: "Atendimentos s\xE3o filtrados pela data de abertura; encerrados e neg\xF3cios ganhos/perdidos pela data de encerramento; tarefas atrasadas consideram a situa\xE7\xE3o atual."
    };
    function buildFilters(req) {
      const p = [];
      const f = { ticket: [], opp: [], from: null, to: null };
      const q = req.query;
      const from = q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from) ? q.from : null;
      const to = q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to) ? q.to : null;
      f.from = from;
      f.to = to;
      let assignee = q.assignee_id ? Number(q.assignee_id) : null;
      if (!isManager(req.user)) assignee = req.user.id;
      if (assignee) {
        p.push(assignee);
        f.ticket.push(`t.assignee_id = $${p.length}`);
        f.opp.push(`o.owner_id = $${p.length}`);
      }
      if (q.source) {
        p.push(q.source);
        f.ticket.push(`c.source = $${p.length}`);
        f.opp.push(`c.source = $${p.length}`);
      }
      if (q.channel) {
        p.push(q.channel);
        f.ticket.push(`t.channel = $${p.length}`);
      }
      if (q.status) {
        p.push(q.status);
        f.ticket.push(`t.status = $${p.length}`);
      }
      if (from) {
        p.push(from);
        f.fromIdx = p.length;
      }
      if (to) {
        p.push(to);
        f.toIdx = p.length;
      }
      return { p, f };
    }
    async function run(sql, params) {
      const used = [...new Set((sql.match(/\$(\d+)/g) || []).map((m) => Number(m.slice(1))))].sort((a, b) => a - b);
      const map = new Map(used.map((n, i) => [n, i + 1]));
      const out = sql.replace(/\$(\d+)(?!\d)/g, (m, n) => `$${map.get(Number(n))}`);
      return query(out, used.map((n) => params[n - 1]));
    }
    var periodSql = (col, f) => [f.fromIdx ? `${col} >= $${f.fromIdx}::date` : null, f.toIdx ? `${col} < ($${f.toIdx}::date + 1)` : null].filter(Boolean);
    var and = (arr) => arr.length ? arr.join(" AND ") : "TRUE";
    router.get("/summary", async (req, res, next) => {
      try {
        const { p, f } = buildFilters(req);
        const tBase = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id`;
        const oBase = `FROM opportunities o JOIN customers c ON c.id = o.customer_id JOIN pipeline_stages s ON s.id = o.stage_id LEFT JOIN users u ON u.id = o.owner_id`;
        const tOpened = and([...f.ticket, ...periodSql("t.opened_at", f)]);
        const tClosed = and([...f.ticket, ...periodSql("t.closed_at", f)]);
        const oClosed = and([...f.opp, ...periodSql("o.closed_at", f)]);
        const oOpen = and([...f.opp, `s.kind = 'open'`]);
        const tickets = (await run(`SELECT
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.status = 'aguardando')::int AS waiting,
        count(*) FILTER (WHERE t.status = 'em_atendimento')::int AS in_progress,
        count(*) FILTER (WHERE t.status = 'aguardando_cliente')::int AS waiting_customer,
        count(*)::int AS opened,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL) AS avg_first_response_s,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL)::int AS first_response_samples
      ${tBase} WHERE ${tOpened}`, p)).rows[0];
        const closed = (await run(`SELECT
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolved,
        count(*) FILTER (WHERE t.status = 'cancelado')::int AS cancelled,
        avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido') AS avg_resolution_s
      ${tBase} WHERE t.closed_at IS NOT NULL AND ${tClosed}`, p)).rows[0];
        const byAssignee = (await run(`SELECT COALESCE(u.name, 'Sem respons\xE1vel') AS name, t.assignee_id,
        count(*)::int AS total,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolved
      ${tBase} WHERE ${tOpened} GROUP BY u.name, t.assignee_id ORDER BY total DESC`, p)).rows;
        const byStatus = (await run(`SELECT t.status, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY t.status`, p)).rows.map((r) => ({ status: r.status, label: STATUS_LABEL[r.status], n: r.n }));
        const byChannel = (await run(`SELECT t.channel, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY t.channel ORDER BY n DESC`, p)).rows;
        const bySource = (await run(`SELECT COALESCE(c.source,'N\xE3o informada') AS source, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY c.source ORDER BY n DESC`, p)).rows;
        const oppsOpen = (await run(`SELECT count(*)::int AS n, COALESCE(sum(o.value),0)::float AS value ${oBase} WHERE ${oOpen}`, p)).rows[0];
        const oppsClosed = (await run(`SELECT
        count(*) FILTER (WHERE s.kind = 'won')::int AS won, COALESCE(sum(o.value) FILTER (WHERE s.kind = 'won'),0)::float AS won_value,
        count(*) FILTER (WHERE s.kind = 'lost')::int AS lost
      ${oBase} WHERE o.closed_at IS NOT NULL AND ${oClosed}`, p)).rows[0];
        const lostReasons = (await run(`SELECT COALESCE(o.lost_reason,'N\xE3o informado') AS reason, count(*)::int AS n ${oBase}
      WHERE s.kind = 'lost' AND o.closed_at IS NOT NULL AND ${oClosed} GROUP BY o.lost_reason ORDER BY n DESC`, p)).rows;
        const byStage = (await run(`SELECT s.name, s.kind, count(*)::int AS n, COALESCE(sum(o.value),0)::float AS value ${oBase}
      WHERE ${and(f.opp)} AND (s.kind = 'open' OR ${and(periodSql("o.closed_at", f))}) GROUP BY s.name, s.kind, s.position ORDER BY s.position`, p)).rows;
        const taskParams = [];
        let taskWhere = "done_at IS NULL AND due_at < now()";
        const assignee = isManager(req.user) ? req.query.assignee_id ? Number(req.query.assignee_id) : null : req.user.id;
        if (assignee) {
          taskParams.push(assignee);
          taskWhere += ` AND assignee_id = $1`;
        }
        const overdue = (await run(`SELECT count(*)::int AS n FROM tasks WHERE ${taskWhere}`, taskParams)).rows[0].n;
        const decided = oppsClosed.won + oppsClosed.lost;
        res.json({
          period: { from: f.from, to: f.to },
          tickets: {
            ...tickets,
            resolved: closed.resolved,
            cancelled: closed.cancelled,
            avg_first_response_s: tickets.avg_first_response_s == null ? null : Number(tickets.avg_first_response_s),
            avg_resolution_s: closed.avg_resolution_s == null ? null : Number(closed.avg_resolution_s)
          },
          by_assignee: byAssignee,
          by_status: byStatus,
          by_channel: byChannel,
          by_source: bySource,
          tasks: { overdue },
          opportunities: {
            open: oppsOpen.n,
            open_value: oppsOpen.value,
            won: oppsClosed.won,
            won_value: oppsClosed.won_value,
            lost: oppsClosed.lost,
            conversion: decided ? oppsClosed.won / decided : null,
            decided,
            lost_reasons: lostReasons,
            by_stage: byStage
          },
          methodology: METHODOLOGY
        });
      } catch (err) {
        next(err);
      }
    });
    router.get("/dashboard", async (req, res, next) => {
      try {
        const mgr = isManager(req.user);
        const me = req.user.id;
        const AW = require_tickets().AWAITING;
        const p = [me];
        const scope = mgr ? "TRUE" : "(t.assignee_id = $1 OR t.assignee_id IS NULL)";
        const t = (await query(`SELECT
        count(*) FILTER (WHERE t.status = 'aguardando' AND t.assignee_id IS NULL)::int AS queue,
        count(*) FILTER (WHERE ${AW})::int AS unanswered,
        count(*) FILTER (WHERE ${AW} AND COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval < now())::int AS overdue,
        count(*) FILTER (WHERE t.follow_up_at IS NOT NULL AND t.follow_up_at < now() AND t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS follow_up_overdue,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.assignee_id = $1 AND t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS mine_open,
        count(*) FILTER (WHERE t.assignee_id = $1 AND ${AW})::int AS mine_unanswered,
        count(*) FILTER (WHERE t.status = 'resolvido' AND t.closed_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date ${mgr ? "" : "AND t.assignee_id = $1"})::int AS resolved_today,
        count(*) FILTER (WHERE t.opened_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS opened_today,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL AND t.opened_at > now() - interval '30 days')::int AS fr_samples,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL AND t.opened_at > now() - interval '30 days' AND t.first_response_at <= t.opened_at + (cs.response_sla_minutes || ' minutes')::interval)::int AS fr_within_sla,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL AND t.opened_at > now() - interval '30 days') AS avg_first_response_s,
        max(cs.response_sla_minutes) AS sla_minutes
      FROM tickets t CROSS JOIN company_settings cs WHERE ${scope}`, p)).rows[0];
        const oScope = mgr ? "TRUE" : "(o.owner_id = $1 OR o.owner_id IS NULL)";
        const o = (await query(`SELECT
        count(*) FILTER (WHERE s.kind = 'open')::int AS open, COALESCE(sum(o.value) FILTER (WHERE s.kind = 'open'),0)::float AS open_value,
        count(*) FILTER (WHERE s.kind = 'open' AND o.next_action_at IS NULL AND NOT EXISTS (SELECT 1 FROM tasks k WHERE k.opportunity_id = o.id AND k.done_at IS NULL))::int AS no_next_action,
        count(*) FILTER (WHERE s.kind = 'open' AND ((o.next_action_at IS NOT NULL AND o.next_action_at < now()) OR EXISTS (SELECT 1 FROM tasks k WHERE k.opportunity_id = o.id AND k.done_at IS NULL AND k.due_at < now())))::int AS overdue,
        count(*) FILTER (WHERE s.kind = 'open' AND o.updated_at < now() - (cs.idle_opportunity_days || ' days')::interval)::int AS idle,
        count(*) FILTER (WHERE s.kind = 'won' AND date_trunc('month', o.closed_at) = date_trunc('month', now()))::int AS won_month,
        COALESCE(sum(o.value) FILTER (WHERE s.kind = 'won' AND date_trunc('month', o.closed_at) = date_trunc('month', now())),0)::float AS won_month_value,
        count(*) FILTER (WHERE s.kind = 'lost' AND date_trunc('month', o.closed_at) = date_trunc('month', now()))::int AS lost_month,
        count(*) FILTER (WHERE s.kind = 'open' AND o.expected_close_date IS NOT NULL AND o.expected_close_date <= (now() + interval '7 days')::date)::int AS closing_week,
        max(cs.idle_opportunity_days) AS idle_days
      FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id CROSS JOIN company_settings cs WHERE ${oScope}`, mgr ? [] : p)).rows[0];
        const tk = (await query(`SELECT
        count(*) FILTER (WHERE done_at IS NULL AND due_at < now())::int AS overdue,
        count(*) FILTER (WHERE done_at IS NULL AND due_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS today
      FROM tasks WHERE ${mgr ? "TRUE" : "assignee_id = $1"}`, mgr ? [] : p)).rows[0];
        const myTasks = (await query(`SELECT t.id, t.title, t.due_at, t.priority, t.kind, t.customer_id, t.ticket_id, t.opportunity_id, c.name AS customer_name, tk.protocol
      FROM tasks t LEFT JOIN customers c ON c.id = t.customer_id LEFT JOIN tickets tk ON tk.id = t.ticket_id
      WHERE t.assignee_id = $1 AND t.done_at IS NULL AND (t.due_at IS NULL OR t.due_at < (now() AT TIME ZONE 'America/Sao_Paulo')::date + 2) ORDER BY t.due_at NULLS LAST LIMIT 8`, [me])).rows;
        const nextContacts = (await query(`SELECT t.id, t.protocol, t.subject, t.follow_up_at, c.name AS customer_name FROM tickets t JOIN customers c ON c.id = t.customer_id
      WHERE t.follow_up_at IS NOT NULL AND t.status IN ('aguardando','em_atendimento','aguardando_cliente') ${mgr ? "" : "AND t.assignee_id = $1"} ORDER BY t.follow_up_at LIMIT 8`, mgr ? [] : [me])).rows;
        let team = [];
        if (mgr) {
          team = (await query(`SELECT u.id, u.name, u.available, u.team,
          count(t.id) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
          count(t.id) FILTER (WHERE ${AW})::int AS unanswered,
          count(t.id) FILTER (WHERE t.status = 'resolvido' AND t.closed_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS resolved_today,
          (SELECT count(*)::int FROM tasks k WHERE k.assignee_id = u.id AND k.done_at IS NULL AND k.due_at < now()) AS overdue_tasks
        FROM users u LEFT JOIN tickets t ON t.assignee_id = u.id WHERE u.active AND u.role = 'atendente' GROUP BY u.id ORDER BY u.name`)).rows;
        }
        res.json({
          role: req.user.role,
          tickets: t,
          opportunities: o,
          tasks: tk,
          my_tasks: myTasks,
          next_contacts: nextContacts,
          team,
          help: {
            queue: 'Atendimentos com status "Aguardando atendimento" e sem respons\xE1vel. Situa\xE7\xE3o atual.',
            unanswered: "Atendimentos ativos em que a \xFAltima mensagem \xE9 do cliente (ou ainda n\xE3o houve resposta). Situa\xE7\xE3o atual.",
            overdue: `Sem resposta h\xE1 mais de ${t.sla_minutes} minutos (prazo configurado em Configura\xE7\xF5es \u203A Empresa).`,
            follow_up_overdue: "Atendimentos abertos com retorno agendado para uma data j\xE1 passada.",
            no_next_action: "Oportunidades abertas sem data de pr\xF3xima a\xE7\xE3o e sem tarefa pendente.",
            sla: `Percentual de atendimentos dos \xFAltimos 30 dias cuja primeira resposta ocorreu dentro de ${t.sla_minutes} minutos ap\xF3s a abertura.`,
            won_month: 'Neg\xF3cios movidos para a etapa "Ganho" no m\xEAs atual, pela data de encerramento.',
            idle: `Oportunidades abertas sem nenhuma atualiza\xE7\xE3o h\xE1 mais de ${o.idle_days} dias.`
          }
        });
      } catch (err) {
        next(err);
      }
    });
    router.get("/export.csv", async (req, res, next) => {
      try {
        const { p, f } = buildFilters(req);
        const tBase = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id`;
        const tOpened = and([...f.ticket, ...periodSql("t.opened_at", f)]);
        const { rows } = await query(`SELECT COALESCE(u.name,'Sem respons\xE1vel') AS responsavel, count(*)::int AS total,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS abertos,
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolvidos,
        count(*) FILTER (WHERE t.status = 'cancelado')::int AS cancelados,
        round(avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL) / 60) AS primeira_resposta_min,
        round(avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido') / 60) AS resolucao_min
      ${tBase} WHERE ${tOpened} GROUP BY u.name ORDER BY total DESC`, p);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="relatorio-atendimentos.csv"');
        res.send(toCsv(rows, ["responsavel", "total", "abertos", "resolvidos", "cancelados", "primeira_resposta_min", "resolucao_min"].map((k) => ({ key: k, label: k }))));
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/notifications.js
var require_notifications = __commonJS({
  "src/routes/notifications.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { query } = require_db();
    var { requireAuth } = require_auth();
    var { subscribe } = require_realtime();
    var router = express.Router();
    router.use(requireAuth);
    router.get("/stream", (req, res) => subscribe(req, res));
    router.get("/", async (req, res, next) => {
      try {
        const { rows } = await query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [req.user.id]);
        const alerts = (await query(
          `SELECT (SELECT count(*)::int FROM tasks WHERE assignee_id = $1 AND done_at IS NULL AND due_at < now()) AS overdue_tasks,
              (SELECT count(*)::int FROM tickets WHERE assignee_id = $1 AND follow_up_at IS NOT NULL AND follow_up_at <= now() + interval '1 day' AND status NOT IN ('resolvido','cancelado')) AS follow_ups_due`,
          [req.user.id]
        )).rows[0];
        res.json({ notifications: rows, unread: rows.filter((n) => !n.read_at).length, alerts });
      } catch (err) {
        next(err);
      }
    });
    router.post("/read-all", async (req, res, next) => {
      try {
        await query("UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL", [req.user.id]);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    });
    router.post("/:id/read", async (req, res, next) => {
      try {
        await query("UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2", [Number(req.params.id), req.user.id]);
        res.json({ ok: true });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/whatsapp.js
var require_whatsapp2 = __commonJS({
  "src/routes/whatsapp.js"(exports, module) {
    "use strict";
    var express = require_express();
    var crypto = require_crypto();
    var { z } = require_zod();
    var { query } = require_db();
    var config = require_config();
    var { validate } = require_validate();
    var { requireAuth, requireRole, isManager } = require_auth();
    var { notFound, forbidden } = require_errors();
    var { audit } = require_audit();
    var wa = require_whatsapp();
    var router = express.Router();
    var cfg = config.whatsapp;
    router.get("/status", requireAuth, async (_req, res, next) => {
      try {
        const st = wa.state();
        const s = (await query("SELECT whatsapp_last_event_at, whatsapp_last_error, whatsapp_last_error_at FROM company_settings WHERE id = 1")).rows[0];
        const counts = (await query(`SELECT count(*) FILTER (WHERE direction='entrada')::int AS received, count(*) FILTER (WHERE direction='saida')::int AS sent,
      count(*) FILTER (WHERE status='falhou')::int AS failed, max(created_at) AS last_message_at FROM whatsapp_messages`)).rows[0];
        const pending = [];
        if (!st.configured) pending.push("Credenciais ausentes no servidor: " + st.missing.filter((m) => ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"].includes(m)).join(", ") + ".");
        if (st.configured && !cfg.verifyToken) pending.push("WHATSAPP_VERIFY_TOKEN ausente: o webhook n\xE3o pode ser verificado pela Meta.");
        if (st.configured && !cfg.appSecret) pending.push("WHATSAPP_APP_SECRET ausente: a assinatura dos webhooks n\xE3o \xE9 validada.");
        if (st.configured && !s.whatsapp_last_event_at) pending.push('Nenhum webhook recebido ainda: confirme a URL e a assinatura do campo "messages" no painel da Meta.');
        res.json({
          connected: st.configured,
          state: st.configured ? s.whatsapp_last_event_at ? "ativo" : "configurado_sem_eventos" : "desconectado",
          phone_number_id: st.configured ? cfg.phoneNumberId : null,
          webhook_url: `${config.appUrl}/api/whatsapp/webhook`,
          webhook_ready: st.webhook_ready,
          signature_check: st.signature_check,
          missing: st.missing,
          last_event_at: s.whatsapp_last_event_at,
          last_error: s.whatsapp_last_error,
          last_error_at: s.whatsapp_last_error_at,
          stats: counts,
          pending,
          message: st.configured ? "Integra\xE7\xE3o configurada. Mensagens recebidas abrem ou atualizam atendimentos; envios feitos pela central ficam no hist\xF3rico com status de entrega." : 'Integra\xE7\xE3o desconectada. Enquanto as credenciais n\xE3o forem configuradas no servidor, use "Abrir no WhatsApp" (atalho externo) e registre a intera\xE7\xE3o manualmente.'
        });
      } catch (err) {
        next(err);
      }
    });
    router.get("/window/:customerId", requireAuth, async (req, res, next) => {
      try {
        res.json({ connected: cfg.configured, ...await wa.windowOpen(Number(req.params.customerId)) });
      } catch (err) {
        next(err);
      }
    });
    router.post("/send", requireAuth, validate(z.object({
      customer_id: z.number().int().positive(),
      ticket_id: z.number().int().positive().nullable().optional(),
      body: z.string().trim().max(4096).optional(),
      template: z.object({ name: z.string().trim().min(1).max(120), language: z.string().trim().max(10).optional() }).optional()
    })), async (req, res, next) => {
      try {
        if (!req.data.body && !req.data.template) return next(new (require_errors()).HttpError(400, "Informe o texto ou o modelo a enviar."));
        if (req.data.ticket_id) {
          const t = (await query("SELECT assignee_id FROM tickets WHERE id = $1", [req.data.ticket_id])).rows[0];
          if (!t) return next(notFound("Atendimento n\xE3o encontrado."));
          if (!isManager(req.user) && t.assignee_id !== req.user.id) return next(forbidden("Assuma o atendimento para responder ao cliente."));
        }
        const m = await wa.sendText({ ticketId: req.data.ticket_id || null, customerId: req.data.customer_id, body: req.data.body, userId: req.user.id, template: req.data.template });
        await audit(req, "whatsapp_send", "customer", req.data.customer_id, { ticket_id: req.data.ticket_id || null, template: req.data.template?.name || null });
        res.status(201).json({ message: "Mensagem enviada pela API oficial.", whatsapp_message: m });
      } catch (err) {
        next(err);
      }
    });
    router.get("/media/:id", requireAuth, async (req, res, next) => {
      try {
        const att = (await query("SELECT * FROM ticket_attachments WHERE wa_media_id = $1", [req.params.id])).rows[0];
        if (!att) return next(notFound("M\xEDdia n\xE3o encontrada."));
        const { mime, buffer } = await wa.fetchMedia(req.params.id);
        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(att.name)}"`);
        res.send(buffer);
      } catch (err) {
        next(err);
      }
    });
    router.get("/log", requireRole("admin", "supervisor"), async (req, res, next) => {
      try {
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const { rows } = await query(`SELECT m.id, m.direction, m.status, m.status_at, m.error, m.body, m.created_at, m.message_type, m.wa_message_id, m.ticket_id, c.name AS customer_name, t.protocol
      FROM whatsapp_messages m LEFT JOIN customers c ON c.id = m.customer_id LEFT JOIN tickets t ON t.id = m.ticket_id ORDER BY m.created_at DESC LIMIT $1`, [limit]);
        res.json({ messages: rows });
      } catch (err) {
        next(err);
      }
    });
    router.get("/webhook", (req, res) => {
      if (!cfg.configured || !cfg.verifyToken) return res.status(404).send("Integra\xE7\xE3o desconectada");
      if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === cfg.verifyToken) return res.status(200).send(req.query["hub.challenge"]);
      res.sendStatus(403);
    });
    router.post("/webhook", async (req, res) => {
      if (!cfg.configured) return res.sendStatus(404);
      if (cfg.appSecret) {
        const sig = req.get("X-Hub-Signature-256") || "";
        const expected = "sha256=" + crypto.createHmac("sha256", cfg.appSecret).update(req.rawBody || Buffer.alloc(0)).digest("hex");
        if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return res.sendStatus(401);
      }
      res.sendStatus(200);
      try {
        await wa.processWebhook(req.body || {});
      } catch (err) {
        console.error("Erro ao processar webhook do WhatsApp:", err.message);
        await query("UPDATE company_settings SET whatsapp_last_error = $1, whatsapp_last_error_at = now() WHERE id = 1", [err.message]).catch(() => {
        });
      }
    });
    module.exports = router;
  }
});

// src/routes/quick-replies.js
var require_quick_replies = __commonJS({
  "src/routes/quick-replies.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query } = require_db();
    var { validate } = require_validate();
    var { requireAuth, requireRole } = require_auth();
    var { notFound } = require_errors();
    var { audit } = require_audit();
    var router = express.Router();
    router.use(requireAuth);
    router.get("/", async (req, res, next) => {
      try {
        const all = req.query.all === "true" && req.user.role !== "atendente";
        const { rows } = await query(`SELECT q.*, u.name AS created_by_name FROM quick_replies q LEFT JOIN users u ON u.id = q.created_by ${all ? "" : "WHERE q.active"} ORDER BY q.active DESC, q.title`);
        res.json({ quick_replies: rows });
      } catch (err) {
        next(err);
      }
    });
    var schema = z.object({
      title: z.string().trim().min(1).max(80),
      shortcut: z.string().trim().max(30).nullable().optional(),
      body: z.string().trim().min(1).max(4e3),
      active: z.boolean().optional()
    });
    router.post("/", requireRole("admin", "supervisor"), validate(schema), async (req, res, next) => {
      try {
        const d = req.data;
        const { rows } = await query("INSERT INTO quick_replies (title, shortcut, body, active, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *", [d.title, d.shortcut || null, d.body, d.active !== false, req.user.id]);
        await audit(req, "quick_reply_create", "quick_reply", rows[0].id, { title: d.title });
        res.status(201).json({ quick_reply: rows[0], message: "Resposta r\xE1pida criada." });
      } catch (err) {
        next(err);
      }
    });
    router.put("/:id", requireRole("admin", "supervisor"), validate(schema.partial()), async (req, res, next) => {
      try {
        const d = req.data;
        const { rows } = await query(
          `UPDATE quick_replies SET title = COALESCE($1, title), shortcut = CASE WHEN $2::boolean THEN $3 ELSE shortcut END, body = COALESCE($4, body), active = COALESCE($5, active), updated_at = now() WHERE id = $6 RETURNING *`,
          [d.title ?? null, d.shortcut !== void 0, d.shortcut ?? null, d.body ?? null, d.active ?? null, Number(req.params.id)]
        );
        if (!rows[0]) return next(notFound());
        await audit(req, "quick_reply_update", "quick_reply", rows[0].id, { fields: Object.keys(d) });
        res.json({ quick_reply: rows[0], message: "Resposta r\xE1pida atualizada." });
      } catch (err) {
        next(err);
      }
    });
    router.delete("/:id", requireRole("admin", "supervisor"), async (req, res, next) => {
      try {
        const { rowCount } = await query("DELETE FROM quick_replies WHERE id = $1", [Number(req.params.id)]);
        if (!rowCount) return next(notFound());
        await audit(req, "quick_reply_delete", "quick_reply", Number(req.params.id));
        res.json({ ok: true, message: "Resposta r\xE1pida exclu\xEDda." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/saved-filters.js
var require_saved_filters = __commonJS({
  "src/routes/saved-filters.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query } = require_db();
    var { validate } = require_validate();
    var { requireAuth, isManager } = require_auth();
    var { notFound, forbidden } = require_errors();
    var router = express.Router();
    router.use(requireAuth);
    router.get("/", async (req, res, next) => {
      try {
        const params = [req.user.id];
        let where = "(f.user_id = $1 OR f.shared)";
        if (req.query.scope) {
          params.push(req.query.scope);
          where += ` AND f.scope = $${params.length}`;
        }
        const { rows } = await query(`SELECT f.*, u.name AS user_name FROM saved_filters f LEFT JOIN users u ON u.id = f.user_id WHERE ${where} ORDER BY f.shared, f.name`, params);
        res.json({ filters: rows });
      } catch (err) {
        next(err);
      }
    });
    var schema = z.object({
      scope: z.enum(["tickets", "pipeline", "customers", "tasks"]),
      name: z.string().trim().min(1).max(60),
      params: z.record(z.any()).default({}),
      shared: z.boolean().optional()
    });
    router.post("/", validate(schema), async (req, res, next) => {
      try {
        const d = req.data;
        const shared = Boolean(d.shared) && isManager(req.user);
        const { rows } = await query("INSERT INTO saved_filters (user_id, scope, name, params, shared) VALUES ($1,$2,$3,$4,$5) RETURNING *", [req.user.id, d.scope, d.name, JSON.stringify(d.params), shared]);
        res.status(201).json({ filter: rows[0], message: "Filtro salvo." });
      } catch (err) {
        next(err);
      }
    });
    router.delete("/:id", async (req, res, next) => {
      try {
        const f = (await query("SELECT * FROM saved_filters WHERE id = $1", [Number(req.params.id)])).rows[0];
        if (!f) return next(notFound());
        if (f.user_id !== req.user.id && !isManager(req.user)) return next(forbidden());
        await query("DELETE FROM saved_filters WHERE id = $1", [f.id]);
        res.json({ ok: true, message: "Filtro removido." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// src/routes/automations.js
var require_automations2 = __commonJS({
  "src/routes/automations.js"(exports, module) {
    "use strict";
    var express = require_express();
    var { z } = require_zod();
    var { query } = require_db();
    var { validate } = require_validate();
    var { requireRole } = require_auth();
    var { notFound, badRequest } = require_errors();
    var { audit } = require_audit();
    var automations = require_automations();
    var config = require_config();
    var router = express.Router();
    router.use(requireRole("admin", "supervisor"));
    router.get("/meta", (_req, res) => res.json({ triggers: automations.TRIGGERS, actions: automations.ACTIONS, whatsapp_connected: config.whatsapp.configured }));
    router.get("/", async (_req, res, next) => {
      try {
        const { rows } = await query(`SELECT r.*, u.name AS created_by_name,
      (SELECT count(*)::int FROM automation_runs x WHERE x.rule_id = r.id AND x.status = 'executada' AND x.created_at > now() - interval '7 days') AS runs_7d,
      (SELECT count(*)::int FROM automation_runs x WHERE x.rule_id = r.id AND x.status = 'falhou' AND x.created_at > now() - interval '7 days') AS failures_7d
      FROM automation_rules r LEFT JOIN users u ON u.id = r.created_by ORDER BY r.active DESC, r.id`);
        res.json({ rules: rows });
      } catch (err) {
        next(err);
      }
    });
    router.get("/runs", async (req, res, next) => {
      try {
        const params = [Math.min(Number(req.query.limit) || 100, 500)];
        let where = "";
        if (req.query.rule_id) {
          params.push(Number(req.query.rule_id));
          where = `WHERE x.rule_id = $2`;
        }
        const { rows } = await query(`SELECT x.*, r.name AS rule_name,
      CASE WHEN x.entity = 'ticket' THEN (SELECT protocol FROM tickets t WHERE t.id = x.entity_id) ELSE (SELECT title FROM opportunities o WHERE o.id = x.entity_id) END AS entity_label
      FROM automation_runs x JOIN automation_rules r ON r.id = x.rule_id ${where} ORDER BY x.created_at DESC LIMIT $1`, params);
        res.json({ runs: rows });
      } catch (err) {
        next(err);
      }
    });
    var schema = z.object({
      name: z.string().trim().min(2).max(120),
      trigger: z.string().refine((v) => Boolean(automations.TRIGGERS[v]), "Gatilho inv\xE1lido."),
      conditions: z.record(z.any()).default({}),
      action: z.string().refine((v) => Boolean(automations.ACTIONS[v]), "A\xE7\xE3o inv\xE1lida."),
      action_params: z.record(z.any()).default({}),
      team: z.string().trim().max(60).nullable().optional(),
      active: z.boolean().optional()
    });
    function check(d) {
      const t = automations.TRIGGERS[d.trigger];
      if (d.action === "distribute" && t.entity !== "ticket") throw badRequest("A distribui\xE7\xE3o em rod\xEDzio s\xF3 se aplica a gatilhos de atendimento.");
      if (["set_priority", "send_message"].includes(d.action) && t.entity !== "ticket") throw badRequest("Esta a\xE7\xE3o s\xF3 se aplica a gatilhos de atendimento.");
      if (d.action === "send_message" && !config.whatsapp.configured) throw badRequest("Mensagens autom\xE1ticas exigem um canal conectado. O WhatsApp est\xE1 desconectado neste servidor.");
      if (d.action === "create_task" && !d.action_params.title) throw badRequest("Informe o t\xEDtulo da tarefa.", { fields: { "action_params.title": "Obrigat\xF3rio." } });
    }
    router.post("/", validate(schema), async (req, res, next) => {
      try {
        const d = req.data;
        check(d);
        const { rows } = await query(
          "INSERT INTO automation_rules (name, trigger, conditions, action, action_params, team, active, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
          [d.name, d.trigger, JSON.stringify(d.conditions), d.action, JSON.stringify(d.action_params), d.team || null, d.active !== false, req.user.id]
        );
        await audit(req, "automation_create", "automation_rule", rows[0].id, { name: d.name, trigger: d.trigger, action: d.action });
        res.status(201).json({ rule: rows[0], message: "Regra criada." });
      } catch (err) {
        next(err);
      }
    });
    router.put("/:id", validate(schema.partial()), async (req, res, next) => {
      try {
        const cur = (await query("SELECT * FROM automation_rules WHERE id = $1", [Number(req.params.id)])).rows[0];
        if (!cur) return next(notFound("Regra n\xE3o encontrada."));
        const d = { ...cur, ...req.data, conditions: req.data.conditions ?? cur.conditions, action_params: req.data.action_params ?? cur.action_params };
        check(d);
        const { rows } = await query(
          `UPDATE automation_rules SET name=$1, trigger=$2, conditions=$3, action=$4, action_params=$5, team=$6, active=$7, updated_at=now() WHERE id=$8 RETURNING *`,
          [d.name, d.trigger, JSON.stringify(d.conditions), d.action, JSON.stringify(d.action_params), d.team || null, d.active, cur.id]
        );
        await audit(req, "automation_update", "automation_rule", cur.id, { fields: Object.keys(req.data) });
        res.json({ rule: rows[0], message: req.data.active === false ? "Regra pausada." : req.data.active === true ? "Regra ativada." : "Regra atualizada." });
      } catch (err) {
        next(err);
      }
    });
    router.delete("/:id", async (req, res, next) => {
      try {
        const { rowCount } = await query("DELETE FROM automation_rules WHERE id = $1", [Number(req.params.id)]);
        if (!rowCount) return next(notFound("Regra n\xE3o encontrada."));
        await audit(req, "automation_delete", "automation_rule", Number(req.params.id));
        res.json({ ok: true, message: "Regra exclu\xEDda." });
      } catch (err) {
        next(err);
      }
    });
    router.post("/run-scheduled", async (req, res, next) => {
      try {
        await automations.runScheduled();
        await audit(req, "automation_run_now", "automation_rule", null);
        res.json({ ok: true, message: "Verifica\xE7\xE3o executada." });
      } catch (err) {
        next(err);
      }
    });
    module.exports = router;
  }
});

// npm-dep:fs
var require_fs = __commonJS({
  "npm-dep:fs"(exports, module) {
    module.exports = globalThis.__deps["fs"];
  }
});

// src/app.js
var require_app = __commonJS({
  "src/app.js"(exports, module) {
    "use strict";
    var path = require_path();
    var express = require_express();
    var helmet = require_helmet();
    var session = require_express_session();
    var PgSession = require_connect_pg_simple()(session);
    var config = require_config();
    var { pool } = require_db();
    var { loadUser } = require_auth();
    var { HttpError } = require_errors();
    var app = express();
    app.set("trust proxy", 1);
    app.disable("x-powered-by");
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false
    }));
    app.use("/api/whatsapp/webhook", express.json({ verify: (req, _res, buf) => {
      req.rawBody = buf;
    } }));
    app.use(express.json({ limit: "6mb" }));
    app.use(express.urlencoded({ extended: false }));
    app.use(session({
      store: new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: false, pruneSessionInterval: 900 }),
      name: "crm.sid",
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, sameSite: "lax", secure: config.cookieSecure, maxAge: config.sessionHours * 3600 * 1e3 }
    }));
    app.use("/api", (req, res, next) => {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && !req.path.startsWith("/whatsapp/webhook")) {
        if (req.get("X-Requested-With") !== "fetch") return res.status(403).json({ error: "Requisi\xE7\xE3o inv\xE1lida (cabe\xE7alho de prote\xE7\xE3o ausente)." });
      }
      next();
    });
    app.use("/api", loadUser);
    app.get("/api/health", async (_req, res) => {
      try {
        await pool.query("SELECT 1");
        res.json({ ok: true, db: "ok" });
      } catch (e) {
        res.status(500).json({ ok: false, db: e.message });
      }
    });
    app.use("/api/auth", require_auth2().router);
    app.use("/api/users", require_users());
    app.use("/api/settings", require_settings());
    app.use("/api/customers", require_customers().router);
    app.use("/api/tickets", require_tickets().router);
    app.use("/api/opportunities", require_pipeline());
    app.use("/api/tasks", require_tasks());
    app.use("/api/reports", require_reports());
    app.use("/api/notifications", require_notifications());
    app.use("/api/whatsapp", require_whatsapp2());
    app.use("/api/quick-replies", require_quick_replies());
    app.use("/api/saved-filters", require_saved_filters());
    app.use("/api/automations", require_automations2());
    app.use("/api", (_req, res) => res.status(404).json({ error: "Rota n\xE3o encontrada." }));
    var MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
    var indexHtml = (raw) => config.publicBase ? raw.replace("<head>", `<head>
  <base href="${config.publicBase}/">`).replace('<script src="js/api.js">', '<script src="js/base.js"></script>\n  <script src="js/api.js">') : raw;
    var baseJs = `window.API_BASE = ${JSON.stringify(config.publicBase)};`;
    app.get("/js/base.js", (_req, res) => {
      res.set("Cache-Control", "no-cache");
      res.type("text/javascript; charset=utf-8").send(baseJs);
    });
    if (globalThis.__STATIC__) {
      const files = globalThis.__STATIC__;
      app.get("*", (req, res) => {
        let p = req.path === "/" ? "/index.html" : req.path;
        if (!files[p]) p = "/index.html";
        const body = p === "/index.html" ? indexHtml(files[p]) : files[p];
        res.set("Cache-Control", p === "/index.html" ? "no-cache" : "public, max-age=3600");
        res.type(MIME[path.extname(p)] || "application/octet-stream").send(body);
      });
    } else {
      const pub = path.join(__dirname, "..", "public");
      app.get(["/", "/index.html"], (_req, res) => {
        res.set("Cache-Control", "no-cache");
        res.type("html").send(indexHtml(require_fs().readFileSync(path.join(pub, "index.html"), "utf8")));
      });
      app.use(express.static(pub, { maxAge: config.env === "production" ? "1h" : 0, etag: true }));
      app.get("*", (_req, res) => {
        res.type("html").send(indexHtml(require_fs().readFileSync(path.join(pub, "index.html"), "utf8")));
      });
    }
    app.use((err, req, res, _next) => {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message, ...err.details || {} });
      }
      if (err.type === "entity.too.large") return res.status(413).json({ error: "Conte\xFAdo muito grande." });
      if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inv\xE1lido." });
      if (err.code === "23505") return res.status(409).json({ error: "Registro duplicado." });
      if (err.code === "23503") return res.status(400).json({ error: "Refer\xEAncia inv\xE1lida: o registro relacionado n\xE3o existe." });
      console.error(err);
      res.status(500).json({ error: "Erro interno. Tente novamente; se persistir, contate o administrador." });
    });
    var exported = app;
    if (config.basePath) {
      exported = express();
      exported.set("trust proxy", 1);
      exported.disable("x-powered-by");
      const bases = [...new Set([config.basePath, config.publicBase].filter(Boolean))];
      for (const b of bases) {
        exported.get(b, (req, res, next) => req.originalUrl.split("?")[0].endsWith("/") ? next() : res.redirect(301, `${config.publicBase || b}/`));
        exported.use(b, app);
      }
    }
    module.exports = exported;
  }
});

// src/lib/migrate.js
var require_migrate = __commonJS({
  "src/lib/migrate.js"(exports, module) {
    "use strict";
    var fs = require_fs();
    var path = require_path();
    function loadMigrations() {
      if (globalThis.__MIGRATIONS__) return globalThis.__MIGRATIONS__;
      const dir = path.join(__dirname, "..", "migrations");
      return fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((name) => ({ name, sql: fs.readFileSync(path.join(dir, name), "utf8") }));
    }
    async function migrate(pool, log = () => {
    }) {
      const client = await pool.connect();
      try {
        await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
        const applied = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
        for (const m of loadMigrations()) {
          if (applied.has(m.name)) continue;
          log(`Aplicando ${m.name}... `);
          await client.query("BEGIN");
          try {
            await client.query(m.sql);
            await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [m.name]);
            await client.query("COMMIT");
            log("ok\n");
          } catch (err) {
            await client.query("ROLLBACK");
            throw err;
          }
        }
      } finally {
        client.release();
      }
    }
    module.exports = migrate;
  }
});

// src/edge-entry.js
var require_edge_entry = __commonJS({
  "src/edge-entry.js"() {
    var D = globalThis.Deno;
    var env = (k, d) => D && D.env.get(k) || process.env[k] || d;
    var crypto = require_crypto();
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = env("DATABASE_URL") || env("SUPABASE_DB_URL");
    process.env.DATABASE_SSL = env("DATABASE_SSL", "true");
    process.env.COOKIE_SECURE = env("COOKIE_SECURE", "true");
    process.env.BASE_PATH = env("BASE_PATH", "/crm");
    process.env.PUBLIC_BASE = env("PUBLIC_BASE", "/functions/v1/crm");
    process.env.APP_URL = env("APP_URL") || (env("SUPABASE_URL") ? `${env("SUPABASE_URL")}${process.env.PUBLIC_BASE}` : "http://localhost:8000" + process.env.PUBLIC_BASE);
    process.env.SESSION_SECRET = env("SESSION_SECRET") || crypto.createHash("sha256").update("crm-session:" + (env("SUPABASE_SERVICE_ROLE_KEY") || env("SUPABASE_ANON_KEY") || "sem-chave")).digest("hex");
    for (const k of ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "SESSION_HOURS"]) {
      const v = env(k);
      if (v) process.env[k] = v;
    }
    globalThis.__STATIC__ = require_static_embed();
    var app = require_app();
    var automations = require_automations();
    var { pool } = require_db();
    var lastRun = 0;
    app.use((_req, _res, next) => {
      const now = Date.now();
      if (now - lastRun > 6e4) {
        lastRun = now;
        automations.runScheduled().catch((e) => console.error("Agendador:", e.message));
      }
      next();
    });
    var migrate = require_migrate();
    migrate(pool).catch((e) => console.error("Migra\xE7\xE3o autom\xE1tica falhou:", e.message));
    app.listen(8e3, () => console.log("CRM (edge) em execu\xE7\xE3o em", process.env.APP_URL));
  }
});
export default require_edge_entry();
