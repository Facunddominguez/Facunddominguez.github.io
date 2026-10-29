// Compuerta del modo autónomo del rediseño (docs/plan-rediseno.md, "Modo autónomo").
// Uso: node herramientas/validar-etapa.mjs <N de 0 a 10> [--navegador <ruta>] [--actualizar-linea-base]
// Controla, para la etapa N:
//   1. index.html y sw.js al día con fuente/ (construir.mjs --verificar).
//   2. Todas las pruebas en verde (probar.mjs, siempre todas las baterías) y su cantidad, total y por batería, no menor
//      que la línea base (la mayor entre la de esta rama, la de la rama rediseno y la del tag etapa-0-ok).
//   3. Cada clave miPlatoFacil_* de la línea base sigue en fuente/ y las del respaldo siguen en el respaldo; cada clave
//      nueva entra al respaldo como opcional (COMPLETE_BACKUP_KEYS y COMPLETE_BACKUP_OPTIONAL_KEYS).
//   4. El respaldo de ejemplo no cambió (sha256) y se restaura completo (batería k01).
//   5. Capturas y medidas (capturas.mjs) sin errores de JavaScript ni scroll horizontal en todas las vistas, estados y
//      temas, y los controles de docs/validacion/criterios.json de esta etapa y de las anteriores.
//   6. criterios.json no es más permisivo que en el tag etapa-0-ok (antes de que exista el tag, que en el último commit).
//   7. Sin dominios externos nuevos en fuente/ ni dependencias en la app.
//   8. En la Etapa 0 la app no cambia; desde la 1, si cambió respecto de rediseno, fuente/version.json subió.
// Termina con "VALIDACIÓN ETAPA N: OK" (código 0) o con la lista de fallas y "VALIDACIÓN ETAPA N: FALLÓ" (código 1).
// Código 2: no se pudo validar (uso incorrecto o sin git).
// No escribe archivos versionados: resultados y capturas quedan en capturas/ (ignorada por git). Solo
// --actualizar-linea-base, con todo en verde, reescribe docs/validacion/linea-base.json, y solo para subir conteos de
// pruebas o sumar claves (nunca baja nada ni toca las medidas, el respaldo de ejemplo ni los dominios de la Etapa 0).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
if (!/^(10|[0-9])$/.test(args[0] || '')) { console.error('Uso: node herramientas/validar-etapa.mjs <N de 0 a 10> [--navegador <ruta>] [--actualizar-linea-base]'); process.exit(2) }
const N = Number(args[0]);
const navegador = arg('--navegador') ? ['--navegador', arg('--navegador')] : [];
const actualizar = args.includes('--actualizar-linea-base');
const inicio = Date.now(), minutos = () => ((Date.now() - inicio) / 60000).toFixed(1) + ' min';

const leer = rel => readFileSync(join(RAIZ, rel), 'utf8');
const git = (...a) => spawnSync('git', a, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 256 << 20 });
if (git('rev-parse', '--git-dir').status !== 0) { console.error('La compuerta necesita git y correr dentro del repositorio.'); process.exit(2) }
const existe = ref => git('rev-parse', '--verify', '--quiet', ref + '^{commit}').status === 0;
const desdeGit = (ref, rel) => { const r = git('show', `${ref}:${rel}`); return r.status === 0 ? r.stdout : null };
const jsonDesdeGit = (ref, rel) => { const t = desdeGit(ref, rel); return t === null ? null : JSON.parse(t) };
const nodo = (script, extra) => spawnSync(process.execPath, [join(RAIZ, 'herramientas', script), ...extra], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 256 << 20 });
const ultimas = (r, n = 3) => ((r.stderr || '') + (r.stdout || '')).trim().split('\n').slice(-n).join(' ⏎ ');

const resultados = [];
const control = (ok, texto, detalle) => { resultados.push({ ok: !!ok, texto, detalle }); console.log(`${ok ? '✓' : '✗'} ${texto}${!ok && detalle ? '\n    ' + detalle : ''}`) };
const nota = texto => console.log('· ' + texto);
const unir = (...listas) => [...new Set(listas.flat().filter(Boolean))].sort();

console.log(`Compuerta de la Etapa ${N} · rama ${git('branch', '--show-current').stdout.trim() || '(sin rama)'} · ${git('rev-parse', '--short', 'HEAD').stdout.trim()}`);

