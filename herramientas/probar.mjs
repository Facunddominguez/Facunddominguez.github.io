// Corre todas las pruebas automáticas de pruebas/ en un navegador sin ventana (Chrome, Chromium o Edge).
// Uso: node herramientas/probar.mjs [--navegador <ruta>] [--suites a.js,b.js]
// Sirve el repositorio en una dirección local temporal, abre index.html y ejecuta las baterías.
// Las pruebas usan solo datos inventados y un perfil de navegador nuevo que se borra al terminar.
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { StringDecoder } from 'node:string_decoder';

const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const espera = ms => new Promise(r => setTimeout(r, ms));
const version = JSON.parse(await readFile(join(RAIZ, 'fuente', 'version.json'), 'utf8')).version;
const suites = arg('--suites') ? arg('--suites').split(',') : JSON.parse(await readFile(join(RAIZ, 'pruebas', 'suites.json'), 'utf8')).suites;

const navegador = [arg('--navegador'), process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(p => p && existsSync(p));
if (!navegador) { console.error('No se encontró Chrome, Chromium ni Edge. Indicá la ruta con --navegador.'); process.exit(2) }

// Servidor local: la app desde la raíz del repositorio y las pruebas en /tests/.
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const servidor = createServer((req, res) => {
  let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.startsWith('/tests/')) ruta = '/pruebas/' + ruta.slice(7);
  let archivo = resolve(RAIZ, '.' + ruta);
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + sep)) { res.writeHead(403); return res.end() }
  if (existsSync(archivo) && statSync(archivo).isDirectory()) archivo = join(archivo, 'index.html');
  if (!existsSync(archivo)) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(archivo).pipe(res);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const puerto = servidor.address().port;

const perfil = await mkdtemp(join(tmpdir(), 'mpf-pruebas-'));
const banderas = ['--headless=new', '--remote-debugging-pipe', '--user-data-dir=' + perfil, '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'];
if (process.platform === 'linux') banderas.push('--no-sandbox', '--disable-dev-shm-usage');
const nav = spawn(navegador, [...banderas, 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
const haciaNav = nav.stdio[3], desdeNav = nav.stdio[4];
let siguiente = 0; const pendientes = new Map(), eventos = []; const dec = new StringDecoder('utf8'); let buf = '';
desdeNav.on('data', d => { buf += dec.write(d); let i; while ((i = buf.indexOf('\0')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); if (m.id && pendientes.has(m.id)) { const p = pendientes.get(m.id); pendientes.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result) } else eventos.push(m) } });
const enviar = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++siguiente; pendientes.set(id, { res, rej }); haciaNav.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0') });

let codigo = 1;
const limite = setTimeout(() => { console.error('Las pruebas tardaron más de 15 minutos.'); terminar(3) }, 15 * 60 * 1000);
async function terminar(c) { clearTimeout(limite); try { await enviar('Browser.close') } catch (e) { } await espera(500); try { nav.kill() } catch (e) { } servidor.close(); await rm(perfil, { recursive: true, force: true }).catch(() => { }); process.exit(c) }
try {
  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const { sessionId: S } = await enviar('Target.attachToTarget', { targetId, flatten: true });
  await enviar('Page.enable', {}, S); await enviar('Runtime.enable', {}, S);
  const desde = eventos.length;
  await enviar('Page.navigate', { url: `http://127.0.0.1:${puerto}/index.html` }, S);
  for (let t = 0; t < 400 && !eventos.slice(desde).some(e => e.method === 'Page.loadEventFired' && e.sessionId === S); t++) await espera(50);
  await espera(2000);
  const expr = `(async()=>{window.__expectVersion=${JSON.stringify(version)};window.__suites=${JSON.stringify(suites)};return await (0,eval)(await (await fetch("/tests/run_all.js",{cache:"no-store"})).text())})()`;
  const r = await enviar('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, S);
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
  const res = r.result.value;
  console.log(`Mi Plato Fácil ${version} · navegador: ${navegador.split(/[\\/]/).pop()}`);
  for (const s of suites) { console.log(`  ${res[s] || 'sin resultado'}  ${s}`); for (const f of res[s + '_fallas'] || []) console.log('      ' + f) }
  const [ok, total] = String(res.TOTAL).split('/').map(Number);
  console.log(`TOTAL ${res.TOTAL}`);
  const errores = eventos.filter(e => e.method === 'Runtime.exceptionThrown').map(e => e.params.exceptionDetails.exception ? e.params.exceptionDetails.exception.description.split('\n')[0] : e.params.exceptionDetails.text);
  errores.forEach(e => console.log('ERROR en la página: ' + e));
  codigo = ok === total && total > 0 && !errores.length ? 0 : 1;
} catch (e) { console.error('No se pudieron correr las pruebas: ' + e.message); codigo = 2 }
await terminar(codigo);
