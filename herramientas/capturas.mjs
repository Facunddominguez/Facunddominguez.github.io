// Capturas y medidas de cada vista de Mi Plato Fácil a 390×844, en tema claro y oscuro.
// Uso: node herramientas/capturas.mjs [--salida <carpeta>] [--vistas a,b] [--estados vacio,normal,todo]
//                                     [--temas claro,oscuro] [--navegador <ruta>] [--raiz <copia del repositorio>]
//                                     [--sin-imagenes]
// Sirve el repositorio en una dirección local con un reloj fijo (lunes 26/10/2026 12:00, Argentina) y, por cada
// vista, estado y tema, guarda una captura (<vista>-<estado>-<tema>.png) y sus medidas en medidas.json.
// Estados:
//   vacio  → primer uso, sin datos guardados (modo simple);
//   normal → el respaldo de ejemplo (pruebas/fixtures/respaldo-v14.9.94.json, semana completa), modo simple;
//   todo   → el respaldo de ejemplo en modo completo, con todos los paneles de la vista abiertos.
// Medidas por vista: alto de la página (px), palabras visibles, errores de JavaScript, scroll horizontal,
// campos sin etiqueta, elementos que se salen de la pantalla, textos cortados y controles superpuestos.
// --raiz mide otra copia del repositorio (por ejemplo, el tag de la etapa anterior), siempre en el mismo equipo.
// La salida por omisión es capturas/actual (capturas/ está en .gitignore). Sin dependencias: Node 18+.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir, platform, release } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { StringDecoder } from 'node:string_decoder';

const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const RAIZ = resolve(arg('--raiz') || fileURLToPath(new URL('../', import.meta.url)));
const espera = ms => new Promise(r => setTimeout(r, ms));
const ANCHO = 390, ALTO = 844;
const RELOJ = '2026-10-26T12:00:00-03:00';
// El respaldo de ejemplo es siempre el de esta copia de las herramientas (no el de --raiz), para medir igual antes y después.
const RESPALDO = fileURLToPath(new URL('../pruebas/fixtures/respaldo-v14.9.94.json', import.meta.url));
const salida = resolve(arg('--salida') || join(RAIZ, 'capturas', 'actual'));
const conImagenes = !args.includes('--sin-imagenes');
const temas = (arg('--temas') || 'claro,oscuro').split(',');
const estados = (arg('--estados') || 'vacio,normal,todo').split(',');
const version = JSON.parse(await readFile(join(RAIZ, 'fuente', 'version.json'), 'utf8')).version;

// Vistas: cómo llegar a cada una desde el inicio. Cuando la interfaz cambia se actualiza el camino, no el significado
// de la vista. "medir" indica qué elemento se mide (por omisión, la pantalla activa).
const VISTAS = [
  { id: 'hoy', ir: 'openTab("hoy")' },
  { id: 'semana', ir: 'openTab("semana")' },
  { id: 'compras', ir: 'openTab("compras")' },
  { id: 'comidas', ir: 'openTab("miscomidas")' },
  { id: 'mas', ir: 'openTab("mas")' },
  { id: 'despensa', ir: 'openTab("compras"); go("ingredientes")' },
  { id: 'entrenamiento', ir: 'openTab("mas"); go("trainingCalendar")' },
  { id: 'respaldo', ir: 'openTab("mas"); go("backupScreen")' },
  { id: 'ia', ir: 'openTab("mas"); go("asistente")' },
  { id: 'ideas', ir: 'openTab("miscomidas"); go("ideas")' },
  { id: 'armado-desayuno', ir: 'openTab("hoy"); start("desayuno")' },
  { id: 'armado-almuerzo', ir: 'openTab("hoy"); start("plato")' },
  { id: 'armado-verduras', ir: 'openTab("hoy"); start("plato"); setDay("Día libre"); go("lunch_veg")' },
  { id: 'resumen', ir: 'openTab("hoy"); start("desayuno"); for (const id of ["fruit", "bfprot", "bfcarb", "bffat"]) { document.querySelector("#" + id + " .choice").click(); await new Promise(r => setTimeout(r, 150)) }' }
].filter(v => !arg('--vistas') || arg('--vistas').split(',').includes(v.id));

const navegador = [arg('--navegador'), process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => p && existsSync(p));
if (!navegador) { console.error('No se encontró Chrome, Chromium ni Edge. Indicá la ruta con --navegador.'); process.exit(2) }