// Referencias: el tag etapa-0-ok fija medidas, respaldo de ejemplo, dominios y criterios; las líneas base de la rama, de
// rediseno y del tag fijan los mínimos (siempre el mayor).
const TAG = 'etapa-0-ok';
const hayTag = existe('refs/tags/' + TAG);
if (N >= 1) control(hayTag, `Existe el tag ${TAG}`, 'desde la Etapa 1 la compuerta compara contra ese tag');
const criterios = JSON.parse(leer('docs/validacion/criterios.json'));
const baseRama = JSON.parse(leer('docs/validacion/linea-base.json'));
const baseRediseno = existe('rediseno') ? jsonDesdeGit('rediseno', 'docs/validacion/linea-base.json') : null;
const baseTag = hayTag ? jsonDesdeGit(TAG, 'docs/validacion/linea-base.json') : null;
const fija = baseTag || baseRama;
const bases = [baseTag, baseRediseno, baseRama].filter(Boolean);
const minimos = {};
for (const b of bases) for (const [s, n] of Object.entries(b.pruebas.suites)) minimos[s] = Math.max(minimos[s] || 0, n);
const totalMinimo = Math.max(...bases.map(b => b.pruebas.total));
const clavesBase = unir(...bases.map(b => b.claves));
const clavesRespaldoBase = unir(...bases.map(b => b.clavesRespaldo));
const opcionalesBase = unir(...bases.map(b => b.clavesRespaldoOpcionales));

// 1. Construcción al día
const construir = nodo('construir.mjs', ['--verificar']);
control(construir.status === 0, 'index.html y sw.js al día con fuente/ (construir.mjs --verificar)', ultimas(construir));

// 2. Pruebas: todas, con el detalle de cada una
const carpeta = join(RAIZ, 'capturas');
mkdirSync(carpeta, { recursive: true });
const jsonPruebas = join(carpeta, `etapa-${N}-pruebas.json`);
rmSync(jsonPruebas, { force: true });
nota(`Corriendo todas las pruebas (${minutos()})…`);
const probar = nodo('probar.mjs', ['--json', jsonPruebas, ...navegador]);
writeFileSync(join(carpeta, `etapa-${N}-pruebas.log`), (probar.stdout || '') + (probar.stderr || ''));
let pruebas = null, todas = [];
if (probar.status >= 2 || probar.status === null || !existsSync(jsonPruebas)) control(false, 'Las pruebas corrieron', ultimas(probar));
else {
  pruebas = JSON.parse(readFileSync(jsonPruebas, 'utf8'));
  todas = Object.entries(pruebas.suites).flatMap(([s, r]) => r.pruebas.map(p => ({ ...p, suite: s })));
  const incompletas = Object.entries(pruebas.suites).filter(([, r]) => { const m = /^(\d+)\/(\d+)$/.exec(r.resultado || ''); return !m || r.pruebas.length !== Number(m[2]) || r.pruebas.filter(p => p.ok).length !== Number(m[1]) }).map(([s]) => s);
  control(todas.length > 0 && !incompletas.length && pruebas.total === `${todas.filter(p => p.ok).length}/${todas.length}`, 'Resultados de las pruebas completos', 'incompletas: ' + incompletas.join(', '));
  const fallas = todas.filter(p => !p.ok);
  control(probar.status === 0 && !fallas.length && !pruebas.erroresPagina.length, `Todas las pruebas en verde (${todas.length - fallas.length}/${todas.length})`,
    [...fallas.slice(0, 10).map(p => `${p.suite}: ${p.texto.slice(0, 160)}`), ...pruebas.erroresPagina.slice(0, 3).map(e => 'error en la página: ' + e)].join('\n    '));
  const faltan = Object.keys(minimos).filter(s => !pruebas.suites[s]);
  control(!faltan.length, `Están las ${Object.keys(minimos).length} baterías de la línea base`, 'faltan: ' + faltan.join(', '));
  const bajan = Object.entries(minimos).filter(([s, n]) => pruebas.suites[s] && pruebas.suites[s].pruebas.length < n).map(([s, n]) => `${s}: ${pruebas.suites[s].pruebas.length} < ${n}`);
  control(!bajan.length && todas.length >= totalMinimo, `La cantidad de pruebas no baja: ${todas.length} (mínimo ${totalMinimo}), y ninguna batería tiene menos que en la línea base`, bajan.join(', ') || `total ${todas.length} < ${totalMinimo}`);
}

