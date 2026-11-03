// Actualiza datos/precios.json desde el archivo de precios promedio de INDEC (IPC, "precios promedio de una selección de
// alimentos según regiones"): un .xls binario (BIFF8 dentro de un contenedor OLE) con las hojas "Nacional" y "GBA".
// Uso: node herramientas/actualizar-precios.mjs [--archivo ruta.xls] [--salida ruta.json] [--hoy AAAA-MM-DD]
//      node herramientas/actualizar-precios.mjs --verificar [--archivo-json ruta.json]   (sin red)
// - Sin --archivo baja el .xls a una carpeta temporal nueva (fuera del repositorio) y lo trata como dato no confiable: se
//   lee como bytes, nunca se ejecuta nada de lo que trae.
// - Procesa, arma el JSON, lo valida y recién entonces lo escribe (de forma atómica). Si algo falla sale con código 1 y
//   deja datos/precios.json como estaba: se conserva el último archivo.
// - Sin dependencias: requiere Node 18 o superior. El lector del .xls es mínimo y solo sirve para este archivo.
import { readFile, writeFile, rename, mkdtemp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from "node:url";

const RAIZ = new URL('../', import.meta.url);
const DESCARGA = 'https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls';
const INFORME = 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31';
const REGIONES = ['GBA', 'Pampeana', 'Noreste', 'Noroeste', 'Cuyo', 'Patagonia'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MAX_BYTES = 5 * 1024 * 1024;
const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const ruta = rel => new URL(rel, RAIZ);
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const redondeo = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

// ---------- Lector mínimo de OLE + BIFF8 ----------
function leerOle(buf) {
  if (buf.length < 512 || buf.readUInt32BE(0) !== 0xD0CF11E0) throw new Error('El archivo no es un .xls (cabecera OLE ausente)');
  const u32 = o => buf.readUInt32LE(o), u16 = o => buf.readUInt16LE(o);
  const ss = 1 << u16(30), mss = 1 << u16(32), FIN = 0xFFFFFFFA;
  if (ss !== 512 && ss !== 4096) throw new Error('Tamaño de sector OLE inesperado');
  const nFat = u32(44), dirIni = u32(48), corte = u32(56), miniIni = u32(60), difIni = u32(68), nDif = u32(72);
  const sec = i => { const o = (i + 1) * ss; if (o + ss > buf.length) throw new Error('Sector OLE fuera del archivo'); return buf.subarray(o, o + ss) };
  const difat = [];
  for (let i = 0; i < 109; i++) { const v = u32(76 + i * 4); if (v < FIN) difat.push(v) }
  for (let d = difIni, k = 0; k < nDif && d < FIN; k++) { const s = sec(d); for (let i = 0; i < ss / 4 - 1; i++) { const v = s.readUInt32LE(i * 4); if (v < FIN) difat.push(v) } d = s.readUInt32LE(ss - 4) }
  const fat = [];
  for (const f of difat.slice(0, nFat)) { const s = sec(f); for (let i = 0; i < ss / 4; i++) fat.push(s.readUInt32LE(i * 4)) }
  const cadena = (ini, tabla, get) => { const out = []; let c = ini, n = 0; while (c < FIN) { out.push(get(c)); c = tabla[c]; if (c === undefined || ++n > 1e6) throw new Error('Cadena de sectores OLE inválida') } return Buffer.concat(out) };
  const dir = cadena(dirIni, fat, sec), ents = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) { const nl = dir.readUInt16LE(o + 64); ents.push({ name: dir.toString('utf16le', o, o + Math.max(0, nl - 2)), type: dir[o + 66], start: dir.readUInt32LE(o + 116), size: dir.readUInt32LE(o + 120) }) }
  const raiz = ents[0];
  const mini = [], miniBuf = miniIni < FIN ? cadena(miniIni, fat, sec) : Buffer.alloc(0);
  for (let i = 0; i < miniBuf.length; i += 4) mini.push(miniBuf.readUInt32LE(i));
  const miniStream = raiz.size ? cadena(raiz.start, fat, sec) : Buffer.alloc(0);
  const leer = e => e.size < corte
    ? cadena(e.start, mini, c => miniStream.subarray(c * mss, (c + 1) * mss)).subarray(0, e.size)
    : cadena(e.start, fat, sec).subarray(0, e.size);
  const libro = ents.find(e => e.type === 2 && (e.name === 'Workbook' || e.name === 'Book'));
  if (!libro) throw new Error('El .xls no tiene el flujo "Workbook"');
  return leer(libro);
}
// Devuelve [{ nombre, celdas: Map("fila,columna" -> número | texto) }]
function leerLibro(wb) {
  const recs = []; // registros BIFF con su posición
  for (let o = 0; o + 4 <= wb.length;) { const id = wb.readUInt16LE(o), len = wb.readUInt16LE(o + 2); if (o + 4 + len > wb.length) break; recs.push({ id, d: wb.subarray(o + 4, o + 4 + len), o }); o += 4 + len }
  const sst = [], hojas = [];
  const rk = v => { let n; if (v & 2) n = v >> 2; else { const b = Buffer.alloc(8); b.writeUInt32LE((v & 0xFFFFFFFC) >>> 0, 4); n = b.readDoubleLE(0) } return v & 1 ? n / 100 : n };
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.id === 0x00FC) { // SST con sus CONTINUE
      const trozos = [r.d]; for (let j = i + 1; j < recs.length && recs[j].id === 0x003C; j++) trozos.push(recs[j].d);
      const total = r.d.readUInt32LE(4); let ci = 0, pos = 8;
      const actual = () => trozos[ci];
      const pasar = () => { if (pos >= actual().length && ci < trozos.length - 1) { ci++; pos = 0; return true } return false };
      for (let k = 0; k < total; k++) {
        pasar(); if (pos + 3 > actual().length) break;
        const cch = actual().readUInt16LE(pos); pos += 2; const fl = actual()[pos++]; let rt = 0, ex = 0;
        if (fl & 8) { rt = actual().readUInt16LE(pos); pos += 2 } if (fl & 4) { ex = actual().readUInt32LE(pos); pos += 4 }
        let ancho = fl & 1, resto = cch, s = '';
        while (resto > 0) {
          if (pos >= actual().length) { if (ci >= trozos.length - 1) break; ci++; pos = 0; ancho = actual()[pos++] & 1 }
          const bytes = ancho ? 2 : 1, n = Math.min(resto, Math.floor((actual().length - pos) / bytes));
          s += ancho ? actual().toString('utf16le', pos, pos + n * 2) : actual().toString('latin1', pos, pos + n);
          pos += n * bytes; resto -= n;
        }
        pos += rt * 4 + ex; sst.push(s);
      }
    }
    if (r.id === 0x0085) { const cch = r.d[6], fl = r.d[7]; hojas.push({ off: r.d.readUInt32LE(0), nombre: fl & 1 ? r.d.toString('utf16le', 8, 8 + cch * 2) : r.d.toString('latin1', 8, 8 + cch) }) }
  }
  return hojas.map(h => {
    const celdas = new Map(), pon = (f, c, v) => celdas.set(f + ',' + c, v);
    let i = recs.findIndex(r => r.o === h.off);
    if (i < 0) throw new Error(`Hoja "${h.nombre}" fuera del archivo`);
    for (i++; i < recs.length && recs[i].id !== 0x000A; i++) {
      const { id, d } = recs[i];
      if (id === 0x00FD) pon(d.readUInt16LE(0), d.readUInt16LE(2), sst[d.readUInt32LE(6)]);
      else if (id === 0x0203) pon(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
      else if (id === 0x027E) pon(d.readUInt16LE(0), d.readUInt16LE(2), rk(d.readUInt32LE(6)));
      else if (id === 0x00BD) { const f = d.readUInt16LE(0), c1 = d.readUInt16LE(2), c2 = d.readUInt16LE(d.length - 2); for (let c = c1, p = 4; c <= c2; c++, p += 6) pon(f, c, rk(d.readUInt32LE(p + 2))) }
      else if (id === 0x0006 && !(d[12] === 0xFF && d[13] === 0xFF)) pon(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
      else if (id === 0x0204) { const cch = d.readUInt16LE(6); pon(d.readUInt16LE(0), d.readUInt16LE(2), d[8] & 1 ? d.toString('utf16le', 9, 9 + cch * 2) : d.toString('latin1', 9, 9 + cch)) }
    }
    return { nombre: h.nombre, celdas };
  });
}

// ---------- Interpretación de las hojas ----------
// Columnas de meses: el año se arrastra desde la última celda con "Año NNNN" o un número de 4 cifras.
function columnasMes(celdas, filaAnio, primera) {
  const cols = []; let anio = null;
  for (let c = primera; c < 400; c++) {
    const a = celdas.get(filaAnio + ',' + c), m = norm(celdas.get((filaAnio + 1) + ',' + c));
    if (a !== undefined) { const t = /(\d{4})/.exec(String(a)); if (t) anio = Number(t[1]) }
    const mes = MESES.indexOf(m);
    if (mes >= 0 && anio) cols.push({ c, anio, mes: mes + 1, clave: anio * 100 + mes + 1 });
  }
  if (cols.length < 12) throw new Error('No se reconocieron las columnas de meses del encabezado');
  return cols;
}
function leerHoja(hoja, { primeraCol, regionCol }) {
  const { celdas } = hoja, texto = (f, c) => { const v = celdas.get(f + ',' + c); return typeof v === 'string' ? v : '' };
  let enc = -1; for (let f = 0; f < 15; f++) if (['región', 'region', 'variedad'].includes(norm(texto(f, 0)))) { enc = f; break }
  if (enc < 0) throw new Error(`Hoja "${hoja.nombre}": no se encontró el encabezado "Región" o "Variedad"`);
  const cols = columnasMes(celdas, enc, primeraCol), filas = new Map();
  for (let f = enc + 3; f < enc + 200; f++) {
    const region = regionCol ? texto(f, 0).trim() : 'GBA', producto = norm(texto(f, regionCol ? 1 : 0)), unidad = norm(texto(f, regionCol ? 2 : 1));
    if (!producto) { if (!texto(f, 0).trim() && f > enc + 5 && !celdas.has(f + ',' + primeraCol)) continue; else continue }
    if (regionCol && !REGIONES.includes(region)) continue;
    const valores = new Map(); for (const k of cols) { const v = celdas.get(f + ',' + k.c); if (typeof v === 'number' && Number.isFinite(v)) valores.set(k.clave, v) }
    filas.set(region + '|' + producto, { unidad, valores });
  }
  return { cols, filas };
}

// ---------- Armado ----------
export function armar(libro, mapa, hoy) {
  const porNombre = n => libro.find(h => norm(h.nombre) === norm(n));
  const hn = porNombre('Nacional'), hg = porNombre('GBA');
  if (!hn) throw new Error('El .xls no tiene la hoja "Nacional"'); if (!hg) throw new Error('El .xls no tiene la hoja "GBA"');
  const nac = leerHoja(hn, { primeraCol: 3, regionCol: true }), gba = leerHoja(hg, { primeraCol: 2, regionCol: false });
  const clavesNac = new Set(nac.cols.map(k => k.clave)), ultima = Math.max(...gba.cols.map(k => k.clave).filter(k => clavesNac.has(k)));
  const meses = [...clavesNac].filter(k => k < ultima).sort((a, b) => a - b), previa = meses.at(-1);
  const items = [];
  const buscar = (hoja, region, [producto, unidad], ingrediente, nombreHoja) => {
    const f = hoja.filas.get(region + '|' + norm(producto));
    if (!f) throw new Error(`Falta el producto "${producto}" en la hoja ${nombreHoja} de INDEC (se usa para "${ingrediente}")`);
    if (f.unidad !== norm(unidad)) throw new Error(`INDEC cambió la unidad de "${producto}" (${nombreHoja}): ahora "${f.unidad}" y se esperaba "${norm(unidad)}"`);
    const v = f.valores.get(ultima), p = f.valores.get(previa);
    if (!(v > 0)) throw new Error(`"${producto}" (${nombreHoja}, ${region}) no tiene precio en el último mes (${ultima})`);
    if (p > 0 && (v / p > 3 || v / p < 1 / 3)) throw new Error(`"${producto}" (${nombreHoja}, ${region}) cambió más de 3 veces contra el mes anterior (${p} → ${v}): se revisa a mano`);
    return v;
  };
  for (const m of mapa.items) {
    const o = { n: m.n, b: m.b, i: m.gba[0], p: {} };
    o.p.GBA = redondeo(buscar(gba, 'GBA', m.gba, m.n, 'GBA') / m.envase);
    if (m.nac) for (const r of REGIONES) {
      const v = buscar(nac, r, m.nac, m.n, 'Nacional');
      if (r === 'GBA' && Math.abs(v - buscar(gba, 'GBA', m.gba, m.n, 'GBA')) > 0.01) throw new Error(`"${m.nac[0]}" no coincide entre las hojas GBA y Nacional`);
      o.p[r] = redondeo(v / m.envase);
    }
    if (m.aprox) o.a = true;
    if (m.densidad) o.d = m.densidad;
    items.push(o);
  }
  const mes = String(Math.floor(ultima / 100)) + '-' + String(ultima % 100).padStart(2, '0');
  return {
    version: 1, revisado: hoy, mes,
    fuente: {
      nombre: 'INDEC · Precios promedio de una selección de alimentos, bebidas y otros artículos de la canasta del IPC, según regiones',
      informe: INFORME, url: DESCARGA,
      atribucion: 'Fuente: INDEC, Dirección Nacional de Estadísticas de Precios, Dirección de Índices de Precios de Consumo.',
      nota: 'Son precios promedio para un conjunto de bienes de la canasta. Comparar regiones puede no ser válido porque los productos no tienen especificaciones armonizadas. Son aproximados: no son los precios de tu comercio.',
    },
    regiones: REGIONES, items,
  };
}

// ---------- Validación (sin red) ----------
export async function catalogoNutricion() {
  return new Set(JSON.parse(await readFile(ruta('datos/nutricion.json'), 'utf8')).items.map(i => i.n));
}
export function validar(d, { catalogo, mapa = null, hoy = new Date().toISOString().slice(0, 10) }) {
  const e = [], url = u => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u) && u.length < 300, txt = (s, max) => typeof s === 'string' && s.trim() && s.length <= max;
  if (!d || typeof d !== 'object') return ['No es un objeto'];
  if (d.version !== 1) e.push('version debe ser 1');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.mes || '')) e.push('mes con formato AAAA-MM'); else if (d.mes > hoy.slice(0, 7)) e.push('mes en el futuro: ' + d.mes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.revisado || '')) e.push('revisado con formato AAAA-MM-DD');
  const f = d.fuente || {};
  if (!txt(f.nombre, 300) || !txt(f.atribucion, 400) || !txt(f.nota, 600)) e.push('fuente sin nombre, atribución o nota');
  if (!url(f.informe) || !url(f.url)) e.push('fuente sin enlaces https al informe y al archivo');
  if (!Array.isArray(d.regiones) || !d.regiones.includes('GBA') || d.regiones.some(r => !REGIONES.includes(r))) e.push('regiones inválidas (GBA es obligatoria)');
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 500) return [...e, 'items vacío o demasiado grande'];
  const vistos = new Set();
  for (const it of d.items) {
    const n = it && it.n; if (typeof n !== 'string') { e.push('ítem sin nombre'); continue }
    if (vistos.has(n)) e.push('repetido: ' + n); vistos.add(n);
    if (!catalogo.has(n)) e.push(`"${n}" no está en el catálogo de nutrición`);
    if (!['kg', 'l', 'unidad'].includes(it.b)) e.push(`"${n}": unidad base inválida`);
    if (!it.p || typeof it.p !== 'object' || !(it.p.GBA > 0)) e.push(`"${n}": falta el precio de GBA`);
    for (const [r, v] of Object.entries(it.p || {})) if (!REGIONES.includes(r) || !d.regiones.includes(r) || !Number.isFinite(v) || !(v > 0) || v >= 1e7) e.push(`"${n}": precio inválido en ${r}`);
  }
  if (mapa) for (const m of mapa.items) {
    const it = d.items.find(x => x.n === m.n);
    if (!it) e.push(`Falta "${m.n}" (está en precios-mapa.json)`);
    else if (m.nac && REGIONES.some(r => !(it.p[r] > 0))) e.push(`"${m.n}": faltan regiones`);
  }
  return e;
}
export function validarMapa(mapa, catalogo) {
  const e = [], vistos = new Set();
  if (!mapa || !Array.isArray(mapa.items) || !mapa.items.length) return ['precios-mapa.json sin ítems'];
  for (const m of mapa.items) {
    if (!catalogo.has(m.n)) e.push(`mapa: "${m.n}" no está en el catálogo de nutrición`);
    if (vistos.has(m.n)) e.push(`mapa: repetido ${m.n}`); vistos.add(m.n);
    if (!['kg', 'l', 'unidad'].includes(m.b) || !(m.envase > 0) || !Array.isArray(m.gba) || m.gba.length !== 2 || (m.nac && m.nac.length !== 2)) e.push(`mapa: "${m.n}" mal armado`);
  }
  return e;
}