// Servidor local: la app desde la raíz elegida.
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const servidor = createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let archivo = resolve(RAIZ, '.' + ruta);
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + sep)) { res.writeHead(403); return res.end() }
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html');
  if (!existsSync(archivo)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(archivo).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const origen = `http://127.0.0.1:${servidor.address().port}`;

const perfil = await mkdtemp(join(tmpdir(), 'mpf-capturas-'));
const banderas = ['--headless=new', '--remote-debugging-pipe', '--user-data-dir=' + perfil, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];
if (process.platform === 'linux') banderas.push('--no-sandbox', '--disable-dev-shm-usage');
const nav = spawn(navegador, [...banderas, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
const haciaNav = nav.stdio[3], desdeNav = nav.stdio[4];
let siguiente = 0; const pendientes = new Map(), eventos = []; const dec = new StringDecoder('utf8'); let buf = '';
desdeNav.on('data', d => { buf += dec.write(d); let i; while ((i = buf.indexOf('\0')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (m.id && pendientes.has(m.id)) { const p = pendientes.get(m.id); pendientes.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) } else eventos.push(m) } });
const enviar = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++siguiente; pendientes.set(id, { res, rej }); haciaNav.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0') });

// Reloj fijo y azar con semilla en cada carga, para que las capturas sean comparables entre etapas.
const FIJO = `(()=>{const F=new Date(${JSON.stringify(RELOJ)}).getTime(),D=Date;class FD extends D{constructor(...a){if(a.length===0)super(F);else super(...a)}static now(){return F}}FD.UTC=D.UTC;FD.parse=D.parse;window.Date=FD;let s=12345;Math.random=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};})();`;

// Medidas dentro de la página.
const MEDIR = sel => `(() => {
  const objetivo = ${sel ? `document.querySelector(${JSON.stringify(sel)})` : 'null'} || document.querySelector(".screen.is-active") || document.body;
  // checkVisibility descarta también el contenido de los paneles cerrados (Chrome lo oculta sin quitarle la caja).
  const visible = e => { if (!e || !e.getClientRects().length) return false; if (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; const cs = getComputedStyle(e); return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0 };
  const nombre = e => (e.id ? "#" + e.id : e.tagName.toLowerCase() + (typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\\s+/).join(".") : "")) + (e.textContent && e.textContent.trim() ? " «" + e.textContent.trim().replace(/\\s+/g, " ").slice(0, 30) + "»" : "");
  const ir = y => window.scrollTo({ top: y, behavior: "instant" });
  ir(0);
  const palabras = (objetivo.innerText || "").split(/\\s+/).filter(w => /[\\p{L}\\p{N}]/u.test(w)).length;
  // Alto: el del documento o, si la vista tiene scroll propio, el de su contenido (el mayor).
  const alto = Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, objetivo.scrollHeight));
  const pantalla = objetivo.id || (objetivo.closest("[id]") || {}).id || objetivo.tagName.toLowerCase();
  const scrollHorizontal = document.documentElement.scrollWidth > innerWidth + 1;
  // Campos sin etiqueta accesible (label, aria-label, aria-labelledby o title).
  const sinEtiqueta = [...document.querySelectorAll("input,select,textarea")].filter(e => e.type !== "hidden" && visible(e) && !(e.labels && e.labels.length) && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby") && !e.title).map(nombre);
  // Elementos que se salen de la pantalla sin estar dentro de un contenedor con scroll horizontal.
  const fueraDePantalla = [];
  for (const e of objetivo.querySelectorAll("*")) {
    if (!visible(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || (r.right <= innerWidth + 1 && r.left >= -1)) continue;
    let p = e.parentElement, desplazable = false;
    while (p && p !== document.body) { const ox = getComputedStyle(p).overflowX; if (ox === "auto" || ox === "scroll") { desplazable = true; break } p = p.parentElement }
    if (!desplazable) fueraDePantalla.push(nombre(e));
  }
  // Textos cortados: elementos con texto que recortan su contenido (overflow oculto o puntos suspensivos).
  const cortados = [...objetivo.querySelectorAll("button,a,label,summary,h1,h2,h3,h4,p,li,span,strong,small,td,th")].filter(e => {
    if (!visible(e) || !e.textContent.trim()) return false;
    const cs = getComputedStyle(e), recorta = /hidden|clip/.test(cs.overflowX) || cs.textOverflow === "ellipsis";
    return recorta && e.scrollWidth > e.clientWidth + 1;
  }).map(nombre);
  // Selectores cuyo texto elegido no entra (el navegador lo corta sin avisar).
  const regla = document.createElement("canvas").getContext("2d");
  for (const e of objetivo.querySelectorAll("select")) {
    const o = e.options[e.selectedIndex];
    if (!visible(e) || !o || !o.text.trim()) continue;
    const cs = getComputedStyle(e);
    regla.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const util = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (cs.appearance === "none" ? 0 : 22);
    if (regla.measureText(o.text.trim()).width > util + 1) cortados.push("select " + nombre(e) + " «" + o.text.trim().slice(0, 30) + "»");
  }
  // Controles superpuestos:
  //  a) dos controles de la vista que se pisan;
  //  b) con el scroll arriba, un control flotante (no una barra de ancho completo) que tapa un control de la vista;
  //  c) con el scroll al final, cualquier control fijo que sigue tapando un control de la vista (no se puede destapar).
  // No cuentan la barra de pestañas ni el encabezado, que el contenido pasa por debajo al desplazarse.
  const SEL = "button,a[href],input,select,textarea,summary";
  const fijo = e => { for (let p = e; p && p !== document.documentElement; p = p.parentElement) if (getComputedStyle(p).position === "fixed") return p; return null };
  const barra = e => { const f = fijo(e); return !!f && f.getBoundingClientRect().width >= innerWidth * 0.9 };
  const propios = [...objetivo.querySelectorAll(SEL)].filter(e => visible(e) && e.type !== "hidden" && !fijo(e));
  const fijos = [...document.querySelectorAll(SEL)].filter(e => visible(e) && e.type !== "hidden" && fijo(e) && !e.closest("#sectionNav,.app-header") && !objetivo.contains(e));
  // Parte visible de un control: recortada por los contenedores con scroll u overflow oculto (una lista con scroll
  // interno no tapa a nadie con lo que queda escondido). Si no queda nada visible, el control no cuenta.
  const recorte = e => {
    let r = e.getBoundingClientRect(), x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
    for (let p = e.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const q = p.getBoundingClientRect();
      x1 = Math.max(x1, q.left); y1 = Math.max(y1, q.top); x2 = Math.min(x2, q.right); y2 = Math.min(y2, q.bottom);
    }
    return x2 - x1 > 2 && y2 - y1 > 2 ? { left: x1, top: y1, right: x2, bottom: y2 } : null;
  };
  const choca = (a, b) => { const r = recorte(a), s = recorte(b); return !!r && !!s && Math.min(r.right, s.right) - Math.max(r.left, s.left) > 2 && Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top) > 2 };
  const superpuestos = [];
  for (let i = 0; i < propios.length; i++) for (let j = i + 1; j < propios.length; j++) { const a = propios[i], b = propios[j]; if (!a.contains(b) && !b.contains(a) && choca(a, b)) superpuestos.push(nombre(a) + " / " + nombre(b)) }
  for (const f of fijos.filter(f => !barra(f))) for (const n of propios) if (choca(f, n)) superpuestos.push(nombre(f) + " tapa " + nombre(n));
  ir(document.documentElement.scrollHeight);
  for (const f of fijos) for (const n of propios) if (choca(f, n)) superpuestos.push(nombre(f) + " tapa al final " + nombre(n));
  ir(0);
  return { pantalla, alto, palabras, scrollHorizontal, sinEtiqueta, fueraDePantalla, cortados, superpuestos };
})()`;

let codigo = 1;
const medidas = { version, fecha: new Date().toISOString(), viewport: { ancho: ANCHO, alto: ALTO }, reloj: RELOJ, entorno: { sistema: platform() + ' ' + release(), navegador: '' }, vistas: {} };
const limite = setTimeout(() => { console.error('Las capturas tardaron más de 20 minutos.'); terminar(3) }, 20 * 60 * 1000);
async function terminar(c) { clearTimeout(limite); try { await enviar('Browser.close') } catch (e) { } await espera(500); try { nav.kill() } catch (e) { } servidor.close(); await rm(perfil, { recursive: true, force: true }).catch(() => { }); process.exit(c) }
try {
  await mkdir(salida, { recursive: true });
  const respaldo = JSON.parse(await readFile(RESPALDO, 'utf8'));
  medidas.entorno.navegador = (await enviar('Browser.getVersion')).product;
  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const { sessionId: S } = await enviar('Target.attachToTarget', { targetId, flatten: true });
  await enviar('Page.enable', {}, S); await enviar('Runtime.enable', {}, S); await enviar('Network.enable', {}, S);
  await enviar('Network.setBypassServiceWorker', { bypass: true }, S);
  await enviar('Page.addScriptToEvaluateOnNewDocument', { source: FIJO }, S);
  await enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: true }, S);
  const evaluar = async expr => { const r = await enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, S); if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text); return r.result.value };
  const cargar = async () => { const desde = eventos.length; await enviar('Page.navigate', { url: origen + '/index.html' }, S); for (let t = 0; t < 400 && !eventos.slice(desde).some(e => e.method === 'Page.loadEventFired' && e.sessionId === S); t++) await espera(50); await espera(600) };
  // Errores: excepciones, console.error y cualquier pedido a internet (la app solo puede pedir a su propio origen).
  const externo = u => { try { const x = new URL(u); return /^(https?|wss?):$/.test(x.protocol) && x.origin !== origen } catch (e) { return false } };
  const errores = desde => eventos.slice(desde).filter(e => e.sessionId === S && (e.method === 'Runtime.exceptionThrown' || (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') || (e.method === 'Network.requestWillBeSent' && externo(e.params.request.url)))).map(e => e.method === 'Runtime.exceptionThrown' ? (e.params.exceptionDetails.exception ? e.params.exceptionDetails.exception.description.split('\n')[0] : e.params.exceptionDetails.text) : e.method === 'Network.requestWillBeSent' ? 'Pedido a internet: ' + e.params.request.url.slice(0, 120) : e.params.args.map(a => a.value || a.description).join(' '));
  await cargar();
  for (const estado of estados) {
    for (const tema of temas) {
      // Datos del estado, tema y modo; después se recarga la app.
      const datos = estado === 'vacio' ? {} : respaldo.data;
      await evaluar(`(() => { localStorage.clear(); const d = ${JSON.stringify(datos)}; for (const [k, v] of Object.entries(d)) if (v !== null) localStorage.setItem(k, v); localStorage.setItem("miPlatoFacil_theme", ${JSON.stringify(tema === 'oscuro' ? 'dark' : 'light')}); if (${JSON.stringify(estado)} === "todo") localStorage.setItem("miPlatoFacil_uiMode_v1", "completo"); return true })()`);
      await enviar('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema === 'oscuro' ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] }, S);
      const desdeCarga = eventos.length;
      await cargar();
      const erroresCarga = errores(desdeCarga);
      for (const vista of VISTAS) {
        const desde = eventos.length;
        let m;
        try {
          await evaluar(`(async () => { window.scrollTo({ top: 0, behavior: "instant" }); restart(); await new Promise(r => setTimeout(r, 60)); ${vista.ir}; await new Promise(r => setTimeout(r, 250)); ${estado === 'todo' ? `const o = ${vista.medir ? `document.querySelector(${JSON.stringify(vista.medir)})` : 'null'} || document.querySelector(".screen.is-active"); o.querySelectorAll("details").forEach(d => { d.open = true }); await new Promise(r => setTimeout(r, 300)); for (const d of [...o.querySelectorAll("details")].filter(d => !d.open).reverse()) { d.open = true; await new Promise(r => setTimeout(r, 120)) }` : ''} document.querySelectorAll("input,textarea").forEach(e => e.blur()); window.scrollTo({ top: 0, behavior: "instant" }); await new Promise(r => setTimeout(r, 200)); return true })()`);
          m = await evaluar(MEDIR(vista.medir));
        } catch (err) { m = { error: err.message } }
        m.errores = (vista === VISTAS[0] ? erroresCarga : []).concat(errores(desde));
        if (m.error) m.errores.unshift('No se pudo abrir la vista: ' + m.error);
        ((medidas.vistas[vista.id] ||= {})[estado] ||= {})[tema] = m;
        if (conImagenes && !m.error) {
          // Para la imagen, la ventana se estira al alto de la página: así las barras fijas quedan abajo, donde se ven al
          // final del recorrido, y no tapan contenido en el medio de la captura. Las medidas ya se tomaron a 390×844.
          const altoFoto = Math.min(m.alto, 16000);
          await enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: altoFoto, deviceScaleFactor: 1, mobile: true }, S);
          await espera(200);
          const foto = await enviar('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: ANCHO, height: altoFoto, scale: 1 } }, S);
          await enviar('Emulation.setDeviceMetricsOverride', { width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: true }, S);
          await espera(100);
          await writeFile(join(salida, `${vista.id}-${estado}-${tema}.png`), Buffer.from(foto.data, 'base64'));
        }
        console.log(`${vista.id.padEnd(16)} ${estado.padEnd(6)} ${tema.padEnd(6)} alto ${String(m.alto ?? '—').padStart(5)} px · ${String(m.palabras ?? '—').padStart(4)} palabras${m.errores.length ? ' · ERRORES: ' + m.errores.join(' | ') : ''}${m.scrollHorizontal ? ' · SCROLL HORIZONTAL' : ''}`);
      }
    }
  }
  await writeFile(join(salida, 'medidas.json'), JSON.stringify(medidas, null, 2) + '\n');
  console.log(`Medidas en ${join(salida, 'medidas.json')}`);
  codigo = 0;
} catch (e) { console.error('No se pudieron tomar las capturas: ' + e.message); codigo = 2 }
await terminar(codigo);