// 3. Claves de localStorage y respaldo
const codigo = readdirSync(join(RAIZ, 'fuente', 'codigo')).sort().map(f => leer('fuente/codigo/' + f)).join('\n');
const clavesAhora = new Set([...codigo.matchAll(/["'`](miPlatoFacil_[A-Za-z0-9_]+)["'`]/g)].map(m => m[1]));
const lista = nombre => { const m = new RegExp('const\\s+' + nombre + '\\s*=\\s*\\[([^\\]]*)\\]').exec(codigo); return m ? [...m[1].matchAll(/["'](miPlatoFacil_[A-Za-z0-9_]+)["']/g)].map(x => x[1]) : [] };
const enRespaldo = lista('COMPLETE_BACKUP_KEYS'), opcionales = lista('COMPLETE_BACKUP_OPTIONAL_KEYS');
const perdidas = clavesBase.filter(k => !clavesAhora.has(k));
control(!perdidas.length, `Siguen las ${clavesBase.length} claves miPlatoFacil_* de la línea base`, 'faltan: ' + perdidas.join(', '));
const fueraDelRespaldo = clavesRespaldoBase.filter(k => !enRespaldo.includes(k));
control(!fueraDelRespaldo.length, `Las ${clavesRespaldoBase.length} claves del respaldo siguen en el respaldo`, 'faltan: ' + fueraDelRespaldo.join(', '));
const nuevas = [...clavesAhora].filter(k => !clavesBase.includes(k)).sort();
const nuevasSinRespaldo = nuevas.filter(k => !enRespaldo.includes(k) || !opcionales.includes(k));
control(!nuevasSinRespaldo.length, nuevas.length ? `Las claves nuevas entran al respaldo como opcionales: ${nuevas.join(', ')}` : 'Sin claves nuevas', 'fuera del respaldo o no opcionales: ' + nuevasSinRespaldo.join(', '));

// 4. Respaldo de ejemplo
let sha = null;
try { sha = createHash('sha256').update(readFileSync(join(RAIZ, fija.respaldoEjemplo.archivo))).digest('hex') } catch (e) { }
control(sha === fija.respaldoEjemplo.sha256, `El respaldo de ejemplo no cambió (${fija.respaldoEjemplo.archivo})`, sha ? 'sha256 ' + sha : 'no se pudo leer');
const k01 = pruebas && pruebas.suites['k01_respaldo_ejemplo.js'];
control(k01 && k01.pruebas.length >= 6 && k01.pruebas.every(p => p.ok), 'El respaldo de ejemplo se restaura completo (k01)', k01 ? k01.pruebas.filter(p => !p.ok).map(p => p.texto).join(' | ') : 'no corrió k01');

// 5. Capturas, medidas y controles de criterios.json
const salida = join(carpeta, `etapa-${N}`);
rmSync(join(salida, 'medidas.json'), { force: true });
nota(`Tomando capturas y medidas en ${relative(RAIZ, salida)} (${minutos()})…`);
const cap = nodo('capturas.mjs', ['--salida', salida, ...navegador]);
writeFileSync(join(carpeta, `etapa-${N}-capturas.log`), (cap.stdout || '') + (cap.stderr || ''));
let medidas = null;
if (cap.status !== 0 || !existsSync(join(salida, 'medidas.json'))) control(false, 'Se tomaron las capturas y medidas', ultimas(cap));
else medidas = JSON.parse(readFileSync(join(salida, 'medidas.json'), 'utf8'));
const temas = unir(criterios.generales.temas, ['claro', 'oscuro']), estados = unir(criterios.generales.estados, ['vacio', 'normal', 'todo']);
const celdas = [];
if (medidas) {
  for (const [v, es] of Object.entries(medidas.vistas)) for (const [e, ts] of Object.entries(es)) for (const [t, m] of Object.entries(ts)) celdas.push({ v, e, t, m });
  const faltantes = Object.keys(fija.medidasEtapa0.vistas).flatMap(v => estados.flatMap(e => temas.map(t => medidas.vistas[v] && medidas.vistas[v][e] && medidas.vistas[v][e][t] ? null : `${v}/${e}/${t}`))).filter(Boolean);
  control(!faltantes.length, `Se midieron las ${Object.keys(fija.medidasEtapa0.vistas).length} vistas de la línea base en ${estados.length} estados y ${temas.length} temas (${celdas.length} capturas)`, 'faltan: ' + faltantes.join(', '));
  const conErrores = celdas.filter(c => c.m.error || (c.m.errores && c.m.errores.length));
  control(!conErrores.length, 'Sin errores de JavaScript en ninguna captura', conErrores.slice(0, 6).map(c => `${c.v}/${c.e}/${c.t}: ${(c.m.errores || [c.m.error]).join(' | ').slice(0, 200)}`).join('\n    '));
  const conScroll = celdas.filter(c => c.m.scrollHorizontal);
  control(!conScroll.length, 'Sin scroll horizontal en ninguna captura', conScroll.map(c => `${c.v}/${c.e}/${c.t}`).join(', '));
}
const valor = (m, metrica) => { if (!m) return null; const x = m[metrica]; return Array.isArray(x) ? x.length : typeof x === 'number' ? x : typeof x === 'boolean' ? Number(x) : null };
const OPERADORES = { '<=': (a, b) => a <= b, '<': (a, b) => a < b, '>=': (a, b) => a >= b, '>': (a, b) => a > b, '==': (a, b) => a === b };
const base0 = (v, e, t, metrica) => valor(fija.medidasEtapa0.vistas[v] && fija.medidasEtapa0.vistas[v][e] && fija.medidasEtapa0.vistas[v][e][t], metrica);
const umbral = (c, v, e, t) => typeof c.umbral === 'number' ? c.umbral : c.umbral && typeof c.umbral.relativoAEtapa0 === 'number' && base0(v, e, t, c.metrica) !== null ? base0(v, e, t, c.metrica) * c.umbral.relativoAEtapa0 : null;
const redondo = x => Math.round(x * 10) / 10;
const registro = leer('docs/plan-rediseno.md');
const seccionDelRegistro = nombre => {
  const desde = registro.indexOf('\n## Registro');
  if (desde < 0) return null;
  const lineas = registro.slice(desde).split('\n'), i = lineas.findIndex(l => l.startsWith('### ' + nombre + ' ') || l.trim() === '### ' + nombre);
  if (i < 0) return null;
  const fin = lineas.findIndex((l, j) => j > i && /^#{2,3} /.test(l));
  return lineas.slice(i, fin < 0 ? undefined : fin);
};
const aplican = criterios.controles.filter(c => c.etapa <= N), despues = criterios.controles.filter(c => c.etapa > N);
nota(`Controles de criterios.json para la Etapa ${N}: ${aplican.length} (${despues.length} aplican en etapas siguientes)`);
for (const c of aplican) {
  const titulo = `${c.id} (etapa ${c.etapa}): ${c.hecho}`;
  if (c.tipo === 'medida') {
    const partes = temas.map(t => { const x = valor(medidas && medidas.vistas[c.vista] && medidas.vistas[c.vista][c.estado] && medidas.vistas[c.vista][c.estado][t], c.metrica), u = umbral(c, c.vista, c.estado, t); return { t, x, u, ok: x !== null && u !== null && OPERADORES[c.operador] && OPERADORES[c.operador](x, u) } });
    control(partes.every(p => p.ok), `${titulo} · ${c.vista}/${c.estado} ${c.metrica}: ${partes.map(p => `${p.t} ${p.x ?? '—'} ${c.operador} ${p.u === null ? '—' : redondo(p.u)}`).join(', ')}`, 'no se cumple');
  } else if (c.tipo === 'medida-todas') {
    const malas = medidas ? celdas.filter(x => { const y = valor(x.m, c.metrica); return y === null || !OPERADORES[c.operador] || !OPERADORES[c.operador](y, c.umbral) }) : [{ v: 'sin medidas', e: '', t: '' }];
    control(!malas.length, `${titulo} · ${c.metrica} ${c.operador} ${c.umbral} en las ${celdas.length} capturas`, malas.slice(0, 12).map(x => `${x.v}/${x.e}/${x.t}: ${valor(x.m, c.metrica)}`).join(', '));
  } else if (c.tipo === 'prueba') {
    const suyas = todas.filter(p => p.texto.startsWith(c.prueba + ' '));
    control(suyas.length > 0 && suyas.every(p => p.ok), `${titulo} · ${suyas.length} prueba(s) ${c.prueba}`, suyas.length ? suyas.filter(p => !p.ok).map(p => p.texto.slice(0, 200)).join(' | ') : `no existe ninguna prueba que empiece con "${c.prueba} "`);
  } else if (c.tipo === 'comando') {
    const r = spawnSync(c.comando, { cwd: RAIZ, encoding: 'utf8', shell: true, maxBuffer: 64 << 20 });
    control(r.status === 0, `${titulo} · \`${c.comando}\``, `código ${r.status}: ${ultimas(r)}`);
  } else if (c.tipo === 'registro') {
    const lineas = seccionDelRegistro(c.seccion);
    const sinNombrar = lineas ? c.debeNombrar.filter(x => !lineas.some(l => l.toLowerCase().includes(x.toLowerCase()) && (l.includes('✅') || l.includes('Decisión')))) : c.debeNombrar;
    control(lineas && !sinNombrar.length, `${titulo} · sección "${c.seccion}" del Registro`, lineas ? 'sin ✅ ni "Decisión": ' + sinNombrar.join(', ') : `no está la sección "### ${c.seccion}" en el Registro`);
  } else if (c.tipo === 'revisor') nota(`${titulo} · lo juzga ${c.revisor} (no lo mide la compuerta)`);
  else control(false, titulo, 'tipo de control desconocido: ' + c.tipo);
}

// 6. criterios.json no más permisivo que la referencia
const refCriterios = hayTag ? jsonDesdeGit(TAG, 'docs/validacion/criterios.json') : jsonDesdeGit('HEAD', 'docs/validacion/criterios.json');
if (!refCriterios) { if (N >= 1) control(false, 'criterios.json tiene referencia', `no está en el tag ${TAG}`); else nota('criterios.json todavía no tiene referencia: no está en el tag etapa-0-ok ni en el último commit') }
else {
  const flojos = [], porId = new Map(criterios.controles.map(c => [c.id, c]));
  const celdasDe = c => c.tipo === 'medida' ? temas.map(t => [c.vista, c.estado, t]) : Object.entries(fija.medidasEtapa0.vistas).flatMap(([v, es]) => Object.entries(es).flatMap(([e, ts]) => Object.keys(ts).map(t => [v, e, t])));
  for (const r of refCriterios.controles) {
    const c = porId.get(r.id);
    if (!c) { flojos.push(`${r.id}: se quitó`); continue }
    if (!(c.etapa <= r.etapa)) flojos.push(`${r.id}: pasó de la etapa ${r.etapa} a la ${c.etapa}`);
    for (const campo of ['tipo', 'vista', 'estado', 'metrica', 'operador', 'prueba', 'comando', 'seccion', 'revisor']) if (JSON.stringify(c[campo]) !== JSON.stringify(r[campo])) flojos.push(`${r.id}: cambió ${campo} (${JSON.stringify(r[campo])} → ${JSON.stringify(c[campo])})`);
    if (r.debeNombrar && !r.debeNombrar.every(x => (c.debeNombrar || []).includes(x))) flojos.push(`${r.id}: debeNombrar perdió ítems`);
    if (r.umbral !== undefined && c.operador === r.operador) {
      const masLaxo = celdasDe(r).some(([v, e, t]) => {
        const a = typeof r.umbral === 'number' ? r.umbral : umbral(r, v, e, t), b = typeof c.umbral === 'number' ? c.umbral : umbral(c, v, e, t);
        if (a === null) return false;
        if (b === null) return true;
        return r.operador.startsWith('<') ? b > a : r.operador.startsWith('>') ? b < a : b !== a;
      });
      if (masLaxo) flojos.push(`${r.id}: umbral más laxo (${JSON.stringify(r.umbral)} → ${JSON.stringify(c.umbral)})`);
    }
  }
  const g = criterios.generales || {}, gr = refCriterios.generales || {};
  if (gr.sinErroresJs && !g.sinErroresJs) flojos.push('generales: sinErroresJs');
  if (gr.sinScrollHorizontal && !g.sinScrollHorizontal) flojos.push('generales: sinScrollHorizontal');
  for (const k of ['temas', 'estados']) if (!(gr[k] || []).every(x => (g[k] || []).includes(x))) flojos.push('generales: ' + k);
  control(!flojos.length, `criterios.json no es más permisivo que en ${hayTag ? 'el tag ' + TAG : 'el último commit (todavía no existe el tag ' + TAG + ')'}: ${refCriterios.controles.length} controles de referencia, ${criterios.controles.length} ahora`, flojos.join('\n    '));
}

// 7. Dominios externos y dependencias de la app
const dominios = new Map(), dependencias = [];
(function recorrer(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const archivo = join(dir, e.name), rel = relative(RAIZ, archivo).replace(/\\/g, '/');
    if (e.isDirectory()) { recorrer(archivo); continue }
    const texto = readFileSync(archivo, 'utf8');
    for (const m of texto.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) if (!dominios.has(m[1].toLowerCase())) dominios.set(m[1].toLowerCase(), rel);
    texto.split('\n').forEach((l, i) => {
      if (/^\s*import\s+[\w{*"']|\bimport\s*\(|\brequire\s*\(|\bimportScripts\s*\(|<script[^>]*\bsrc\s*=|<link[^>]*rel=["']?(stylesheet|modulepreload|preload)/.test(l)) dependencias.push(`${rel}:${i + 1}`);
    });
  }
})(join(RAIZ, 'fuente'));
const dominiosNuevos = [...dominios.keys()].filter(d => !fija.dominios.includes(d));
control(!dominiosNuevos.length, `Sin dominios externos nuevos en fuente/ (hay ${dominios.size}: ${[...dominios.keys()].sort().join(', ')})`, dominiosNuevos.map(d => `${d} en ${dominios.get(d)}`).join(', '));
if (existsSync(join(RAIZ, 'package.json'))) { const pj = JSON.parse(leer('package.json')); for (const k of ['dependencies', 'peerDependencies', 'optionalDependencies']) if (pj[k] && Object.keys(pj[k]).length) dependencias.push('package.json: ' + k) }
control(!dependencias.length, 'Sin dependencias en la app (import, require, importScripts, scripts o estilos externos, package.json)', dependencias.slice(0, 10).join(', '));

// 8. Versión de la app
const version = JSON.parse(leer('fuente/version.json')).version;
if (existe('rediseno')) {
  const cambios = git('diff', '--name-only', 'rediseno', '--', 'fuente', ':(exclude)fuente/version.json').stdout.trim().split('\n').filter(Boolean)
    .concat(git('ls-files', '--others', '--exclude-standard', '--', 'fuente').stdout.trim().split('\n').filter(Boolean));
  const anterior = (jsonDesdeGit('rediseno', 'fuente/version.json') || {}).version || '0.0.0';
  const mayor = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false };
  if (N === 0) control(!cambios.length && version === anterior, `La app no cambia en la Etapa 0 (fuente/ igual que en rediseno, versión ${version})`, cambios.slice(0, 8).join(', '));
  else if (cambios.length) control(mayor(version, anterior), `La app cambió (${cambios.length} archivos de fuente/) y la versión subió: ${anterior} → ${version}`, 'subí fuente/version.json (regla 4)');
  else nota(`La app no cambió respecto de rediseno (versión ${version})`);
}

// Resultado
const fallas = resultados.filter(r => !r.ok);
console.log('');
if (fallas.length) {
  console.log(`Fallas (${fallas.length}):`);
  for (const f of fallas) console.log(`  ✗ ${f.texto}${f.detalle ? '\n      ' + f.detalle.replace(/\n\s*/g, '\n      ') : ''}`);
  console.log(`VALIDACIÓN ETAPA ${N}: FALLÓ (${fallas.length} de ${resultados.length} controles, ${minutos()})`);
  process.exit(1);
}
if (actualizar) {
  const suites = { ...baseRama.pruebas.suites };
  for (const [s, r] of Object.entries(pruebas.suites)) suites[s] = Math.max(suites[s] || 0, r.pruebas.length, minimos[s] || 0);
  const nueva = { ...baseRama, pruebas: { total: Object.values(suites).reduce((a, b) => a + b, 0), suites },
    claves: unir(clavesBase, [...clavesAhora]), clavesRespaldo: unir(clavesRespaldoBase, nuevas), clavesRespaldoOpcionales: unir(opcionalesBase, nuevas),
    actualizada: { etapa: N, version, fecha: new Date().toISOString().slice(0, 10) } };
  nueva.clavesSoloDelDispositivo = nueva.claves.filter(k => !nueva.clavesRespaldo.includes(k));
  writeFileSync(join(RAIZ, 'docs', 'validacion', 'linea-base.json'), JSON.stringify(nueva, null, 2) + '\n');
  nota(`Línea base actualizada: ${nueva.pruebas.total} pruebas, ${nueva.claves.length} claves (antes ${baseRama.pruebas.total} y ${baseRama.claves.length})`);
}
console.log(`VALIDACIÓN ETAPA ${N}: OK (${resultados.length} controles, ${minutos()})`);
process.exit(0);