// ---------- Programa ----------
async function descargar() {
  const r = await fetch(DESCARGA, { headers: { 'User-Agent': 'mi-plato-facil (GitHub Actions)' }, redirect: 'follow', signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar el archivo de INDEC`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('El archivo de INDEC es más grande de lo esperado');
  const carpeta = await mkdtemp(join(tmpdir(), 'indec-')), archivo = join(carpeta, 'sh_ipc_precios_promedio.xls');
  await writeFile(archivo, buf);
  return { buf, archivo };
}
async function principal() {
  const leerJson = async rel => JSON.parse(await readFile(ruta(rel), 'utf8'));
  const catalogo = await catalogoNutricion(), mapa = await leerJson('datos/precios-mapa.json');
  if (args.includes('--verificar')) {
    const fallas = [...validarMapa(mapa, catalogo)];
    const real = arg('--archivo-json') || 'datos/precios.json';
    fallas.push(...validar(await leerJson(real), { catalogo, mapa }).map(x => `${real}: ${x}`));
    if (!arg('--archivo-json')) fallas.push(...validar(await leerJson('datos/precios-ejemplo.json'), { catalogo }).map(x => `datos/precios-ejemplo.json: ${x}`));
    if (fallas.length) { console.error('Precios inválidos:\n- ' + fallas.join('\n- ')); process.exit(1) }
    console.log('Precios válidos.'); return;
  }
  const hoy = arg('--hoy') || new Date().toISOString().slice(0, 10);
  let buf, origen = arg('--archivo');
  if (origen) buf = await readFile(origen); else ({ buf, archivo: origen } = await descargar());
  const datos = armar(leerLibro(leerOle(buf)), mapa, hoy);
  const fallas = validar(datos, { catalogo, mapa, hoy });
  if (fallas.length) throw new Error('El resultado no pasa la validación:\n- ' + fallas.join('\n- '));
  const salida = arg('--salida') ? new URL(arg('--salida'), 'file://' + process.cwd().replace(/\\/g, '/') + '/') : ruta('datos/precios.json');
  let previo = null; try { previo = JSON.parse(await readFile(salida, 'utf8')) } catch { /* no existe */ }
  const igual = previo && JSON.stringify({ ...previo, revisado: 0 }) === JSON.stringify({ ...datos, revisado: 0 });
  console.log(`INDEC ${datos.mes}: ${datos.items.length} ingredientes · sha256 ${createHash('sha256').update(buf).digest('hex').slice(0, 16)} · ${igual ? 'sin cambios' : 'actualizado'}`);
  if (igual) return;
  const tmp = new URL(salida.href + '.tmp'); await writeFile(tmp, JSON.stringify(datos) + '\n'); await rename(tmp, salida);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch(e => { console.error('No se actualizaron los precios (se conserva el último archivo): ' + e.message); process.exit(1) });
}
